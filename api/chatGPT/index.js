// ai/openai.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let userObjectReference = {};

const tools = [
  {
    type: "function",
    function: {
      name: "fetch-calendar",
      description: "Fetch calendar events for a given date range.",
      parameters: {
        type: "object",
        properties: {
          timeMin: {
            type: "string",
            format: "date-time",
            description: "Start date/time for events, in YYYY-MM-DD format"
          },
          timeMax: {
            type: "string",
            format: "date-time",
            description: "End date/time for events, in YYYY-MM-DD format"
          },
          userTimeZone: { type: "string", description: "The Timezone of the user"}
        },
        required: ["timeMin", "timeMax"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add-calendar-events",
      description: "Add multiple events to the calendar.",
      parameters: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                summary: { type: "string", description: "The summary or title of the event" },
                start: { type: "string", format: "date-time", description: "Start date/time for the event" },
                end: { type: "string", format: "date-time", description: "End date/time for the event" },
                description: { type: "string", description: "A detailed description of the event" },
                timeZone: { type: "string", description: "The user's time zone as a Timezone ID" }
              },
              required: ["summary", "start", "end", "timeZone"]
            }
          }
        },
        required: ["events"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete-calendar-events",
      description: "Delete an event from the calendar.",
      parameters: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                calendarId: { type: "string", description: "Calendar identifier. Use the 'primary' keyword by default."},
                eventId: { type: "string", description: "Event Id." }
              },
              required: ["calendarId", "eventId"]
            }
          }
        },
        required: ["events"]
      }
    }
  },    
  {
    type: "function",
    function: {
      name: "google-search",
      description: "Perform a google search.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A highly detailed query used for a Google search"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create-memories",
      description: "Add new memories (things to remember) for a given user.",
      parameters: {
        type: "object",
        properties: {
          memories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                summary: { type: "string", description: "A detailed summary of the memory, or thing to remember about the user." }
              },
              required: ["calendarId", "eventId"]
            }
          }
        },
        required: ["events"]
      }
    }
  }
];

let conversationObject = {
  name: "lifeMNGR",
  model: "gpt-3.5-turbo",
  instructions: `You are an assistant named lifeMNGR. Your goal is to help the user figure out what they should do today. Use all of the tools you have available to you to help accomplish this task. By the time the user is finished interacting with you, the user should know all of the things that they want to do today, that would make today a "good" day. 
  
  You're equipped with the ability to record memories for the user by calling the "create-memories" function. Anytime the user asks you to 'remember' something, get a thorough understanding of what it is the user wants you to rememeber then call the 'create-memories' function and pass in the summary of what it is you're being asked to remember as the function argument.

  When asked to get a calendar for 'today' you should call the 'fetch-calendar' function passing in today's date at midnight as the 'timeMin' property, and todays's date at 11:59pm as the 'timeMax' property. Only call this function when explicitly asked.

  When asked to add an event, you should only ever call the 'add-calendar-events' function and only the 'add-calendar-events'. You should never call multiple functions in one run. Always wait for the first function to end before calling a second one. Never run multiple functions at the same time. 
  
  You should always verify function arguments with the user before executing a function. Don't execute functions without first verifying the necessary details to put in to the function call wwith the user.
  
  Introduce yourself after the first message I send which will be about my time and date and is for informational purposes only and should be ignored.`,
  tools: tools
  //description: '(512 character limit)'
};

async function initChat(userObj) {

  if(!userObjectReference[userObj.email]) {

    userObjectReference[userObj.email] = userObj;

    userObjectReference[userObj.email].assistant = await openai.beta.assistants.create(conversationObject);

    userObjectReference[userObj.email].thread = await openai.beta.threads.create();

    userObjectReference[userObj.email].runsList = await openai.beta.threads.runs.list(
      userObjectReference[userObj.email].thread.id
    );
  
    console.log("runs list: ", userObjectReference[userObj.email].runsList);
  }
}

let runTries = 0;
async function checkStatusAndReturnMessages(threadId, runId, res) {

  const runCheck = await openai.beta.threads.runs.retrieve(threadId, runId);
  const runStatus = runCheck.status;

    if (runStatus === 'completed') {
      let messages = await openai.beta.threads.messages.list(threadId);
      let firstMessage = messages.data[0].content[0];

      runTries = 0;
      res.send(JSON.stringify(firstMessage)); 
      res.end("done");
    } else if (runStatus === 'requires_action') {
      const retrieveRun = await openai.beta.threads.runs.retrieve(
        threadId,
        runId
      );

      let toolCallsObj = {};

      const toolCalls = retrieveRun.required_action.submit_tool_outputs.tool_calls;
      toolCallsObj.toolCalls = toolCalls;
      toolCallsObj.threadId = threadId;
      toolCallsObj.runId = runId;

      runTries = 0;
      return toolCallsObj;
    } else {
      //If we try for 3 minutes and it doesn't work, we need to cancel the run
      if(runTries == 180) {
        await openai.beta.threads.runs.cancel(
          threadId,
          runId
        );

        runTries = 0;
        return;
      }
      runTries++;
     
      console.log("Run status: ", runStatus);
      // Wait for one second before checking the status again
      await new Promise(resolve => setTimeout(resolve, 1000));
      return checkStatusAndReturnMessages(threadId, runId, res); // Recursively call the function
    }
}

async function startChat(req, res, conversation) {

  console.log(res);

  const userObject = req.session.user;

  await initChat(userObject);
  
  try {

    const threadAddition = await openai.beta.threads.messages.create(userObjectReference[userObject.email].thread.id, conversation);
   
    userObjectReference[userObject.email].run = await openai.beta.threads.runs.create(userObjectReference[userObject.email].thread.id, { 
      assistant_id: userObjectReference[userObject.email].assistant.id
    });

    return await checkStatusAndReturnMessages(userObjectReference[userObject.email].thread.id, userObjectReference[userObject.email].run.id, res);
  } catch (e) {
    console.error(e);
    return { error: true, message: e.message || "An error occurred with the Open AI API." };
  }
}

async function resolveFunction(gptFunctionObjects, res) {

  const threadId = gptFunctionObjects[0].threadId;
  const runId = gptFunctionObjects[0].runId;

  const toolOutputs = gptFunctionObjects.map((gptFunctionObject) => {
    return {
      tool_call_id: gptFunctionObject.toolCallId,
      output: JSON.stringify(gptFunctionObject.functionResponse),
    }
  });

  try {
    const output = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      {
        tool_outputs: toolOutputs,
      }
    );

    await checkStatusAndReturnMessages(threadId, runId, res);

  } catch(e) {
    console.error("There was an error resolving the function call: ", e);
  }

}

module.exports = { startChat, resolveFunction };
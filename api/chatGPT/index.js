// ai/openai.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


let userObjectReference = {};
let thread;
let runId;
let runTries = 0;

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
            description: "The query used for the Google search"
          }
        },
        required: ["query"]
      }
    }
  }
];

let conversationObject = {
  name: "lifeMNGR",
  model: "gpt-3.5-turbo",
  instructions: `You are an assistant named lifeMNGR.

  When asked to get my calendar for 'today' you should call the 'fetch-calendar' function passing in today's date at midnight as the 'timeMin' property, and todays's date at 11:59pm as the 'timeMax' property. Only call this function when explicitly asked.

  When asked to add an event, you should only ever call the 'add-calendar-events' function and only the 'add-calendar-events'. You should never call multiple functions in one run. Always wait for the first function to end before calling a second one. Never run multiple functions at the same time. 
  
  You should always verify first with me before executing a function. Don't execute functions without first verifying the necessary details to put in to the function call.
  
  Introduce yourself elaborately after the first thing I say regarding my date and time.`,
  tools: tools
  //description: '(512 character limit)'
};

async function initChat(userObj){

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

async function checkStatusAndReturnMessages(threadId, runId) {

  const runCheck = await openai.beta.threads.runs.retrieve(threadId, runId);
  const runStatus = runCheck.status;

    if (runStatus === 'completed') {
      let messages = await openai.beta.threads.messages.list(threadId);
      let firstMessage = messages.data[0].content[0];

      console.log("Last message COMPLETE, response from chatGPT: ", firstMessage);
      return firstMessage; 
    } else if (runStatus === 'requires_action') {
      const retrieveRun = await openai.beta.threads.runs.retrieve(
        threadId,
        runId
      );

      const toolCalls = retrieveRun.required_action.submit_tool_outputs.tool_calls;

      return toolCalls;
    } else {
      //If we try ten times and it doesn't work, we need to cancel the run
      if(runTries == 10) {
        await openai.beta.threads.runs.cancel(
          threadId,
          runId
        );
        return;
      }
      runTries++;
     
      console.log("Run status: ", runStatus);
      // Wait for a short period before checking the status again
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
      return checkStatusAndReturnMessages(threadId, runId); // Recursively call the function
    }
}

async function startChat(conversation, userObject) {

  console.log("user Object being passed to chat GPT: ", userObject);

  await initChat(userObject);
  
  try {

    const threadAddition = await openai.beta.threads.messages.create(userObjectReference[userObject.email].thread.id, conversation);
   
    userObjectReference[userObject.email].run = await openai.beta.threads.runs.create(userObjectReference[userObject.email].thread.id, { 
      assistant_id: userObjectReference[userObject.email].assistant.id
    });

    return await checkStatusAndReturnMessages(userObjectReference[userObject.email].thread.id, userObjectReference[userObject.email].run.id);
  } catch (e) {
    console.error(e);
    return { error: true, message: e.message || "An error occurred withthe Open AI API." };
  }
}

async function resolveFunction(obj) {
  console.log("OBJ: ", obj);

  try {
    const output = await openai.beta.threads.runs.submitToolOutputs(
      thread.id,
      runId,
      {
        tool_outputs: [
          {
            tool_call_id: obj.toolCallId,
            output: JSON.stringify(obj.functionResponse),
          },
        ],
      }
    );

    return await checkStatusAndReturnMessages(thread.id, runId);  

  } catch(e) {
    console.error("There was an error resolving the function call: ", e);
  }

}

module.exports = { startChat, resolveFunction };
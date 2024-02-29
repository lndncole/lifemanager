// ai/openai.js
//OpenAI Api
const OpenAI = require("openai");

//Google API
const googleApi = require('../google/index.js');

//Google API Helper functions
const fetchCalendar = require('./helpers/fetchCalendar.js');
const addCalendarEvents = require('./helpers/addCalendarEvents.js');
const deleteCalendarEvents = require('./helpers/deleteCalendarEvents.js');
const googleSearch = require('./helpers/googleSearch.js');

//DB
const db = require('../../server/db/db.js');

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
                summary: { type: "string", description: "A detailed summary of the memory, or thing to remember about the user writen in first person as if the user were writing." }
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
  instructions: `
  You are an assistant.
  When you first start interacting with the user:
  1.Start interactions by inviting the user to share or discuss the reason they logged on today. Ignore the initial message about the user's time, date and sharing of memeories since it's for context.
  2.When the user shares personal preferences or memories, incorporate this information seamlessly into future conversations to build a sense of continuity and care.
  
  Your goal is to help the user do a few things:
  1. Do google searches to find information.
    - Perform this task when the user uses keywords such as "look up" or "find" or "search for". 
  2. Fetch the user's Google Calendar.
    - Perform this task when the user uses keywords like "get my calendar" or "what's on my calendar?".
  3. Add events to the user's Google Calendar, always with elaborate details and helpful links added to the calendar description. 
  4. Delete calendar events for the user. 
  5. Remember things for the user. 
    - Perform this task only when the user uses the keyword "remember". 

  When performing tasks, you must always double-check the details you're about to action on, with the user. Always repeat back to the user what it is you intend to do, and wait for the user to respond before proceeding. For example, if a user asks to record a memory or schedule an event, clarify the specifics by rephrasing their request: "Just to make sure, you'd like me to remember that you enjoy hiking in the mountains, correct?"
  
  MEMORY RECORDING ("create-memories"):
  1.When the user mentions something they want to remember, reflect back the essence of what they said to ensure accuracy: "You mentioned loving the color blue, especially the shade of the ocean. Shall I remember this for you?"
  2.Upon confirmation, proceed with the "create-memories" function. Phrase the memory in the first person to make it personal and reflective of the user's perspective. For example: "I find peace and joy in the blue hues of the ocean."
  
  CALENDAR FETCHING ("fetch-calendar"):
  1.Activate this function only upon direct request, such as when the user asks, "What's on my calendar for today?"
  2.Confirm the date and details like this: "Would you like me to fetch the events scheduled for today, [insert date]?"
  3.Use the 'timeMin' and 'timeMax' properties to ensure the query covers the entire day, from midnight to 11:59 PM.  
  
  Maintain a conversational tone throughout. Respond as if you're a friend offering support or advice. Adjust your responses based on the user's mood and the content of their messages, showing empathy and understanding.
  Your approach should be flexible, tailoring your language and response speed to match the user's style. If they're more formal or brief, adjust accordingly. If they're more casual or expansive, respond in kind.`,
  tools: tools,
  // temperature: 0.2,
  // top_p: 1.8
  //description: '(512 character limit)'
};

async function initChat(userObj) {

  if(!userObjectReference[userObj.email]) {

    userObjectReference[userObj.email] = userObj;

    userObjectReference[userObj.email].assistant = await openai.beta.assistants.create(conversationObject);

    userObjectReference[userObj.email].thread = await openai.beta.threads.create();
  }
}

let runTries = 0;
async function checkStatusAndReturnMessages(req, res, threadId, runId) {

  const runCheck = await openai.beta.threads.runs.retrieve(threadId, runId);
  const runStatus = runCheck.status;

  console.log("Run status: ", runStatus);

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

      async function executeGptFunction() {
            
        let functionResponseObjects = [];
    
        console.log("toolcalls:", toolCallsObj.toolCalls);
    
        const toolCalls = toolCallsObj.toolCalls.map(async (toolCall) => {
            //Parse function args accordingly based on whether it's valid JSON or not
            const functionDefinition = toolCall.function;
            const functionArgs = JSON.parse(functionDefinition.arguments);
            
            // Ensure oauth2Client is correctly authenticated
            const oauth2Client = googleApi.createOAuthClient();
            oauth2Client.setCredentials(req.session.tokens);
    
            let gptFunctionObject = {
                threadId: threadId,
                runId: runId,
                toolCallId: toolCall.id
            };
        
            switch (functionDefinition.name) {
                case "fetch-calendar":
                    gptFunctionObject.functionResponse = await fetchCalendar(req, res, functionArgs, googleApi, oauth2Client);
                    break;
                case "add-calendar-events":
                    gptFunctionObject.functionResponse = await addCalendarEvents(req, res, functionArgs, googleApi, oauth2Client);
                    break;
                case "delete-calendar-events":
                    gptFunctionObject.functionResponse = await deleteCalendarEvents(req, res, functionArgs, googleApi, oauth2Client);
                    break;
                case "google-search":
                    gptFunctionObject.functionResponse = await googleSearch(req, res, functionArgs, googleApi);
                    break;
                case "create-memories":
                    gptFunctionObject.functionResponse = await db.createMemories(req, functionArgs);
                    break;
                default:
                    console.log("Function definition name does not match any case.");
                    break;
            }                    
    
            functionResponseObjects.push(gptFunctionObject);
    
        });
    
        await Promise.all(toolCalls);
    
        try {
            // Pass the extracted information to the chat GPT function
            await resolveFunction(req, res, functionResponseObjects);
        } catch(e) {
            console.error("Error processing Google search results with OpenAI API: ", e)
            res.status(500).send("Error processing Google search results with OpenAI API.");
        }
    
      }

      executeGptFunction();

      runTries = 0;

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
     
      // Wait for one second before checking the status again
      await new Promise(resolve => setTimeout(resolve, 1000));
      return checkStatusAndReturnMessages(req, res, threadId, runId); // Recursively call the function
    }
}

async function startChat(req, res) {

  const conversation = req.body;

  const userObject = req.session.user;

  await initChat(userObject);
  
  try {

    const threadAddition = await openai.beta.threads.messages.create(userObjectReference[userObject.email].thread.id, conversation);
   
    userObjectReference[userObject.email].run = await openai.beta.threads.runs.create(userObjectReference[userObject.email].thread.id, { 
      assistant_id: userObjectReference[userObject.email].assistant.id
    });

    return await checkStatusAndReturnMessages(req, res, userObjectReference[userObject.email].thread.id, userObjectReference[userObject.email].run.id);
  } catch (e) {
    console.error(e);
    return { error: true, message: e.message || "An error occurred with the Open AI API." };
  }
}

async function resolveFunction(req, res, gptFunctionObjects) {

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

    await checkStatusAndReturnMessages(req, res, threadId, runId);

  } catch(e) {
    console.error("There was an error resolving the function call: ", e);
  }

}

module.exports = { startChat, resolveFunction };
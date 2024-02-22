// ai/openai.js
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


let assistant;
let thread;
let runId;

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
  model: "gpt-3.5-turbo"
  //description: '(512 character limit)'
};

async function initChat(){
  if(!assistant) {
    assistant = await openai.beta.assistants.create(conversationObject);
  }
  if(!thread) {
    thread = await openai.beta.threads.create();
  }
}

async function checkStatusAndReturnMessages(threadId, runId) {
  let attempts = 0;
  while (attempts < 10) { // Limit the number of attempts to avoid infinite loops
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (runStatus.status === 'completed') {
      let messages = await openai.beta.threads.messages.list(threadId);
      let firstMessage = messages.data[0].content[0];

      console.log("Last message COMPLETE, response from chatGPT: ", firstMessage);
      return firstMessage; 
    } else if (runStatus.status === 'requires_action') {
      const retrieveRun = await openai.beta.threads.runs.retrieve(
        threadId,
        runId
      );

      const toolCalls = retrieveRun.required_action.submit_tool_outputs.tool_calls;

      console.log("Required ACTION ", toolCalls);
      return toolCalls;
    } else {

      attempts++;
      
      let messages = await openai.beta.threads.messages.list(threadId);
      let firstMessage = messages.data[0].content[0];
     
      console.log("Run status: ", runStatus.status);
      console.log("Run is not yet completed. Waiting...: ", firstMessage);
      // Wait for a short period before checking the status again
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
      return checkStatusAndReturnMessages(threadId, runId); // Recursively call the function
    }
  }
  throw new Error('Run did not complete in the expected timeframe.');
}

async function startChat(conversation) {

  await initChat();
  
  try {
    
    const threadAddition = await openai.beta.threads.messages.create(thread.id, conversation);

    let run = await openai.beta.threads.runs.create(thread.id, { 
      assistant_id: assistant.id,
      instructions: `You are an assistant. Work with the Google Calendar API and the Google Search API to look up information on the internet, add, delete and get events from Google Calendar and support the user in whatever way they need. Call predefined functions and pass in the appropriate values to ensure successful function calls. Never call more than 1 function at a time. Always only call one function at a time. Confirm with the user before calling the next function.
  
      Example of an introduction: 'Hello! Nice to meet you. Welcome to lifeMNGR. I'm here to help you with various tasks such as performing Google searches, managing your calendar events, and more. I've noted your timezone as [timezone].' If you get a message from the role of 'function', then you should take in that contents and summarize it for the user. 
      
      You should always verify first with me before executing a function. Don't execute functions without first verifying the necessary details to put in to the function call. 
      
      If I ask you to make a search or to look for information, then you should perform a 'google-search' by calling the 'google-search' function and adding a query that can be used to address the user's needs. Verify with me first before calling the function. 
      
      Ask me for my location if I ask you to do a search that is local to me. If I only give you one date or time for an event to be added to the calendar, ask me for an end time or suggest one for me. 
      
      Anytime I ask for you to get my calendar for 'today' you should call the 'fetch-calendar' function passing in today's date at midnight as the 'timeMin' property, and todays's date at 11:59pm as the 'timeMax' property. 
      
      Every time you are asked to retrieve calendar information you must include the event ID of each event along with the event's summary, description, start time and end time.     
      Anytime I ask you to delete an event, use the unaltered eventId as the eventId argument in the delete-calendar-events' function call for the event in question. It's important that you use the exact id that you get back from the fetch calendar function you called prior otherwise it won't work.
      Examples of event IDs: 4srt29alpr5dk1l3sc5n1ao6ak_20240216T140000Z, e59jfsa3l1rjdmh8jbnkgev62g, 28i03ilte02k8tfheplffst1q0, b5recdu6fp3qrtj5qcruvc2e50. `,
      tools: tools
    });

    runId = run.id;

    return await checkStatusAndReturnMessages(thread.id, runId);
  } catch (e) {
    console.error(e);
    return { error: true, message: e.message || "An error occurred withthe Open AI API." };
  }
}

async function resolveFunction(obj) {
  console.log("OBJ: ", obj);

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

  console.log("output from resolveFunction: ", output);

  return await checkStatusAndReturnMessages(thread.id, runId);  
}

module.exports = { startChat, resolveFunction };
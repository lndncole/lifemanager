// ai/openai.js
const OpenAI = require("openai");

async function startChat(conversation) {

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Define functions first
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
    instructions: "You are an assistant. Work with the Google Calendar API and the Google Search API to look up information on the internet and provide information back to the user. Call predefined functions and pass in the appropriate values to ensure successful function calls. Example of an introduction: 'Hello! Nice to meet you. Welcome to lifeMNGR. I'm here to help you with various tasks such as performing Google searches, managing your calendar events, and more. I've noted your timezone as [timezone].' If you get a message from the role of 'function', then you should take in that contents and summarize it for the user. You should always verify first with the user before executing a function. Don't execute functions without first verifying the necessary details to put in to the function call. If I ask you to make a search or to look for information, then you should perform a 'google-search' by calling the 'google-search' function and adding a query that can be used to address the user's needs. Ask me for my location if I ask you to do a search that is local to me. If I only give you one date or time for an event to be added to the calendar, ask me for an end time or suggest one for me. If there are multiple events in consideration, you should add each event one-by-one, checking against my Google calendar after each entry to ensure that you have entered all events that I agree to adding in to my calendar. Anytime I ask for you to get my calendar for 'today' you should call the 'fetch-calendar' function passing in today's date at midnight as the 'timeMin' property, and todays's date at 11:59pm as the 'timeMax' property. Examples of event IDs: 4srt29alpr5dk1l3sc5n1ao6ak_20240216T140000Z, e59jfsa3l1rjdmh8jbnkgev62g, 28i03ilte02k8tfheplffst1q0, b5recdu6fp3qrtj5qcruvc2e50. Introduce yourself after the first thing I say. Every time you are asked to retrieve calendar information you must include the event ID of each event along with the event's summary, description, start time and end time. Anytime I ask you to delete an event, use the unaltered eventId as the eventId argument in the delete-calendar-events' function call. It's important that you use the exact id that you get back from the fetch calendar function you called prior otherwise it won't work.",
    tools: tools,
    // function_call: "auto",
    // stream: true
  };

  try {

    const assistant = await openai.beta.assistants.create(conversationObject);

    // const query = ;
    
    const thread = await openai.beta.threads.create();

    const message = await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Hi how are you today?"
    });

    let run = await openai.beta.threads.runs.create(
      thread.id,
      { assistant_id: assistant.id }
    );

    const checkStatusAndPrintMessages = async (threadId, runId) => {
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);

      // console.log(runStatus);
      if(runStatus.status == 'completed') {
        let messages = await openai.beta.threads.messages.list(threadId);
        messages.data.forEach((msg)=> {
          let role = msg.role;
          let content = msg.content[0].text.value;
          console.log(
            `${role.charAt(0).toUpperCase() + role.slice(1)}: ${content}`
          )
        })
      } else {
        console.log("Run is not yet completed");
      }
    }

    let time = 0;

    setInterval(()=> {
      checkStatusAndPrintMessages(thread.id, run.id);
      time ++;
      if(time == 20) {
        return;
      }
    }, 1000);

    // run = openai.beta.threads.runs.retrieve(thread.id, run.id);

    // while(true) {
    //   if (run.status=="completed") {
    //     let messages = openai.beta.threads.messages.list(thread.id)
    //     let latest_message = messages.data[0]
    //     // let text = latest_message.content[0].text.value
    //     console.log(latest_message);
    //     break;
    //   }
    // }


    // if(run.status = 'complete') {
    //   const listMessage = await openai.beta.threads.messages.list(
    //     thread.id
    //   );
  
  
    //   console.log(listMessage.body.data[0].content);
    //   return;
    // }

   

    
  } catch (e) {
    console.error(e);
    return { error: true, message: e.message || "An error occurred withthe Open AI API." };
  }
}


startChat();


module.exports = { startChat };

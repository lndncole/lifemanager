// ai/openai.js
const OpenAI = require("openai");

module.exports = { startChat };

async function startChat(conversation) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Define functions first
  const functions = [
    {
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
          }
        },
        required: ["timeMin", "timeMax"]
      }
    },
    {
      name: "add-calendar-event",
      description: "Add an event to the calendar.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "The summary or title of the event"
          },
          start: {
            type: "string",
            format: "date-time",
            description: "Start date for the event, in YYYY-MM-DD format or RFC3339 timestamp"
          },
          end: {
            type: "string",
            format: "date-time",
            description: "End date for the event, in YYYY-MM-DD format or RFC3339 timestamp"
          },
          description: {
            type: "string",
            description: "A detailed description of the event"
          }
        },
        required: ["summary", "start", "end"]
      }
    }
  ];

  let conversationObject = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: 'system', content: `I am an assistant to help you add and get calendar entries to and from your Google Calendar. Today is ${new Date()}. Anytime someone asks for you to get their calendar for "today" you should call the "fetch-calendar" function passing in today's date at midnight as the timeMin property, and todays's date at 11:59pm as the timeMax property. If someone asks you to add an event to their calendar, make sure you understand everything you need to know to add then calendar first, then call the "add-calendar-event" function and respond letting the user know that you attempted to update their calendar. If the user only gives you one date or time for an event to be added to the calendar, ask the user for an end time or suggest one for the user.`}
    ],
    functions: functions,
    function_call: "auto"
  };

  conversationObject.messages = [...conversationObject.messages, ...conversation];

  try {
    const completion = await openai.chat.completions.create(conversationObject);
    return completion;
  } catch (e) {
    console.error('Error connecting to OpenAI API - heres the error:', e);
  }
}


module.exports = { startChat };

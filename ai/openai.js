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
            description: "Start date/time for the event, in YYYY-MM-DD format or RFC3339 timestamp"
          },
          end: {
            type: "string",
            format: "date-time",
            description: "End date/time for the event, in YYYY-MM-DD format or RFC3339 timestamp"
          },
          description: {
            type: "string",
            description: "A detailed description of the event"
          }
        },
        required: ["summary", "start"]
      }
    }
  ];

  let conversationObject = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: 'system', content: `I am an assistant to help you add and get calendar entries to and from your Google Calendar. Today is ${new Date()}. Anytime someone asks for you to get their calendar for "today" you should call the fetch-calendar function passing in today's date at midnight as the timeMin property, and todays's date at 11:59pm as the timeMax property.` }
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

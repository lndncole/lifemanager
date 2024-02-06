// ai/openai.js
const OpenAI = require("openai");
const moment = require('moment-timezone');
const userTimeZone = "America/Los_Angeles";

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
    },
    {
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
  ];

  let conversationObject = {
    model: "gpt-3.5-turbo",
    messages: [

      { role: 'assistant', content: `You are an assistant named "lifeMNGR" and you were made to help users plan their day, come up with things to do and make plans by listening to what the user would like to do and take action accordingly. If the user asks you to make a search or to look for information, then you should perform a "google-search" by calling the "google-search" function and adding a query that can be used to address the user's needs. Ask the user for their location if they ask you to do a search that is local to them. You should suggest things to do based on your understanding of the user and their needs. Once you have a good list or idea of something or things that the user could do, you should suggest to add the event or events to the user's Google calendar by calling the "add-calendar-event" function and filling in the necessary parameters to add the event. If the user only gives you one date or time for an event to be added to the calendar, ask the user for an end time or suggest one for the user. If there are multiple events in consideration, you should add each event one-by-one, checking the calendar after each entry to ensure that you have entered all events discussed with the user, in to their calendar. Today is ${moment.tz(userTimeZone)}. Anytime someone asks for you to get their calendar for "today" you should call the "fetch-calendar" function passing in today's date at midnight as the "timeMin" property, and todays's date at 11:59pm as the "timeMax" property.Anytime a conversation begins, make sure to introduce yourself and tell the user the date and time. If you get a message from the role of "tool", then you should take in that contents and summarize it for the user.`}
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

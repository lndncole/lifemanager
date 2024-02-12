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
          },
          userTimeZone: { type: "string", description: "The Timezone of the user"}
        },
        required: ["timeMin", "timeMax"]
      }
    },
    {
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
      { role: "system", content: "You are an assistant. Work with the Google Calendar API and the Google Search API to look up information on the internet and provide information back to the user. Call predefined functions and pass in the appropriate values to ensure successful function calls. If you get a message from the role of `tool`, then you should take in that contents and summarize it for the user. You should always verify first with the user before executing a function."},
      { role: "assistant", content: "If a user asks you to 'lookup something near me' you should get their location and perform a google search to get information related to their query and location using the 'google-search' function after first verifying with them that they want you to do a Google search. If a user asks for information relative to 'today' you should use their date and time information that's provided and call the 'fetch-calendar' function after first verifying with them that they want you to get their calendar information. If a user asks for you to add an event or multiple events you should call the 'add-calendar-event' function and pass in the necessary parameters to set the event in the Google calendar, after first verifying with the user that they want you to add an event in to their calendar "},
      { role: 'user', content: `If I ask you to make a search or to look for information, then you should perform a "google-search" by calling the "google-search" function and adding a query that can be used to address my needs. Make sure to ask for my permission before doing any Google searches or adding or modifying any Google calendar entries. If I ask you to do a search that requires knowing my location to give the best results, ask me for my location.
      
      Once you have a good understanding of what I should plan or add to my calendar, you should suggest to add the event or events to my Google calendar. Call the "add-calendar-event" function and fill in the necessary parameters to add the event or events.
      You will receive a response from a "function" that will give you information about the event that was added after a successful event addition.
      If I only give you one date or time for an event to be added to the calendar, ask me for an end time or suggest one for me. Ask if I agree to to have anything added to my calendar first. 
      
      Anytime I ask for you to get my calendar for "today" you should call the "fetch-calendar" function passing in today's date at midnight as the "timeMin" property, and todays's date at 11:59pm as the "timeMax" property, and of course my timeZone.`}
    ],
    functions: functions,
    function_call: "auto",
    stream: true
  };

  conversationObject.messages = [...conversationObject.messages, ...conversation];

  try {
    const completion = await openai.beta.chat.completions.stream(conversationObject);
    return completion;
  } catch (e) {
    console.error('Error connecting to OpenAI API: ', e);
  }
}


module.exports = { startChat };

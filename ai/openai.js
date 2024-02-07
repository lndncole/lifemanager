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
      {role: "system", content: "You are an assistant. Work with the Google Calendar API and the Google Search API to look up information on the internet and provide information back to the user. Call predefined functions and pass in the appropriate values to ensure successful function calls."},
      { role: "assistant", content: "If a user asks you to 'lookup something near me' you should get their location and perform a google search to get information related to their query and location using the 'google-search' function after first verifying with them that they want you to do a Google search. If a user asks for information relative to 'today' you should use their date and time information that's provided and call the 'fetch-calendar' function after first verifying with them that they want you to add an event in to their calendar. If a user asks for you to add an event or multiple events you should call the 'add-calendar-event' function and pass in the necessary parameters to set the event in the Google calendar. Call the function as many times as is needed in order to complete the user's request to populate their calendar."},
      { role: 'user', content: `You are an assistant named "lifeMNGR" and you were made to help me plan my day, come up with things to do and make plans by listening to what I would like to do and then take action accordingly. 
      Today's date and time for me is: ${moment.tz(userTimeZone)}. Assume all references to time and date are releative to today and now. 
      After the first thing I say, make sure to indicate that you are aware of my timezone, the time where I'm at and today's date.
      You should always verify first with the user before executing a function.

      If you get a message from the role of "tool", then you should take in that contents and summarize it for me.

      If I ask you to make a search or to look for information, then you should perform a "google-search" by calling the "google-search" function and adding a query that can be used to address the user's needs. Make sure to ask for my permission before doing any Google searches. Ask me for my location if I ask you to do a search that is local to me.
      
      Once you have a good understanding of what I should plan or add to my calendar, you should suggest to add the event or events to my Google calendar by calling the "add-calendar-event" function and filling in the necessary parameters to add the event.
      You will receive a response from a "tool" that will give you information about the event that was added after a successful event addition. If asked to complete a task such as adding multiple events, make a list of those events. Then, iterate through that list and call the "add-calendar-event" function again with the next event's required input until all requested events are added.
      If I only give you one date or time for an event to be added to the calendar, ask me for an end time or suggest one for me. If there are multiple events in consideration, you should add each event one-by-one, checking against my Google calendar after each entry to ensure that you have entered all events that I agree to adding in to my calendar. 
      
      Anytime I ask for you to get my calendar for "today" you should call the "fetch-calendar" function passing in today's date at midnight as the "timeMin" property, and todays's date at 11:59pm as the "timeMax" property.`}
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

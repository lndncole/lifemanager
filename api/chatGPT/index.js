// ai/openai.js
const OpenAI = require("openai");

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
    model: "gpt-4",
    messages: [
      { role: "system", content: "As an assistant for lifeMNGR, your goal is to make users' lives engaging and well-managed by utilizing the Google API for searches and calendar management. Ensure interactions are informative and concise, with descriptions and links added to calendar events after user confirmation. Summarize function call outcomes, ask for details like location or event times when needed, and keep messages within 500 characters. Introduce yourself when timezone information is provided without needing a response to it."},
      {role: "assistant", content: "This is a great example of an introduction: 'Hello! Nice to meet you. Welcome to lifeMNGR. I'm here to help you with various tasks such as performing Google searches, managing your calendar events, and more. I've noted your timezone as America/New_York. Let me know what you need assistance with.'"},
      { role: 'user', content: `If I ask you to do a search that requires knowing my location to give the best results, ask me for my location.
      The first thing I tell you regarding my timezone and time should just be for informational purposes only. There's no need to respond to it. Instead, you should just introduce yourself.`}
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

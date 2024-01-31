// ai/openai.js
const OpenAI = require("openai");

// Dummy function for testing
function fetchCalendarDummy() {
  return {
    "date": "2023-01-18",
    "events": [
      { "title": "Meeting with team", "time": "10:00 AM" },
      { "title": "Lunch with client", "time": "1:00 PM" }
    ]
  };
}

module.exports = { startChat };

async function startChat(message) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Define a dummy function for GPT to call
  const functions = [{
    name: "fetch-calendar",
    description: "Fetch calendar events for a given date",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "The date to fetch events for, in YYYY-MM-DD format"
        }
      },
      required: ["date"]
    }
  }];

 try {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: 'system', content: 'How can you help me?' },
      { role: 'user', content: message }
    ],
    functions: functions,
    function_call: "auto" // Let GPT decide when to use the function

  });
  return completion;

 } catch(e) {
  console.error('Error connecting to OpenAI API - heres the error :', e);
 }

}

module.exports = { startChat, fetchCalendarDummy };

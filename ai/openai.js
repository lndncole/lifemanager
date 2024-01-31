// ai/openai.js
const OpenAI = require("openai");

module.exports = { startChat };

async function startChat(conversation) {
  if(!conversation) {
    conversation = [
      { role: 'system', content: 'How can you help me?' },
      { role: 'user', content: message }
    ];
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  //List of function that GPT can call
  const functions = [{
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
  }];  

 try {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: conversation,
    functions: functions,
    //"auto" let's GPT decide when to run the function based on it's analysis of user intent
    function_call: "auto"

  });
  return completion;

 } catch(e) {
  console.error('Error connecting to OpenAI API - heres the error :', e);
 }

}

module.exports = { startChat };

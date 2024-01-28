//ai/openai.js
const OpenAI = require("openai");

async function startChat(message) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'How can you help me?' },
      { role: 'user', content: message }
    ],
    model: 'gpt-3.5-turbo',
  });

  return completion;
}

module.exports = { startChat };
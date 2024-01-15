require('dotenv').config();

const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", 
      content: "How can you help me?" }
    ],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

main();
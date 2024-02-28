//server/routes/chatGPT/index.js

async function chat(req, res, chatGPTApi, googleApi) {
    const userMessage = req.body;

    console.log("user message from front end to GPT: ", userMessage);

    try {
        const thread = await chatGPTApi.startChat(req, res, userMessage, googleApi);
      
    } catch (e) {
        let errorMessage = e.message || "";
        if(errorMessage.includes("maximum context length")) {
            console.error('Error with OpenAI API: ', e);

            res.status(400).json({
                message: "Request exceeded the maximum token limit for the model. Please reduce the length of the messages or functions."
              });
        } else {
            console.error('Error with OpenAI API: ', e);

            res.status(500).json({
              message: "An unexpected error occurred. Please try again later."
            });
          }
    
    }
}

module.exports = { chat };
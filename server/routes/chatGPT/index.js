//server/routes/chatGPT/index.js
const fetchCalendar = require('./fetchCalendar.js');
const addCalendarEvents = require('./addCalendarEvents.js');
const deleteCalendarEvents = require('./deleteCalendarEvents.js');
const googleSearch = require('./googleSearch.js');

async function chat(req, res, chatGPTApi, googleApi) {
    const userMessage = req.body;

    console.log("user message to GPT: ", userMessage);

    try {
        const thread = await chatGPTApi.startChat(userMessage, req.session.user);

        console.log(thread);

        let functionCall;

        if(thread.toolCalls) {
            functionCall = true;
        } else {
            res.send(JSON.stringify(thread));
            res.end("done");
        }

        //If the response is a function call
        if (functionCall) {
            //Parse function args accordingly based on whether it's valid JSON or not
            const functionDefinition = thread.toolCalls[0].function;
            const functionArgs = functionDefinition.arguments;

            console.log("functionArgs: ", functionArgs);
            
            // Ensure oauth2Client is correctly authenticated
            const oauth2Client = googleApi.createOAuthClient();
            oauth2Client.setCredentials(req.session.tokens);

            if (functionDefinition.name === "fetch-calendar") {
                fetchCalendar(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client);
            } else if(functionDefinition.name === "add-calendar-events") {
                addCalendarEvents(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client);
            } else if(functionDefinition.name === "delete-calendar-events") {
                deleteCalendarEvents(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client);
            } else if(functionDefinition.name === "google-search") {
                googleSearch(req, res, thread, functionArgs, chatGPTApi, googleApi);
            } 
        }

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
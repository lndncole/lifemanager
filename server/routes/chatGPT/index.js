//server/routes/chatGPT/index.js
const fetchCalendar = require('./fetchCalendar.js');
const addCalendarEvents = require('./addCalendarEvents.js');
const deleteCalendarEvents = require('./deleteCalendarEvents.js');
const googleSearch = require('./googleSearch.js');

function isValidJSON(text) {
    try {
        JSON.parse(text);
        return true; // Parsing succeeded, the text is valid JSON
    } catch (error) {
        return false; // Parsing failed, the text is not valid JSON
    }
}

async function chat(req, res, chatGPTApi, googleApi) {
    const conversation = req.body;

    console.log("User request to GPT: ", conversation);

    // Ensure conversation array is not empty
    // if (!conversation || !conversation.length) {
    //     throw new Error("The 'conversation' array is empty.");
    // }

    try {        //Add to the chat with the GPT
        const thread = await chatGPTApi.startChat(conversation);

        console.log("thread response: ", thread);
        let functionCall;

        if(!thread[0]) {
            res.send(JSON.stringify(thread));
            res.end("done");
        } else if(thread[0] && thread[0].function) {
            functionCall = true;
        }

        //If the response is a function call
        if (functionCall) {
            //Parse function args accordingly based on whether it's valid JSON or not
            const functionDefinition = thread[0].function;
            const functionArgs = functionDefinition.arguments;
            
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
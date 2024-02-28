//server/routes/chatGPT/index.js
const fetchCalendar = require('./fetchCalendar.js');
const addCalendarEvents = require('./addCalendarEvents.js');
const deleteCalendarEvents = require('./deleteCalendarEvents.js');
const googleSearch = require('./googleSearch.js');

//DB
const db = require('../../db/db.js');

async function chat(req, res, chatGPTApi, googleApi) {
    const userMessage = req.body;

    console.log("user message from front end to GPT: ", userMessage);

    try {
        const thread = await chatGPTApi.startChat(req, res, userMessage);
      
        let functionCall;

        if(thread && thread.toolCalls) {
            functionCall = true;
        } 

        //If the response is a function call
        if (functionCall) {

            async function executeGptFunction() {
            
                let functionResponseObjects = [];

                const toolCalls = thread.toolCalls.map(async (toolCall) => {
                    //Parse function args accordingly based on whether it's valid JSON or not
                    const functionDefinition = toolCall.function;
                    const functionArgs = functionDefinition.arguments;
    
                    console.log("functionArgs: ", functionArgs);
                    
                    // Ensure oauth2Client is correctly authenticated
                    const oauth2Client = googleApi.createOAuthClient();
                    oauth2Client.setCredentials(req.session.tokens);

                    let gptFunctionObject = {
                        threadId: thread.threadId,
                        runId: thread.runId,
                        toolCallId: toolCall.id
                    };
                
                    if (functionDefinition.name === "fetch-calendar") {
                        gptFunctionObject.functionResponse = await fetchCalendar(req, res, functionArgs, googleApi, oauth2Client);
                    } else if(functionDefinition.name === "add-calendar-events") {
                        gptFunctionObject.functionResponse = await addCalendarEvents(req, res, functionArgs, googleApi, oauth2Client);
                    } else if(functionDefinition.name === "delete-calendar-events") {
                        gptFunctionObject.functionResponse = await deleteCalendarEvents(req, res, functionArgs, googleApi, oauth2Client);
                    } else if(functionDefinition.name === "google-search") {
                        gptFunctionObject.functionResponse = await googleSearch(req, res, functionArgs, googleApi);
                    } else if(functionDefinition.name === "create-memories") {
                        gptFunctionObject.functionResponse = await db.createMemories(req, functionArgs);
                    }

                    functionResponseObjects.push(gptFunctionObject);

                });

                await Promise.all(toolCalls);

                if(functionResponseObjects.length) {
                    try {
                        console.log(JSON.stringify("functionResponseObjects: ", functionResponseObjects));
                        // Pass the extracted information to the chat GPT function
                        const gptResponse = await chatGPTApi.resolveFunction(functionResponseObjects, res);
        
                        res.end("done");
                    } catch(e) {
                        console.error("Error processing Google search results with OpenAI API: ", e)
                        res.status(500).send("Error processing Google search results with OpenAI API.");
                    }
                }
            }

            executeGptFunction();
            
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
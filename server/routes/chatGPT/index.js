//server/routes/chatGPT/index.js
const fetchCalendar = require('./fetchCalendar.js');
const addCalendarEvents = require('./addCalendarEvents.js');
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
    const { conversation } = req.body;
    // Ensure conversation array is not empty
    if (!conversation || !conversation.length) {
        throw new Error("The 'conversation' array is empty.");
    }

    try {
        console.log("Conversation going to the GPT: ", conversation[conversation.length-1], conversation[conversation.length-2], conversation[conversation.length-3])
        //Add to the chat with the GPT
        const stream = await chatGPTApi.startChat(conversation);

        let gptFunctionCall = false;

        for await (const chunk of stream) {
            let gptResponse = chunk.choices[0].delta;

            if(gptResponse.function_call) {
                gptFunctionCall = true;
            } else {
                res.write(JSON.stringify(chunk));
            }
        }

        // Wait for chat to be completed and grab the chat object to send to functions and close the stream.
        const chatCompletion = await stream.finalChatCompletion();
        res.end("done");

        // If ChatGPT wants to call a function we 
        if (gptFunctionCall) {

            //The response from the GPT
            const choice = chatCompletion.choices[0].message;

            //If the response is a function call
            if (choice.function_call) {
                //Parse function args accordingly based on whether it's valid JSON or not
                let functionArgs = 
                    isValidJSON(choice.function_call.arguments) ? JSON.parse(choice.function_call.arguments)
                        : choice.function_call.arguments;
                
                // Ensure oauth2Client is correctly authenticated
                const oauth2Client = googleApi.createOAuthClient();
                oauth2Client.setCredentials(req.session.tokens);

                if (choice.function_call.name === "fetch-calendar") {
                    fetchCalendar(req, res, conversation, functionArgs, chatGPTApi, googleApi, oauth2Client);
                } else if(choice.function_call && choice.function_call.name === "add-calendar-events") {
                    addCalendarEvents(req, res, conversation, functionArgs, chatGPTApi, googleApi, oauth2Client);
                } else if(choice.function_call && choice.function_call.name === "google-search") {
                    googleSearch(req, res, conversation, functionArgs, chatGPTApi, googleApi);
                } 
            }
        }
    } catch (e) {
        console.error('Error with OpenAI API: ', e);
        res.status(500).send('Error with OpenAI API.');
    }
}

module.exports = { chat };
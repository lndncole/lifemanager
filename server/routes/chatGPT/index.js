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
        //Add to the chat with the GPT
        const completion = await chatGPTApi.startChat(conversation);

        if (completion && completion.choices && completion.choices.length > 0) {
            //The response from the GPT
            const choice = completion.choices[0].message;
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
                    addCalendarEvents(req, res, conversation, choice, chatGPTApi, googleApi, oauth2Client);
                } else if(choice.function_call && choice.function_call.name === "google-search") {
                    googleSearch(req, res, conversation, functionArgs, chatGPTApi, googleApi);
                } 
            } else {
                //If it's not a function call, just send the GPT's regular response back
                res.json({ response: choice });
            }
        } else {
            throw new Error('Invalid response structure from OpenAI API');
        }
    } catch (e) {
        console.error('Error with OpenAI API: ', e);
        res.status(500).send('Error with OpenAI API.');
    }
}

module.exports = { chat };
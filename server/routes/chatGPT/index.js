//server/routes/chatGPT/index.js
const fetchCalendar = require('./fetchCalendar.js');
const addCalendarEvents = require('./addCalendarEvents.js');

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
                    try {
                        // Assuming functionArgs.query is already defined and contains the query string
                        const req = {
                            q: functionArgs.query
                        };
                    
                        // Call Google Search api
                        const googleSearchResponse = await googleApi.search(req);
                    
                        // Check if googleSearchResponse.items exists and has length
                        if (googleSearchResponse && googleSearchResponse.items && googleSearchResponse.items.length > 0) {
                            // Map through the items array to extract 'link' and 'snippet'
                            const searchResults = googleSearchResponse.items.map(item => ({
                                link: item.link,
                                snippet: item.snippet
                            }));
                            try {
                                // Pass the extracted information to the chat GPT function
                                const gptResponse = await chatGPTApi.startChat([...conversation, {
                                    role: 'function',
                                    content: JSON.stringify(searchResults),
                                    name: 'google-search'
                                }]);

                                if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
                                    const gptChoice = gptResponse.choices[0].message;
                                    // Process and return GPT's response with the search results
                                    res.json({
                                        gptFunction: 'google-search',
                                        result: gptChoice.content
                                    });
                                } else {
                                    throw new Error('No response received from GPT after getting Google search results.');
                                }
                            } catch(e) {
                                console.error("Error processing Google search results with OpenAI API: ", e)
                                res.status(500).send("Error processing Google search results with OpenAI API.");
                            }
                        } else {
                            throw new Error('No Google search results returned.');
                        }
                    } catch (e) {
                        console.error("Error performing Google search: ", e);
                        res.status(500).send("Error performing Google search.");
                    }
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
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
                // Parse the JSON string of function arguments in to an object
                const functionArgs = JSON.parse(choice.function_call.arguments);
                // Ensure oauth2Client is correctly authenticated
                const oauth2Client = googleApi.createOAuthClient();
                oauth2Client.setCredentials(req.session.tokens);

                if (choice.function_call.name === "fetch-calendar") {
                    // Format dates to RFC3339 if necessary
                    const timeMin = new Date(functionArgs.timeMin).toISOString();
                    const timeMax = new Date(functionArgs.timeMax).toISOString();

                    try {
                        //Fetch calendar events from the Google Calendar
                        const events = await googleApi.getCalendar(oauth2Client, timeMin, timeMax);

                        // Check if googleSearchResponse.items exists and has length
                        if (events && events.length > 0) {
                            try {
                                // Pass the extracted information to the chat GPT function
                                const gptResponse = await chatGPTApi.startChat([...conversation, {
                                    role: 'function',
                                    content: JSON.stringify(events),
                                    name: 'fetch-calendar'
                                }]);
                                
                                if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
                                    const gptChoice = gptResponse.choices[0].message;
                                    // Process and return GPT's response with calendar events list
                                    res.json({
                                        gptFunction: 'fetch-calendar',
                                        calendarEvents: gptChoice.content
                                    });
                                } else {
                                    throw new Error('No response received from GPT after getting Calendar events.');
                                }
                            } catch(e) {
                                console.error("Error processing Google search results with OpenAI API: ", e)
                                res.status(500).send("Error processing Google search results with OpenAI API.");
                            }
                        } else {
                            throw new Error('No Google calendar events returned.');
                        }
                    } catch (e) {
                        console.error("Error getting calendar data:", e);
                        res.status(500).send("Error fetching calendar data");
                    }
                } else if(choice.function_call && choice.function_call.name === "add-calendar-events") {
                    const events = JSON.parse(choice.function_call.arguments).events;
                    try {
                        // Iterate through each event object and add it to the calendar
                        const googleCalendarResponses = [];
                        for (const event of events) {
                            // Format dates to RFC3339 if necessary
                            const startTime = new Date(event.start).toISOString();
                            const endTime = new Date(event.end).toISOString();
                            
                            // Create a request object for each event
                            const req = {
                                body: {
                                    summary: event.summary,
                                    start: { dateTime: startTime },
                                    end: { dateTime: endTime },
                                    description: event.description
                                }
                            };

                            try {
                                // Pass the oauth2Client and the constructed req object to the addCalendarEvent function
                                const googleCalendarAddEventResponse = await googleApi.addCalendarEvent(oauth2Client, req);
                                // Check if googleCalendarAddEventResponse.items exists and has length
                                if (googleCalendarAddEventResponse && googleCalendarAddEventResponse.data) {
                                    // Add response to array
                                    googleCalendarResponses.push(googleCalendarAddEventResponse.data); 
                                } else {
                                    throw new Error('No data received from addCalendarEvent');
                                }
                            } catch (e) {
                                console.error(`Error adding event: ${event.summary}`, e);
                                googleCalendarResponses.push({ error: `Error adding event: ${event.summary}`, details: e.toString() });
                            }
                        }
                        try {
                            // Pass the Google Calendar responses back to the GPT
                            const gptResponse = await chatGPTApi.startChat([...conversation, {
                                role: 'function',
                                content: JSON.stringify(googleCalendarResponses),
                                name: 'add-calendar-events'
                            }]);
                        
                            if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
                                const gptChoice = gptResponse.choices[0].message;
                                // Process and return GPT's response to the Calendar's response
                                res.json({
                                    gptFunction: 'add-calendar-events',
                                    response: gptChoice.content
                                });
                            } else {
                                throw new Error('No response received from GPT after Calendar confirmation.');
                            }
                        } catch (e) {
                            console.error("Error adding Google calendar event with lifeMNGR: ", e);
                            res.status(500).send("Error adding Google calendar event with lifeMNGR.");
                        }
                    } catch (e) {
                        console.error("Error getting calendar data: ", e);
                        res.status(500).send("Error adding calendar data");
                    }
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
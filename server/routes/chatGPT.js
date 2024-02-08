async function chat(req, res, chatGPTApi, googleApi) {
  const { conversation } = req.body;
    try {

        // Ensure messages array is not empty
        if (!conversation || !conversation.length) {
            throw new Error("The 'messages' array is empty.");
        }

        const completion = await chatGPTApi.startChat(conversation);

        if (completion && completion.choices && completion.choices.length > 0) {
            const choice = completion.choices[0].message;
            if (choice.function_call) {
                // Parse the JSON string to an object
                const functionArgs = JSON.parse(choice.function_call.arguments);
                // Ensure oauth2Client is correctly authenticated
                const oauth2Client = googleApi.createOAuthClient();
                oauth2Client.setCredentials(req.session.tokens);
            if (choice.function_call.name === "fetch-calendar") {
                try {
                // Format dates to RFC3339 if necessary
                const timeMin = new Date(functionArgs.timeMin).toISOString();
                const timeMax = new Date(functionArgs.timeMax).toISOString();

                const events = await googleApi.getCalendar(oauth2Client, timeMin, timeMax);
                res.json({
                    gptFunction: 'fetch-calendar',
                    calendarEvents: events
                });
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
                    try {
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
                    // Pass the oauth2Client and the constructed req object to the addCalendarEvent function
                    const googleCalendarAddEventResponse = await googleApi.addCalendarEvent(oauth2Client, req);
                    // Check if googleCalendarAddEventResponse.items exists and has length
                    if (googleCalendarAddEventResponse && googleCalendarAddEventResponse.data) {
                        googleCalendarResponses.push(googleCalendarAddEventResponse.data); // Add response to array
                    } else {
                        throw new Error('No data received from addCalendarEvent');
                    }
                    } catch (e) {
                    console.error(`Error adding event: ${event.summary}`, e);
                    googleCalendarResponses.push({ error: `Error adding event: ${event.summary}`, details: e.toString() });
                    }
                }
                
                // Pass the extracted information to the chat GPT function
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
                    res.status(500).send("Error adding Google calendar event with lifeMNGR.");
                }
                } catch (e) {
                // console.error("Error getting calendar data:", e);
                res.status(500).send("Error adding calendar data");
                }
            } else if(choice.function_call && choice.function_call.name === "google-search") {
                try {
                // Assuming functionArgs.query is already defined and contains the query string
                const req = {
                    q: functionArgs.query
                };
            
                // Simulate calling the Google search API function
                const googleSearchResponse = await googleApi.search(req);
            
                // Check if googleSearchResponse.items exists and has length
                if (googleSearchResponse && googleSearchResponse.items && googleSearchResponse.items.length > 0) {
                    // Map through the items array to extract 'link' and 'snippet'
                    const searchResults = googleSearchResponse.items.map(item => ({
                    link: item.link,
                    snippet: item.snippet
                    }));
            
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
                        result: gptChoice.content // Assuming this is how you access the response content
                    });
                    } else {
                    res.status(500).send("Error processing Google search results with lifeMNGR.");
                    }
                } else {
                    res.status(500).send("No results found for the Google search.");
                }
                } catch (e) {
                console.error(e);
                res.status(500).send("Error performing Google search.");
                }
            } 
            } else {
            res.json({ response: choice });
            }
        } else {
            throw new Error('Invalid response structure from OpenAI API');
        }
    } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).send('Error processing your request');
    }
}

module.exports = { chat };
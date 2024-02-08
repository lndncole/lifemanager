module.exports = async function addCalendarEvents(req, res, conversation, choice, chatGPTApi, googleApi, oauth2Client) {
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
}
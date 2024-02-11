module.exports = async function addCalendarEvents(req, res, conversation, functionArgs, chatGPTApi, googleApi, oauth2Client) {
    const events = functionArgs.events;
    console.log("GPT requested events to insert: ", events);
    try {
        // Iterate through each event object and add it to the calendar
        const googleCalendarResponses = [];
        for (const event of events) {
            
            // Create a request object for each event
            const req = {
                body: {
                    summary: event.summary,
                    description: event.description,
                    start: { dateTime: startTime },
                    end: { dateTime: endTime }
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
        //Event added, now pass the response from the Calendar back to the GPT
        try {

            console.log("calendar add responses: ", googleCalendarResponses);
            // Pass the Google Calendar responses back to the GPT
            const gptResponse = await chatGPTApi.startChat([...conversation, {
                role: 'system',
                content: JSON.stringify(googleCalendarResponses),
                name: 'add-calendar-events'
            }]);

            for await (const chunk of gptResponse) {
                res.write(JSON.stringify(chunk));
            }

            console.log("GPT response to the Calendar being added: ", gptResponse);

        } catch (e) {
            console.error("Error adding Google calendar event with lifeMNGR: ", e);
            res.status(500).send("Error adding Google calendar event with lifeMNGR.");
        }
    } catch (e) {
        console.error("Error getting calendar data: ", e);
        res.status(500).send("Error adding calendar data");
    }
}
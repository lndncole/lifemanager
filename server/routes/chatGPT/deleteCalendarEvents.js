module.exports = async function deleteCalendarEvents(req, res, conversation, functionArgs, chatGPTApi, googleApi, oauth2Client) {
    const events = functionArgs.events;
    console.log("events: ", events);
    try {
        // Iterate through each event object and add it to the calendar
        const googleCalendarResponses = [];
        for (const event of events) {
            
            // Create a request object for each event
            const eventDetails = {
                calendarId: event.calendarId,
                eventId: event.eventId
            };

            try {
                // Pass the oauth2Client and the constructed req object to the addCalendarEvent function
                const googleCalendarDeleteEventResponse = await googleApi.deleteCalendarEvents(oauth2Client, eventDetails);
                // Check if googleCalendarDeleteEventResponse.items exists and has length
                if (googleCalendarDeleteEventResponse && googleCalendarDeleteEventResponse.data) {
                    // Add response to array
                    googleCalendarResponses.push(googleCalendarDeleteEventResponse.data); 
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
            // Pass the Google Calendar responses back to the GPT
            const gptResponse = await chatGPTApi.startChat([...conversation, {
                role: 'user',
                content: JSON.stringify(googleCalendarResponses),
                name: 'delete-calendar-events'
            }]);

            for await (const chunk of gptResponse) {
                res.write(JSON.stringify(chunk));
            }

            res.end("done");


        } catch (e) {
            console.error("Error deleting Google calendar event with lifeMNGR: ", e);
            res.status(500).send("Error deleting Google calendar event with lifeMNGR.");
        }
    } catch (e) {
        console.error("Error getting calendar data: ", e);
        res.status(500).send("Error deleting calendar data");
    }
}
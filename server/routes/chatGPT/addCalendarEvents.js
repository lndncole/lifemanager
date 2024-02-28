module.exports = async function addCalendarEvents(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client) {

    const events = JSON.parse(functionArgs).events;

    const eventAddResponses = [];
    
    for (const event of events) {
        // Create a request object for each event
        const eventDetails = {
            summary: event.summary,
            description: event.description,
            start: { 
                dateTime: event.start,
                timeZone: event.timeZone 
            },
            end: { 
                dateTime: event.start,
                timeZone: event.timeZone
            }
        };

        try {
            // Pass the oauth2Client and the constructed req object to the addCalendarEvent function
            const googleCalendarAddEventResponse = await googleApi.addCalendarEvent(oauth2Client, eventDetails);
            // Check if googleCalendarAddEventResponse.items exists and has length
            if (googleCalendarAddEventResponse && googleCalendarAddEventResponse.data) {
                // Add response to array
                eventAddResponses.push(googleCalendarAddEventResponse.data); 
            } else {
                throw new Error('No data received from addCalendarEvent');
            }
        } catch (e) {
            gptFunctionObject.functionResponse.push({error: `Error adding event: ${event.summary}`, details: e.toString()});
            console.error(`Error adding event: ${event.summary}`, e);
            res.status(500).send(`Error adding event: ${e.toString()}`);
        }
    }

    return eventAddResponses;

}
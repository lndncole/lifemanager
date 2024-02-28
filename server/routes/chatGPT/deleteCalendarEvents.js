module.exports = async function deleteCalendarEvents(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client) {
    
    const eventDeleteResponses = [];
    
    const events = JSON.parse(functionArgs).events;

    // Iterate through each event object and delete it from the calendar
    for (const event of events) {
        
        // Create a request object for each event
        const eventDetails = {
            calendarId: event.calendarId,
            eventId: event.eventId
        };

        try {
            // Pass the oauth2Client and the constructed req object to the addCalendarEvent function
            const googleCalendarDeleteEventResponse = await googleApi.deleteCalendarEvent(oauth2Client, eventDetails);
            // Check if googleCalendarDeleteEventResponse.items exists and has length
            if (googleCalendarDeleteEventResponse && googleCalendarDeleteEventResponse.status && googleCalendarDeleteEventResponse.status == 204) {
                eventDeleteResponses.push({googleCalendarDeleteEventResponse: `successfully deleted event: ${googleCalendarDeleteEventResponse}`});
            } else {
                throw new Error('No data received from deleteCalendarEvents');
            }
        } catch (e) {
            console.error(`Error deleting event: ${event}`, e);
            gptFunctionObject.functionResponse.push({error: `Error deleting event: ${event}`, details: e.toString()});
            res.status(500).send("Error deleting calendar event.");
        }
    }

    return eventDeleteResponses;
}
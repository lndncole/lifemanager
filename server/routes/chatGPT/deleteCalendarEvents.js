module.exports = async function deleteCalendarEvents(req, res, functionArgs, googleApi, oauth2Client) {
        
    const events = functionArgs;

    const eventDeleteResponses = [];

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
            eventDeleteResponses.push({error: `Error deleting event: ${event}`, details: e.toString()});
            console.error(`Error deleting event: ${event}`, e);
            res.status(500).send("Error deleting calendar event.");
        }
    }

    return eventDeleteResponses;
}
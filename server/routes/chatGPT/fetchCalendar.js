module.exports = async function fetchCalendar(req, res, functionArgs, googleApi, oauth2Client) {

    functionArgs = JSON.parse(functionArgs);
    // Format dates to RFC3339 if necessary
    const timeMin = new Date(functionArgs.timeMin).toISOString();
    const timeMax = new Date(functionArgs.timeMax).toISOString();
    const timeZone = functionArgs.userTimeZone;

    try {
        //Fetch calendar events from the Google Calendar
        const events = await googleApi.getCalendar(oauth2Client, timeMin, timeMax, timeZone);

        if(events) {

            return JSON.stringify(events).trim() == "[]" ? 
                [{googleCalendaResponse: "You have no Events for the selected date range."}] :
                    events.map((event)=>{
                        return {
                            eventId: event.eventId,
                            eventSummary: event.summary,
                            eventStartTime: event.start,
                            eventEndTime: event.end,
                            eventLink: event.eventLink,
                            eventStatus: event.eventStatus
                        };
                    });

        } else {
            throw new Error('No Google calendar event information returned.');
        }
    } catch (e) {
        gptFunctionObject.functionResponse.push({error: `Error getting calendar events: ${timeMin}`, summary: `${timeMin}... ${timeMax}...${timeZone}`});
        console.error("Error getting calendar data:", e);
        res.status(500).send("Error fetching calendar data");
    }
}
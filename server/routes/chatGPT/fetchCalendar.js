module.exports = async function fetchCalendar(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client) {

    functionArgs = JSON.parse(functionArgs);

    // Format dates to RFC3339 if necessary
    const timeMin = new Date(functionArgs.timeMin).toISOString();
    const timeMax = new Date(functionArgs.timeMax).toISOString();
    const timeZone = functionArgs.userTimeZone;

    try {
        //Fetch calendar events from the Google Calendar
        const events = await googleApi.getCalendar(oauth2Client, timeMin, timeMax, timeZone);

        let gptEventObjects = {};

        if(JSON.stringify(events).trim() == "[]") {
            gptEventObjects.functionResponse = [{googleRCalendaResponse: "You have no Events for the selected date range."}];
        }

        gptEventObjects.functionResponse = events.map((event)=>{
            return {
                eventId: event.eventId,
                eventSummary: event.summary,
                eventStartTime: event.start,
                eventEndTime: event.end,
                eventLink: event.eventLink,
                eventStatus: event.eventStatus
            };
        });

        gptEventObjects.toolCallId = thread[0].id;

        if (gptEventObjects && gptEventObjects.functionResponse) {
            try {
                // Pass the extracted information to the chat GPT function
                const gptResponse = await chatGPTApi.resolveFunction(gptEventObjects);

                res.send(gptResponse);
                res.end("done");
            } catch(e) {
                console.error("Error processing Google search results with OpenAI API: ", e)
                res.status(500).send("Error processing Google search results with OpenAI API.");
            }
        } else {
            throw new Error('No Google calendar event information returned.');
        }
    } catch (e) {
        console.error("Error getting calendar data:", e);
        res.status(500).send("Error fetching calendar data");
    }
}
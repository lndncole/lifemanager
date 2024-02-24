module.exports = async function deleteCalendarEvents(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client) {
    
    let gptFunctionObject = {
        functionResponse:[],
        threadId: thread.threadId,
        runId: thread.runId,
    };
    
    const events = JSON.parse(functionArgs).events;

    try {
        // Iterate through each event object and add it to the calendar
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
                    // Add response to array
                    console.log("google calendar response to deletion: ", googleCalendarDeleteEventResponse);
                    gptFunctionObject.functionResponse.push({googleCalendarDeleteEventResponse: "successfully deleted event."}); 
                } else {
                    throw new Error('No data received from deleteCalendarEvents');
                }
            } catch (e) {
                console.error(`Error deleting event: ${event}`, e);
                gptFunctionObject.functionResponse.push({ error: `Error deleting event: ${event}`, details: e.toString() });
            }
        }

        gptFunctionObject.toolCallId = thread.toolCalls[0].id;

        //Event added, now pass the response from the Calendar back to the GPT
        try {
            // Pass the Google Calendar responses back to the GPT
            const gptResponse = await chatGPTApi.resolveFunction(gptFunctionObject);
            
            res.send(gptResponse);
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
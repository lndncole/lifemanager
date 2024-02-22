module.exports = async function addCalendarEvents(req, res, thread, functionArgs, chatGPTApi, googleApi, oauth2Client) {
    // Iterate through each event object and add it to the calendar
    let gptFunctionObject = {
        functionResponse:[]
    };

    try {

        const events = JSON.parse(functionArgs).events;
        
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
                    gptFunctionObject.functionResponse.push(googleCalendarAddEventResponse.data); 
                } else {
                    throw new Error('No data received from addCalendarEvent');
                }
            } catch (e) {
                console.error(`Error adding event: ${event.summary}`, e);
                gptFunctionObject.functionResponse.push({ error: `Error adding event: ${event.summary}`, details: e.toString() });
            }
        }

        gptFunctionObject.toolCallId = thread[0].id;
        //Event added, now pass the response from the Calendar back to the GPT
        try {
            // Pass the Google Calendar responses back to the GPT
            const gptResponse = await chatGPTApi.resolveFunction(gptFunctionObject);
            
            res.send(gptResponse);
            res.end("done");

        } catch (e) {
            console.error("Error adding Google calendar event with lifeMNGR: ", e);
            res.status(500).send("Error adding Google calendar event with lifeMNGR.");
        }
    } catch (e) {
        console.error("Error getting calendar data: ", e);
        res.status(500).send("Error adding calendar data");
    }
}
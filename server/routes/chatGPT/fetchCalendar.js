module.exports = async function fetchCalendar(req, res, conversation, functionArgs, chatGPTApi, googleApi, oauth2Client) {
    // Format dates to RFC3339 if necessary
    const timeMin = new Date(functionArgs.timeMin).toISOString();
    const timeMax = new Date(functionArgs.timeMax).toISOString();
    const timeZone = functionArgs.userTimeZone;

    try {
        //Fetch calendar events from the Google Calendar
        const events = await googleApi.getCalendar(oauth2Client, timeMin, timeMax, timeZone);

        if(JSON.stringify(events).trim() == "[]") {
            res.write(JSON.stringify({content: "You have no events for this date."}));
            res.end("done");
            return;
        }

        console.log("events from google calendat: ", events);

        const gptEventObjects = events.map((event)=>{
            return {
                eventId: event.eventId,
                eventSummary: event.summary,
                eventStartTime: event.start,
                eventEndTime: event.end,
                eventLink: event.eventLink,
                eventStatus: event.eventStatus
            };
        });

        if (events && events.length > 0) {
            try {
                console.log("gptEventObjects: ", gptEventObjects);
                const fetchCalendarMessage = "Google Calendar events list: " + gptEventObjects;
                // Pass the extracted information to the chat GPT function
                const gptResponse = await chatGPTApi.startChat([...conversation, {
                    role: 'function',
                    content: JSON.stringify(events),
                    name: 'fetch-calendar'
                }]);

                for await (const chunk of gptResponse) {
                    res.write(JSON.stringify(chunk));
                }

                const wait = await gptResponse.finalChatCompletion();
                console.log("fetch calendar GPT response: ", wait.choices[0].message);
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
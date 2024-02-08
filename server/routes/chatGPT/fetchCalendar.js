module.exports = async function fetchCalendar(req, res, conversation, functionArgs, chatGPTApi, googleApi, oauth2Client) {
    // Format dates to RFC3339 if necessary
    const timeMin = new Date(functionArgs.timeMin).toISOString();
    const timeMax = new Date(functionArgs.timeMax).toISOString();

    try {
        //Fetch calendar events from the Google Calendar
        const events = await googleApi.getCalendar(oauth2Client, timeMin, timeMax);

        // Check if googleSearchResponse.items exists and has length
        if (events && events.length > 0) {
            try {
                // Pass the extracted information to the chat GPT function
                const gptResponse = await chatGPTApi.startChat([...conversation, {
                    role: 'function',
                    content: JSON.stringify(events),
                    name: 'fetch-calendar'
                }]);

                if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
                    const gptChoice = gptResponse.choices[0].message;
                    // Process and return GPT's response with calendar events list
                    res.json({
                        gptFunction: 'fetch-calendar',
                        calendarEvents: gptChoice.content
                    });
                } else {
                    throw new Error('No response received from GPT after getting Calendar events.');
                }
            } catch(e) {
                console.error("Error processing Google search results with OpenAI API: ", e)
                res.status(500).send("Error processing Google search results with OpenAI API.");
            }
        } else {
            throw new Error('No Google calendar events returned.');
        }
    } catch (e) {
        console.error("Error getting calendar data:", e);
        res.status(500).send("Error fetching calendar data");
    }
}
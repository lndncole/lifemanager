module.exports = async function googleSearch(req, res, thread, functionArgs, chatGPTApi, googleApi) {

    let gptFunctionObject = {
        functionResponse:[],
        threadId: thread.threadId,
        runId: thread.runId
    };
    // Assuming functionArgs.query is already defined and contains the query string
    const queryObject = {
        q: JSON.parse(functionArgs).query
    };
    
    try {    
        // Call Google Search api
        const googleSearchResponse = await googleApi.search(queryObject);
    
        // Check if googleSearchResponse.items exists and has length
        if (googleSearchResponse && googleSearchResponse.items && googleSearchResponse.items.length > 0) {
            // Map through the items array to extract 'link' and 'snippet'
            gptFunctionObject.functionResponse = [...googleSearchResponse.items.map(item => ({
                link: item.link,
                snippet: item.snippet
            }))];

            gptFunctionObject.toolCallId = thread.toolCalls[0].id;

            try {
                // Pass the extracted information to the chat GPT function
                const gptResponse = await chatGPTApi.resolveFunction(gptFunctionObject);

                res.send(gptResponse);
                res.end("done");

            } catch(e) {
                console.error("Error processing Google search results with OpenAI API: ", e)
                res.status(500).send("Error processing Google search results with OpenAI API.");
            }
        } else {
            throw new Error('No Google search results returned.');
        }
    } catch (e) {
        console.error("Error performing Google search: ", e);
        res.status(500).send("Error performing Google search.");
    }
}
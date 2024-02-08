module.exports = async function googleSearch(req, res, conversation, functionArgs, chatGPTApi, googleApi) {
    // Assuming functionArgs.query is already defined and contains the query string
    const queryObject = {
        q: functionArgs.query
    };
    
    try {    
        // Call Google Search api
        const googleSearchResponse = await googleApi.search(queryObject);
    
        // Check if googleSearchResponse.items exists and has length
        if (googleSearchResponse && googleSearchResponse.items && googleSearchResponse.items.length > 0) {
            // Map through the items array to extract 'link' and 'snippet'
            const searchResults = googleSearchResponse.items.map(item => ({
                link: item.link,
                snippet: item.snippet
            }));
            try {
                // Pass the extracted information to the chat GPT function
                const gptResponse = await chatGPTApi.startChat([...conversation, {
                    role: 'function',
                    content: JSON.stringify(searchResults),
                    name: 'google-search'
                }]);

                if (gptResponse && gptResponse.choices && gptResponse.choices.length > 0) {
                    const gptChoice = gptResponse.choices[0].message;
                    // Process and return GPT's response with the search results
                    res.json({
                        gptFunction: 'google-search',
                        result: gptChoice.content
                    });
                } else {
                    throw new Error('No response received from GPT after getting Google search results.');
                }
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
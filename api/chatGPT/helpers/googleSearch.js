module.exports = async function googleSearch(req, res, functionArgs, googleApi) {

    const queryObject = {
        q: functionArgs.query
    };

    let googleSearchQueryResponse = [];
    
    try {    
        // Call Google Search api
        const googleSearchResponse = await googleApi.search(queryObject);
    
        // Check if googleSearchResponse.items exists and has length
        if(googleSearchResponse && googleSearchResponse.items && googleSearchResponse.items.length) {
             // Map through the items array to extract 'link' and 'snippet'
             googleSearchQueryResponse = [...googleSearchResponse.items.map(item => ({
                link: item.link,
                snippet: item.snippet
            }))];
        } else {
            throw new Error('No Google search results returned.');
        }
     
    } catch (e) {
        googleSearchQueryResponse.push({error: `Error fetching Google search results.`, details: e.toString()});
        console.error("Error performing Google search: ", e);
        res.status(500).send("Error performing Google search.");
    }

    return googleSearchQueryResponse;
}
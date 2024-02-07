async function fetchCalendar(req, res, googleApi) {
    if (!req.session.tokens) {
        return res.status(401).send('User not authenticated');
    }

    const days = req.body.days ? req.body.days : 10;

    const oauth2Client = googleApi.createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    try {
        const events = await googleApi.getCalendar(oauth2Client, null, null, days);
        console.log(events);
        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).send('Error fetching calendar data');
    }
}

async function addCalendarEvents(req, res, googleApi) {
  const oauth2Client = googleApi.createOAuthClient();
  oauth2Client.setCredentials(req.session.tokens);

  try {
    response = await googleApi.addCalendarEvent(oauth2Client, req);
    res.json(response);
  } catch (error) {
    console.error('Error adding calendar event:', error);
    res.status(500).send('Error adding event to calendar');
  }
}

module.exports = { fetchCalendar, addCalendarEvents };
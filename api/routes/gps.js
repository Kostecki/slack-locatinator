var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  let sender = req.body.user_name;
  let channel = req.body.channel_name;
  let auto = req.body.text;

  res.send(
    {
      "text": `Hey ${sender}! \n I can't get your location directly because Slack is boring and secure, so you have to visit this link:`,
      "attachments": [
        {
          "fallback": "You are unable to get the button. Go to https://israndom.win/thunderducks",
          "callback_id": "location_trigger",
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
                "name": "game",
                "text": "Get location",
                "type": "button",
                "url": `https://israndom.win/thunderducks?user=${sender}&channel=${channel}&auto=${auto}`
            }
          ]
        }
      ]
    }
  );
});

router.get('/', function(req, res, next) {
  res.status(200).json({
    status: 'ok'
  })
})

module.exports = router;

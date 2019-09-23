var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/', function(req, res, next) {
  let sender = req.body.user_name;
  let channelId = req.body.channel_id;

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
                "url": `https://israndom.win/thunderducks?u=${sender}&c=${channelId}`
            }
          ]
        }
      ]
    }
  );
});

module.exports = router;

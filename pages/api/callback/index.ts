import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { user_name, channel_name, text } = req.body;

    if (user_name && channel_name) {
      let url = `https://israndom.win/thunderducks?user=${user_name}&channel=${channel_name}`;

      console.log(text);

      if (text && text === "true") {
        url += `&auto=${text}`;
      }

      res.status(200).json({
        text: `Hey ${user_name}! \n I can't get your location directly because Slack is boring and secure, so you have to visit this link:`,
        attachments: [
          {
            fallback:
              "You are unable to get the button. Go to https://israndom.win/thunderducks",
            callback_id: "location_trigger",
            color: "#3AA3E3",
            attachment_type: "default",
            actions: [
              {
                name: "game",
                text: "Get location",
                type: "button",
                url,
              },
            ],
          },
        ],
      });
    } else {
      res.status(400).json({
        error: "Missing parameters: user_name, channel_name",
      });
    }
  }
}

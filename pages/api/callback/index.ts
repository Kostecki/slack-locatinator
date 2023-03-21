import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("api/callback/index.ts", req);
  if (req.method === "POST") {
    const { user_name, channel_name, text } = req.body;

    if (user_name && channel_name) {
      let url = `https://thunderducks.israndom.win?user=${user_name}&channel=${channel_name}`;

      if (text && text === "true") {
        url += `&auto=${text}`;
      }

      res.status(200).json({
        text: `Hey ${user_name}! \n I can't get your location directly because Slack is boring and secure, so you have to visit this link:`,
        attachments: [
          {
            fallback:
              "You are unable to get the button. Go to https://thunderducks.israndom.win",
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

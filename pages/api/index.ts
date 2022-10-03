// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

interface Action {
  name: string;
  text: string;
  type: string;
  url: string;
}

interface Attachment {
  fallback: string;
  callback_id: string;
  color: string;
  attachment_type: string;
  actions: Action[];
}

interface Response {
  text: string;
  attachments: Attachment[];
}

interface ErrorResponse {
  error: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response | ErrorResponse>
) {
  const { sender, channel, auto } = req.query;

  if (sender && channel) {
    let url = `https://israndom.win/thunderducks?user=${sender}&channel=${channel}`;

    if (auto) {
      url += `&auto${auto}`;
    }

    res.status(200).json({
      text: `Hey ${sender}! \n I can't get your location directly because Slack is boring and secure, so you have to visit this link:`,
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
      error: "Missing parameters sender and/or channel",
    });
  }
}

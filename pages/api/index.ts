import { NextApiRequest, NextApiResponse } from "next";

const mapboxToken = process.env.PUBLIC_MAPBOX_TOKEN;
const slackToken = process.env.PUBLIC_SLACK_OAUTH_TOKEN;

const slackPostURL = "https://slack.com/api/chat.postMessage";

const slackResponseBlock = (
  username: string,
  lat: number,
  lng: number,
  address: string
): string => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `The current location of ${username}: \n http://maps.google.com/maps?&z=16&q=${lat}+${lng}&ll=${lat}+${lng}`,
      },
    },
    {
      type: "image",
      title: {
        type: "plain_text",
        text: address || "Current location",
        emoji: true,
      },
      image_url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-marker+285A98(${lng},${lat})/${lng},${lat},13,0/600x300?access_token=${mapboxToken}&attribution=false&logo=false`,
      alt_text: `The current location of ${username}`,
    },
  ];

  return JSON.stringify(blocks);
};

const ReverseGeocode = async (
  lat: number,
  lng: number
): Promise<string | void> => {
  const mapboxURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`;

  return fetch(mapboxURL)
    .then((response) => response.json())
    .then((data) => data.features[1].place_name)
    .catch((err) => console.error(err));
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method === "POST") {
    const { username, channel, lat, lng } = req.body;
    let address;
    let blocks;

    if (lat && lng) {
      address = await ReverseGeocode(lat, lng);
    }

    if (address) {
      blocks = slackResponseBlock(username, lat, lng, address);
    }

    if (slackToken && username && channel && lat && lng && blocks) {
      const url = new URL(slackPostURL);
      const params = {
        token: slackToken,
        channel,
        blocks,
        unfurl_link: "true",
        unfurl_media: "true",
        as_user: "false",
      };
      url.search = new URLSearchParams(params).toString();

      await fetch(url, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
        .then((resp) => resp.json())
        .then((data) => {
          if (data.ok) {
            res.status(200).json({
              status: "success",
              username: username,
              channel,
            });
          } else {
            res.status(500).json({ error: data.error });
          }
        });
    } else {
      res
        .status(400)
        .json({ error: "Missing paramters: username, channel, lat, lng" });
    }
  }
}

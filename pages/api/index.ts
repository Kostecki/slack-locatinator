import type { NextApiRequest, NextApiResponse } from "next";

const mapboxToken =
	process.env.MAPBOX_TOKEN ??
	process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
	process.env.PUBLIC_MAPBOX_TOKEN;
const slackToken =
	process.env.SLACK_OAUTH_TOKEN ?? process.env.PUBLIC_SLACK_OAUTH_TOKEN;

const slackPostURL = "https://slack.com/api/chat.postMessage";

type ApiSuccessResponse = {
	status: "success";
	username: string;
	channel: string;
};

type ApiErrorResponse = {
	error: string;
};

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

type SlackBlock = {
	type: string;
	text?: {
		type: string;
		text: string;
	};
	title?: {
		type: string;
		text: string;
		emoji: boolean;
	};
	image_url?: string;
	alt_text?: string;
};

const slackResponseBlocks = (
	username: string,
	lat: number,
	lng: number,
	address: string,
): SlackBlock[] => {
	const blocks: SlackBlock[] = [
		{
			type: "section",
			text: {
				type: "mrkdwn",
				text: `The current location of ${username}: \n http://maps.google.com/maps?&z=16&q=${lat}+${lng}&ll=${lat}+${lng}`,
			},
		},
	];

	if (mapboxToken) {
		blocks.push({
			type: "image",
			title: {
				type: "plain_text",
				text: address || "Current location",
				emoji: true,
			},
			image_url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-marker+285A98(${lng},${lat})/${lng},${lat},13,0/600x300?access_token=${mapboxToken}&attribution=false&logo=false`,
			alt_text: `The current location of ${username}`,
		});
	}

	return blocks;
};

const reverseGeocode = async (
	lat: number,
	lng: number,
): Promise<string | null> => {
	if (!mapboxToken) {
		return null;
	}

	const mapboxURL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`;

	try {
		const response = await fetch(mapboxURL);
		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as {
			features?: Array<{ place_name?: string }>;
		};

		return data.features?.[0]?.place_name ?? null;
	} catch {
		return null;
	}
};

const toNumber = (value: unknown): number | null => {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ApiResponse>,
) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		return res.status(405).json({ error: "Method not allowed" });
	}

	if (!slackToken) {
		return res.status(500).json({ error: "Missing server configuration" });
	}

	const { username, channel, lat, lng } = req.body as {
		username?: unknown;
		channel?: unknown;
		lat?: unknown;
		lng?: unknown;
	};

	const normalizedUsername =
		typeof username === "string" ? username.trim() : "";
	const normalizedChannel = typeof channel === "string" ? channel.trim() : "";
	const latitude = toNumber(lat);
	const longitude = toNumber(lng);

	if (
		!normalizedUsername ||
		!normalizedChannel ||
		latitude === null ||
		longitude === null
	) {
		return res
			.status(400)
			.json({ error: "Missing parameters: username, channel, lat, lng" });
	}

	const address =
		(await reverseGeocode(latitude, longitude)) ?? "Current location";
	const blocks = slackResponseBlocks(
		normalizedUsername,
		latitude,
		longitude,
		address,
	);

	try {
		const slackResponse = await fetch(slackPostURL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${slackToken}`,
				"Content-Type": "application/json; charset=utf-8",
			},
			body: JSON.stringify({
				channel: normalizedChannel,
				blocks,
				unfurl_links: true,
				unfurl_media: true,
			}),
		});

		const slackData = (await slackResponse.json()) as {
			ok?: boolean;
			error?: string;
		};

		if (!slackResponse.ok || !slackData.ok) {
			return res
				.status(502)
				.json({ error: slackData.error || "Failed posting message to Slack" });
		}

		return res.status(200).json({
			status: "success",
			username: normalizedUsername,
			channel: normalizedChannel,
		});
	} catch {
		return res.status(500).json({ error: "Unexpected server error" });
	}
}

import {
	Alert,
	type AlertColor,
	Box,
	Button,
	Container,
	CssBaseline,
	createTheme,
	InputAdornment,
	TextField,
	ThemeProvider,
	Typography,
} from "@mui/material";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const theme = createTheme({
	typography: {
		h3: {
			fontWeight: "bold",
		},
	},
});

const Home: NextPage = () => {
	const [username, setUsername] = useState("");
	const [channelId, setChannelId] = useState("");
	const [channelName, setChannelName] = useState("");
	const [loading, setLoading] = useState(false);
	const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [showAlert, setShowAlert] = useState(false);
	const [alertSeverity, setAlertSeverity] = useState<AlertColor | undefined>(
		undefined,
	);
	const [alertMsg, setAlertMsg] = useState("");

	const router = useRouter();
	const normalizedChannelName = channelName.trim().replace(/^#/, "");
	const targetChannel = channelId || normalizedChannelName;

	const doThatAlertThing = useCallback((severity: AlertColor, msg: string) => {
		if (alertTimeoutRef.current) {
			clearTimeout(alertTimeoutRef.current);
		}

		setShowAlert(true);
		setAlertSeverity(severity);
		setAlertMsg(msg);

		alertTimeoutRef.current = setTimeout(() => {
			setShowAlert(false);
			setAlertSeverity(undefined);
			setAlertMsg("");
			alertTimeoutRef.current = null;
		}, 3000);
	}, []);

	useEffect(() => {
		return () => {
			if (alertTimeoutRef.current) {
				clearTimeout(alertTimeoutRef.current);
			}
		};
	}, []);

	const sendToSlack = useCallback(async (position: GeolocationPosition) => {
		const lat = position.coords.latitude;
		const lng = position.coords.longitude;

		try {
			const response = await fetch("/api", {
				method: "POST",
				body: JSON.stringify({ username, channel: targetChannel, lat, lng }),
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Unknown server error");
			}

			doThatAlertThing(
				"success",
				`Successfully posted location to #${channelName}!`,
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			doThatAlertThing("error", `Failed posting to Slack: ${message}`);
		} finally {
			setLoading(false);
		}
	}, [channelName, doThatAlertThing, targetChannel, username]);

	const handleGeoError = useCallback(
		(error: GeolocationPositionError) => {
			setLoading(false);
			doThatAlertThing("error", `Failed getting location: ${error.message}`);
		},
		[doThatAlertThing],
	);

	const getLocation = useCallback(() => {
		setLoading(true);

		if (typeof navigator !== "undefined" && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(sendToSlack, handleGeoError);
		} else {
			setLoading(false);
			doThatAlertThing("error", "Geolocation is not supported by this browser");
		}
	}, [doThatAlertThing, handleGeoError, sendToSlack]);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		getLocation();
	};

	const disableButton = () => {
		return username.trim().length === 0 || targetChannel.length === 0;
	};

	useEffect(() => {
		if (router.isReady) {
			const { u: user, id: chId, n: chName } = router.query;
			if (user) {
				setUsername(user.toString());
			}

			if (chId) {
				const id = chId.toString().toUpperCase();
				setChannelId(id);
			}

			if (chName) {
				setChannelName(chName.toString());
			}
		}
	}, [router.isReady, router.query]);

	const autoSubmit = router.query.a;

	useEffect(() => {
		if (channelId && channelName && autoSubmit) {
			getLocation();
		}
	}, [autoSubmit, channelId, channelName, getLocation]);

	useEffect(() => {
		if (typeof navigator !== "undefined" && !navigator.geolocation) {
			doThatAlertThing("error", "Geolocation is not supported by this browser");
		}
	}, [doThatAlertThing]);

	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="xs">
				<Head>
					<title>Slack Locatinator</title>
				</Head>

				<CssBaseline />

				{showAlert && (
					<Alert severity={alertSeverity || "info"}>{alertMsg}</Alert>
				)}
				<Box
					sx={{
						marginTop: 8,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<Typography component="h1" variant="h3">
						Slack Location
					</Typography>
					<Box
						component="form"
						onSubmit={handleSubmit}
						noValidate
						sx={{ mt: 1 }}
					>
						<TextField
							margin="normal"
							fullWidth
							id="username"
							label="Username"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							required
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">@</InputAdornment>
									),
								},
							}}
						/>
						<TextField
							margin="normal"
							fullWidth
							label="Channel"
							id="slack-channel"
							value={channelName}
							onChange={(event) => setChannelName(event.target.value)}
							required
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">#</InputAdornment>
									),
								},
							}}
						/>
						<Button
							loading={loading}
							type="submit"
							fullWidth
							variant="contained"
							sx={{ mt: 3, mb: 2 }}
							disabled={disableButton()}
						>
							Post to channel
						</Button>
					</Box>
				</Box>
			</Container>
		</ThemeProvider>
	);
};

export default Home;

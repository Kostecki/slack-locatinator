import type { NextPage } from "next";
import Head from "next/head";

import {
  Alert,
  AlertColor,
  Box,
  Container,
  createTheme,
  CssBaseline,
  InputAdornment,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

const theme = createTheme({
  typography: {
    h3: {
      fontWeight: "bold",
    },
  },
});

const Home: NextPage = () => {
  const [hasNavigator, setHasNavigator] = useState(false);

  const [username, setUsername] = useState("");
  const [channel, setChannel] = useState("");
  const [loading, setLoading] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<AlertColor | undefined>(
    undefined
  );
  const [alertMsg, setAlertMsg] = useState("");

  const router = useRouter();

  const doThatAlertThing = (severity: AlertColor, msg: string) => {
    setShowAlert(true);
    setAlertSeverity(severity);
    setAlertMsg(msg);

    setTimeout(() => {
      setShowAlert(false);
      setAlertSeverity(undefined);
      setAlertMsg("");
    }, 2000);
  };

  const sendToSlack = async (lat: number, lng: number, address: string) => {
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
        image_url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-marker+285A98(${lng},${lat})/${lng},${lat},13,0/600x300?access_token=${process.env.NEXT_PUBLIC_MAP_BOX_TOKEN}&attribution=false&logo=false`,
        alt_text: `The current location of ${username}`,
      },
    ];

    const url = new URL("https://slack.com/api/chat.postMessage");
    const params = {
      token: process.env.NEXT_PUBLIC_SLACK_OAUTH_TOKEN || "",
      channel,
      blocks: JSON.stringify(blocks),
      unfurl_links: "true",
      unfurl_media: "true",
      as_user: "false",
    };
    url.search = new URLSearchParams(params).toString();

    const resp = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (resp.ok) {
      doThatAlertThing(
        "success",
        `Succesfully posted location to #${channel}!`
      );
    } else {
      doThatAlertThing("error", `Error posting to slack #${channel}!`);
    }

    setLoading(false);
  };

  const reverseGeocode = async (position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAP_BOX_TOKEN}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => sendToSlack(lat, lng, data.features[1].place_name))
      .catch((err) => {
        setLoading(false);
        doThatAlertThing("error", `Failed doing reverse geocode: ${err}`);
      });
  };

  const getLocation = () => {
    setLoading(true);

    if (hasNavigator) {
      navigator.geolocation.getCurrentPosition(reverseGeocode);
    } else {
      setLoading(false);
      doThatAlertThing("error", "Geolocation is not supported by this browser");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    getLocation();
  };

  const disableButton = () => {
    return username.length === 0 || channel.length === 0;
  };

  useEffect(() => {
    if (router.isReady) {
      const { user: pUser, channel: pChannel, auto: pAuto } = router.query;

      if (pUser) {
        setUsername(pUser.toString());
      }

      if (pChannel) {
        setChannel(pChannel.toString());
      }

      if (pAuto && pUser && pChannel) {
        getLocation();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (navigator.geolocation) {
      setHasNavigator(true);
    } else {
      doThatAlertThing("error", "Geolocation is not supported by this browser");
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <Head>
          <title>Slack Locatinator</title>
        </Head>

        <CssBaseline />

        {showAlert && (
          <Alert severity={alertSeverity as AlertColor}>{alertMsg}</Alert>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">@</InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Channel"
              id="slack-channel"
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">#</InputAdornment>
                ),
              }}
            />
            <LoadingButton
              loading={loading}
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={disableButton()}
            >
              Post to channel
            </LoadingButton>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default Home;

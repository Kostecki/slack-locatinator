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
  const [channelId, setChannelId] = useState("");
  const [channelName, setChannelName] = useState("");
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
    }, 3000);
  };

  const sendToSlack = (position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    fetch("/api", {
      method: "POST",
      body: JSON.stringify({ username, channel: channelId, lat, lng }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then(() => {
        doThatAlertThing(
          "success",
          `Succesfully posted location to #${channelName}!`
        );
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        doThatAlertThing("error", `Failed posting to Slack: ${err}`);
      });
  };

  const getLocation = () => {
    setLoading(true);

    if (hasNavigator) {
      navigator.geolocation.getCurrentPosition(sendToSlack);
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
    return username.length === 0 || channelName.length === 0;
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

  useEffect(() => {
    if (channelId && channelName && router.query.a) {
      getLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, channelName]);

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
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
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

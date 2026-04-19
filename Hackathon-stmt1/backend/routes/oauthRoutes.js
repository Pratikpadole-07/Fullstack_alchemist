const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const User = require("../models/User");

/* =========================
   REQUIRED ENV
=========================

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=

BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

*/

/* =========================
   TEMP PKCE STORE
========================= */
const pkceStore = new Map();

/* =========================
   HELPERS
========================= */
function base64URLEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function sha256(buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest();
}

async function redirectToProfile(res) {
  return res.redirect(
    `${process.env.FRONTEND_URL}/app/profile`
  );
}

/* =========================
   GITHUB START
========================= */
router.get("/github", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId required"
      });
    }

    const githubUrl =
      "https://github.com/login/oauth/authorize" +
      `?client_id=${process.env.GITHUB_CLIENT_ID}` +
      "&scope=read:user user:email" +
      `&state=${encodeURIComponent(userId)}`;

    res.redirect(githubUrl);
  } catch (err) {
    res.status(500).json({
      message: "GitHub OAuth start failed"
    });
  }
});

/* =========================
   GITHUB CALLBACK
========================= */
router.get("/github/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        message: "Invalid callback"
      });
    }

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      null,
      {
        params: {
          client_id:
            process.env.GITHUB_CLIENT_ID,
          client_secret:
            process.env.GITHUB_CLIENT_SECRET,
          code
        },
        headers: {
          Accept: "application/json"
        }
      }
    );

    const accessToken =
      tokenRes.data.access_token;

    if (!accessToken) {
      return res.status(400).json({
        message: "GitHub token failed"
      });
    }

    const profileRes = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

    const github = profileRes.data;

    const updatedUser =
      await User.findByIdAndUpdate(
        state,
        {
          "verification.githubConnected":
            true,

          "verification.githubName":
            github.name || "",

          "verification.githubUsername":
            github.login || "",

          "verification.githubFollowers":
            github.followers || 0,

          "verification.githubRepos":
            github.public_repos || 0,

          lastActiveAt: new Date()
        },
        { new: true }
      );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    await redirectToProfile(res);
  } catch (err) {
    console.log(
      "GitHub OAuth Error:",
      err.response?.data ||
        err.message
    );

    res.status(500).json({
      message: "GitHub OAuth failed"
    });
  }
});

/* =========================
   TWITTER START
========================= */
router.get("/twitter", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId required"
      });
    }

    const redirectUri =
      `${process.env.BACKEND_URL}` +
      "/api/oauth/twitter/callback";

    const codeVerifier =
      base64URLEncode(
        crypto.randomBytes(32)
      );

    const codeChallenge =
      base64URLEncode(
        sha256(codeVerifier)
      );

    pkceStore.set(
      userId,
      codeVerifier
    );

    const twitterUrl =
      "https://twitter.com/i/oauth2/authorize" +
      "?response_type=code" +
      `&client_id=${process.env.TWITTER_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(
        redirectUri
      )}` +
      "&scope=users.read tweet.read offline.access" +
      `&state=${encodeURIComponent(
        userId
      )}` +
      `&code_challenge=${codeChallenge}` +
      "&code_challenge_method=S256";

    res.redirect(twitterUrl);
  } catch (err) {
    res.status(500).json({
      message: "Twitter OAuth start failed"
    });
  }
});

/* =========================
   TWITTER CALLBACK
========================= */
router.get("/twitter/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        message: "Invalid callback"
      });
    }

    const codeVerifier =
      pkceStore.get(state);

    if (!codeVerifier) {
      return res.status(400).json({
        message:
          "Code verifier missing"
      });
    }

    const redirectUri =
      `${process.env.BACKEND_URL}` +
      "/api/oauth/twitter/callback";

    const tokenRes = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code,
        grant_type:
          "authorization_code",
        client_id:
          process.env.TWITTER_CLIENT_ID,
        redirect_uri:
          redirectUri,
        code_verifier:
          codeVerifier
      }).toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        auth: {
          username:
            process.env.TWITTER_CLIENT_ID,
          password:
            process.env.TWITTER_CLIENT_SECRET
        }
      }
    );

    const accessToken =
      tokenRes.data.access_token;

    if (!accessToken) {
      return res.status(400).json({
        message: "Twitter token failed"
      });
    }

    const profileRes = await axios.get(
      "https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url,public_metrics",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

    const twitter =
      profileRes.data.data;

    const updatedUser =
      await User.findByIdAndUpdate(
        state,
        {
          "verification.twitterConnected":
            true,

          "verification.twitterName":
            twitter.name || "",

          "verification.twitterUsername":
            twitter.username || "",

          lastActiveAt: new Date()
        },
        { new: true }
      );

    pkceStore.delete(state);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    await redirectToProfile(res);
  } catch (err) {
    console.log(
      "Twitter OAuth Error:",
      err.response?.data ||
        err.message
    );

    res.status(500).json({
      message: "Twitter OAuth failed"
    });
  }
});

module.exports = router;
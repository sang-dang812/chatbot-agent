const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');
const axios = require('axios');

require('dotenv').config();
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;

router.get('/callback' ,async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: client_id,
    client_secret: client_secret,
    redirect_uri: 'https://chatbot.danghs.id.vn/oauth2/callback',
    grant_type: 'authorization_code'
  });

  const { access_token, refresh_token, expires_in } = tokenResponse.data;

  const expires_at = new Date(Date.now() + expires_in * 1000);

  console.log(tokenResponse.data);
  await pool.query(
    'INSERT INTO gmail_tokens (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET access_token=$2, refresh_token=$3, expires_at=$4',
    [userId, access_token, refresh_token, expires_at]
  );

  res.json(tokenResponse.data,userId);
});

module.exports = router;

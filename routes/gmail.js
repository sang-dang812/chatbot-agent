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

  res.redirect('/dashboard.html');
});


router.get('/getLatestEmails', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  
  try {
    // Lấy access_token từ cơ sở dữ liệu của người dùng
    const result = await pool.query('SELECT access_token FROM gmail_tokens WHERE user_id = $1', [userId]);
    const access_token = result.rows[0]?.access_token;

    if (!access_token) {
      return res.status(400).json({ error: 'Không tìm thấy token' });
    }

    // Gọi Gmail API để lấy 5 email gần nhất
    const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages', {
      headers: {
        Authorization: `Bearer ${access_token}`
      },
      params: {
        maxResults: 5,
        q: 'is:inbox'  // Lọc chỉ các email trong hộp thư đến
      }
    });

    // Lấy các message ids
    const messages = response.data.messages;
    
    // Lấy chi tiết email từ message IDs
    const emailDetails = [];
    for (const message of messages) {
      const email = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      emailDetails.push(email.data);
    }

    // Trả về danh sách email
    res.json(emailDetails);
    
  } catch (error) {
    console.error('Lỗi khi lấy email:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lấy email.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');
const axios = require('axios');

require('dotenv').config();
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id,
      client_secret,
      redirect_uri: 'https://chatbot.danghs.id.vn/oauth2/callback',
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expires_at = new Date(Date.now() + expires_in * 1000);

    console.log('✅ Token Response:', tokenResponse.data);

    if (!refresh_token) {
      console.warn('⚠️ Google did NOT return a refresh_token. Maybe user already granted access before?');
    }

    await pool.query(
      `INSERT INTO gmail_tokens (user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET access_token=$2, refresh_token=COALESCE($3, gmail_tokens.refresh_token), expires_at=$4`,
      [userId, access_token, refresh_token || null, expires_at]
    );

    res.redirect('/gmail.html');
  } catch (error) {
    console.error('❌ Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).send('OAuth2 callback error');
  }
});



router.get('/getLatestEmails', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const access_token = await getValidGmailAccessToken(userId);
    // Lấy access_token từ cơ sở dữ liệu của người dùng
    // const result = await pool.query('SELECT access_token FROM gmail_tokens WHERE user_id = $1', [userId]);
    // const access_token = result.rows[0]?.access_token;

    // if (!access_token) {
    //   return res.status(400).json({ error: 'Không tìm thấy token' });
    // }

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

/**
 * Lấy access_token hợp lệ từ DB và làm mới nếu đã hết hạn
 * @param {string} userId
 * @returns {Promise<string>} access_token
 */
async function getValidGmailAccessToken(userId) {
  // Lấy thông tin token từ DB
  const result = await pool.query(
    'SELECT access_token, refresh_token, expires_at FROM gmail_tokens WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) throw new Error('Token not found for user');

  let { access_token, refresh_token, expires_at } = result.rows[0];

  // Nếu token chưa hết hạn thì dùng luôn
  if (new Date(expires_at) > new Date()) return access_token;

  // Nếu có refresh_token thì dùng để lấy access_token mới
  if (!refresh_token) throw new Error('No refresh_token available');

  console.log('🔄 Refreshing access_token...');
  const response = await axios.post('https://oauth2.googleapis.com/token', {
    client_id,
    client_secret,
    refresh_token,
    grant_type: 'refresh_token'
  });

  const newAccessToken = response.data.access_token;
  const newExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

  // Cập nhật lại DB
  await pool.query(
    'UPDATE gmail_tokens SET access_token = $1, expires_at = $2 WHERE user_id = $3',
    [newAccessToken, newExpiresAt, userId]
  );

  return newAccessToken;
}

module.exports = router;

// POST /auth/agent-info
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');


router.post('/sendMsg', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const msg = req.body.userInput;

  try {
    const result = await pool.query('SELECT id FROM agents WHERE user_id = $1', [userId]);
    const agentId = result.rows[0]?.id;
    const calendar = await pool.query('SELECT calendar_link FROM users WHERE id = $1', [userId]);
    const calendar_link = calendar.rows[0]?.calendar_link;
    const gmail = await pool.query('SELECT access_token FROM gmail_tokens WHERE user_id = $1', [userId]);
    const access_token = gmail.rows[0]?.access_token;

    const response = await fetch('https://n8n.danghs.id.vn/webhook/createDate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: msg,
        sessionId: userId,
        user_id: userId,
        id: agentId,
        calendar_link: calendar_link,
        access_token: access_token
      })
    });

    const data = await response.json();
    res.json(data); // trả kết quả về frontend
  } catch (err) {
    console.error('Lỗi khi gọi n8n:', err);
    res.status(500).json({ error: 'Đã có lỗi xảy ra khi gửi đến AI agent.' });
  }
});

router.get('/getAgentInfo', authMiddleware, async(req,res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query('SELECT * FROM agents WHERE user_id = $1',[userId]);
    const data = result.rows[0];
    console.log(data);
    res.json(data);
  } catch(err) {
    res.status(500).json({error: "loi khong tim thay user"});
  }
})

router.post('/addNewMemory', authMiddleware, async (req, res) => {
  const user_id = req.user.userId;
  const newFact = req.body.fact; // ví dụ: "thích đi chơi"
  console.log(newFact);
  try {
    const query = `
      UPDATE agents
      SET memory_json = jsonb_set(
        memory_json,
        '{memory}',
        COALESCE(memory_json->'memory', '[]'::jsonb) || to_jsonb($1::text)
      )
      WHERE user_id = $2
    `;

    await pool.query(query, [newFact, user_id]);

    res.status(200).json({ message: 'Memory updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
  }
});

router.post('/addNewPersonality', authMiddleware, async (req, res) => {
  const user_id = req.user.userId;
  const newFact = req.body.fact; // ví dụ: "thích đi chơi"
  console.log(newFact);
  try {
    const query = `
      UPDATE agents
      SET personality_prompt = $1
      WHERE user_id = $2
    `;

    await pool.query(query, [newFact, user_id]);

    res.status(200).json({ message: 'Personality updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
  }
});

router.delete('/chat-history', authMiddleware, async (req, res) => {
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM n8n_chat_histories WHERE session_id = $1',
      [user_id]
    );

    res.status(200).json({
      message: 'Đã xoá toàn bộ lịch sử chat thành công',
      rowsAffected: result.rowCount
    });
  } catch (err) {
    console.error('Lỗi khi xoá chat history:', err);
    res.status(500).json({ error: 'Lỗi server khi xoá chat history' });
  }
});

router.post('/uploadFile', authMiddleware, upload.single('file'), async (req, res) => {
  const userId = req.user.userId; // Lấy userId từ token đã xác thực
  const file = req.file;  // Lấy file gửi lên

  if (!file) {
    return res.status(400).json({ error: 'Không có file nào được gửi.' });
  }

  try {
    // Lấy thông tin từ database (ví dụ như user_id, access_token, ... nếu cần)
    const result = await pool.query('SELECT id FROM agents WHERE user_id = $1', [userId]);
    const agentId = result.rows[0]?.id;
    const calendar = await pool.query('SELECT calendar_link FROM users WHERE id = $1', [userId]);
    const calendar_link = calendar.rows[0]?.calendar_link;
    const gmail = await pool.query('SELECT access_token FROM gmail_tokens WHERE user_id = $1', [userId]);
    const access_token = gmail.rows[0]?.access_token;

    // Tạo form data để gửi file qua n8n
    const form = new FormData();
    form.append('sessionId', userId);
    form.append('user_id', userId);
    form.append('id', agentId);
    form.append('calendar_link', calendar_link);
    form.append('access_token', access_token);

    // Thêm file vào form data
    form.append('file', fs.createReadStream(file.path), file.originalname);

    // Gửi file tới n8n
    const response = await axios.post('https://n8n.danghs.id.vn/webhook/file', form, {
      headers: form.getHeaders(),
    });

    // Xoá file sau khi đã gửi tới n8n
    fs.unlinkSync(file.path);

    // Trả kết quả từ n8n về frontend
    res.json(response.data);
  } catch (err) {
    console.error('Lỗi khi gọi n8n:', err);
    res.status(500).json({ error: 'Đã có lỗi xảy ra khi gửi đến n8n.' });
  }
});

module.exports = router;

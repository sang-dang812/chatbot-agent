// POST /auth/agent-info
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

router.post('/sendMsg', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const msg = req.body.userInput;

  try {
    const result = await pool.query('SELECT id FROM agents WHERE user_id = $1', [userId]);
    const agentId = result.rows[0]?.id;
    const calendar = await pool.query('SELECT calendar_link FROM users WHERE id = $1', [userId]);
    const calendar_link = calendar.rows[0]?.calendar_link;
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
        calendar_link: calendar_link
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


module.exports = router;

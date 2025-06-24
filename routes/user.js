// POST /auth/agent-info
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

router.get('/getUserEmail', authMiddleware, async(req,res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    const email = result.rows[0]?.email;
    res.json(email); // trả kết quả về frontend
  } catch (err) {
    console.error('Lỗi', err);
    res.status(500).json({ error: 'Khoong timf thay ten' });
  }
});

router.get('/getUserInfo', authMiddleware, async(req,res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    console.log(user);
    res.json(user)
  } catch(err) {
    res.status(500).json({error: "loi khong tim thay user"});
  }
})

module.exports = router;

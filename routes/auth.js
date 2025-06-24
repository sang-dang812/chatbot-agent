const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Đăng ký
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Tạo user mới
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, hash]
    );

    const user = userResult.rows[0];

    // Tạo agent mặc định
    await pool.query(
      'INSERT INTO agents (user_id, personality_prompt) VALUES ($1, $2)',
      [user.id, 'Bạn là một AI trợ lý thân thiện.']
    );

    res.status(201).json({ message: 'Đăng ký thành công' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});


// Đăng nhập
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Email không tồn tại' });
    if (user.password_hash == password) {
        const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // => Token sống 7 ngày
        );

        res.json({ token });
    }
    else return res.status(400).json({error:"sai mật khẩu"})
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

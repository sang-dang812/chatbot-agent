const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

router.post("/create",authMiddleware, async(req,res) => {
    const userId = req.user.userId;
    const link = req.body.data;
    try {
        const result = await pool.query('UPDATE users SET calendar_link = $1 WHERE id = $2', [link,userId]);
        res.status(200).json({ message: 'Calendar ID updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update, something went wrong' });
  }
})

router.get("/getCalendarId", authMiddleware, async(req,res) => {
    const userId = req.user.userId;
    try {
        const result = await pool.query('SELECT calendar_link FROM users WHERE id = $1', [userId]);
        const calendar_link = result.rows[0]?.calendar_link;
        res.status(200).json({ calendar_link: calendar_link});
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi lấy dữ liệu' });
  }
})

module.exports = router;
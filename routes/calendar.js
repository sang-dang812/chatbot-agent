const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

router.post("/create",authMiddleware, async(req,res) => {
    const userId = req.user.userId;
    const link = req.body.data;
    try {
        const result = await pool.query('UPDATE users SET calendar_link = $1 WHERE id = $2', [link,userId]);
        res.status(200).json({ message: 'Memory updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi khi cập nhật dữ liệu' });
  }
})

module.exports = router;
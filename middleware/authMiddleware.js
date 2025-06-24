const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Thiếu token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // gắn userId vào req.user
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

module.exports = authMiddleware;

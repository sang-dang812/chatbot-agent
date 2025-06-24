const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Lỗi kết nối:', err.message);
  } else {
    console.log('✅ Kết nối thành công:', res.rows[0]);
  }
});

module.exports = pool
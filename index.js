const express = require('express');
const app = express();
require('dotenv').config();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); 
const agentRoutes = require('./routes/agent');
const calendarRoutes = require('./routes/calendar');

app.use(express.static('public'));
app.use(express.json());  


// Mount route
app.use('/auth', authRoutes);
app.use('/user', userRoutes); 
app.use('/agent', agentRoutes);
app.use('/calendar', calendarRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

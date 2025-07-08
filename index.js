const express = require('express');
const app = express();
require('dotenv').config();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user'); 
const agentRoutes = require('./routes/agent');
const calendarRoutes = require('./routes/calendar');
const oauth2Routes = require('./routes/gmail');
const http = require('http'); 

app.use(express.static('public'));
app.use(express.json());  


// Mount route
app.use('/auth', authRoutes);
app.use('/user', userRoutes); 
app.use('/agent', agentRoutes);
app.use('/calendar', calendarRoutes);
app.use('/oauth2', oauth2Routes);

const server = http.createServer(app);
server.setTimeout(300000); // 5 phút (300,000 ms)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const playerRouter = require('./routes/player.route');
const userRouter = require('./routes/user.route');
const adminRouter = require('./routes/admin.route');

app.use('/api', playerRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

// Middleware to check user session
const checkUserSession = (req, res, next) => {
  const userId = req.cookies.user_id;
  
  if (!userId) {
    // Redirect to user selection if no session
    return res.redirect('/');
  }
  
  next();
};

// Root route - user selection page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Serve dedicated pages (require user session)
app.get('/home', checkUserSession, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/home/index.html'));
});

app.get('/movies', checkUserSession, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/movies/index.html'));
});

app.get('/series', checkUserSession, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/series/index.html'));
});

app.get('/play', checkUserSession, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/play/index.html'));
});

// Admin route - no session required but PIN protected
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

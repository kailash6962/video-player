require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const playerRouter = require('./routes/player.route');

app.use('/api', playerRouter);

// Serve dedicated pages
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/home/index.html'));
});

app.get('/movies', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/movies/index.html'));
});

app.get('/series', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/series/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

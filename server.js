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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

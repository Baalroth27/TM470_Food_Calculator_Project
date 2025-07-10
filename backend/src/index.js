require('dotenv').config();
const express = require('express');
const pool = require('./db');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

 // Middleware
app.use(cors());
app.use(express.json());

// Test the database connection on startup
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.log('Connected to the database');
  }
});

app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
  });

app.use('/api/ingredients', require('./routes/api/ingredients'));
app.use('/api/recipes', require('./routes/api/recipes'));

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
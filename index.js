require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serves static files from public directory

// POST route to talk to Gemini API
app.post('/chat', async (req, res) => {
  const userPrompt = req.body.prompt;

  if (!userPrompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: userPrompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    // Better error handling for API response
    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const geminiReply = response.data.candidates[0].content.parts[0].text;
      res.json({ response: geminiReply });
    } else {
      console.error('Unexpected API response structure:', response.data);
      res.status(500).json({ error: 'Invalid response from Gemini API' });
    }
  } catch (err) {
    console.error("Error from Gemini:", err.response?.data || err.message);
    res.status(500).json({ error: 'Gemini API failed', details: err.message });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`RIOgpt is live at http://localhost:${port}`);
});
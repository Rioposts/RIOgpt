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

// POST route to talk to AI APIs
app.post('/chat', async (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!model) {
    return res.status(400).json({ error: 'Model selection is required' });
  }

  try {
    let response;
    
    // Handle OpenAI models
    if (model.startsWith('gpt-')) {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiReply = response.data.choices[0].message.content;
      res.json({ response: aiReply });
    }
    // Handle Gemini models
    else if (model.startsWith('gemini-')) {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          headers: { 'Content-Type': 'application/json' },
          params: { key: process.env.GEMINI_API_KEY },
        }
      );

      if (response.data && response.data.candidates && response.data.candidates.length > 0) {
        const aiReply = response.data.candidates[0].content.parts[0].text;
        res.json({ response: aiReply });
      } else {
        console.error('Unexpected Gemini API response structure:', response.data);
        res.status(500).json({ error: 'Invalid response from Gemini API' });
      }
    }
    else {
      res.status(400).json({ error: 'Unsupported model selected' });
    }
  } catch (err) {
    console.error("Error from AI API:", err.response?.data || err.message);
    
    // More specific error messages
    if (err.response?.status === 401) {
      res.status(401).json({ error: 'Invalid API key' });
    } else if (err.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (err.response?.status === 400) {
      res.status(400).json({ error: 'Invalid request. Please check your input.' });
    } else {
      res.status(500).json({ error: 'AI API failed', details: err.message });
    }
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
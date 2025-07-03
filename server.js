const express = require('express');
const cors = require('cors');
const questionsRoutes = require('./routes/questions');
const uploadRoutes = require('./routes/upload');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 5000;
require('dotenv').config()


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/questions', questionsRoutes);
app.use('/api/upload', uploadRoutes);
app.get('/api/codes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get code by ID
app.get('/api/codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Code not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new code
app.post('/api/codes', async (req, res) => {
  try {
    const { title, description, code, language, category } = req.body;

    // Validation
    if (!title || !description || !code) {
      return res.status(400).json({ error: 'Title, description, and code are required' });
    }

    const { data, error } = await supabase
      .from('codes')
      .insert([
        {
          title,
          description,
          code,
          language: language || 'javascript',
          category: category || 'algorithm'
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update code
app.put('/api/codes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, code, language, category } = req.body;

    // Validation
    if (!title || !description || !code) {
      return res.status(400).json({ error: 'Title, description, and code are required' });
    }

    const { data, error } = await supabase
      .from('codes')
      .update({
        title,
        description,
        code,
        language: language || 'javascript',
        category: category || 'algorithm',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Code not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete code
app.delete('/api/codes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('codes')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Code not found' });
    }

    res.json({ message: 'Code deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
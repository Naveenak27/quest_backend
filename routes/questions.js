const express = require('express');
const supabase = require('../config/supabase');
const router = express.Router();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error (GET):', error);
      throw error;
    }
    res.json(data);
  } catch (error) {
    console.error('Server error (GET):', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new question
router.post('/', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    const { question, answer, category, subcategory } = req.body;

    // Validate required fields
    if (!question || !answer || !category || !subcategory) {
      return res.status(400).json({ 
        error: 'All fields are required: question, answer, category, subcategory',
        received: { question: !!question, answer: !!answer, category: !!category, subcategory: !!subcategory }
      });
    }

    // Trim whitespace from all fields
    const cleanData = {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      subcategory: subcategory.trim()
    };

    console.log('Inserting data:', cleanData);

    const { data, error } = await supabase
      .from('questions')
      .insert([cleanData])
      .select();

    if (error) {
      console.error('Supabase error (POST):', error);
      throw error;
    }

    console.log('Successfully inserted:', data);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Server error (POST):', error);
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'No additional details available'
    });
  }
});

// Update question
// Update question
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, subcategory } = req.body;

    // Validate ID exists
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    // Validate required fields
    if (!question || !answer || !category || !subcategory) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const cleanData = {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      subcategory: subcategory.trim()
    };

    const { data, error } = await supabase
      .from('questions')
      .update(cleanData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error (PUT):', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Server error (PUT):', error);
    res.status(500).json({ error: error.message });
  }
});
// Delete question
// Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID exists
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error (DELETE):', error);
      throw error;
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Server error (DELETE):', error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
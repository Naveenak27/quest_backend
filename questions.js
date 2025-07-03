const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get all questions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error (GET questions):', error);
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Server error (GET questions):', error);
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
        received: { 
          question: !!question, 
          answer: !!answer, 
          category: !!category, 
          subcategory: !!subcategory 
        }
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
      console.error('Supabase error (POST question):', error);
      throw error;
    }
    
    console.log('Successfully inserted:', data);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Server error (POST question):', error);
    res.status(500).json({
      error: error.message,
      details: error.details || 'No additional details available'
    });
  }
});

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
      console.error('Supabase error (PUT question):', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error('Server error (PUT question):', error);
    res.status(500).json({ error: error.message });
  }
});

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
      console.error('Supabase error (DELETE question):', error);
      throw error;
    }
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Server error (DELETE question):', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
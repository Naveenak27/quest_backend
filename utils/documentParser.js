const parseDocument = (content) => {
  console.log('\n🔍 Starting document parsing...');
  console.log('📄 Content length:', content.length);
  
  const questions = [];
  
  // Clean up the content
  const cleanContent = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  
  console.log('🧹 Cleaned content length:', cleanContent.length);
  console.log('📝 Full content preview:\n', cleanContent);
  
  // Use a more comprehensive approach to find question boundaries
  // Look for patterns like "1.", "2.", etc. that mark new questions
  const questionBoundaries = [];
  
  // Find all question number patterns
  const questionNumberRegex = /(?:^|\n)(\*?\*?)?(\d+)\.\s*(?:\*?\*?)?(.*?)(?:\*?\*?)?(?=\n|$)/g;
  let match;
  
  while ((match = questionNumberRegex.exec(cleanContent)) !== null) {
    questionBoundaries.push({
      fullMatch: match[0],
      number: match[2],
      position: match.index,
      content: match[3] || ''
    });
  }
  
  console.log('🔍 Found question boundaries:', questionBoundaries.length);
  questionBoundaries.forEach((boundary, index) => {
    console.log(`  Question ${boundary.number} at position ${boundary.position}: "${boundary.content.substring(0, 50)}..."`);
  });
  
  // If we found question boundaries, use them to split content
  if (questionBoundaries.length > 0) {
    for (let i = 0; i < questionBoundaries.length; i++) {
      const currentBoundary = questionBoundaries[i];
      const nextBoundary = questionBoundaries[i + 1];
      
      console.log(`\n--- Processing Question ${currentBoundary.number} ---`);
      
      // Extract the full content for this question
      let questionSection;
      if (nextBoundary) {
        questionSection = cleanContent.substring(currentBoundary.position, nextBoundary.position).trim();
      } else {
        questionSection = cleanContent.substring(currentBoundary.position).trim();
      }
      
      console.log('📄 Question section length:', questionSection.length);
      console.log('📄 Question section preview:', questionSection.substring(0, 200) + '...');
      
      // Parse this specific question section
      const parsedQuestion = parseQuestionSection(questionSection, currentBoundary.number);
      
      if (parsedQuestion) {
        questions.push(parsedQuestion);
        console.log('✅ Question added successfully');
      } else {
        console.log('❌ Failed to parse question section');
      }
    }
  } else {
    console.log('❌ No question boundaries found, trying alternative approach');
    
    // Fallback: try to split on any number followed by period
    const fallbackSections = cleanContent.split(/(?=\d+\.\s)/).filter(section => section.trim());
    console.log('🔄 Fallback found sections:', fallbackSections.length);
    
    fallbackSections.forEach((section, index) => {
      console.log(`\n--- Processing Fallback Section ${index + 1} ---`);
      const parsedQuestion = parseQuestionSection(section.trim(), index + 1);
      
      if (parsedQuestion) {
        questions.push(parsedQuestion);
        console.log('✅ Question added successfully');
      }
    });
  }
  
  console.log('\n=== PARSING COMPLETE ===');
  console.log('Total parsed questions:', questions.length);
  
  return questions;
};

// Helper function to parse individual question sections
const parseQuestionSection = (sectionContent, questionNumber) => {
  console.log(`\n🔍 Parsing question section ${questionNumber}:`);
  console.log('Section content:', sectionContent.substring(0, 300) + '...');
  
  // Remove the question number prefix and any markdown formatting
  let content = sectionContent
    .replace(/^\*?\*?\d+\.\s*\*?\*?/, '') // Remove question number and markdown
    .replace(/\*\*([^*]+)\*\*/g, '$1')    // Remove bold formatting
    .replace(/`([^`]+)`/g, '$1')          // Remove code backticks
    .trim();
  
  console.log('🧹 Cleaned content:', content.substring(0, 200) + '...');
  
  let question = '';
  let answer = '';
  
  // Strategy 1: Look for question mark followed by bullet points
  const questionWithBulletsMatch = content.match(/^(.*?\?)\s*\n?\s*((?:\*\s*.+(?:\n|$))+)/s);
  
  if (questionWithBulletsMatch) {
    console.log('✅ Found question with bullet points');
    question = questionWithBulletsMatch[1].trim();
    
    // Process bullet points
    const bulletContent = questionWithBulletsMatch[2];
    answer = bulletContent
      .split(/\n\s*\*\s*/)
      .filter(item => item.trim())
      .map(item => item.trim())
      .join('. ')
      .replace(/\.\s*$/, '') // Remove trailing period
      .trim();
    
    console.log('📝 Extracted from bullets');
  }
  // Strategy 2: Look for question mark followed by content
  else {
    const questionMarkMatch = content.match(/^(.*?\?)\s*(.+)/s);
    
    if (questionMarkMatch) {
      console.log('✅ Found question mark separator');
      question = questionMarkMatch[1].trim();
      answer = questionMarkMatch[2].trim();
      
      // Clean up answer - remove bullet points if they exist
      answer = answer
        .replace(/^\*\s*/, '') // Remove leading bullet
        .replace(/\n\s*\*\s*/g, '. ') // Convert bullets to sentences
        .trim();
    }
    // Strategy 3: Split at common question words
    else {
      const questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who'];
      let found = false;
      
      for (const word of questionWords) {
        const regex = new RegExp(`^(.*?${word}[^.?!]*[.?!])\\s*(.+)`, 'is');
        const match = content.match(regex);
        
        if (match && match[2].trim()) {
          console.log(`✅ Found split after question word: ${word}`);
          question = match[1].trim();
          answer = match[2].trim();
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log('⚠️ Could not parse question/answer, using fallback');
        // If no clear separation, assume first sentence is question
        const sentences = content.split(/(?<=[.!?])\s+/);
        if (sentences.length >= 2) {
          question = sentences[0].trim();
          answer = sentences.slice(1).join(' ').trim();
        } else {
          question = content;
          answer = 'Answer could not be separated from question.';
        }
      }
    }
  }
  
  // Clean up HTML entities
  question = question.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  answer = answer.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  
  console.log('📋 Final parsed data:');
  console.log('  Question length:', question.length);
  console.log('  Answer length:', answer.length);
  console.log('  Question:', question);
  console.log('  Answer:', answer.substring(0, 100) + '...');
  
  // Validate the parsed question and answer
  if (question.length < 5) {
    console.log('❌ Question too short');
    return null;
  }
  
  if (answer.length < 3) {
    console.log('❌ Answer too short');
    return null;
  }
  
  // Determine category and difficulty based on content
  const category = determineCategory(question + ' ' + answer);
  const difficulty = determineDifficulty(question + ' ' + answer);
  const tags = extractTags(question + ' ' + answer);
  
  return {
    question: question,
    answer: answer,
    category: category,
    subcategory: 'General',
    difficulty: difficulty,
    tags: tags,
    options: null
  };
};

// Helper function to determine category based on content
const determineCategory = (content) => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('html') || lowerContent.includes('css') || lowerContent.includes('javascript')) {
    return 'Web Development';
  } else if (lowerContent.includes('python') || lowerContent.includes('java') || lowerContent.includes('programming')) {
    return 'Programming';
  } else if (lowerContent.includes('database') || lowerContent.includes('sql')) {
    return 'Database';
  } else if (lowerContent.includes('network') || lowerContent.includes('server')) {
    return 'Networking';
  } else if (lowerContent.includes('algorithm') || lowerContent.includes('data structure')) {
    return 'Computer Science';
  } else {
    return 'General';
  }
};

// Helper function to determine difficulty based on content
const determineDifficulty = (content) => {
  const lowerContent = content.toLowerCase();
  
  // Advanced indicators
  if (lowerContent.includes('optimization') || 
      lowerContent.includes('performance') || 
      lowerContent.includes('architecture') ||
      lowerContent.includes('advanced') ||
      lowerContent.includes('complex')) {
    return 'Advanced';
  }
  
  // Intermediate indicators
  if (lowerContent.includes('implementation') || 
      lowerContent.includes('design pattern') || 
      lowerContent.includes('framework') ||
      lowerContent.includes('integration')) {
    return 'Intermediate';
  }
  
  // Default to Beginner
  return 'Beginner';
};

// Helper function to extract tags from content
const extractTags = (content) => {
  const tags = [];
  const lowerContent = content.toLowerCase();
  
  // Technology tags
  const techKeywords = ['html', 'css', 'javascript', 'python', 'java', 'sql', 'react', 'node', 'angular', 'vue'];
  techKeywords.forEach(tech => {
    if (lowerContent.includes(tech)) {
      tags.push(tech.toUpperCase());
    }
  });
  
  // Concept tags
  const conceptKeywords = ['semantic', 'responsive', 'accessibility', 'seo', 'performance', 'security'];
  conceptKeywords.forEach(concept => {
    if (lowerContent.includes(concept)) {
      tags.push(concept.charAt(0).toUpperCase() + concept.slice(1));
    }
  });
  
  return tags;
};

module.exports = { parseDocument };
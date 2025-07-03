const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const StreamZip = require('node-stream-zip');
const unzipper = require('unzipper');
const { parseDocument } = require('../utils/documentParser');

const router = express.Router();

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word (DOC/DOCX), and ODT files are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Process PDF files
async function processPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);
  return pdfData.text;
}

// Process DOCX files
async function processDOCX(filePath) {
  if (!await isValidDocx(filePath)) {
    throw new Error('Invalid DOCX file format');
  }
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// Process ODT files by extracting content.xml
async function processODT(filePath) {
  try {
    const extractDir = path.join(__dirname, '../temp_odt_extract');
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }

    // Extract the ODT file (which is a ZIP archive)
    await fs.createReadStream(filePath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();

    // Read the content.xml file
    const contentPath = path.join(extractDir, 'content.xml');
    if (!fs.existsSync(contentPath)) {
      throw new Error('Invalid ODT file - content.xml not found');
    }

    const content = fs.readFileSync(contentPath, 'utf8');
    
    // Basic XML parsing to extract text
    const text = content.replace(/<[^>]+>/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();

    // Clean up extracted files
    fs.rmSync(extractDir, { recursive: true, force: true });

    return text;
  } catch (error) {
    throw new Error(`ODT processing failed: ${error.message}`);
  }
}

// Validate DOCX file structure
async function isValidDocx(filePath) {
  try {
    const zip = new StreamZip.async({ file: filePath });
    const entries = await zip.entries();
    let hasContent = false;
    
    for (const entry of Object.values(entries)) {
      if (entry.name.startsWith('word/')) {
        hasContent = true;
        break;
      }
    }
    
    await zip.close();
    return hasContent;
  } catch (error) {
    console.error('DOCX validation error:', error);
    return false;
  }
}

// Document upload endpoint
router.post('/document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let text;
    const ext = path.extname(req.file.path).toLowerCase();

    // Process based on file type
    if (req.file.mimetype === 'application/pdf' || ext === '.pdf') {
      text = await processPDF(req.file.path);
    }
    else if (req.file.mimetype.includes('word') || ext === '.docx') {
      text = await processDOCX(req.file.path);
    }
    else if (req.file.mimetype === 'application/vnd.oasis.opendocument.text' || ext === '.odt') {
      text = await processODT(req.file.path);
    }
    else {
      throw new Error('Unsupported file type');
    }

    const questions = parseDocument(text);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Processed ${questions.length} questions successfully`,
      questions
    });

  } catch (error) {
    console.error('Upload error:', error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false,
      error: 'Document processing failed',
      details: error.message 
    });
  }
});

module.exports = router;
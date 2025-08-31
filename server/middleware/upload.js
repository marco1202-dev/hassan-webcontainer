const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.id;
    const uploadDir = path.join(__dirname, '../uploads', projectId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    files: 1000,
    fieldSize: 10 * 1024 * 1024 // 10MB field size
  }
});

// Helper function to determine file type
const getFileType = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'unknown';
  }
  
  const ext = path.extname(filename).toLowerCase();
  if (ext) return ext;
  
  // Handle files without extensions
  if (filename.includes('Dockerfile')) return '.dockerfile';
  if (filename.includes('Makefile')) return '.makefile';
  if (filename.includes('README')) return '.readme';
  if (filename.includes('LICENSE')) return '.license';
  if (filename.includes('.gitignore')) return '.gitignore';
  if (filename.includes('.env')) return '.env';
  
  return 'unknown';
};

module.exports = { upload, getFileType };

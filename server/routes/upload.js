const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Project = require('../models/Project');

const router = express.Router();

// Helper function to determine file type
const getFileType = (filename) => {
  if (!filename || typeof filename !== 'string') {
    console.warn('Invalid filename provided to getFileType:', filename);
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
  
  // Handle other common files without extensions
  if (filename === 'package-lock.json') return '.json';
  if (filename === 'yarn.lock') return '.lock';
  if (filename === '.npmrc') return '.npmrc';
  if (filename === '.nvmrc') return '.nvmrc';
  
  console.log(`No extension found for file: ${filename}, using 'unknown'`);
  return 'unknown';
};

// Helper function to build project structure
const buildProjectStructure = (files) => {
  const structure = new Map();
  
  files.forEach(file => {
    const pathParts = file.relativePath.split('/');
    let currentPath = '';
    
    // Handle root level files
    if (pathParts.length === 1) {
      if (!structure.has('')) {
        structure.set('', []);
      }
      structure.get('').push(file.filename);
      return;
    }
    
    // Build folder structure
    pathParts.forEach((part, index) => {
      if (index === pathParts.length - 1) {
        // This is a file - add it to the current folder
        if (!structure.has(currentPath)) {
          structure.set(currentPath, []);
        }
        structure.get(currentPath).push(file.filename);
      } else {
        // This is a directory - create or update the folder
        if (currentPath === '') {
          currentPath = part;
        } else {
          currentPath = currentPath + '/' + part;
        }
        
        if (!structure.has(currentPath)) {
          structure.set(currentPath, []);
        }
      }
    });
  });
  
  return structure;
};

// Configure multer for basic file storage (we'll handle folder structure manually)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.projectId;
    const uploadDir = path.join(__dirname, '../uploads', projectId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Always store in project root first, we'll move files to proper locations later
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1000, // Increased limit for large folder uploads
    fieldSize: 10 * 1024 * 1024 // 10MB for field data
  },
  fileFilter: (req, file, cb) => {
    // Allow common web development file types
    const allowedTypes = [
      // Web files
      '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
      '.json', '.md', '.txt', '.xml', '.yaml', '.yml',
      
      // Images
      '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
      
      // Fonts
      '.woff', '.woff2', '.ttf', '.otf', '.eot',
      
      // Source maps and preprocessors
      '.map', '.scss', '.sass', '.less', '.styl', '.coffee',
      
      // Programming languages
      '.py', '.php', '.rb', '.go', '.rs', '.java', '.cpp', '.c', '.h', '.cs',
      '.swift', '.kt', '.dart', '.r', '.m', '.pl', '.sh', '.bat', '.ps1',
      
      // Data files
      '.csv', '.xlsx', '.xls', '.sql', '.db', '.sqlite',
      
      // Archives (if needed)
      '.zip', '.tar', '.gz', '.rar',
      
      // Other common files
      '.pdf', '.doc', '.docx', '.rtf'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext) || ext === '') {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed`));
    }
  }
});

// Add middleware to parse text fields (for folderStructure)
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// @route   POST /api/projects/:projectId/upload
// @desc    Upload files to a project (with folder support)
// @access  Private (project owner only)
router.post('/', auth, upload.array('files', 1000), async (req, res) => {
  console.log(`Individual file upload started for project ${req.params.projectId}`);
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload to this project' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = [];
    
    try {
      for (const file of req.files) {
        // For individual file uploads, also check if they have folder structure
        let relativePath;
        if (file.webkitRelativePath) {
          // This file has folder structure - preserve it
          relativePath = file.webkitRelativePath.replace(/\\/g, '/'); // Normalize to forward slashes
          console.log(`File with folder structure: ${file.originalname} -> ${relativePath}`);
        } else {
          // This is a regular file upload
          const projectRoot = path.join(__dirname, '../uploads', projectId);
          const tempRelativePath = path.relative(projectRoot, file.path);
          relativePath = path.join(path.dirname(tempRelativePath), file.originalname).replace(/\\/g, '/');
        }
        
        const fileInfo = {
          filename: file.originalname,
          filepath: file.path,
          relativePath: relativePath,
          filetype: getFileType(file.originalname),
          size: file.size,
          isDirectory: false
        };
        
        console.log(`Processing file: ${file.originalname} -> Type: ${fileInfo.filetype} -> Path: ${relativePath}`);
        uploadedFiles.push(fileInfo);
      }
    } catch (fileProcessingError) {
      console.error('Error processing files:', fileProcessingError);
      return res.status(500).json({ 
        message: 'Error processing uploaded files',
        error: fileProcessingError.message
      });
    }
    
    // Validate uploaded files before processing
    const invalidFiles = uploadedFiles.filter(f => !f.filename || !f.filepath || !f.relativePath || !f.filetype);
    if (invalidFiles.length > 0) {
      console.error('Invalid files found:', invalidFiles);
      return res.status(400).json({ 
        message: 'Some files have invalid data',
        invalidFiles: invalidFiles.map(f => ({ filename: f.filename, missing: [] }))
      });
    }
    
    // Ensure all files have valid filetypes
    uploadedFiles.forEach(file => {
      if (!file.filetype || file.filetype === '') {
        console.warn(`Fixing empty filetype for ${file.filename}`);
        file.filetype = 'unknown';
      }
    });

    console.log(`File validation completed. ${uploadedFiles.length} files ready for upload.`);
    
    // Log file type summary
    const fileTypeCounts = {};
    uploadedFiles.forEach(file => {
      fileTypeCounts[file.filetype] = (fileTypeCounts[file.filetype] || 0) + 1;
    });
    console.log('File type summary:', fileTypeCounts);
    
    // Final validation check
    const finalInvalidFiles = uploadedFiles.filter(f => !f.filename || !f.filepath || !f.relativePath || !f.filetype);
    if (finalInvalidFiles.length > 0) {
      console.error('Final validation failed. Invalid files:', finalInvalidFiles);
      return res.status(400).json({ 
        message: 'File validation failed. Some files have invalid data.',
        invalidFiles: finalInvalidFiles.map(f => ({ filename: f.filename, missing: [] }))
      });
    }

    // Update project with new files
    project.files = [...project.files, ...uploadedFiles];
    
    // Build project structure manually to avoid parallel save issues
    try {
      project.projectStructure = buildProjectStructure(project.files);
      console.log('Project structure built successfully');
      
      // Log structure summary
      const structureSummary = {};
      project.projectStructure.forEach((files, path) => {
        structureSummary[path || 'root'] = files.length;
      });
      console.log('Structure summary:', structureSummary);
    } catch (structureError) {
      console.error('Error building project structure:', structureError);
      // Continue without project structure if it fails
      project.projectStructure = new Map();
    }
    
    // Set main file if it's the first upload and contains index.html
    if (project.files.length === uploadedFiles.length) {
      const indexFile = uploadedFiles.find(f => f.filename === 'index.html');
      if (indexFile) {
        project.mainFile = indexFile.relativePath;
      }
    }

    try {
      await project.save();
      console.log(`Individual file upload completed successfully. Total files: ${project.files.length}`);
      
      // Final summary
      const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
      console.log(`Upload summary: ${uploadedFiles.length} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB total`);
      
      res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles,
        project
      });
    } catch (saveError) {
      console.error('Error saving project:', saveError);
      res.status(500).json({ 
        message: 'Error saving project after file upload',
        error: saveError.message
      });
    }

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// @route   POST /api/projects/:projectId/upload/folder
// @desc    Upload a folder structure to a project
// @access  Private (project owner only)
router.post('/folder', auth, upload.array('folder', 1000), async (req, res) => {
  console.log(`Folder upload started for project ${req.params.projectId}`);
  console.log(`Files received: ${req.files ? req.files.length : 0}`);
  
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload to this project' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Get the folder structure from the request body
    const folderStructure = req.body.folderStructure ? JSON.parse(req.body.folderStructure) : {};
    console.log('Received folder structure:', folderStructure);
    
    // Log file information for debugging
    console.log('File details:');
    req.files.slice(0, 5).forEach((file, index) => {
      console.log(`  File ${index + 1}: ${file.originalname}`);
      console.log(`  Path: ${file.path}`);
      console.log(`  Fieldname: ${file.fieldname}`);
    });

    const uploadedFiles = [];
    
    try {
      for (const file of req.files) {
        // Ensure we have valid file data
        if (!file.originalname || !file.path || !file.size) {
          console.warn('Skipping invalid file:', file);
          continue;
        }
        
        // For folder uploads, use the folder structure information sent from frontend
        let relativePath;
        if (Object.keys(folderStructure).length > 0) {
          // Find which folder this file belongs to
          let fileFolder = '';
          for (const [folderPath, fileNames] of Object.entries(folderStructure)) {
            if (fileNames.includes(file.originalname)) {
              fileFolder = folderPath;
              break;
            }
          }
          
          if (fileFolder) {
            // This file belongs to a subfolder
            relativePath = `${fileFolder}/${file.originalname}`;
            console.log(`Folder upload: ${file.originalname} -> ${relativePath}`);
            
            // Create the directory structure in the filesystem
            const projectRoot = path.join(__dirname, '../uploads', projectId);
            const fullDirPath = path.join(projectRoot, fileFolder);
            
            if (!fs.existsSync(fullDirPath)) {
              fs.mkdirSync(fullDirPath, { recursive: true });
              console.log(`Created directory: ${fullDirPath}`);
            }
            
            // Move the file to the correct subdirectory
            const newFilePath = path.join(fullDirPath, file.originalname);
            try {
              fs.renameSync(file.path, newFilePath);
              console.log(`Moved file to: ${newFilePath}`);
              
              // Update the file path to the new location
              file.path = newFilePath;
            } catch (moveError) {
              console.error(`Error moving file ${file.originalname}:`, moveError);
              // If move fails, keep the file in the root directory
              relativePath = file.originalname;
            }
          } else {
            // This file is at the root level
            relativePath = file.originalname;
            console.log(`Root level file: ${file.originalname}`);
          }
        } else {
          // Fallback: calculate relative path from project root
          const projectRoot = path.join(__dirname, '../uploads', projectId);
          const tempRelativePath = path.relative(projectRoot, file.path);
          relativePath = path.join(path.dirname(tempRelativePath), file.originalname).replace(/\\/g, '/');
          console.log(`Fallback path: ${file.originalname} -> ${relativePath}`);
        }
        
        const fileInfo = {
          filename: file.originalname,
          filepath: file.path,
          relativePath: relativePath,
          filetype: getFileType(file.originalname),
          size: file.size,
          isDirectory: false
        };
        
        console.log(`Processing file: ${file.originalname} -> Type: ${fileInfo.filetype} -> Path: ${relativePath}`);
        uploadedFiles.push(fileInfo);
      }
    } catch (fileProcessingError) {
      console.error('Error processing files:', fileProcessingError);
      return res.status(500).json({ 
        message: 'Error processing uploaded files',
        error: fileProcessingError.message
      });
    }

    // Validate uploaded files before processing
    const invalidFiles = uploadedFiles.filter(f => !f.filename || !f.filepath || !f.relativePath || !f.filetype);
    if (invalidFiles.length > 0) {
      console.error('Invalid files found:', invalidFiles);
      return res.status(400).json({ 
        message: 'Some files have invalid data',
        invalidFiles: invalidFiles.map(f => ({ filename: f.filename, missing: [] }))
      });
    }
    
    // Ensure all files have valid filetypes
    uploadedFiles.forEach(file => {
      if (!file.filetype || file.filetype === '') {
        console.warn(`Fixing empty filetype for ${file.filename}`);
        file.filetype = 'unknown';
      }
    });

    console.log(`File validation completed. ${uploadedFiles.length} files ready for upload.`);
    
    // Log file type summary
    const fileTypeCounts = {};
    uploadedFiles.forEach(file => {
      fileTypeCounts[file.filetype] = (fileTypeCounts[file.filetype] || 0) + 1;
    });
    console.log('File type summary:', fileTypeCounts);
    
    // Final validation check
    const finalInvalidFiles = uploadedFiles.filter(f => !f.filename || !f.filepath || !f.relativePath || !f.filetype);
    if (finalInvalidFiles.length > 0) {
      console.error('Final validation failed. Invalid files:', finalInvalidFiles);
      return res.status(400).json({ 
        message: 'File validation failed. Some files have invalid data.',
        invalidFiles: finalInvalidFiles.map(f => ({ filename: f.filename, missing: [] }))
      });
    }
    
    // Update project with new files
    project.files = [...project.files, ...uploadedFiles];
    
    // Set main file if it's the first upload and contains index.html
    if (project.files.length === uploadedFiles.length) {
      const indexFile = uploadedFiles.find(f => f.filename === 'index.html');
      if (indexFile) {
        project.mainFile = indexFile.relativePath;
      }
    }
    
        // Build project structure manually to avoid parallel save issues
    try {
      project.projectStructure = buildProjectStructure(project.files);
      console.log('Project structure built successfully');
      
      // Log structure summary
      const structureSummary = {};
      project.projectStructure.forEach((files, path) => {
        structureSummary[path || 'root'] = files.length;
      });
      console.log('Structure summary:', structureSummary);
    } catch (structureError) {
      console.error('Error building project structure:', structureError);
      // Continue without project structure if it fails
      project.projectStructure = new Map();
    }
    
    try {
      await project.save();
      console.log(`Folder upload completed successfully. Total files: ${project.files.length}`);
      
      // Final summary
      const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
      console.log(`Upload summary: ${uploadedFiles.length} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB total`);
      
      res.json({
        message: 'Folder uploaded successfully',
        files: uploadedFiles,
        project
      });
    } catch (saveError) {
      console.error('Error saving project:', saveError);
      res.status(500).json({ 
        message: 'Error saving project after file upload',
        error: saveError.message
      });
    }

  } catch (error) {
    console.error('Folder upload error:', error);
    
    // Provide more detailed error information
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error during folder upload',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ message: 'Server error during folder upload' });
  }
});

// @route   DELETE /api/upload/:projectId/:filename
// @desc    Delete a file from a project
// @access  Private (project owner only)
router.delete('/:projectId/:filename', auth, async (req, res) => {
  try {
    const { projectId, filename } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete from this project' });
    }

    // Find the file
    const fileIndex = project.files.findIndex(f => f.filename === filename);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = project.files[fileIndex];

    // Delete file from filesystem
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    // Remove file from project
    project.files.splice(fileIndex, 1);

    // Update main file if necessary
    if (project.mainFile === filename) {
      project.mainFile = project.files.length > 0 ? project.files[0].relativePath : 'index.html';
    }

    await project.save();

    res.json({
      message: 'File deleted successfully',
      project
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Server error during file deletion' });
  }
});

// Error handling for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: `Too many files. Maximum allowed: 1000 files. You tried to upload: ${error.message}` 
      });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: `File too large. Maximum allowed: 10MB per file. ${error.message}` 
      });
    }
    if (error.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({ 
        message: `Too many form fields. ${error.message}` 
      });
    }
    return res.status(400).json({ 
      message: `Upload error: ${error.message}` 
    });
  }
  
  // Handle other errors
  console.error('Upload route error:', error);
  res.status(500).json({ 
    message: 'Server error during upload' 
  });
});

module.exports = router;

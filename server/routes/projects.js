const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const { upload, getFileType } = require('../middleware/upload');
const AdmZip = require('adm-zip');

const router = express.Router();

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', auth, [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('framework')
    .isIn(['react', 'nextjs', 'vue', 'svelte', 'angular', 'vanilla', 'other'])
    .withMessage('Invalid framework selection')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { title, description, framework, tags, isPublic } = req.body;

    const project = new Project({
      title,
      description,
      framework,
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      owner: req.user._id
    });

    await project.save();

    res.status(201).json({
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error during project creation' });
  }
});

// @route   GET /api/projects
// @desc    Get user's projects
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate('owner', 'username');

    res.json({ projects });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// IMPORTANT: More specific routes must come BEFORE generic routes
// @route   GET /api/projects/:id/structure
// @desc    Get project file structure from filesystem
// @access  Private (project owner only)
router.get('/:id/structure', auth, async (req, res) => {
  try {
    console.log(`Structure route called for project ID: ${req.params.id}`);
    console.log(`User ID: ${req.user._id}`);
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      console.log('Project not found in database');
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Project found: ${project.title}, Owner: ${project.owner}`);

    // Check if user has access to this project
    if (project.owner.toString() !== req.user._id.toString()) {
      console.log('User not authorized for this project');
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    const projectDir = path.join(__dirname, '../uploads', req.params.id);
    console.log(`Looking for project directory: ${projectDir}`);
    
    if (!fs.existsSync(projectDir)) {
      console.log('Project directory not found on filesystem');
      return res.status(404).json({ message: 'Project directory not found' });
    }

    console.log('Project directory found, reading structure...');

    // Function to recursively read directory structure
    const readDirectoryStructure = (dirPath, relativePath = '') => {
      const items = [];
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);
        const itemRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Recursively read subdirectory
          const subItems = readDirectoryStructure(fullPath, itemRelativePath);
          items.push({
            type: 'folder',
            name: entry.name,
            relativePath: itemRelativePath,
            children: subItems
          });
        } else {
          // File
          const stats = fs.statSync(fullPath);
          items.push({
            type: 'file',
            name: entry.name,
            relativePath: itemRelativePath,
            size: stats.size,
            modified: stats.mtime
          });
        }
      });
      
      return items;
    };

    const fileStructure = readDirectoryStructure(projectDir);
    console.log(`File structure built with ${fileStructure.length} root items`);
    
    res.json({ 
      success: true, 
      structure: fileStructure 
    });
    
  } catch (error) {
    console.error('Error getting project structure:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id/files/:filepath
// @desc    Get file content by relative path
// @access  Private (project owner or public projects)
router.get('/:id/files/*', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const filePath = req.params[0]; // This captures the wildcard part
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user can access this project
    if (!project.isPublic && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    // Find the file in the project
    const file = project.files.find(f => f.relativePath === filePath);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if file exists on filesystem
    if (!fs.existsSync(file.filepath)) {
      return res.status(404).json({ message: 'File not found on filesystem' });
    }

    // Read file content
    try {
      const content = fs.readFileSync(file.filepath, 'utf8');
      res.json({ 
        content,
        filename: file.filename,
        filepath: file.filepath,
        relativePath: file.relativePath,
        filetype: file.filetype,
        size: file.size
      });
    } catch (readError) {
      console.error('Error reading file:', readError);
      res.status(500).json({ message: 'Error reading file content' });
    }
  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id/preview/:filepath
// @desc    Serve file for preview (HTML, CSS, JS) - PUBLIC ACCESS FOR IFRAME
// @access  Public (for iframe embedding)
router.get('/:id/preview/*', async (req, res) => {
  try {
    const projectId = req.params.id;
    const filePath = req.params[0];
    
    console.log(`Preview request: ${projectId}/${filePath}`);
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // For preview routes, we'll allow public access to make iframe embedding work
    // In a production environment, you might want to add project-level privacy settings

    // Build the actual file path from the filesystem (not database)
    const projectDir = path.join(__dirname, '../uploads', projectId);
    const actualFilePath = path.join(projectDir, filePath);
    
    console.log(`Looking for file: ${actualFilePath}`);
    
    // Security check - make sure file is within project directory
    const resolvedPath = path.resolve(actualFilePath);
    const resolvedProjectDir = path.resolve(projectDir);
    if (!resolvedPath.startsWith(resolvedProjectDir)) {
      console.log('Security violation: file outside project directory');
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists on filesystem
    if (!fs.existsSync(actualFilePath)) {
      console.log(`Preview file not found: ${actualFilePath}`);
      return res.status(404).json({ message: 'File not found on filesystem' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(actualFilePath).toLowerCase();
    let contentType = 'text/plain';
    
    switch (ext) {
      case '.html':
      case '.htm':
        contentType = 'text/html';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        contentType = 'application/javascript';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.xml':
        contentType = 'application/xml';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.woff':
        contentType = 'font/woff';
        break;
      case '.woff2':
        contentType = 'font/woff2';
        break;
      case '.ttf':
        contentType = 'font/ttf';
        break;
      case '.otf':
        contentType = 'font/otf';
        break;
    }

    // For text files, read and serve content
    if (contentType.startsWith('text/') || contentType === 'application/javascript' || contentType === 'application/json') {
      try {
        let content = fs.readFileSync(actualFilePath, 'utf8');
        
        // Special handling for HTML files - modify relative paths to use preview endpoints
        if (contentType === 'text/html') {
          console.log(`🔗 Processing HTML file: ${filePath}`);
          const htmlDir = path.dirname(filePath); // Directory containing the HTML file
          console.log(`📁 HTML directory: ${htmlDir}`);
          
          // Replace relative paths with absolute preview paths
          content = content.replace(
            /(href|src)=["']([^"']*\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf|html|htm|ico|webp|download))["']/g,
            (match, attr, relativePath, ext) => {
              // Skip if it's already an absolute URL or data URL
              if (relativePath.startsWith('http') || relativePath.startsWith('data:') || relativePath.startsWith('//') || relativePath.startsWith('/api/')) {
                return match;
              }
              
              // Resolve relative path relative to the HTML file's directory
              let resolvedPath;
              if (relativePath.startsWith('./')) {
                // Current directory relative
                resolvedPath = path.join(htmlDir, relativePath.substring(2)).replace(/\\/g, '/');
              } else if (relativePath.startsWith('../')) {
                // Parent directory relative
                resolvedPath = path.resolve(path.join(htmlDir, relativePath)).replace(/\\/g, '/');
                // Remove the project root part to get relative path from project root
                const projectRoot = path.resolve(__dirname, '../uploads', projectId).replace(/\\/g, '/');
                if (resolvedPath.startsWith(projectRoot)) {
                  resolvedPath = resolvedPath.substring(projectRoot.length + 1);
                }
              } else if (!relativePath.startsWith('/')) {
                // Relative to current directory (no ./ prefix)
                resolvedPath = path.join(htmlDir, relativePath).replace(/\\/g, '/');
              } else {
                // Already absolute from project root
                resolvedPath = relativePath.substring(1);
              }
              
              // Convert to absolute preview path
              const absolutePath = `/api/projects/${projectId}/preview/${resolvedPath}`;
              console.log(`🔗 ${attr}: ${relativePath} -> ${absolutePath}`);
              return `${attr}="${absolutePath}"`;
            }
          );
          
          // Also handle inline styles and scripts that might reference relative paths
          content = content.replace(
            /url\(['"]?([^'")\s]+)['"]?\)/g,
            (match, url) => {
              // Skip if it's already an absolute URL or data URL
              if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('//') || url.startsWith('/api/')) {
                return match;
              }
              
              // Resolve relative path relative to the HTML file's directory
              let resolvedPath;
              if (url.startsWith('./')) {
                resolvedPath = path.join(htmlDir, url.substring(2)).replace(/\\/g, '/');
              } else if (url.startsWith('../')) {
                resolvedPath = path.resolve(path.join(htmlDir, url)).replace(/\\/g, '/');
                const projectRoot = path.resolve(__dirname, '../uploads', projectId).replace(/\\/g, '/');
                if (resolvedPath.startsWith(projectRoot)) {
                  resolvedPath = resolvedPath.substring(projectRoot.length + 1);
                }
              } else if (!url.startsWith('/')) {
                resolvedPath = path.join(htmlDir, url).replace(/\\/g, '/');
              } else {
                resolvedPath = url.substring(1);
              }
              
              // Convert relative URL to absolute preview path
              const absolutePath = `/api/projects/${projectId}/preview/${resolvedPath}`;
              console.log(`🎨 CSS url(): ${url} -> ${absolutePath}`);
              return `url("${absolutePath}")`;
            }
          );
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
        
        // Add headers to allow iframe embedding from localhost:3000
        if (contentType === 'text/html') {
          res.setHeader('X-Frame-Options', 'ALLOWALL');
          res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 https://localhost:3000 http://localhost:8000 https://localhost:8000 http://127.0.0.1:3000 https://127.0.0.1:3000 http://127.0.0.1:8000 https://127.0.0.1:8000 http://hassan-webcontainer-1.onrender.com https://hassan-webcontainer-1.onrender.com");
        }
        
        res.send(content);
      } catch (readError) {
        console.error('Error reading file:', readError);
        res.status(500).json({ message: 'Error reading file content' });
      }
    } else {
      // For binary files, serve as stream
      try {
        const stats = fs.statSync(actualFilePath);
        const stream = fs.createReadStream(actualFilePath);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        stream.pipe(res);
      } catch (streamError) {
        console.error('Error streaming file:', streamError);
        res.status(500).json({ message: 'Error streaming file' });
      }
    }
  } catch (error) {
    console.error('Preview file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID with files
// @access  Private (project owner or public projects)
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user can access this project
    if (!project.isPublic && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (project owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { title, description, framework, tags, isPublic } = req.body;
    
    // Update fields
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (framework !== undefined) project.framework = framework;
    if (tags !== undefined) project.tags = tags;
    if (isPublic !== undefined) project.isPublic = isPublic;

    await project.save();
    
    res.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (project owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`Attempting to delete project: ${req.params.id}`);
    console.log(`User ID: ${req.user._id}`);
    
    // Validate project ID format
    if (!req.params.id || !/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      console.log(`Project not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Found project: ${project.title}, Owner: ${project.owner}`);

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      console.log(`Authorization failed: User ${req.user._id} cannot delete project owned by ${project.owner}`);
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Delete project files from filesystem
    try {
      const projectDir = path.join(__dirname, '../uploads', req.params.id);
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
        console.log(`Deleted project directory: ${projectDir}`);
      } else {
        console.log(`Project directory not found: ${projectDir}`);
      }
    } catch (fileError) {
      console.error('Error deleting project files:', fileError);
      // Continue with project deletion even if file deletion fails
    }

    const deleteResult = await Project.deleteOne({ _id: req.params.id });
    console.log(`Project deletion result:`, deleteResult);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/projects/:id/upload
// @desc    Upload files to a project
// @access  Private (project owner only)
router.post('/:id/upload', auth, upload.array('files', 1000), async (req, res) => {
  try {
    const projectId = req.params.id;
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
    
    for (const file of req.files) {
      const fileInfo = {
        filename: file.originalname,
        filepath: file.path,
        relativePath: file.originalname,
        filetype: getFileType(file.originalname),
        size: file.size,
        isDirectory: false
      };
      
      uploadedFiles.push(fileInfo);
    }

    // Update project with new files
    project.files = [...project.files, ...uploadedFiles];
    await project.save();

    res.json({
      message: 'Files uploaded successfully',
      uploadedFiles: uploadedFiles.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// @route   POST /api/projects/:id/upload/folder
// @desc    Upload a folder structure to a project
// @access  Private (project owner only)
router.post('/:id/upload/folder', auth, upload.array('folder', 1000), async (req, res) => {
  try {
    const projectId = req.params.id;
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

    // Get the path mapping from the request body
    const pathMapping = req.body.pathMapping ? JSON.parse(req.body.pathMapping) : {};
    const folderStructure = req.body.folderStructure ? JSON.parse(req.body.folderStructure) : {};
    
    console.log('📁 Path mapping received:', pathMapping);
    console.log('📁 Folder structure received:', folderStructure);
    
    const uploadedFiles = [];
    
    for (const file of req.files) {
      let relativePath = file.originalname;
      
      // Check if file has webkitRelativePath (folder upload)
      console.log(`Processing file: ${file.originalname}, fieldname: ${file.fieldname}`);
      
      // For folder uploads, use the path mapping sent from frontend
      if (file.fieldname === 'folder' && pathMapping[file.originalname]) {
        relativePath = pathMapping[file.originalname].replace(/\\/g, '/'); // Normalize path separators
        console.log(`🔗 Folder upload detected: ${file.originalname} -> ${relativePath}`);
      } else if (Object.keys(folderStructure).length > 0) {
        // Fallback to folderStructure if available
        for (const [folderPath, fileNames] of Object.entries(folderStructure)) {
          if (fileNames.includes(file.originalname)) {
            relativePath = `${folderPath}/${file.originalname}`;
            break;
          }
        }
      }
      
      // Create directory structure if file has nested path
      if (relativePath.includes('/')) {
        const projectRoot = path.join(__dirname, '../uploads', projectId);
        const dirPath = path.dirname(relativePath);
        const fullDirPath = path.join(projectRoot, dirPath);
        
        if (!fs.existsSync(fullDirPath)) {
          fs.mkdirSync(fullDirPath, { recursive: true });
          console.log(`Created directory: ${fullDirPath}`);
        }
        
        // Move file to correct subdirectory
        const newFilePath = path.join(projectRoot, relativePath);
        try {
          fs.renameSync(file.path, newFilePath);
          file.path = newFilePath;
          console.log(`Moved file to: ${newFilePath}`);
        } catch (moveError) {
          console.error(`Error moving file ${file.originalname}:`, moveError);
          relativePath = file.originalname; // Fallback to flat structure
        }
      }
      
      const fileInfo = {
        filename: file.originalname,
        filepath: file.path,
        relativePath: relativePath,
        filetype: getFileType(file.originalname),
        size: file.size,
        isDirectory: false
      };
      
      uploadedFiles.push(fileInfo);
    }

    // Update project with new files
    project.files = [...project.files, ...uploadedFiles];
    await project.save();

    res.json({
      message: 'Folder uploaded successfully',
      uploadedFiles: uploadedFiles.length
    });

  } catch (error) {
    console.error('Folder upload error:', error);
    res.status(500).json({ message: 'Server error during folder upload' });
  }
});

// @route   POST /api/projects/:id/upload/zip
// @desc    Upload and extract zip file
// @access  Private (project owner only)
router.post('/:id/upload/zip', auth, upload.single('zip'), async (req, res) => {
  try {
    const projectId = req.params.id;
    const { file } = req;
    
    if (!file) {
      return res.status(400).json({ message: 'No zip file provided' });
    }

    // Check if file is actually a zip
    if (!file.mimetype.includes('zip') && !file.originalname.endsWith('.zip')) {
      return res.status(400).json({ message: 'File must be a zip archive' });
    }

    console.log(`📦 Processing zip file: ${file.originalname}`);
    console.log(`📁 Project ID: ${projectId}`);
    console.log(`📍 Temp location: ${file.path}`);

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload to this project' });
    }

    const projectDir = path.join(__dirname, '../uploads', projectId);
    
    // Ensure project directory exists
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    try {
      // Extract zip file
      const zip = new AdmZip(file.path);
      const zipEntries = zip.getEntries();
      
      console.log(`📋 Zip contains ${zipEntries.length} entries`);
      
      const extractedFiles = [];
      const uploadedFiles = [];

      // Extract all files
      for (const entry of zipEntries) {
        if (!entry.isDirectory) {
          const entryName = entry.entryName;
          console.log(`📄 Extracting: ${entryName}`);
          
          // Skip __MACOSX and other system files
          if (entryName.includes('__MACOSX') || entryName.includes('.DS_Store')) {
            console.log(`⏭️ Skipping system file: ${entryName}`);
            continue;
          }

          // Determine the target path
          const targetPath = path.join(projectDir, entryName);
          const targetDir = path.dirname(targetPath);
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            console.log(`📁 Created directory: ${targetDir}`);
          }
          
          // Extract the file
          zip.extractEntryTo(entry, targetDir, false, true);
          console.log(`✅ Extracted: ${entryName} -> ${targetPath}`);
          
          // Get file stats
          const stats = fs.statSync(targetPath);
          
          const fileInfo = {
            filename: path.basename(entryName),
            filepath: targetPath,
            relativePath: entryName.replace(/\\/g, '/'), // Normalize to forward slashes
            filetype: getFileType(entryName),
            size: stats.size,
            isDirectory: false
          };
          
          extractedFiles.push(fileInfo);
          uploadedFiles.push(fileInfo);
        }
      }

      // Update project with new files
      project.files = [...project.files, ...uploadedFiles];
      await project.save();

      // Clean up temp zip file
      fs.unlinkSync(file.path);
      console.log(`🧹 Cleaned up temp file: ${file.path}`);

      console.log(`🎉 Zip extraction complete! Extracted ${extractedFiles.length} files`);
      
      res.json({
        message: 'Zip file uploaded and extracted successfully',
        extractedFiles: extractedFiles.length,
        files: extractedFiles.map(f => ({
          filename: f.filename,
          relativePath: f.relativePath,
          filetype: f.filetype,
          size: f.size
        }))
      });

    } catch (extractError) {
      console.error('Zip extraction error:', extractError);
      
      // Clean up temp file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      res.status(500).json({ 
        message: 'Error extracting zip file',
        error: extractError.message 
      });
    }

  } catch (error) {
    console.error('Zip upload error:', error);
    res.status(500).json({ message: 'Server error during zip upload' });
  }
});

// @route   PUT /api/projects/:id/files/*
// @desc    Save file content
// @access  Private (project owner only)
router.put('/:id/files/*', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const filePath = req.params[0];
    const { content } = req.body;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this project' });
    }

    // Find the file in the project
    const file = project.files.find(f => f.relativePath === filePath);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if file exists on filesystem
    if (!fs.existsSync(file.filepath)) {
      return res.status(404).json({ message: 'File not found on filesystem' });
    }

    // Save the content to the file
    try {
      fs.writeFileSync(file.filepath, content, 'utf8');
      
      // Update file size in database
      const stats = fs.statSync(file.filepath);
      file.size = stats.size;
      
      await project.save();
      
      res.json({ 
        message: 'File saved successfully',
        file: {
          filename: file.filename,
          relativePath: file.relativePath,
          size: file.size
        }
      });
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      res.status(500).json({ message: 'Error saving file content' });
    }
  } catch (error) {
    console.error('Save file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/terminal
// @desc    Execute terminal command in project directory
// @access  Private (project owner only)
router.post('/:id/terminal', auth, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { command } = req.body;
    
    if (!command || !command.trim()) {
      return res.status(400).json({ message: 'Command is required' });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check ownership
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to execute commands in this project' });
    }

    const projectDir = path.join(__dirname, '../uploads', projectId);
    
    // Check if project directory exists
    if (!fs.existsSync(projectDir)) {
      return res.status(404).json({ message: 'Project directory not found' });
    }

    // Execute command in project directory
    const { spawn } = require('child_process');
    
    try {
      // Parse command and arguments
      const commandParts = command.trim().split(' ');
      const cmd = commandParts[0];
      const args = commandParts.slice(1);
      
      // Security: Only allow safe commands
      const allowedCommands = [
        'npm', 'yarn', 'node', 'ls', 'dir', 'pwd', 'cat', 'type', 
        'echo', 'git', 'python', 'pip', 'python3', 'pip3'
      ];
      
      if (!allowedCommands.includes(cmd)) {
        return res.status(400).json({ 
          success: false,
          error: `Command '${cmd}' is not allowed for security reasons`,
          message: `Allowed commands: ${allowedCommands.join(', ')}`
        });
      }
      
      // Execute the command
      const childProcess = spawn(cmd, args, {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });
      
      let output = '';
      let errorOutput = '';
      
      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      childProcess.on('close', (code) => {
        if (code === 0) {
          res.json({
            success: true,
            output: output.trim(),
            exitCode: code,
            message: output.trim() ? null : 'Command executed successfully'
          });
        } else {
          res.json({
            success: false,
            error: errorOutput.trim() || `Command failed with exit code ${code}`,
            output: output.trim(),
            exitCode: code
          });
        }
      });
      
      childProcess.on('error', (error) => {
        console.error('Command execution error:', error);
        res.json({
          success: false,
          error: `Failed to execute command: ${error.message}`,
          exitCode: -1
        });
      });
      
      // Set timeout to prevent hanging
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill();
          res.json({
            success: false,
            error: 'Command timed out after 30 seconds',
            exitCode: -1
          });
        }
      }, 30000);
      
    } catch (execError) {
      console.error('Command execution error:', execError);
      res.status(500).json({
        success: false,
        error: 'Failed to execute command',
        message: execError.message
      });
    }
  } catch (error) {
    console.error('Terminal command error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message 
    });
  }
});

module.exports = router;

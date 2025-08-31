import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  AlertTitle,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Upload as UploadIcon,
  FolderOpen as FolderOpenIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';

const FileUpload = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState('files'); // 'files', 'folder', or 'zip'

  const onDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const onDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Check if any of the dropped items are folders (directories)
      const hasFolders = droppedFiles.some(file => {
        // Check if it's a directory by looking at the file type or size
        return file.type === '' || file.size === 0 || file.webkitRelativePath;
      });

      // Check if any of the dropped items are zip files
      const hasZipFiles = droppedFiles.some(file => 
        file.name.endsWith('.zip') || file.type.includes('zip')
      );

      if (hasFolders && uploadMode === 'folder') {
        // Show folder input since drag and drop can't access folder contents
        toast('Folders detected! Please use "Browse Folder" to select the folder contents, as drag and drop cannot access folder files.', {
          icon: '📁',
          duration: 5000,
        });
        return;
      }

      if (hasZipFiles && uploadMode === 'zip') {
        // Handle zip file drop
        handleFiles(droppedFiles);
        toast.success('Zip file detected! It will be extracted on the server.');
        return;
      }

      // Check if this looks like a folder drop (multiple files with common directory structure)
      if (droppedFiles.length > 1) {
        const isLikelyFolder = checkIfLikelyFolder(droppedFiles);
        if (isLikelyFolder && uploadMode === 'folder') {
          // Auto-switch to folder mode if it looks like a folder
          handleFiles(droppedFiles);
          toast.success('Multiple files detected! Files will be uploaded with structure preserved.');
        } else if (isLikelyFolder && uploadMode === 'files') {
          // Ask user if they want to switch to folder mode
          if (window.confirm('This looks like a folder. Would you like to switch to folder upload mode to preserve the directory structure?')) {
            setUploadMode('folder');
            handleFiles(droppedFiles);
            toast.success('Switched to folder mode! Files will be uploaded with structure preserved.');
          } else {
            handleFiles(droppedFiles);
          }
        } else {
          handleFiles(droppedFiles);
        }
      } else if (droppedFiles.length === 1 && hasZipFiles && uploadMode !== 'zip') {
        // Auto-switch to zip mode if a zip file is dropped
        if (window.confirm('A zip file was detected. Would you like to switch to zip upload mode to extract it on the server?')) {
          setUploadMode('zip');
          handleFiles(droppedFiles);
          toast.success('Switched to zip mode! The file will be extracted on the server.');
        } else {
          handleFiles(droppedFiles);
        }
      } else {
        handleFiles(droppedFiles);
      }
      
      e.dataTransfer.clearData();
    }
  }, [uploadMode]);

  // Function to detect if dropped files likely represent a folder structure
  const checkIfLikelyFolder = (fileList) => {
    if (fileList.length < 2) return false;
    
    // Check if files have different extensions (typical for projects)
    const extensions = new Set(fileList.map(f => f.name.split('.').pop().toLowerCase()));
    if (extensions.size > 2) return true;
    
    // Check if files have common directory-like names
    const hasCommonPrefix = fileList.some(f1 => 
      fileList.some(f2 => 
        f1 !== f2 && f1.name.startsWith(f2.name.split('.')[0] + '.')
      )
    );
    
    return hasCommonPrefix;
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // 'pending', 'uploading', 'success', 'error'
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFolderInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log('🔍 FOLDER INPUT DEBUG:');
    console.log('Total files selected:', selectedFiles.length);
    
    selectedFiles.slice(0, 5).forEach((file, index) => {
      console.log(`File ${index + 1}:`);
      console.log('  - name:', file.name);
      console.log('  - webkitRelativePath:', file.webkitRelativePath);
      console.log('  - size:', file.size);
    });
    
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
      setUploadMode('folder'); // Ensure folder mode is set
      toast.success('Folder selected! Files will be uploaded with structure preserved.');
    }
  };

  const handleZipInput = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if it's a zip file
      if (!selectedFile.name.endsWith('.zip') && !selectedFile.type.includes('zip')) {
        toast.error('Please select a valid zip file (.zip)');
        return;
      }
      
      // Clear any existing files and set zip mode
      setFiles([{
        file: selectedFile,
        id: Math.random().toString(36).substr(2, 9),
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        status: 'pending',
        progress: 0
      }]);
      setUploadMode('zip');
      toast.success('Zip file selected! It will be extracted on the server.');
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      let response;
      
      if (uploadMode === 'folder') {
        // For folder mode, preserve the directory structure
        const pathMapping = {};
        files.forEach(({ file }, index) => {
          // Use the full path from the file input
          const relativePath = file.webkitRelativePath || file.name;
          console.log(`🔗 Upload File ${index + 1}: ${file.name}`);
          console.log(`   webkitRelativePath: "${file.webkitRelativePath}"`);
          console.log(`   Final relativePath: "${relativePath}"`);
          
          // Append file with indexed name and store path mapping
          formData.append('folder', file);
          pathMapping[file.name] = relativePath;
        });
        
        console.log('📁 Final pathMapping:', pathMapping);
        formData.append('uploadMode', 'folder');
        formData.append('pathMapping', JSON.stringify(pathMapping));
        
        // Use the folder upload endpoint
        response = await axios.post(`/api/projects/${projectId}/upload/folder`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
      } else if (uploadMode === 'zip') {
        // For zip mode, upload the zip file
        const zipFile = files[0].file;
        formData.append('zip', zipFile);
        
        // Use the zip upload endpoint
        response = await axios.post(`/api/projects/${projectId}/upload/zip`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
      } else {
        // For files mode, just append the files
        files.forEach(({ file }) => {
          formData.append('files', file);
        });
        formData.append('uploadMode', 'files');
        
        // Use the regular upload endpoint
        response = await axios.post(`/api/projects/${projectId}/upload`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
      }

      toast.success('Files uploaded successfully!');
      
      // Navigate to project view
      navigate(`/projects/${projectId}`);
      
    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Failed to upload files';
      toast.error(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'json', 'md'].includes(ext)) {
      return <FileIcon />;
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      return <FileIcon />; // Assuming ImageIcon is not defined, using FileIcon for images
    }
    return <FileIcon />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: 'primary.main'
            }}
          >
            Upload Project Files
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: '1.1rem' }}
          >
            Upload your project files to get started with VibeShare
          </Typography>
        </Box>

        {/* Upload Mode Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Upload Mode
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant={uploadMode === 'files' ? 'contained' : 'outlined'}
              startIcon={<FileIcon />}
              onClick={() => setUploadMode('files')}
            >
              Individual Files
            </Button>
            <Button
              variant={uploadMode === 'folder' ? 'contained' : 'outlined'}
              startIcon={<FolderIcon />}
              onClick={() => setUploadMode('folder')}
            >
              Folder Structure
            </Button>
            <Button
              variant={uploadMode === 'zip' ? 'contained' : 'outlined'}
              startIcon={<ArchiveIcon />}
              onClick={() => setUploadMode('zip')}
            >
              Zip Archive
            </Button>
          </Box>
          
          {uploadMode === 'folder' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Folder Upload Mode</AlertTitle>
              This mode will preserve your project's directory structure when uploading.
            </Alert>
          )}
          {uploadMode === 'zip' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Zip Archive Mode</AlertTitle>
              Upload a zip file and it will be automatically extracted on the server, preserving the directory structure.
            </Alert>
          )}
        </Box>

        {/* File Input */}
        <Box sx={{ mb: 4 }}>
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="file-input"
          />
          <input
            type="file"
            webkitdirectory=""
            onChange={handleFolderInput}
            style={{ display: 'none' }}
            id="folder-input"
          />
          <input
            type="file"
            accept=".zip"
            onChange={handleZipInput}
            style={{ display: 'none' }}
            id="zip-input"
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              component="label"
              htmlFor="file-input"
              variant="outlined"
              startIcon={<FileIcon />}
              size="large"
            >
              Browse Files
            </Button>
            {uploadMode === 'folder' && (
              <Button
                component="label"
                htmlFor="folder-input"
                variant="outlined"
                startIcon={<FolderOpenIcon />}
                size="large"
              >
                Browse Folder
              </Button>
            )}
            {uploadMode === 'zip' && (
              <Button
                component="label"
                htmlFor="zip-input"
                variant="outlined"
                startIcon={<ArchiveIcon />}
                size="large"
              >
                Browse Zip File
              </Button>
            )}
          </Box>
        </Box>

        {/* Drag & Drop Area */}
        <Box
          onDragEnter={onDragIn}
          onDragLeave={onDragOut}
          onDragOver={onDrag}
          onDrop={onDrop}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            borderRadius: 3,
            p: 6,
            textAlign: 'center',
            bgcolor: dragActive ? 'primary.50' : 'grey.50',
            transition: 'all 0.3s ease',
            mb: 4,
            cursor: 'pointer'
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag & Drop Files Here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {uploadMode === 'folder' 
              ? 'Drop a folder or multiple files to preserve directory structure'
              : uploadMode === 'zip'
              ? 'Drop a zip file here or click browse to select'
              : 'Drop files here or click browse to select'
            }
          </Typography>
        </Box>

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">
                Uploading... {uploadProgress}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {/* File List */}
        {files.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Selected Files ({files.length})
            </Typography>
            <Grid container spacing={2}>
              {files.map(({ id, name, size, type, status, progress }) => (
                <Grid item xs={12} sm={6} md={4} key={id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        {getFileIcon(name)}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(size)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeFile(id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      {status === 'uploading' && (
                        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
                      )}
                      
                      {status === 'success' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography variant="caption" color="success.main">
                            Uploaded
                          </Typography>
                        </Box>
                      )}
                      
                      {status === 'error' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <ErrorIcon color="error" fontSize="small" />
                          <Typography variant="caption" color="error.main">
                            Failed
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/projects/${projectId}`)}
            size="large"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            size="large"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FileUpload;

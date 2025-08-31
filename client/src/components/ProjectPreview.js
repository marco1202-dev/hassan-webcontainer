import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  AlertTitle,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Code as CodeIcon,
  ViewColumn as ViewColumnIcon,
  Laptop as DesktopIcon,
  Fullscreen as FullscreenIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import webContainerService from '../services/webcontainer';
import toast from 'react-hot-toast';

const ProjectPreview = ({ project, fileStructure, selectedFile, mode, onFileSaved, isLivePreviewEnabled = false }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' only
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mainHtmlFile, setMainHtmlFile] = useState(null);
  const [webContainerReady, setWebContainerReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [projectType, setProjectType] = useState('html'); // 'html', 'react', 'node', 'vue', 'next'
  const [localLivePreviewEnabled, setLocalLivePreviewEnabled] = useState(isLivePreviewEnabled);
  const navigate = useNavigate();

  // Sync local live preview state with prop
  useEffect(() => {
    setLocalLivePreviewEnabled(isLivePreviewEnabled);
  }, [isLivePreviewEnabled]);

  // Auto-refresh preview when files are saved (if live preview is enabled)
  useEffect(() => {
    if (onFileSaved && localLivePreviewEnabled && mainHtmlFile) {
      // Check if the saved file is relevant to the current preview
      const savedFile = onFileSaved;
      const isRelevantFile = 
        savedFile === mainHtmlFile.relativePath || // HTML file itself
        savedFile.endsWith('.css') || // CSS files
        savedFile.endsWith('.js') || // JavaScript files
        savedFile.includes('assets/') || // Asset files
        savedFile.includes('images/') || // Image files
        savedFile.includes('styles/'); // Style files
      
      if (isRelevantFile) {
        console.log(`🔄 Auto-refreshing preview due to relevant file save: ${savedFile}`);
        // Show a subtle notification
        toast.success(`Preview updated: ${savedFile.split('/').pop()}`, {
          duration: 2000,
          icon: '🔄',
          style: { fontSize: '0.9rem' }
        });
        // Small delay to ensure file is fully written
        setTimeout(() => {
          handleRefresh();
        }, 100);
      } else {
        console.log(`⏭️ Skipping preview refresh - saved file not relevant: ${savedFile}`);
      }
    }
  }, [onFileSaved, localLivePreviewEnabled, mainHtmlFile]);

  // Keyboard shortcuts for preview
  useEffect(() => {
    const handleKeyDown = (event) => {
      // F5 or Ctrl+R to refresh preview
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        console.log('⌨️ Keyboard shortcut: Refreshing preview');
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect project type based on files
  const detectProjectType = useCallback(() => {
    if (!project || !project.files) return 'html';
    
    const files = project.files;
    
    // Check for package.json to determine if it's a Node.js project
    const packageJson = files.find(f => f.filename === 'package.json');
    if (packageJson) {
      // Try to determine framework from package.json or file structure
      if (files.some(f => f.filename === 'next.config.js' || f.relativePath.includes('pages/'))) {
        return 'next';
      }
      if (files.some(f => f.filename.endsWith('.vue') || f.filename === 'vue.config.js')) {
        return 'vue';
      }
      if (files.some(f => f.filename.endsWith('.jsx') || f.filename.endsWith('.tsx') || f.relativePath.includes('src/App'))) {
        return 'react';
      }
      return 'node';
    }
    
    // Check for HTML files (static website)
    if (files.some(f => f.filename.endsWith('.html'))) {
      return 'html';
    }
    
    return 'html';
  }, [project]);

  // Find the main HTML file for preview recursively in file structure
  const findMainHtmlFile = useCallback(() => {
    if (!fileStructure || fileStructure.length === 0) return null;
    
    // Priority order for main files
    const mainFilePatterns = [
      'index.html',
      'index.htm',
      'main.html',
      'main.htm',
      'app.html',
      'app.htm'
    ];
    
    // Helper function to search recursively
    const searchRecursively = (items) => {
      const htmlFiles = [];
      
      for (const item of items) {
        if (item.type === 'file') {
          const fileName = item.name.toLowerCase();
          if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
            htmlFiles.push(item);
          }
        } else if (item.type === 'folder' && item.children) {
          htmlFiles.push(...searchRecursively(item.children));
        }
      }
      
      return htmlFiles;
    };
    
    // Get all HTML files
    const allHtmlFiles = searchRecursively(fileStructure);
    
    if (allHtmlFiles.length === 0) return null;
    
    // First try to find exact matches by priority
    for (const pattern of mainFilePatterns) {
      const file = allHtmlFiles.find(f => f.name.toLowerCase() === pattern);
      if (file) return file;
    }
    
    // Return the first HTML file found
    return allHtmlFiles[0];
  }, [fileStructure]);

  // Generate preview URL for the main HTML file (DISABLED - using direct backend URL)
  const generatePreviewUrl = useCallback(() => {
    // This function is disabled to avoid conflicts with direct backend URL
    return;
  }, [project, findMainHtmlFile, fileStructure]);

  // DISABLE the original preview URL generation to avoid conflicts
  // useEffect(() => {
  //   if (project && fileStructure && fileStructure.length > 0) {
  //     generatePreviewUrl();
  //   }
  // }, [project, fileStructure, generatePreviewUrl]);

  // SMART HTML FILE DETECTION AND PREVIEW URL GENERATION
  useEffect(() => {
    if (project && project._id && fileStructure && fileStructure.length > 0) {
      console.log('🚨 SMART HTML FILE DETECTION');
      
      const htmlFile = findMainHtmlFile();
      console.log('Found HTML file:', htmlFile);
      
      if (htmlFile) {
        const timestamp = Date.now();
        const directUrl = `http://localhost:5000/api/projects/${project._id}/preview/${encodeURIComponent(htmlFile.relativePath)}?v=${timestamp}`;
        console.log('Generated preview URL:', directUrl);
        setPreviewUrl(directUrl);
        setPreviewError(null);
        setPreviewLoading(true);
        setMainHtmlFile(htmlFile);
      } else {
        console.log('No HTML file found in project structure');
        setPreviewError('No HTML file found. Please upload an HTML file to preview your project.');
        setPreviewUrl('');
      }
    }
  }, [project, fileStructure, findMainHtmlFile]);



  const handleRefresh = () => {
    setPreviewLoading(true);
    // Force iframe reload with cache busting
    const iframe = document.getElementById('preview-iframe');
    if (iframe && project && mainHtmlFile) {
      const timestamp = Date.now();
      const newUrl = `http://localhost:5000/api/projects/${project._id}/preview/${encodeURIComponent(mainHtmlFile.relativePath)}?v=${timestamp}`;
      console.log('🔄 Refreshing with URL:', newUrl);
      iframe.src = newUrl;
      setPreviewUrl(newUrl);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleIframeLoad = () => {
    setPreviewLoading(false);
  };

  const handleIframeError = () => {
    setPreviewLoading(false);
    setPreviewError('Failed to load preview. Please check if your HTML file is valid.');
  };

  // Get preview dimensions - always full size
  const getPreviewDimensions = () => {
    return { width: '100%', height: '100%' };
  };

  const dimensions = getPreviewDimensions();

  // Render preview content
  const renderPreviewContent = () => {
    if (previewError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          p: 4,
          textAlign: 'center'
        }}>
          <Alert severity="warning" sx={{ maxWidth: 400 }}>
            <AlertTitle>Preview Unavailable</AlertTitle>
            {previewError}
          </Alert>
          <Button
            variant="contained"
            startIcon={<CodeIcon />}
            onClick={() => navigate(`/projects/${project._id}`)}
            sx={{ mt: 2 }}
          >
            View Project Files
          </Button>
        </Box>
      );
    }

    if (!previewUrl) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%'
        }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <Box sx={{ position: 'relative', height: '100%' }}>
        {/* Preview Controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          p: 1, 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          {/* Preview Mode Label */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DesktopIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Desktop Preview
            </Typography>
          </Box>
          
          {/* Live Preview Toggle */}
          <Tooltip title={
            localLivePreviewEnabled 
              ? "Disable Live Preview - Preview will not auto-refresh when files are saved" 
              : "Enable Live Preview - Preview will automatically refresh when HTML, CSS, or JS files are saved"
          }>
            <IconButton
              size="small"
              onClick={() => setLocalLivePreviewEnabled(!localLivePreviewEnabled)}
              color={localLivePreviewEnabled ? "primary" : "default"}
              sx={{ 
                backgroundColor: localLivePreviewEnabled ? 'primary.50' : 'transparent',
                '&:hover': {
                  backgroundColor: localLivePreviewEnabled ? 'primary.100' : 'action.hover'
                }
              }}
            >
              <PlayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {/* Live Preview Status */}
          {localLivePreviewEnabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: 'success.main',
                animation: 'pulse 2s infinite'
              }} />
              <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem' }}>
                LIVE
              </Typography>
            </Box>
          )}
          
          {/* Auto-refresh Indicator */}
          {onFileSaved && localLivePreviewEnabled && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                backgroundColor: 'info.main',
                animation: 'pulse 1s infinite'
              }} />
              <Typography variant="caption" color="info.main" sx={{ fontSize: '0.65rem' }}>
                AUTO
              </Typography>
            </Box>
          )}
          
          <Divider orientation="vertical" flexItem />
          
          {/* Action Buttons */}
          <Tooltip title={localLivePreviewEnabled ? "Refresh Preview" : "Refresh Preview (Live preview is disabled)"}>
            <IconButton 
              onClick={handleRefresh} 
              size="small"
              color={!localLivePreviewEnabled ? "warning" : "default"}
              sx={{
                backgroundColor: !localLivePreviewEnabled ? 'warning.50' : 'transparent',
                '&:hover': {
                  backgroundColor: !localLivePreviewEnabled ? 'warning.100' : 'action.hover'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Open in New Tab">
            <IconButton onClick={handleOpenInNewTab} size="small">
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Toggle Fullscreen">
            <IconButton onClick={handleFullscreen} size="small">
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Preview Frame */}
        <Box sx={{ 
          height: 'calc(100% - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          p: previewMode !== 'desktop' ? 2 : 0
        }}>
          {previewLoading && (
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}>
              <CircularProgress />
            </Box>
          )}
          
          <Box sx={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: '100%',
            maxHeight: '100%',
            border: previewMode !== 'desktop' ? '8px solid #333' : 'none',
            borderRadius: previewMode !== 'desktop' ? '20px' : 0,
            overflow: 'hidden',
            backgroundColor: 'white',
            boxShadow: previewMode !== 'desktop' ? '0 10px 30px rgba(0,0,0,0.3)' : 'none'
          }}>
            <iframe
              id="preview-iframe"
              src={previewUrl}
              title="Project Preview"
              width="100%"
              height="100%"
              frameBorder="0"
              onLoad={() => {
                console.log('🎯 IFRAME LOADED with URL:', previewUrl);
                handleIframeLoad();
              }}
              onError={(e) => {
                console.log('❌ IFRAME ERROR with URL:', previewUrl, e);
                handleIframeError();
              }}
              style={{ border: 'none' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              allow="fullscreen"
            />
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '@keyframes pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.5 },
          '100%': { opacity: 1 }
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Live Preview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {mainHtmlFile ? `Previewing: ${mainHtmlFile.filename}` : 'No HTML file found'}
        </Typography>
      </Box>

      {/* Preview Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {renderPreviewContent()}
      </Box>
    </Paper>
  );
};

export default ProjectPreview;

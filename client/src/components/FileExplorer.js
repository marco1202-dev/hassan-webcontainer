import React, { useState } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewHeadline as ViewHeadlineIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Code as CodeIcon,
  Image as ImageIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const FileExplorer = ({ files, selectedFile, onFileSelect, projectName = 'Project' }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'details'

  // Debug logging
  console.log('FileExplorer received files:', files);
  console.log('Files type:', typeof files);
  console.log('Files length:', files?.length);

  // Get current directory contents
  const getCurrentContents = () => {
    if (!files || !Array.isArray(files)) return [];
    
    if (!currentPath) {
      // Root level
      return files;
    }
    
    // Navigate to current path
    const pathParts = currentPath.split('/');
    let currentLevel = files;
    
    for (const part of pathParts) {
      const folder = currentLevel.find(item => item.type === 'folder' && item.name === part);
      if (folder && folder.children) {
        currentLevel = folder.children;
      } else {
        return [];
      }
    }
    
    return currentLevel;
  };

  const navigateToPath = (newPath) => {
    setCurrentPath(newPath);
    
    // Add to history
    const newHistory = pathHistory.slice(0, currentIndex + 1);
    newHistory.push(newPath);
    setPathHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
    }
  };

  const goForward = () => {
    if (currentIndex < pathHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentPath(pathHistory[newIndex]);
    }
  };

  const goUp = () => {
    if (currentPath) {
      const pathParts = currentPath.split('/');
      pathParts.pop();
      const newPath = pathParts.join('/');
      navigateToPath(newPath);
    }
  };

  const getBreadcrumbs = () => {
    const parts = currentPath ? currentPath.split('/') : [];
    const breadcrumbs = [{ name: projectName, path: '' }];
    
    let currentPathPart = '';
    parts.forEach(part => {
      currentPathPart += (currentPathPart ? '/' : '') + part;
      breadcrumbs.push({ name: part, path: currentPathPart });
    });
    
    return breadcrumbs;
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      html: <CodeIcon />,
      htm: <CodeIcon />,
      css: <CodeIcon />,
      js: <CodeIcon />,
      jsx: <CodeIcon />,
      ts: <CodeIcon />,
      tsx: <CodeIcon />,
      vue: <CodeIcon />,
      svelte: <CodeIcon />,
      json: <CodeIcon />,
      md: <DescriptionIcon />,
      png: <ImageIcon />,
      jpg: <ImageIcon />,
      jpeg: <ImageIcon />,
      gif: <ImageIcon />,
      svg: <ImageIcon />,
      scss: <CodeIcon />,
      sass: <CodeIcon />,
      less: <CodeIcon />,
      py: <CodeIcon />,
      php: <CodeIcon />,
      rb: <CodeIcon />,
      go: <CodeIcon />,
      rs: <CodeIcon />,
      env: <CodeIcon />
    };
    return iconMap[ext] || <FileIcon />;
  };

  const currentContents = getCurrentContents();
  const breadcrumbs = getBreadcrumbs();

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Tooltip title="Back">
            <IconButton 
              onClick={goBack}
              disabled={currentIndex <= 0}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Forward">
            <IconButton
              onClick={goForward}
              disabled={currentIndex >= pathHistory.length - 1}
              size="small"
            >
              <ArrowForwardIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Up">
            <IconButton
              onClick={goUp}
              disabled={!currentPath}
              size="small"
            >
              <ArrowUpwardIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Breadcrumbs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Address:
          </Typography>
          {breadcrumbs.map((crumb, index) => (
            <Box key={crumb.path} sx={{ display: 'flex', alignItems: 'center' }}>
              {index > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                  \
                </Typography>
              )}
              <Button
                variant="text"
                size="small"
                onClick={() => navigateToPath(crumb.path)}
                sx={{
                  textTransform: 'none',
                  minWidth: 'auto',
                  p: 0.5,
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                {crumb.name}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>

      {/* View Controls */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Tooltip title="List View">
          <IconButton
            size="small"
            onClick={() => setViewMode('list')}
            color={viewMode === 'list' ? 'primary' : 'default'}
          >
            <ViewListIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Grid View">
          <IconButton
            size="small"
            onClick={() => setViewMode('grid')}
            color={viewMode === 'grid' ? 'primary' : 'default'}
          >
            <ViewModuleIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Details View">
          <IconButton
            size="small"
            onClick={() => setViewMode('details')}
            color={viewMode === 'details' ? 'primary' : 'default'}
          >
            <ViewHeadlineIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {!currentContents || currentContents.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              This folder is empty
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1 }}>
            {viewMode === 'list' && (
              <List dense>
                {/* Folders First */}
                {currentContents
                  .filter(item => item.type === 'folder')
                  .map(item => (
                    <ListItem
                      key={item.relativePath}
                      button
                      onClick={() => navigateToPath(item.relativePath)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <FolderIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.name}
                        secondary={`${item.children?.length || 0} items`}
                      />
                    </ListItem>
                  ))
                }
                
                {/* Files */}
                {currentContents
                  .filter(item => item.type === 'file')
                  .map(item => (
                    <ListItem
                      key={item.relativePath}
                      button
                      selected={selectedFile?.relativePath === item.relativePath}
                      onClick={() => onFileSelect(item)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {getFileIcon(item.name)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.name}
                        secondary={item.size ? `${(item.size / 1024).toFixed(1)} KB` : ''}
                      />
                    </ListItem>
                  ))
                }
              </List>
            )}

            {viewMode === 'grid' && (
              <Grid container spacing={1}>
                {currentContents.map(item => (
                  <Grid item xs={6} sm={4} md={3} key={item.relativePath}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      onClick={() => item.type === 'folder' ? navigateToPath(item.relativePath) : onFileSelect(item)}
                    >
                      <Box sx={{ mb: 1 }}>
                        {item.type === 'folder' ? (
                          <FolderIcon color="primary" sx={{ fontSize: 32 }} />
                        ) : (
                          getFileIcon(item.name)
                        )}
                      </Box>
                      <Typography variant="caption" noWrap>
                        {item.name}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {viewMode === 'details' && (
              <List dense>
                {currentContents.map(item => (
                  <ListItem
                    key={item.relativePath}
                    button
                    onClick={() => item.type === 'folder' ? navigateToPath(item.relativePath) : onFileSelect(item)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.type === 'folder' ? (
                        <FolderIcon color="primary" />
                      ) : (
                        getFileIcon(item.name)
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {item.type === 'folder' ? 'Folder' : 'File'}
                          </Typography>
                          {item.size && (
                            <Typography variant="caption" color="text.secondary">
                              {`${(item.size / 1024).toFixed(1)} KB`}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default FileExplorer;

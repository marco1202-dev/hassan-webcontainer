import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField
} from '@mui/material';
import {
  Code as CodeIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const CodeViewer = ({ file, content, onContentChange }) => {
  if (!file) {
    return (
      <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 4,
          textAlign: 'center'
        }}>
          <CodeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No file selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a file from the explorer to view its content
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Check if it's a binary file
  const isBinary = !file.name || !['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'json', 'md', 'txt', 'xml', 'yaml', 'yml'].includes(
    file.name.split('.').pop()?.toLowerCase()
  );

  if (isBinary) {
    return (
      <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FileIcon color="error" />
            <Typography variant="h6" color="error">
              Binary File
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {file.name} is a binary file and cannot be displayed as text.
          </Typography>
          
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>File size:</strong> {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>File type:</strong> {file.name ? `.${file.name.split('.').pop()}` : 'Unknown'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* File Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <CodeIcon color="primary" />
          <Typography variant="h6" component="h3">
            {file.name}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {file.relativePath}
        </Typography>
      </Box>
      
      {/* Code Content */}
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <TextField
          fullWidth
          multiline
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Loading file content..."
          spellCheck={false}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              height: '100%',
              '& textarea': {
                height: '100% !important',
                minHeight: '400px'
              }
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default CodeViewer;

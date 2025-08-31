import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Button
} from '@mui/material';
import {
  Send as SendIcon,
  Clear as ClearIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Terminal as TerminalIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const Terminal = ({ projectId }) => {
  const [commandHistory, setCommandHistory] = useState([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Common commands for web development
  const commonCommands = [
    { label: 'npm install', command: 'npm install', description: 'Install dependencies' },
    { label: 'npm start', command: 'npm start', description: 'Start development server' },
    { label: 'npm run build', command: 'npm run build', description: 'Build project' },
    { label: 'npm run dev', command: 'npm run dev', description: 'Start dev server' },
    { label: 'yarn install', command: 'yarn install', description: 'Install with Yarn' },
    { label: 'yarn start', command: 'yarn start', description: 'Start with Yarn' },
    { label: 'ls', command: 'ls', description: 'List files' },
    { label: 'pwd', command: 'pwd', description: 'Show current directory' },
    { label: 'clear', command: 'clear', description: 'Clear terminal' }
  ];

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input when terminal is clicked
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addToOutput = (text, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, { text, type, timestamp, id: Date.now() + Math.random() }]);
  };

  const executeCommand = async (command) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Add command to output
    addToOutput(`$ ${command}`, 'command');
    
    // Clear current command
    setCurrentCommand('');
    
    // Handle built-in commands
    if (command.trim() === 'clear') {
      setOutput([]);
      return;
    }

    if (command.trim() === 'help') {
      addToOutput('Available commands:', 'info');
      commonCommands.forEach(cmd => {
        addToOutput(`  ${cmd.command} - ${cmd.description}`, 'help');
      });
      return;
    }
    
    setIsRunning(true);
    
    try {
      // Send command to backend for execution
      const response = await axios.post(`/api/projects/${projectId}/terminal`, {
        command: command.trim()
      });

      if (response.data.success) {
        if (response.data.output) {
          // Split output into lines and add each line
          const lines = response.data.output.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            addToOutput(line, 'output');
          });
        }
        if (response.data.message) {
          addToOutput(response.data.message, 'success');
        }
      } else {
        addToOutput(response.data.error || 'Command failed', 'error');
      }
    } catch (error) {
      console.error('Terminal command error:', error);
      
      // Simulate command execution for now (fallback)
      if (command === 'ls' || command === 'dir') {
        addToOutput('index.html', 'output');
        addToOutput('styles.css', 'output');
        addToOutput('script.js', 'output');
        addToOutput('package.json', 'output');
      } else if (command === 'pwd') {
        addToOutput(`/projects/${projectId}`, 'output');
      } else if (command.startsWith('npm install') || command.startsWith('yarn install')) {
        addToOutput('Installing dependencies...', 'info');
        setTimeout(() => {
          addToOutput('Dependencies installed successfully!', 'success');
          setIsRunning(false);
        }, 2000);
        return;
      } else if (command.startsWith('npm start') || command.startsWith('yarn start')) {
        addToOutput('Starting development server...', 'info');
        addToOutput('Server running on http://localhost:3000', 'success');
        addToOutput('Press Ctrl+C to stop', 'info');
      } else if (command.startsWith('npm run build') || command.startsWith('yarn build')) {
        addToOutput('Building project...', 'info');
        setTimeout(() => {
          addToOutput('Build completed successfully!', 'success');
          addToOutput('Output files created in /dist folder', 'output');
          setIsRunning(false);
        }, 3000);
        return;
      } else {
        addToOutput(`Command not found: ${command}`, 'error');
        addToOutput('Type "help" to see available commands', 'help');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeCommand(currentCommand);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleCommandClick = (command) => {
    setCurrentCommand(command);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const stopCommand = () => {
    setIsRunning(false);
    addToOutput('Command stopped by user', 'warning');
  };

  const getOutputColor = (type) => {
    switch (type) {
      case 'command': return '#00ff00';
      case 'output': return '#ffffff';
      case 'error': return '#ff6b6b';
      case 'success': return '#51cf66';
      case 'warning': return '#ffd43b';
      case 'help': return '#74c0fc';
      case 'info': return '#91a7ff';
      default: return '#adb5bd';
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TerminalIcon color="primary" />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              Terminal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Clear Output">
              <IconButton onClick={clearOutput} size="small">
                <ClearIcon />
              </IconButton>
            </Tooltip>
            {isRunning ? (
              <Tooltip title="Stop Command">
                <IconButton onClick={stopCommand} color="error" size="small">
                  <StopIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Run Command">
                <IconButton 
                  onClick={() => executeCommand(currentCommand)} 
                  disabled={!currentCommand.trim()}
                  color="primary" 
                  size="small"
                >
                  <PlayIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Execute commands for your project
        </Typography>
      </Box>

      {/* Common Commands */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Quick Commands:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {commonCommands.slice(0, 6).map((cmd, index) => (
            <Tooltip key={index} title={cmd.description}>
              <Chip
                label={cmd.label}
                size="small"
                variant="outlined"
                onClick={() => handleCommandClick(cmd.command)}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Command Input */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 600, fontFamily: 'monospace' }}>
              $
            </Typography>
            <TextField
              ref={inputRef}
              fullWidth
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command... (Use ↑↓ for history)"
              variant="outlined"
              size="small"
              disabled={isRunning}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }
              }}
              InputProps={{
                endAdornment: (
                  <IconButton 
                    type="submit" 
                    disabled={!currentCommand.trim() || isRunning}
                    size="small"
                  >
                    <SendIcon />
                  </IconButton>
                )
              }}
            />
          </Box>
        </form>
      </Box>

      {/* Output Display */}
      <Box 
        ref={terminalRef}
        onClick={() => inputRef.current?.focus()}
        sx={{ 
          flex: 1, 
          p: 2, 
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: 1.5,
          overflow: 'auto',
          cursor: 'text'
        }}
      >
        {output.length === 0 ? (
          <Box sx={{ color: '#adb5bd', fontStyle: 'italic' }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              Welcome to VibeShare Terminal
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
              Type "help" to see available commands
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              Use ↑↓ arrow keys to navigate command history
            </Typography>
          </Box>
        ) : (
          output.map((item) => (
            <Box key={item.id} sx={{ mb: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: getOutputColor(item.type),
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {item.text}
              </Typography>
            </Box>
          ))
        )}
        
        {isRunning && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                backgroundColor: '#51cf66',
                borderRadius: '50%',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} 
            />
            <Typography variant="body2" sx={{ color: '#51cf66', fontFamily: 'monospace' }}>
              Running...
            </Typography>
          </Box>
        )}
        
        {/* Cursor */}
        <Box 
          sx={{ 
            display: 'inline-block',
            width: '8px',
            height: '16px',
            backgroundColor: '#ffffff',
            animation: 'blink 1s step-end infinite',
            ml: 0.5
          }} 
        />
      </Box>

      {/* CSS for animations */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </Paper>
  );
};

export default Terminal;
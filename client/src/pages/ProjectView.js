import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import FileExplorer from '../components/FileExplorer';
import CodeViewer from '../components/CodeViewer';
import ProjectPreview from '../components/ProjectPreview';
import Terminal from '../components/Terminal';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileStructure, setFileStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'terminal'
  const [previewMode] = useState('iframe'); // 'iframe', 'live'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedFile, setLastSavedFile] = useState(null);

  // Helper function to find first file in structure
  const findFirstFile = useCallback((structure) => {
    for (const item of structure) {
      if (item.type === 'file') {
        return item;
      }
      if (item.type === 'folder' && item.children) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const fetchFileContent = useCallback(async (file) => {
    if (!file) return;
    
    try {
      // Only fetch content for text-based files
      const textExtensions = ['.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.json', '.md', '.txt', '.xml', '.yaml', '.yml'];
      const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
      
      if (textExtensions.includes(`.${ext}`)) {
        const response = await apiService.get(`/projects/${projectId}/files/${encodeURIComponent(file.relativePath)}`);
        setFileContent(response.data.content);
      } else {
        setFileContent('Binary file - cannot display content');
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
      setFileContent('Error loading file content');
    }
  }, [projectId]);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/projects/${projectId}`);
      setProject(response.data.project);
      
      // Fetch the actual file system structure
              const structureResponse = await apiService.get(`/projects/${projectId}/structure`);
      setFileStructure(structureResponse.data.structure);
      
      // Set default selected file (index.html if exists, or first file)
      const indexFile = structureResponse.data.structure.find(f => 
        f.type === 'file' && (f.name === 'index.html' || f.name === 'index.htm')
      );
      if (indexFile) {
        setSelectedFile(indexFile);
        fetchFileContent(indexFile);
      } else if (structureResponse.data.structure.length > 0) {
        // Find first file in structure
        const firstFile = findFirstFile(structureResponse.data.structure);
        if (firstFile) {
          setSelectedFile(firstFile);
          fetchFileContent(firstFile);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchFileContent, findFirstFile]);

  // Save file content to backend
  const saveFileContent = useCallback(async (file, content) => {
    if (!file || saving) return;
    
    setSaving(true);
    try {
      await apiService.put(`/projects/${projectId}/files/${encodeURIComponent(file.relativePath)}`, {
        content: content
      });
      
      setHasUnsavedChanges(false);
      setLastSavedFile(file.relativePath);
      toast.success('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file');
    } finally {
      setSaving(false);
    }
  }, [projectId, saving]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+S to save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (selectedFile && hasUnsavedChanges) {
          saveFileContent(selectedFile, fileContent);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, hasUnsavedChanges, fileContent, saveFileContent]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    fetchFileContent(file);
  };

  // Auto-save functionality with debounce
  const [saveTimeout, setSaveTimeout] = useState(null);
  
  const handleContentChange = (newContent) => {
    setFileContent(newContent);
    setHasUnsavedChanges(true);
    
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set new timeout for auto-save (2 seconds after user stops typing)
    const timeout = setTimeout(() => {
      if (selectedFile) {
        saveFileContent(selectedFile, newContent);
      }
    }, 2000);
    
    setSaveTimeout(timeout);
  };



  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading project...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => fetchProject()}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning">
          <AlertTitle>Project Not Found</AlertTitle>
          The requested project could not be found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            size="small"
          >
            Back to Dashboard
          </Button>
          
          <Divider orientation="vertical" flexItem />
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              {project.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.description}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Toggle Sidebar">
              <IconButton
                size="small"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Toggle Preview">
              <IconButton
                size="small"
                onClick={() => setPreviewCollapsed(!previewCollapsed)}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Project Settings">
              <IconButton
                size="small"
                onClick={() => navigate(`/projects/${projectId}/edit`)}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)' }}>
        {/* Sidebar - File Explorer */}
        {!sidebarCollapsed && (
          <Paper elevation={2} sx={{ width: 300, borderRadius: 2 }}>
            <FileExplorer
              files={fileStructure}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              projectName={project.title}
            />
          </Paper>
        )}

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Tab Navigation */}
          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
              <Button
                variant={activeTab === 'code' ? 'contained' : 'outlined'}
                startIcon={<CodeIcon />}
                onClick={() => setActiveTab('code')}
                size="small"
              >
                Code Editor
                {hasUnsavedChanges && (
                  <Box component="span" sx={{ ml: 1, color: 'warning.main' }}>
                    •
                  </Box>
                )}
                {saving && (
                  <Box component="span" sx={{ ml: 1 }}>
                    <SaveIcon sx={{ fontSize: 16 }} />
                  </Box>
                )}
              </Button>
              <Button
                variant={activeTab === 'terminal' ? 'contained' : 'outlined'}
                startIcon={<TerminalIcon />}
                onClick={() => setActiveTab('terminal')}
                size="small"
              >
                Terminal
              </Button>
            </Box>
          </Paper>

          {/* Code Editor */}
          {activeTab === 'code' && (
            <Box sx={{ flexGrow: 1 }}>
              <CodeViewer
                file={selectedFile}
                content={fileContent}
                onContentChange={handleContentChange}
              />
            </Box>
          )}

          {/* Terminal */}
          {activeTab === 'terminal' && (
            <Box sx={{ flexGrow: 1 }}>
              <Terminal projectId={projectId} />
            </Box>
          )}
        </Box>

        {/* Preview Panel */}
        {!previewCollapsed && (
          <Paper elevation={2} sx={{ width: 400, borderRadius: 2 }}>
            <ProjectPreview
              project={project}
              fileStructure={fileStructure}
              selectedFile={selectedFile}
              mode={previewMode}
              onFileSaved={lastSavedFile}
              isLivePreviewEnabled={true}
            />
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default ProjectView;

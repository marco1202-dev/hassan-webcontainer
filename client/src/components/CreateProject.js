import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Grid,

  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const CreateProject = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    framework: 'vanilla',
    tags: '',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);

  const frameworks = [
    { value: 'vanilla', label: 'Vanilla HTML/CSS/JS' },
    { value: 'react', label: 'React' },
    { value: 'nextjs', label: 'Next.js' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'angular', label: 'Angular' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Parse tags from comma-separated string
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const projectData = {
        ...formData,
        tags
      };

      const response = await apiService.post('/projects', projectData);

      toast.success('Project created successfully!');
      
      // Navigate to the new project's upload page
      navigate(`/projects/${response.data.project._id}/upload`);
      
    } catch (error) {
      console.error('Create project error:', error);
      const message = error.response?.data?.message || 'Failed to create project';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: 'primary.main'
            }}
          >
            Create New Project
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: '1.1rem' }}
          >
            Start building something amazing with VibeShare
          </Typography>
        </Box>
        
        {/* Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Project Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="title"
                name="title"
                label="Project Title *"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter project title"
                inputProps={{ maxLength: 100 }}
                required
                helperText={`${formData.title.length}/100 characters`}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description *"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project..."
                inputProps={{ maxLength: 500 }}
                required
                multiline
                rows={4}
                helperText={`${formData.description.length}/500 characters`}
              />
            </Grid>

            {/* Framework */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="framework-label">Framework</InputLabel>
                <Select
                  labelId="framework-label"
                  id="framework"
                  name="framework"
                  value={formData.framework}
                  label="Framework"
                  onChange={handleChange}
                >
                  {frameworks.map(framework => (
                    <MenuItem key={framework.value} value={framework.value}>
                      {framework.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Tags */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="tags"
                name="tags"
                label="Tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="react, webapp, ui (comma-separated)"
                helperText="Add tags to help others discover your project"
              />
            </Grid>

            {/* Public Checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" component="span">
                      Make this project public
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Public projects can be viewed and discovered by other users
                    </Typography>
                  </Box>
                }
              />
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  disabled={loading}
                  sx={{ px: 3 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  disabled={loading}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateProject;

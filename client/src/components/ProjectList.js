import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Folder as FolderIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';


const ProjectList = ({ onProjectClick }) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Fetch projects error:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleting(projectId);

    try {
      await axios.delete(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Project deleted successfully');
      setProjects(prev => prev.filter(p => p._id !== projectId));
    } catch (error) {
      console.error('Delete project error:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  const getFrameworkIcon = (framework) => {
    const icons = {
      react: '⚛️',
      nextjs: '▲',
      vue: '💚',
      svelte: '🟠',
      angular: '🅰️',
      vanilla: '🌐',
      other: '📁'
    };
    return icons[framework] || '📁';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">
          Loading your projects...
        </Typography>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
          🚀
        </Typography>
        <Typography variant="h4" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
          No projects yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
          Start building by creating your first project!
        </Typography>
        <Button
          component={Link}
          to="/create-project"
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2, px: 4, py: 1.5 }}
        >
          Create Your First Project
        </Button>
      </Box>
    );
  }

    return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          My Projects ({projects.length})
        </Typography>
        <Button
          component={Link}
          to="/create-project"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          + New Project
        </Button>
      </Box>

      {/* Projects Grid */}
      <Grid container spacing={3}>
        {projects.map(project => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={project._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 2 }}>
                {/* Project Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" component="span">
                      {getFrameworkIcon(project.framework)}
                    </Typography>
                    <Chip
                      label={project.framework}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                  <Chip
                    icon={project.isPublic ? <PublicIcon /> : <LockIcon />}
                    label={project.isPublic ? 'Public' : 'Private'}
                    size="small"
                    color={project.isPublic ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>

                {/* Project Content */}
                <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 600, lineHeight: 1.3 }}>
                  {project.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 3, 
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {project.description}
                </Typography>

                {/* Project Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FolderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {project.files?.length || 0} files
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {project.stats?.views || 0} views
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FavoriteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {project.stats?.likes || 0} likes
                    </Typography>
                  </Box>
                </Box>

                {/* Project Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Created {formatDate(project.createdAt)}
                  </Typography>
                </Box>
              </CardContent>

              <Divider />

              {/* Project Actions */}
              <CardActions sx={{ p: 2, pt: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <Button
                    component={Link}
                    to={`/projects/${project._id}`}
                    variant="outlined"
                    size="small"
                    startIcon={<ViewIcon />}
                    sx={{ flex: 1, borderRadius: 1.5 }}
                  >
                    View
                  </Button>
                  <Button
                    component={Link}
                    to={`/projects/${project._id}/edit`}
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    sx={{ flex: 1, borderRadius: 1.5 }}
                  >
                    Edit
                  </Button>
                  <Tooltip title="Delete Project">
                    <IconButton
                      onClick={() => handleDelete(project._id)}
                      disabled={deleting === project._id}
                      color="error"
                      size="small"
                      sx={{ borderRadius: 1.5 }}
                    >
                      {deleting === project._id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProjectList;

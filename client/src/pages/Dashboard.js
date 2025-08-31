import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateProject from '../components/CreateProject';
import ProjectList from '../components/ProjectList';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
    { id: 'projects', label: 'My Projects', icon: <FolderIcon /> },
    { id: 'create', label: 'Create New', icon: <AddIcon /> }
  ];

  const stats = [
    { label: 'Total Projects', value: '0', icon: <FolderIcon sx={{ color: 'primary.main' }} /> },
    { label: 'Total Views', value: '0', icon: <VisibilityIcon sx={{ color: 'info.main' }} /> },
    { label: 'Total Likes', value: '0', icon: <FavoriteIcon sx={{ color: 'error.main' }} /> },
    { label: 'Total Forks', value: '0', icon: <ShareIcon sx={{ color: 'success.main' }} /> }
  ];

  const recentActivity = [
    {
      icon: '🚀',
      text: 'Welcome to VibeShare!',
      time: 'Just now'
    },
    {
      icon: '📁',
      text: 'Create your first project to get started',
      time: 'Ready when you are'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Overview
        return (
          <Box sx={{ mt: 3 }}>
            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        {stat.icon}
                      </Box>
                      <Typography
                        variant="h3"
                        component="div"
                        sx={{
                          fontWeight: 700,
                          color: 'primary.main',
                          mb: 1
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textTransform: 'uppercase', fontWeight: 500 }}
                      >
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Recent Activity */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <TrendingUpIcon />
                Recent Activity
              </Typography>
              
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Typography variant="h6">{activity.icon}</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.text}
                        secondary={activity.time}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          color: 'text.primary'
                        }}
                        secondaryTypographyProps={{
                          color: 'text.secondary',
                          fontSize: '0.875rem'
                        }}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>
        );
      
      case 1: // Projects
        return <ProjectList onProjectClick={(projectId) => navigate(`/projects/${projectId}`)} />;
      
      case 2: // Create
        return <CreateProject />;
      
      default:
        return <div>Select a tab</div>;
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: 'text.primary'
          }}
        >
          Dashboard
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 400 }}
        >
          Manage your projects and create amazing things
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none'
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {renderTabContent()}
      </Box>
    </Container>
  );
};

export default Dashboard;

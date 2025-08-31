import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper
} from '@mui/material';
import {
  RocketLaunch as RocketIcon,
  FlashOn as FlashIcon,
  Security as SecurityIcon,
  Share as ShareIcon
} from '@mui/icons-material';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <RocketIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Universal Support',
      description: 'Run React, Next.js, Vue, Svelte, and plain HTML/CSS/JS projects seamlessly'
    },
    {
      icon: <FlashIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
      title: 'Live Preview',
      description: 'See your code execute in real-time with hot reload and instant feedback'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      title: 'Secure Execution',
      description: 'WebContainers provide isolated, secure environments for your code'
    },
    {
      icon: <ShareIcon sx={{ fontSize: 48, color: 'info.main' }} />,
      title: 'Easy Sharing',
      description: 'Share your projects with one click and let others fork and build upon them'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              lineHeight: 1.2
            }}
          >
            Share Your AI-Generated Code
            <br />
            Live & Interactive
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              opacity: 0.9,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Upload your projects and see them run in real-time. Support for React, Next.js, Vue, 
            and more. Built with WebContainers for seamless browser-based execution.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Button
                component={Link}
                to="/dashboard"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'grey.100'
                    }
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Sign In
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Why Choose VibeShare?
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: 'text.primary'
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: { xs: 4, md: 6 },
              textAlign: 'center',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                mb: 2,
                fontWeight: 600
              }}
            >
              Ready to Share Your Code?
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                opacity: 0.9
              }}
            >
              Join thousands of developers sharing their AI-generated projects
            </Typography>
            
            {!isAuthenticated && (
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Start Building Today
              </Button>
            )}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

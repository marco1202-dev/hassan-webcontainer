import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateProject from './components/CreateProject';
import FileUpload from './components/FileUpload';
import ProjectView from './pages/ProjectView';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

// Create MUI theme component that integrates with our theme context
const MuiThemeWrapper = ({ children }) => {
  const { isDark } = useTheme();

  const muiTheme = createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#667eea',
      },
      secondary: {
        main: '#764ba2',
      },
      background: {
        default: isDark ? '#0a0a0a' : '#ffffff', // Pure black for dark mode
        paper: isDark ? '#1a1a1a' : '#ffffff',   // Dark gray for cards/surfaces
      },
      surface: {
        main: isDark ? '#1a1a1a' : '#ffffff',    // Additional surface color
      },
      text: {
        primary: isDark ? '#ffffff' : '#1a1a1a',
        secondary: isDark ? '#b0b0b0' : '#666666',
      },
      divider: isDark ? '#333333' : '#e0e0e0',
      action: {
        hover: isDark ? '#2a2a2a' : '#f5f5f5',
        selected: isDark ? '#333333' : '#e3f2fd',
        active: isDark ? '#404040' : '#e8eaf6',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
            color: isDark ? '#ffffff' : '#1a1a1a',
          },
          html: {
            backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            borderRadius: 12,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            backgroundImage: 'none', // Remove default paper texture
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            color: isDark ? '#ffffff' : '#1a1a1a',
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
          },
        },
      },
      MuiBox: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent', // Let parent control background
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? '#333333' : '#e0e0e0',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              '& fieldset': {
                borderColor: isDark ? '#333333' : '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#555555' : '#bdbdbd',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#667eea',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
            },
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
          },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MuiThemeWrapper>
          <Router>
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/create-project"
                  element={
                    <PrivateRoute>
                      <CreateProject />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/upload"
                  element={
                    <PrivateRoute>
                      <FileUpload />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/projects/:projectId"
                  element={
                    <PrivateRoute>
                      <ProjectView />
                    </PrivateRoute>
                  }
                />
              </Routes>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </MuiThemeWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

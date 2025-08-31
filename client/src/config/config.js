// Configuration file for VibeShare client
// Automatically detects environment and uses appropriate values

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const config = {
  // API Configuration
  api: {
    // Base URL for API calls - auto-detects environment
    baseURL: isDev 
      ? '' // Use proxy in development
      : process.env.REACT_APP_API_BASE_URL || 'https://api.vibeshare.com',
    
    // API version (if needed)
    version: process.env.REACT_APP_API_VERSION || 'v1',
    
    // Timeout for API requests (in milliseconds)
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
    
    // Whether to use proxy (auto-detects: true for dev, false for prod)
    useProxy: isDev,
  },

  // App Configuration
  app: {
    // App name
    name: process.env.REACT_APP_NAME || 'VibeShare',
    
    // App version
    version: process.env.REACT_APP_VERSION || '1.0.0',
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Debug mode (auto-detects: true for dev, false for prod)
    debug: isDev,
  },

  // WebContainer Configuration
  webcontainer: {
    // WebContainer service URL - auto-detects environment
    serviceURL: isDev 
      ? 'http://localhost:3000' 
      : process.env.REACT_APP_WEBCONTAINER_URL || 'https://webcontainer.vibeshare.com',
  },

  // Preview Configuration
  preview: {
    // Preview server URL - auto-detects environment
    serverURL: isDev 
      ? 'http://localhost:5000' 
      : process.env.REACT_APP_PREVIEW_SERVER_URL || 'https://api.vibeshare.com',
    
    // Cache busting enabled
    cacheBusting: process.env.REACT_APP_PREVIEW_CACHE_BUSTING !== 'false',
  },

  // Development Configuration
  development: {
    // Enable hot reload (auto-detects: true for dev, false for prod)
    hotReload: isDev,
    
    // Enable debug logging (auto-detects: true for dev, false for prod)
    debugLogging: isDev,
  }
};

// Helper functions
export const getApiUrl = (endpoint = '') => {
  const baseURL = config.api.useProxy ? '' : config.api.baseURL;
  return `${baseURL}/api${endpoint}`;
};

export const getPreviewUrl = (projectId, filePath, timestamp = null) => {
  const baseURL = config.preview.serverURL;
  const url = `${baseURL}/api/projects/${projectId}/preview/${encodeURIComponent(filePath)}`;
  return timestamp ? `${url}?v=${timestamp}` : url;
};

export const getWebContainerUrl = () => {
  return config.webcontainer.serviceURL;
};

export const isDevelopment = () => {
  return config.app.environment === 'development';
};

export const isProduction = () => {
  return config.app.environment === 'production';
};

export const isDebugEnabled = () => {
  return config.app.debug || config.development.debugLogging;
};

// Log configuration in development
if (isDebugEnabled()) {
  console.log('🔧 VibeShare Configuration:', config);
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔗 API Base URL:', config.api.baseURL);
  console.log('📱 Preview Server:', config.preview.serverURL);
  console.log('🐳 WebContainer URL:', config.webcontainer.serviceURL);
  console.log('🔄 Using Proxy:', config.api.useProxy);
}

export default config;

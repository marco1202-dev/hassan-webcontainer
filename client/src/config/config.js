// Configuration file for VibeShare client
// Uses environment variables directly

const config = {
  // API Configuration
  api: {
    // Base URL for API calls
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
    
    // API version (if needed)
    version: process.env.REACT_APP_API_VERSION || 'v1',
    
    // Timeout for API requests (in milliseconds)
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
    
    // Whether to use proxy
    useProxy: process.env.REACT_APP_USE_PROXY === 'true',
  },

  // App Configuration
  app: {
    // App name
    name: process.env.REACT_APP_NAME || 'VibeShare',
    
    // App version
    version: process.env.REACT_APP_VERSION || '1.0.0',
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Debug mode
    debug: process.env.REACT_APP_DEBUG === 'true',
  },

  // WebContainer Configuration
  webcontainer: {
    // WebContainer service URL
    serviceURL: process.env.REACT_APP_WEBCONTAINER_URL || 'http://localhost:3000',
  },

  // Preview Configuration
  preview: {
    // Preview server URL
    serverURL: process.env.REACT_APP_PREVIEW_SERVER_URL || 'http://localhost:5000',
    
    // Cache busting enabled
    cacheBusting: process.env.REACT_APP_PREVIEW_CACHE_BUSTING !== 'false',
  },

  // Development Configuration
  development: {
    // Enable hot reload
    hotReload: process.env.REACT_APP_HOT_RELOAD === 'true',
    
    // Enable debug logging
    debugLogging: process.env.REACT_APP_DEBUG_LOGGING === 'true',
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
  return process.env.NODE_ENV === 'development';
};

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

export const isDebugEnabled = () => {
  return config.app.debug || config.development.debugLogging;
};

// Log configuration
if (isDebugEnabled()) {
  console.log('🔧 VibeShare Configuration:', config);
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔗 API Base URL:', config.api.baseURL);
  console.log('📱 Preview Server:', config.preview.serverURL);
  console.log('🐳 WebContainer URL:', config.webcontainer.serviceURL);
  console.log('🔄 Using Proxy:', config.api.useProxy);
}

export default config;

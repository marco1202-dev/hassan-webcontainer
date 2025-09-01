// Configuration file for VibeShare client
// Uses simple config file - no environment variables needed!

import simpleConfig from './simple-config';
import localConfig from './local-config';

// Choose which config to use based on current URL
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const activeConfig = isLocalhost ? localConfig : simpleConfig;

const config = {
  // API Configuration
  api: {
    // Base URL for API calls - from active config
    baseURL: activeConfig.apiUrl,
    
    // API version (if needed)
    version: 'v1',
    
    // Timeout for API requests (in milliseconds)
    timeout: 30000,
    
    // Whether to use proxy - from active config
    useProxy: activeConfig.useProxy,
  },

  // App Configuration
  app: {
    // App name
    name: activeConfig.appName,
    
    // App version
    version: activeConfig.appVersion,
    
    // Environment
    environment: isLocalhost ? 'development' : 'production',
    
    // Debug mode - from active config
    debug: activeConfig.debug,
  },

  // WebContainer Configuration
  webcontainer: {
    // WebContainer service URL - from active config
    serviceURL: activeConfig.webcontainerUrl,
  },

  // Preview Configuration
  preview: {
    // Preview server URL - from active config
    serverURL: activeConfig.previewUrl,
    
    // Cache busting enabled
    cacheBusting: true,
  },

  // Development Configuration
  development: {
    // Enable hot reload - from active config
    hotReload: !activeConfig.useProxy,
    
    // Enable debug logging - from active config
    debugLogging: activeConfig.debug,
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
  console.log('🌍 Environment:', config.app.environment);
  console.log('🔗 API Base URL:', config.api.baseURL);
  console.log('📱 Preview Server:', config.preview.serverURL);
  console.log('🐳 WebContainer URL:', config.webcontainer.serviceURL);
  console.log('🔄 Using Proxy:', config.api.useProxy);
  console.log('📍 Hostname:', window.location.hostname);
  console.log('📍 Port:', window.location.port);
  console.log('📍 Is Localhost:', isLocalhost);
  console.log('📍 Active Config:', activeConfig === simpleConfig ? 'simple-config.js (Production)' : 'local-config.js (Local)');
  
  // Debug: Show the actual config values being used
  console.log('🔍 Debug - Active Config Values:', {
    apiUrl: activeConfig.apiUrl,
    useProxy: activeConfig.useProxy,
    appName: activeConfig.appName
  });
}

export default config;

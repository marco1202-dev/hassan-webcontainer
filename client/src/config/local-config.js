// Local Development Configuration
// Use this when working on your local machine

const localConfig = {
  // Backend API URL - Local development
  apiUrl: 'https://hassan-webcontainer.onrender.com',
  
  // WebContainer URL - Local development
  webcontainerUrl: 'http://localhost:8000',
  
  // Preview Server URL - Local development
  previewUrl: 'https://hassan-webcontainer.onrender.com',
  
  // App Settings
  appName: 'VibeShare (Local)',
  appVersion: '1.0.0-dev',
  
  // Debug Mode (true for development)
  debug: true,
  
  // Use Proxy (false since we're using production URLs for XAMPP testing)
  useProxy: false
};

export default localConfig;

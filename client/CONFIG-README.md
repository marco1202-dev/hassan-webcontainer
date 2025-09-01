# VibeShare Configuration Guide

## 🎯 Simple Configuration System

**No more environment variables!** Just edit config files and deploy.

## 📁 Configuration Files

### **1. `src/config/simple-config.js` - Production/Deployment**
```javascript
const config = {
  // Backend API URL - Update this for your deployment
  apiUrl: 'https://your-backend.onrender.com',
  
  // WebContainer URL - Update this for your deployment
  webcontainerUrl: 'https://your-webcontainer.onrender.com',
  
  // Preview Server URL - Update this for your deployment
  previewUrl: 'https://your-backend.onrender.com',
  
  // App Settings
  appName: 'VibeShare',
  appVersion: '1.0.0',
  
  // Debug Mode (false for production)
  debug: false,
  
  // Use Proxy (false for production)
  useProxy: false
};
```

### **2. `src/config/local-config.js` - Local Development**
```javascript
const localConfig = {
  // Backend API URL - Local development
  apiUrl: 'http://localhost:5000',
  
  // WebContainer URL - Local development
  webcontainerUrl: 'http://localhost:3000',
  
  // Preview Server URL - Local development
  previewUrl: 'http://localhost:5000',
  
  // App Settings
  appName: 'VibeShare (Local)',
  appVersion: '1.0.0-dev',
  
  // Debug Mode (true for development)
  debug: true,
  
  // Use Proxy (true for local development)
  useProxy: true
};
```

## 🚀 How It Works

1. **Local Development** (`localhost:3000`):
   - Automatically uses `local-config.js`
   - API calls go to `http://localhost:5000`
   - Proxy enabled for development

2. **Production/Deployment** (any other domain):
   - Automatically uses `simple-config.js`
   - API calls go to your production URLs
   - No proxy, direct API calls

## 🔧 How to Deploy

### **Step 1: Update Production Config**
Edit `src/config/simple-config.js`:
```javascript
apiUrl: 'https://your-backend.onrender.com',
webcontainerUrl: 'https://your-webcontainer.onrender.com',
previewUrl: 'https://your-backend.onrender.com',
```

### **Step 2: Build and Deploy**
```bash
npm run build
# Deploy the build folder
```

## ✨ Benefits

- **🎯 No Environment Variables** - Just edit config files
- **🚀 No Complex Setup** - Simple JavaScript objects
- **📱 Automatic Detection** - Local vs production auto-detected
- **🔧 Easy to Update** - Change URLs in one place
- **📚 No Confusion** - Clear, simple configuration

## 🔍 What Happens Automatically

- **Localhost** → Uses local config (localhost URLs)
- **Production** → Uses production config (your deployment URLs)
- **No Manual Switching** - Just works based on where you're running

## 📝 Example: Deploying to Render.com

1. **Update `simple-config.js`:**
   ```javascript
   apiUrl: 'https://hassan-webcontainer.onrender.com',
   webcontainerUrl: 'https://hassan-webcontainer.onrender.com',
   previewUrl: 'https://hassan-webcontainer.onrender.com',
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   ```

3. **That's it!** No environment variables needed.

## 🎉 Summary

- **Local Development**: Edit `local-config.js`
- **Production**: Edit `simple-config.js`
- **No .env files needed**
- **No environment variables**
- **Just simple JavaScript configs**

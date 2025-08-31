# VibeShare Client Configuration

This document explains the simplified configuration system for VibeShare client.

## 🎯 Simple Environment Setup

**Only ONE environment file needed!** The system automatically detects your environment and uses appropriate values.

### 📁 Environment Files

- **`.env`** - Main configuration file (development defaults)
- **`.env.production`** - Production overrides (optional, only for deployment)

### 🚀 Quick Start

```bash
# Development (uses .env automatically)
npm start

# Production build (uses .env.production if exists)
npm run build
```

## 🔧 How It Works

The configuration automatically detects your environment:

- **Development** (`NODE_ENV=development`):
  - API: `http://localhost:5000`
  - WebContainer: `http://localhost:3000`
  - Preview: `http://localhost:5000`
  - Proxy: Enabled
  - Debug: Enabled

- **Production** (`NODE_ENV=production`):
  - API: `https://api.vibeshare.com`
  - WebContainer: `https://webcontainer.vibeshare.com`
  - Preview: `https://api.vibeshare.com`
  - Proxy: Disabled
  - Debug: Disabled

## 📝 Configuration Structure

The configuration is centralized in `src/config/config.js` and supports:

- **API Configuration** - Base URLs, timeouts, proxy settings
- **App Configuration** - App name, version, debug mode
- **WebContainer Configuration** - WebContainer service URLs
- **Preview Configuration** - Preview server URLs and cache settings
- **Development Features** - Hot reload, debug logging

## 🌍 Environment Variables

### Main Configuration (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `REACT_APP_API_BASE_URL` | Backend API base URL | `http://localhost:5000` |
| `REACT_APP_WEBCONTAINER_URL` | WebContainer service URL | `http://localhost:3000` |
| `REACT_APP_PREVIEW_SERVER_URL` | Preview server URL | `http://localhost:5000` |
| `REACT_APP_DEBUG` | Enable debug mode | `true` |

### Production Override (`.env.production`)

Only set values that differ from the main `.env` file:

```bash
NODE_ENV=production
REACT_APP_API_BASE_URL=https://api.vibeshare.com
REACT_APP_WEBCONTAINER_URL=https://webcontainer.vibeshare.com
REACT_APP_PREVIEW_SERVER_URL=https://api.vibeshare.com
REACT_APP_DEBUG=false
```

## 🛠️ Local Development

1. **Copy `.env`** - Already configured for development
2. **Run the app** - `npm start`
3. **That's it!** - No additional configuration needed

## 🚀 Deployment

### Development
- Uses `.env` file
- Localhost URLs for services
- Debug logging enabled
- Hot reload enabled

### Production
- Uses `.env.production` if exists, otherwise `.env`
- Production URLs for services
- Debug logging disabled
- Optimized builds

## 💡 Configuration Usage

### In Components

```javascript
import { getApiUrl, getPreviewUrl, getWebContainerUrl } from '../config/config';

// API calls
const apiUrl = getApiUrl('/projects');
const response = await fetch(apiUrl);

// Preview URLs
const previewUrl = getPreviewUrl(projectId, filePath, timestamp);

// WebContainer URLs
const webcontainerUrl = getWebContainerUrl();
```

### API Service

```javascript
import apiService from '../services/api';

// Use the configured API service
const response = await apiService.get('/projects');
const project = await apiService.post('/projects', projectData);
```

## 🔍 Troubleshooting

### Common Issues

1. **API calls failing**: Check your `.env` file values
2. **Preview not loading**: Verify `REACT_APP_PREVIEW_SERVER_URL`
3. **WebContainer errors**: Check `REACT_APP_WEBCONTAINER_URL`

### Debug Mode

The system automatically enables debug logging in development:

```bash
# Check console for configuration details
🔧 VibeShare Configuration: {...}
🌍 Environment: development
🔗 API Base URL: http://localhost:5000
📱 Preview Server: http://localhost:5000
🐳 WebContainer URL: http://localhost:3000
```

## ✨ Benefits of This Approach

- **🎯 One File** - Only `.env` to manage
- **🤖 Auto-Detection** - Environment automatically detected
- **🚀 Simple Commands** - Just `npm start` and `npm run build`
- **🔧 Easy Override** - Optional `.env.production` for deployment
- **📱 No Confusion** - Clear, simple setup

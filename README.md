# VibeShare - Universal Preview Iframe

A social platform where developers share code projects they've created with AI assistants, allowing others to view live previews, remix, and build upon them.

## 🚀 Features

- **User Authentication**: Sign up, login, and user management
- **Universal Project Support**: React, Next.js, Vue, Svelte, plain HTML/CSS/JS
- **Live Preview**: Real-time project execution using WebContainers
- **Project Management**: Create, upload, and manage your projects
- **Social Features**: Share projects and discover others' work

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Preview Engine**: WebContainers (coming soon)

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd vibeshare
```

### 2. Install dependencies
```bash
npm run install-all
```

### 3. Environment Setup
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vibeshare
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running on your system or use MongoDB Atlas.

### 5. Run the application
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend (port 3000).

## 📁 Project Structure

```
vibeshare/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── ...
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── ...
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile/:id` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🎨 UI Components

- **Navbar**: Navigation with authentication state
- **Auth Forms**: Login and registration forms
- **Dashboard**: User dashboard with project management
- **Home**: Landing page with features and CTA

## 🔧 Development

### Backend Development
```bash
cd server
npm run dev
```

### Frontend Development
```bash
cd client
npm start
```

### Database
The application uses MongoDB with Mongoose for data modeling. Make sure to have MongoDB running locally or update the connection string in your environment variables.

## 🚧 Coming Soon

- **WebContainers Integration**: Browser-based project execution
- **Project Upload**: File upload and project creation
- **Live Preview**: Real-time project preview with hot reload
- **Project Sharing**: Social features and project discovery
- **AI Chat Import**: Import projects from AI conversations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**VibeShare** - Share your AI-generated code with the world! 🚀


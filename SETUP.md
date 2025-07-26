# ImageFlow Setup Guide

This guide will help you set up and run the ImageFlow application locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**

## Quick Setup

1. **Clone the repository**:
   ```bash
   cd capstone
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration:
   ```
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=imageflow
   DB_USER=imageflow_app
   DB_PASSWORD=your_password_here

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_here
   JWT_REFRESH_SECRET=your_refresh_secret_here

   # Server Configuration
   PORT=5000
   CLIENT_URL=http://localhost:3000
   ```

3. **Database Setup**:
   
   Create PostgreSQL database and user:
   ```sql
   CREATE DATABASE imageflow;
   CREATE USER imageflow_app WITH ENCRYPTED PASSWORD 'your_password_here';
   GRANT ALL PRIVILEGES ON DATABASE imageflow TO imageflow_app;
   ```

   Run the schema:
   ```bash
   psql -U imageflow_app -d imageflow -f database/schema.sql
   psql -U imageflow_app -d imageflow -f database/seed.sql
   ```

4. **Install Dependencies**:
   ```bash
   npm run setup
   ```

5. **Start Development Servers**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server on http://localhost:5000
   - Frontend React app on http://localhost:3000

## Individual Component Setup

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

## Testing the Setup

1. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

2. **Test with demo account**:
   - Username: `demouser`
   - Password: `Demo123!`

3. **API Health Check**:
   ```bash
   curl http://localhost:5000/health
   ```

## Development Features Available

### ✅ Completed Features

1. **Project Structure**
   - Full-stack application with separate frontend/backend
   - PostgreSQL database with comprehensive schema
   - Environment configuration and security

2. **Backend Infrastructure**
   - Express.js server with middleware
   - Custom JWT authentication system
   - PostgreSQL integration with custom query builder
   - WebSocket setup for real-time features
   - Comprehensive error handling

3. **Frontend Foundation**
   - React application with routing
   - Authentication context and state management
   - Design system implementation
   - Responsive layout components

4. **Authentication System**
   - User registration and login
   - JWT token management with refresh
   - Protected routes
   - Session management

5. **Database Design**
   - Complete schema for all features
   - User management, image storage, social features
   - Version control, collaboration, and search tables
   - Optimized indexes and views

### 🚧 In Development

The following features have foundations in place but need implementation:

- **Canvas Editor**: HTML5 Canvas-based image editor
- **Image Processing**: Upload and processing pipeline
- **Social Features**: Follow/unfollow, activity feeds
- **Real-time Collaboration**: WebSocket-based editing
- **Search Engine**: Custom search with indexing
- **Version Control**: Git-inspired edit history

## Architecture Overview

```
ImageFlow/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Database and WebSocket config
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API endpoints
│   │   └── server.js       # Main server file
│   └── uploads/            # File storage
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Theme)
│   │   ├── pages/          # Route components
│   │   └── styles/         # CSS and design system
│   └── public/
├── database/               # Database schema and seeds
└── docs/                   # Documentation
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh tokens
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/verify` - Verify token

### Users
- `GET /api/v1/users/:username` - Get user profile
- `PUT /api/v1/users/profile` - Update profile

### Images (planned)
- `POST /api/v1/images/upload` - Upload image
- `GET /api/v1/images/:id` - Get image details

### Canvas (planned)
- `GET /api/v1/canvas/:imageId` - Get canvas state
- `POST /api/v1/canvas/:imageId/layers` - Add layer

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database and user exist

2. **Port Already in Use**:
   - Change PORT in `.env` file
   - Or kill existing process: `lsof -ti:5000 | xargs kill`

3. **CORS Issues**:
   - Verify CLIENT_URL in backend `.env`
   - Check frontend is running on correct port

4. **Authentication Issues**:
   - Verify JWT_SECRET is set in `.env`
   - Clear localStorage in browser
   - Check token expiration

### Reset Database

To reset the database with fresh data:
```bash
psql -U imageflow_app -d imageflow -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql -U imageflow_app -d imageflow -f database/schema.sql
psql -U imageflow_app -d imageflow -f database/seed.sql
```

## Next Steps

1. **Implement Canvas Editor**: Start with basic drawing tools
2. **Add Image Upload**: File handling and processing
3. **Build Social Features**: Follow system and activity feeds
4. **Add Real-time Features**: WebSocket collaboration
5. **Implement Search**: Custom search engine

## Contributing

This is a capstone project demonstrating custom full-stack development. The focus is on implementing features from scratch rather than using third-party services.

## License

MIT License - See LICENSE file for details.
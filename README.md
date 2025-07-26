# ImageFlow

A custom web-based image processing and social platform built entirely from scratch.

## Features

- **Custom Canvas Editor**: Browser-based image editing with layers, filters, and drawing tools
- **Social Platform**: Follow users, share images, and build communities
- **Real-time Collaboration**: Edit images together with live cursors and comments
- **Version Control**: Track edit history with branching and merging capabilities
- **Advanced Search**: Custom search engine with full-text and visual search
- **Image Processing**: Custom algorithms for thumbnails, compression, and analysis

## Architecture

- **Frontend**: React with custom Canvas API implementation
- **Backend**: Node.js/Express with custom middleware and services
- **Database**: PostgreSQL with custom query builders
- **Real-time**: WebSocket with custom operational transformation
- **Processing**: Custom image processing pipeline with Sharp

## Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd imageflow
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install dependencies**:
   ```bash
   npm run setup
   ```

3. **Start development servers**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Development

### Project Structure
```
imageflow/
├── frontend/          # React application
├── backend/           # Express API server
├── database/          # Database schema and migrations
├── docs/             # Documentation
└── design/           # Design documents and assets
```

### Key Components

- **Canvas Editor**: Custom implementation using HTML5 Canvas API
- **Authentication**: JWT-based with refresh token rotation
- **Image Processing**: Custom algorithms for thumbnails and filters
- **Social Graph**: Efficient queries for followers and activity feeds
- **Real-time Sync**: Operational transformation for collaborative editing

## API Documentation

The API follows RESTful principles with custom endpoints:
- Authentication: `/api/v1/auth/*`
- Images: `/api/v1/images/*`
- Users: `/api/v1/users/*`
- Canvas: `/api/v1/canvas/*`
- Social: `/api/v1/social/*`

## License

MIT License - See LICENSE file for details.

## Author

Sinem Eissler - Capstone Project 2025
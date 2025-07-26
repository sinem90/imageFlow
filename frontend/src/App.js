import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UploadPage from './pages/UploadPage';
import EditorPage from './pages/EditorPage';
import GalleryPage from './pages/GalleryPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={
            <Layout>
              <HomePage />
            </Layout>
          } 
        />
        
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        
        <Route 
          path="/register" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterPage />
            )
          } 
        />

        <Route 
          path="/search" 
          element={
            <Layout>
              <SearchPage />
            </Layout>
          } 
        />

        <Route 
          path="/gallery/:username" 
          element={
            <Layout>
              <GalleryPage />
            </Layout>
          } 
        />

        <Route 
          path="/profile/:username" 
          element={
            <Layout>
              <ProfilePage />
            </Layout>
          } 
        />

        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <Layout>
                <UploadPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/editor/:imageId" 
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Catch all route */}
        <Route 
          path="*" 
          element={
            <Layout>
              <NotFoundPage />
            </Layout>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
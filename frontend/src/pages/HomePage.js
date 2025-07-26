import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="heading-1 text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Create, Edit, and Share
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Amazing Images
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            ImageFlow is a powerful web-based image processing platform with real-time collaboration, 
            custom editing tools, and social features. All built from scratch with cutting-edge technology.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
                <Link to="/upload" className="btn btn-secondary btn-lg">
                  Upload Image
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started Free
                </Link>
                <Link to="/search" className="btn btn-secondary btn-lg">
                  Explore Gallery
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="heading-2 text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to create, edit, and share amazing images with your community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="heading-4 font-semibold text-gray-900 mb-2">
              Custom Canvas Editor
            </h3>
            <p className="text-gray-600">
              Professional-grade editing tools built with HTML5 Canvas API. Layers, filters, 
              drawing tools, and more - all in your browser.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="heading-4 font-semibold text-gray-900 mb-2">
              Real-time Collaboration
            </h3>
            <p className="text-gray-600">
              Edit images together with live cursors, comments, and synchronized changes. 
              Perfect for teams and creative partnerships.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="heading-4 font-semibold text-gray-900 mb-2">
              Custom Processing
            </h3>
            <p className="text-gray-600">
              Advanced image processing algorithms built from scratch. Smart thumbnails, 
              color analysis, and optimization - no third-party services.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="heading-4 font-semibold text-gray-900 mb-2">
              Smart Search
            </h3>
            <p className="text-gray-600">
              Find images instantly with our custom search engine. Search by tags, colors, 
              content, or visual similarity.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="heading-4 font-semibold text-gray-900 mb-2">
              Social Platform
            </h3>
            <p className="text-gray-600">
              Follow artists, share your work, and build communities. Like, comment, 
              and discover amazing creativity from around the world.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <h3 className="heading-4 font-semibold text-gray-900 mb-2">
              Version Control
            </h3>
            <p className="text-gray-600">
              Never lose your work with git-inspired version control. Branch, merge, 
              and track every edit with complete history.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="heading-2 text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already using ImageFlow to bring their ideas to life.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Your Free Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
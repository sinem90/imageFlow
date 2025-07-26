import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="heading-1 text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.displayName}!
        </h1>
        <p className="text-gray-600">
          Manage your images, track your progress, and discover new inspiration.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/upload"
          className="card p-6 hover:shadow-lg transition-all duration-200 block"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upload Images</h3>
              <p className="text-sm text-gray-600">Start a new project</p>
            </div>
          </div>
        </Link>

        <Link
          to="/search"
          className="card p-6 hover:shadow-lg transition-all duration-200 block"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Explore Gallery</h3>
              <p className="text-sm text-gray-600">Discover amazing work</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/profile/${user?.username}`}
          className="card p-6 hover:shadow-lg transition-all duration-200 block"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">My Profile</h3>
              <p className="text-sm text-gray-600">View your portfolio</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {user?.imageCount || 0}
          </div>
          <div className="text-sm text-gray-600">Images</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">
            {user?.followerCount || 0}
          </div>
          <div className="text-sm text-gray-600">Followers</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {user?.followingCount || 0}
          </div>
          <div className="text-sm text-gray-600">Following</div>
        </div>

        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-2">
            {user?.totalViews || 0}
          </div>
          <div className="text-sm text-gray-600">Total Views</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Images */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-4 font-semibold text-gray-900">Recent Images</h3>
            <Link to={`/gallery/${user?.username}`} className="text-blue-600 hover:text-blue-500 text-sm">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            <p className="text-gray-500 text-center py-8">
              No images yet. <Link to="/upload" className="text-blue-600 hover:text-blue-500">Upload your first image</Link>
            </p>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-4 font-semibold text-gray-900">Activity Feed</h3>
            <button className="text-blue-600 hover:text-blue-500 text-sm">
              View all
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-gray-500 text-center py-8">
              Follow other users to see their activity here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
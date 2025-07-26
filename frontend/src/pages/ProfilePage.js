import React from 'react';
import { useParams } from 'react-router-dom';

const ProfilePage = () => {
  const { username } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="heading-1">Profile: {username}</h1>
      <p className="body-text">Profile page implementation coming soon...</p>
    </div>
  );
};

export default ProfilePage;
import React from 'react';
import { useParams } from 'react-router-dom';

const GalleryPage = () => {
  const { username } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="heading-1">Gallery: {username}</h1>
      <p className="body-text">Gallery view implementation coming soon...</p>
    </div>
  );
};

export default GalleryPage;
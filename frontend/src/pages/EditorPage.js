import React from 'react';
import { useParams } from 'react-router-dom';

const EditorPage = () => {
  const { imageId } = useParams();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="heading-1 text-white">Canvas Editor</h1>
        <p className="body-text text-gray-300">Editing image: {imageId}</p>
        <p className="body-text text-gray-300">Canvas editor implementation coming soon...</p>
      </div>
    </div>
  );
};

export default EditorPage;
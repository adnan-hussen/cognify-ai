import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import LessonViewer from './LessonViewer';

const MenuModal = ({ onClose }) => {
  const { instance } = useMsal();

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="menu-modal-overlay" onClick={onClose}>
      <div className="menu-modal-content" onClick={e => e.stopPropagation()}>
        <div className="menu-items">
          <button className="menu-item">
            <i className="bi bi-star-fill me-2"></i>
            Get Premium
          </button>
          <button className="menu-item text-danger">
            <i className="bi bi-trash-fill me-2"></i>
            Delete Account
          </button>
          <div className="menu-divider"></div>
          <button 
            className="menu-item"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const FileUploadInterface = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLesson, setShowLesson] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files?.length) {
      setFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files?.length) {
      setFile(files[0]);
    }
  };

  const handleStartSession = () => {
    setShowLesson(true);
  };

  if (showLesson) {
    return (
      <>
        <button 
          className="menu-button"
          onClick={() => setShowMenu(true)}
          aria-label="Menu"
        >
          <i className="bi bi-list"></i>
        </button>
        <LessonViewer />
        {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
      </>
    );
  }

  return (
    <div className="chat-container">
      <button 
        className="menu-button"
        onClick={() => setShowMenu(true)}
        aria-label="Menu"
      >
        <i className="bi bi-list"></i>
      </button>

      <div className="upload-content">
        <div 
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p>Paste your text or upload a file.</p>
          
          <label className="upload-icon">
            <input
              type="file"
              className="hidden-input"
              onChange={handleFileInput}
              accept="text/*,.pdf,.doc,.docx"
            />
            <i className="bi bi-cloud-upload"></i>
          </label>
          {file && (
            <p className="mt-3">Selected file: {file.name}</p>
          )}
        </div>

        <button
          className="btn-custom"
          id="start-button"
          onClick={handleStartSession}
        >
          Start Session
        </button>
      </div>

      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
    </div>
  );
};

export default FileUploadInterface;
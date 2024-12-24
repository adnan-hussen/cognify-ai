import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useMsal } from '@azure/msal-react';
import LessonViewer from './LessonViewer';

// Menu Modal Component
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

// Helper function to request fullscreen
const requestFullscreen = (element) => {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

const FileUploadInterface = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files?.length) {
      setFile(files[0]);
    }
  }, []);

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files?.length) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    requestFullscreen(document.documentElement);
    
    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const { data } = await axios.post('http://localhost:5000/analyze-and-generate', 
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (data.error) {
        console.error('Server returned an error:', data.error);
        alert(`Error: ${data.error}`);
      } else {
        setLesson(data.lesson);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred while uploading the file. Please try again.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  if (lesson) {
    return <LessonViewer lesson={lesson} />;
  }

  return (
    <div className="chat-container">
      {/* Menu Button */}
      <button 
        className="menu-button"
        onClick={() => setShowMenu(true)}
        aria-label="Menu"
      >
        <i className="bi bi-list"></i>
      </button>

      <div className="upload-content">
        {/* Upload Area */}
        <div 
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p>Drag and drop your study material here or click to upload</p>
          <p className="file-types"></p>
          
          {file ? (
            <div className="file-preview">
              <i className="bi bi-file-earmark-text"></i>
              <span>{file.name}</span>
              <button 
                className="remove-file"
                onClick={() => setFile(null)}
                aria-label="Remove file"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          ) : (
            <label className="upload-icon">
              <input
                type="file"
                className="hidden-input"
                onChange={handleFileInput}
                accept=".pdf,.docx,.doc,.ppt,.pptx,.txt,.xlsx,.jpg,.png,.html"
              />
              <i className="bi bi-cloud-upload"></i>
            </label>
          )}

          {isLoading && (
            <div className="upload-progress">
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <span>{uploadProgress}% uploaded</span>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          className="btn-custom"
          id="start-button"
          onClick={handleUpload}
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <>
              <i className="bi bi-hourglass-split me-2"></i>
              Generating Lesson...
            </>
          ) : (
            'Start Studying'
          )}
        </button>
      </div>

      {/* Menu Modal */}
      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
    </div>
  );
};

export default FileUploadInterface;
import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useMsal } from '@azure/msal-react';
import LessonViewer from './LessonViewer';
import ThemeToggle from './ThemeToggle';

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
            <i className="bi bi-star-fill"></i>
            Get Premium
          </button>
          <button className="menu-item">
            <i className="bi bi-gear-fill"></i>
            Settings
          </button>
          <button className="menu-item">
            <i className="bi bi-question-circle-fill"></i>
            Help & Support
          </button>
          <button className="menu-item text-danger">
            <i className="bi bi-trash-fill"></i>
            Delete Account
          </button>
          <div className="menu-divider"></div>
          <button 
            className="menu-item"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
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
  const [lesson, setLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

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

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: 'bi-file-pdf',
      doc: 'bi-file-word',
      docx: 'bi-file-word',
      ppt: 'bi-file-ppt',
      pptx: 'bi-file-ppt',
      txt: 'bi-file-text',
      xlsx: 'bi-file-excel',
      jpg: 'bi-file-image',
      png: 'bi-file-image',
      html: 'bi-file-code'
    };
    return iconMap[extension] || 'bi-file-earmark';
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    setUploadProgress(0);
    setUploadStatus('Uploading file...');

    try {
      const response = await axios.post('http://localhost:5000/analyze-and-generate', 
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            if (percentCompleted === 100) {
              setUploadStatus('Generating personalized lesson...');
            }
          },
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setLesson(response.data.lesson);
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus('Error occurred. Please try again.');
      setTimeout(() => setUploadStatus(''), 3000);
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
      <div className="upload-background">
        <div className="bg-pattern"></div>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Menu Button */}
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
          <h2 className="upload-h2">Upload Your Study Material</h2>
          <p>Drag and drop your file here, or click to browse</p>
          
          {file ? (
            <div className="file-preview">
              <i className={`bi ${getFileIcon(file.name)}`}></i>
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
              <span>{uploadStatus || `${uploadProgress}% uploaded`}</span>
            </div>
          )}
        </div>

        <button
          className="btn-custom"
          id="start-button"
          onClick={handleUpload}
          disabled={!file || isLoading}
        >
          {isLoading ? (
            <>
              <i className="bi bi-hourglass-split"></i>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="bi bi-lightning-charge"></i>
              <span>Start Learning</span>
            </>
          )}
        </button>
      </div>

      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
    </div>
  );
};

export default FileUploadInterface;
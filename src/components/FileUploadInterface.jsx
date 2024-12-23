import React, { useState } from 'react';
import axios from 'axios';
import LessonViewer from './LessonViewer';

// Helper function to request fullscreen
function requestFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) { /* Firefox */
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) { /* IE/Edge */
    element.msRequestFullscreen();
  }
}

const FileUploadInterface = () => {
  const [file, setFile] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileInput = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert('Please upload a file.');

    // Attempt fullscreen as soon as the user clicks
    requestFullscreen(document.documentElement);

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const { data } = await axios.post(
        'http://localhost:5000/analyze-and-generate',
        formData
      );

      if (data.error) {
        console.error('Server returned an error:', data.error);
        alert(`Error: ${data.error}`);
      } else {
        // data.lesson contains the validated lesson JSON
        setLesson(data.lesson);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (lesson) {
    return <LessonViewer lesson={lesson} />;
  }

  return (
    <div className="upload-container">
      <input type="file" onChange={handleFileInput} accept=".pdf,.docx,.txt" />
      <button onClick={handleUpload} disabled={!file || isLoading}>
        {isLoading ? 'Processing...' : 'Upload and Generate Lesson'}
      </button>
    </div>
  );
};

export default FileUploadInterface;

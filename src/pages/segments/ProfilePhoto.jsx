import React, { useState, useRef } from 'react';

function ProfilePhoto({ nextStep, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('assets/img/male.svg');
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file.');
        setSelectedFile(null);
        setPreviewUrl('assets/img/male.svg'); // Reset to default on error
        return;
      }

      setUploadError(null);
      setSelectedFile(file);
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };

      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl('assets/img/male.svg'); // Reset to default on cancel
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      setIsUploading(true);
      if (onUpload) {
        onUpload(selectedFile, 1, 0, 'Photo', 'Photo', (success) => {
          setIsUploading(false);
          if (success) {
            setSelectedFile(null);
            setPreviewUrl('assets/img/male.svg');
            nextStep();
          }
        });
      } else {
        console.log('No onUpload prop provided. File:', selectedFile);
        setIsUploading(false);
      }
    } else {
      console.log('No file selected.');
      setIsUploading(false);
    }
  };

  const handleCardClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="container mt-4" id="main-content">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card adminuiux-card overflow-hidden mb-4">
            <div className="card-body text-center">
              <div
                  className="card adminuiux-card text-center bg-gradient-5 mb-4"
                  onClick={handleCardClick}
                  style={{ cursor: 'pointer' }}
              >
                  <div className="card-body">
                      {isUploading ? (
                          <img
                          src="assets/img/uploading.gif"
                          alt="Loading..."
                          style={{ height: '100px' }}
                          />
                      ) : (
                          <>
                          <input
                              type="file"
                              onChange={handleFileChange}
                              ref={fileInputRef}
                              style={{ display: 'none' }}
                              accept="image/*"
                          />
                          {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                          {previewUrl && (
                              <div>
                                  <div className="d-inline-block position-relative w-auto mx-auto my-3">
                                      <figure className="avatar avatar-150 coverimg rounded-circle" style={{ backgroundImage: `url('${previewUrl}')` }}>
                                          <img src={previewUrl} alt style={{display: 'none'}} />
                                      </figure>
                                      <div className="position-absolute bottom-0 end-0 z-index-1 h-auto">
                                          <button className="btn btn-lg btn-theme btn-square">
                                              <i className="bi bi-upload" />
                                          </button> 
                                          <input type="file" className="d-none" />
                                      </div>
                                  </div>
                              </div>
                          )}
                          </>
                      )}
                  </div>
              </div>
              <h4>Selfie / Passport Size Photo</h4>
              <p>
                  Click on the avatar above to upload a passport size photo. The face should be well-lit and visible without obstructions.
              </p>
              {selectedFile && (
                  <button
                  onClick={handleUpload}
                  className="btn btn-theme btn-lg"
                  disabled={!selectedFile || isUploading}
                  >
                  {isUploading ? 'Uploading...please wait' : 'Upload Photo'}
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePhoto;
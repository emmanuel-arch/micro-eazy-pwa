import React, { useState, useEffect, useRef } from 'react';

function ProfileID({ nextStep, photoType, photoRef, passportPhoto, idFrontPhoto, idBackPhoto, onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('assets/img/male.svg');
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [numericPhotoType, setNumericPhotoType] = useState(null);
  const [numericPhotoRef, setNumericPhotoRef] = useState(null);

  useEffect(() => {    
    console.log("Updating preview for photoType:", photoType);
    const numericPhotoRef = Number(photoRef);
    setNumericPhotoRef(numericPhotoRef);
    const numericPhotoType = Number(photoType);
    setNumericPhotoType(numericPhotoType);
    switch (numericPhotoType) {
      case 1:
        setPreviewUrl('assets/img/id_front.png');
        break;
      case 2:
        setPreviewUrl('assets/img/id_back.png');
        break;
      case 3:
        setPreviewUrl('assets/img/id_passport.png');
        break;
      default:
        setPreviewUrl('assets/img/male.svg'); // Default if needed
        break;
    }
  }, [photoType]);

  const switchPhotoType = (newPhotoType) => {
    if(newPhotoType===1){ ///switch to id front
      if(idFrontPhoto){ ///id front set - go to id back
        newPhotoType=newPhotoType+1;

        switchPhotoType(newPhotoType);
      }else{ ///display id front form
        setNumericPhotoType(newPhotoType);
      }
    }

    if(newPhotoType===2){///switch to id back
      if(idBackPhoto){ ///id front set - exit
        nextStep();
      }else{ ///display id back form
        setNumericPhotoType(newPhotoType);
      }
    }

    if(newPhotoType===3){///switch to passport
      if(passportPhoto){ ///passport set - exit
        nextStep();
      }else{ ///display passport form
        setNumericPhotoType(newPhotoType);
      }
    }
  }


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
        onUpload(selectedFile, numericPhotoType+1, 0,'ID','ID', (success) => {
          setIsUploading(false);
          if (success) {
            setSelectedFile(null);
            switch (numericPhotoType) {
              case 1:
                setPreviewUrl('assets/img/id_front.png');
                break;
              case 2:
                setPreviewUrl('assets/img/id_back.png');
                break;
              case 3:
                setPreviewUrl('assets/img/id_passport.png');
                break;
              default:
                setPreviewUrl('assets/img/attachment.jpg'); // Default if needed
                break;
            }
            // if photo saved is passport, exit
            if(numericPhotoType===3){
              nextStep();
            }
            // if photo saved is id back, exit
            if(numericPhotoType===2){
              nextStep();
            }
            // if photo saved is id front, request back
            if(numericPhotoType===1){
              switchPhotoType(2);
            }
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

  const renderTemplate = () =>{
    console.log("photo Type",numericPhotoType);
    switch(numericPhotoType){
      case 1:
          ///console.log("photo Ref",photoType);
          return (<>
            <h4>National ID - Front Photo</h4>
            <p>Upload clear photo of the front side of your national ID card. Make sure all details are visible.</p>
            {numericPhotoRef===3  && !isUploading &&
              <button
              onClick={() => switchPhotoType(3)}
              className="btn btn-theme btn-lg"
              ><i className="bi bi-arrow-left mr-3" /> Use Passport
            </button>}
          </>)
      case 2:
        ///console.log("photo Ref 2",photoType);
        return (<>
          <h4>National ID - Back Photo</h4>
          <p>Upload clear photo of the back side of your national ID card. Make sure all details are visible.</p>
        </>)
      case 3:
        ///console.log("photo Ref 3",photoType);
        return(<>
          <h4>Passport Photo</h4>
          <p>Upload clear photo of your passport. Make sure all details are visible.</p>
          {numericPhotoRef===3  && !isUploading &&
            <button
            onClick={() => switchPhotoType(1)}
            className="btn btn-theme btn-lg"
            >Use National ID <i className="bi bi-arrow-right ml-3" />
          </button>}
        </>)
      default:
        console.log("photo Ref",numericPhotoType);
        return null;
    }
  }

  const renderPreview = () => {
    return (
      <figure className="avatar preview-150 coverimg rounded" style={{ backgroundImage: `url('${previewUrl}')` }}>
        <img src={previewUrl} alt="" style={{ display: 'none' }} />
      </figure>
    );
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
                                        {renderPreview()}
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
                {renderTemplate()}
                {/* {numericPhotoRef===3 && numericPhotoType===3 &&
                <>
                  <button
                    onClick={setNumericPhotoType(1)}
                    className="btn btn-theme btn-lg"
                    >SKIP
                  </button>
                </>} */}
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

export default ProfileID;
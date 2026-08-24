import React, { useState, useEffect, useRef } from 'react';

// type AttachmentLocation = {
//     latitude: number | null;
//     longitude: number | null;
// };

function ProfileAttachments({ nextStep, profileOptions, onUpload }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentFormIndex, setCurrentFormIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('assets/img/attachment.jpg');
    const [formData, setFormData] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);
    const [fileInfo, setFileInfo] = useState(null);

    if (!profileOptions || !profileOptions.borrowerAttachments) {
        return <div className="container mt-4">No borrower attachments available.</div>;
    }

    const borrowerAttachments = profileOptions.borrowerAttachments;

    const handleNextForm = (success) => {
        if (success) {
            setCurrentFormIndex((prevIndex) => prevIndex + 1);
            setFormData({});
            setFileInfo(null);
        }
    };

    const handlePreviousForm = () => {
        setCurrentFormIndex((prevIndex) => prevIndex - 1);
        setFormData({});
        setFileInfo(null);
    };

    let currentForm = null;

    if (currentFormIndex < borrowerAttachments.length) {
        currentForm = borrowerAttachments[currentFormIndex];

        if (profileOptions.attachedFiles && profileOptions.attachedFiles.includes(currentForm.ID)) {
            console.log("Skip this form if it's in filledData");
            handleNextForm(true);
            return null;
        }
    } else {
        nextStep();
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            const allowedFileTypes = currentForm.FileTypes.split(',');
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

            if (!allowedFileTypes.includes(fileExtension)) {
                setUploadError(`Please select a file with one of the following extensions: ${allowedFileTypes.join(', ')}`);
                setSelectedFile(null);
                setPreviewUrl('assets/img/attachment.jpg');
                setFileInfo(null);
                return;
            }

            setUploadError(null);
            setSelectedFile(file);
            const reader = new FileReader();

            reader.onloadend = () => {
                if (file.type.startsWith('image/')) {
                    setPreviewUrl(reader.result);
                    setFileInfo(null);
                } else {
                    setPreviewUrl('assets/img/attachment.jpg'); // Default file icon
                    setFileInfo({
                        name: file.name,
                        type: file.type.split('/').pop(), // Extract the last part of the type
                        size: file.size,
                    });
                }
            };

            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreviewUrl('assets/img/attachment.jpg');
            setFileInfo(null);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            setIsUploading(true);
            setLoading(true);
            if (onUpload) {
                onUpload(selectedFile, 0, currentForm.ID, currentForm.AttachmentName, currentForm.AttachmentDescription, (success) => {
                    setIsUploading(false);
                    setLoading(false);
                    if (success) {
                        setSelectedFile(null);
                        setPreviewUrl('assets/img/attachment.jpg');
                        handleNextForm(true);
                        setFileInfo(null);
                    }
                });
            } else {
                console.log('No onUpload prop provided. File:', selectedFile);
                setIsUploading(false);
                setLoading(false);
            }
        } else {
            console.log('No file selected.');
            setIsUploading(false);
            setLoading(false);
        }
    };

    const handleCardClick = () => {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    };

    return (
        <div className="container mt-4" id="main-content">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card adminuiux-card overflow-hidden mb-4">
                        <div className="card-body">
                            <div
                                className="card adminuiux-card text-center bg-gradient-5 mb-4"
                                onClick={handleCardClick}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="card-body">
                                    {loading ? (
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
                                                accept={currentForm.FileTypes}
                                            />
                                            {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                                            {previewUrl && (
                                                <div>
                                                    <div className="d-inline-block position-relative w-auto mx-auto my-3">
                                                        <figure className="avatar preview-150 coverimg rounded" style={{ backgroundImage: `url('${previewUrl}')` }}>
                                                            <img src={previewUrl} alt style={{ display: 'none' }} />
                                                        </figure>
                                                        {fileInfo && (
                                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                                                                <p>{fileInfo.name}</p>
                                                                <p>{fileInfo.type}</p>
                                                                <p>{(fileInfo.size / 1024).toFixed(2)} KB</p>
                                                            </div>
                                                        )}
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
                            <h4>{currentForm.AttachmentName}</h4>
                            <p>{currentForm.AttachmentDescription}</p>
                            {selectedFile && (
                                <button
                                    onClick={handleUpload}
                                    className="btn btn-theme btn-lg"
                                    disabled={!selectedFile || loading}
                                >
                                    {loading ? 'Uploading...please wait' : 'Upload File'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileAttachments;
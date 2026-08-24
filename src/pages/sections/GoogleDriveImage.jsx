import React, { useState, useEffect } from 'react';

function GoogleDriveImage({ fileId, preview,alt,styling }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://drive.google.com/uc?id=${fileId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch image from Google Drive.');
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchImage();
    }

    return () => { // Cleanup function
      if(imageUrl){
        URL.revokeObjectURL(imageUrl); // Release the object URL
      }
    };
  }, [fileId]);

  if (loading) {
    return <img src={preview} alt="Loading..." className={styling} />;
  }

  if (error) {
    return <img src={preview} alt="Failed..." className={styling} />;
  }

  return (
    <>
      {imageUrl && <img src={imageUrl} alt={alt} className={styling} />}
    </>
  );
}

export default GoogleDriveImage;
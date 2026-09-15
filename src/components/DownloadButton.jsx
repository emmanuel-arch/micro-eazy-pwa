import { useEffect, useState } from 'react';

const DownloadButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event fired');
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
        } else {
          console.log('[PWA] User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowButton(false);
      });
    }
  };

  if (!showButton) return null;

  return (
    <div
        className="alert alert-success d-flex align-items-center mb-0"
        role="alert"
        style={{
          position: 'fixed',
          zIndex: '1020',
          margin: 15,
          bottom: 15,
          right: 15, // Added to align to the bottom-right
        }}
      >
        <div>
            Install application for better experience.
        </div>
        <button
        onClick={handleInstall}
        className="btn btn-success"
        >
        Install <i className="bi bi-box-arrow-down ml-2"></i>
        </button>
    </div>
  );
};

export default DownloadButton;
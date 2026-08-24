import React, { useState, useEffect } from 'react';

function PWAInstallAlert() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    console.log("Check installation status:::");

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAlert(true); // Show alert when install prompt is available
      console.log("beforeinstallprompt event fired");
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowAlert(false); // Hide alert if app is installed
      console.log("appinstalled event fired");
    };

    const checkAppInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        setIsAppInstalled(true);
        setShowAlert(false);
        console.log("Status::: Installed");
      } else {
        console.log("Status::: Not Installed");
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    checkAppInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []); // Empty dependency array

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowAlert(false); // Hide alert after user interaction
      });
    }
  };

  if (isAppInstalled) {
    return null; // Don't show anything if the app is already installed
  }

  if (!showAlert) {
    return null; // Don't show anything if alert should not be shown.
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: '#f0f0f0',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
      }}
    >
      <p>Install our app for a better experience!</p>
      <button onClick={handleInstallClick}>Install</button>
    </div>
  );
}

export default PWAInstallAlert;
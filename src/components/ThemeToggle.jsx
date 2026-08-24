import React, { useState, useEffect } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css'; // Import Bootstrap Icons

function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if(storedTheme === 'dark'){
            setIsDarkMode(true);
        }
    },[]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <button
      className="btn btn-link btn-square btnsunmoon btn-link-header"
      id="btn-layout-modes-dark-page"
      onClick={toggleTheme}
    >
      {isDarkMode ? (
        <i className="sun mx-auto bi bi-sun" />
      ) : (
        <i className="moon mx-auto bi bi-moon" />
      )}
    </button>
  );
}

export default ThemeToggle;
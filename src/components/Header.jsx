import React, {useEffect,useState} from "react";
import { Link, useNavigate } from "react-router-dom";

import PWAInstallAlert from "./PWAInstallAlert";
import DownloadButton from "./DownloadButton";
// import ThemeToggle from "./ThemeToggle";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Header = ({ userSession, logout }) => {
    const navigate = useNavigate();
    const [fullname, setName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountPhoto, setAccountPhoto] = useState("");
    const [borrowerPhotoUrl, setBorrowerPhotoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        // Load alerts from localStorage
        const storedAlerts = localStorage.getItem("alerts");
        if (storedAlerts) {
            try {
                const parsed = JSON.parse(storedAlerts);
                // If your alerts are in an array property, adjust accordingly
                setAlerts(Array.isArray(parsed) ? parsed : parsed.Table || []);
            } catch {
                setAlerts([]);
            }
        }
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
        document.body.classList.toggle('sidebar-open', !isSidebarOpen);
        document.body.classList.toggle('sidebar-close', isSidebarOpen);
    };

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if(storedTheme === 'dark'){
            setIsDarkMode(true);
        }

        const session = localStorage.getItem("session");
        if (session) {
            const parsedSession = JSON.parse(session);
            setName(parsedSession.fullname);
            setAccountNumber(parsedSession?.accountNumber);
        }

        
        const storedAccountPhoto = localStorage.getItem('account_photo');
        if(storedAccountPhoto){
            setAccountPhoto(storedAccountPhoto);
            fetchImage(storedAccountPhoto);
        }
    },[]);

    const fetchImage = async (fileId) => {
        try {
          const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/api/app/ViewImage?fileid=${fileId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch image from Google Drive.');
          }
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);

          setBorrowerPhotoUrl(objectUrl);
        } catch (err) {
          //setError(err);
        } finally {
          ///setLoading(false);
        }
    };

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
    
    useEffect(() => {
        // Simulating loading delay
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timeout);
    });

    const handleLogout = () => {
        logout();
        navigate("/"); // Redirect to login page after logout
    };

    useEffect(() => {
        const handleScroll = () => {
          const header = document.querySelector('.adminuiux-header');
          if (window.scrollY > 30) {
            header?.classList.add('active');
          } else {
            header?.classList.remove('active');
          }
        };
    
        window.addEventListener('scroll', handleScroll);
    
        return () => {
          window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <>
            {isLoading &&
                <div className="pageloader">
                    <div className="container h-100">
                        <div className="row justify-content-center align-items-center text-center h-100">
                            <div className="col-12 mb-auto pt-4" />
                            <div className="col-auto">
                                <img src="icon.png" alt="Service Suite Cloud" className="height-60 mb-3" />
                                <p className="h6 mb-0">Service Suite Cloud</p>
                                <p className="h3 mb-4">Customer Portal</p>
                                <div className="loader10 mb-2 mx-auto" />
                            </div>
                            <div className="col-12 mt-auto pb-4">
                                <p className="text-secondary">Please wait...</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
            <header className="adminuiux-header">
                <nav className="navbar navbar-expand-lg fixed-top">
                    <div className="container-fluid">
                        <a className="navbar-brand" href="#">
                            <img data-bs-img="light" src="logo.png" alt="Service Suite Cloud" /> 
                            <img data-bs-img="dark" src="logo_light.png" alt="Service Suite Cloud" />
                        </a>
                        <div className="collapse navbar-collapse right-in-device justify-content-center" id="header-navbar">
                            {/* <ul className="navbar-nav mx-lg-3 mb-2 mb-md-0">
                                <li className="nav-item"><a className="nav-link" href="investment-dashboard.html">Dashboard</a></li>
                                <li className="nav-item"><a className="nav-link" href="investment-portfolio.html">Portfolio</a></li>
                                <li className="nav-item"><a className="nav-link" href="investment-transaction.html">Transaction</a></li>
                                <li className="nav-item"><a className="nav-link" href="investment-blogs.html">News</a></li>
                            </ul> */}
                        </div>
                        <div className="ms-auto">
                            <button className="btn btn-link btn-square btn-link-header" id="btn-layout-modes-dark-page" onClick={toggleTheme}>
                                {isDarkMode ? (
                                    <i className="sun mx-auto bi bi-sun" />
                                ) : (
                                    <i className="moon mx-auto bi bi-moon" />
                                )}
                            </button>
                            {/* <ThemeToggle/> */}
                            <div className="dropdown d-inline-block">
                                <button className="btn btn-link btn-square btn-icon btn-link-header dropdown-toggle no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i className="bi bi-bell" />
                                    {alerts && alerts.length > 0 && (
                                        <span className="position-absolute top-0 end-0 badge rounded-pill bg-danger p-1" style={{"max-width":"20px"}}>
                                            <small>{alerts.length > 5 ? "5+" : alerts.length}</small>
                                            <span className="visually-hidden">unread messages</span>
                                        </span>
                                    )}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end notification-dd sm-mi-95px">
                                    {alerts && alerts.length > 0 ? (
                                        alerts.slice(0, 5).map((alert, idx) => (
                                            <li key={idx}>
                                                <Link className="dropdown-item p-2" to="/updates">
                                                    <div className="row gx-3">
                                                        <div className="col-auto">
                                                            <figure className="avatar avatar-40 rounded-circle bg-pink">
                                                                <i className="bi bi-bell text-white" />
                                                            </figure>
                                                        </div>
                                                        <div className="col">
                                                            <p className="mb-2 small">{alert.fcmTitle || "Notification"}</p>
                                                            <span className="row">
                                                                <span className="col">
                                                                    <span className="badge badge-light rounded-pill text-bg-warning small">
                                                                        {alert.fcmBody || ""}
                                                                    </span>
                                                                </span>
                                                                <span className="col-auto small opacity-75">
                                                                    {alert.DateSend ? new Date(alert.DateSend).toLocaleTimeString() : ""}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-center text-secondary p-2">No notifications</li>
                                    )}
                                    <li className="text-center">
                                        <Link className="btn btn-link text-center" to="/updates">
                                            View all <i className="bi bi-arrow-right fs-14" />
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="dropdown d-inline-block">
                                <a className="dropdown-toggle btn btn-link btn-square btn-link-header style-none no-caret px-0" id="userprofiledd" data-bs-toggle="dropdown" aria-expanded="false" role="button">
                                    <div className="row gx-0 d-inline-flex">
                                        <div className="col-auto align-self-center">
                                            {borrowerPhotoUrl ? (
                                                <figure className="avatar avatar-28 rounded-circle coverimg align-middle" style={{"backgroundImage":`url(${borrowerPhotoUrl})`}}>
                                                    <img src={`${borrowerPhotoUrl}`} alt="Name" id="userphotoonboarding2" />
                                                </figure>
                                            ):(
                                                <figure className="avatar avatar-28 rounded-circle coverimg align-middle" style={{"backgroundImage":"url(assets/img/male.svg)"}}>
                                                    <img src="assets/img/male.svg" alt="Name" id="userphotoonboarding2" />
                                                </figure>
                                            )}
                                            
                                        </div>
                                    </div>
                                </a>
                                <div className="dropdown-menu dropdown-menu-end width-300 pt-0 px-0 sm-mi-45px" aria-labelledby="userprofiledd">
                                    <div className="bg-theme-1-space rounded py-3 mb-3 dropdown-dontclose">
                                        <div className="row gx-0">
                                            <div className="col-auto px-3">
                                                <figure className="avatar avatar-50 rounded-circle coverimg align-middle" style={{"backgroundImage":"url(assets/img/male.svg)"}}>
                                                    <img src="assets/img/male.svg"  alt="Name" />
                                                </figure>
                                            </div>
                                            <div className="col align-self-center">
                                                <p className="mb-1"><span>{fullname}</span></p>
                                                <p><small className="opacity-50"><i className="bi bi-wallet2 me-2" />  {accountNumber}</small></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <div>
                                            <Link className="dropdown-item" to="/profile">
                                            <i className="bi bi-person-circle me-2" /> My Profile
                                            </Link>
                                        </div>
                                        {/* <div>
                                            <a className="dropdown-item" href="investment-earning.html"><i data-feather="dollar-sign" className="avatar avatar-18 me-1" /> Earning</a>
                                        </div> */}
                                        <div>
                                            <Link className="dropdown-item" to="/settings">
                                                <i data-feather="settings" className="avatar avatar-18 me-1" /> Change Password
                                            </Link>
                                        </div>
                                        <div>
                                            <a className="dropdown-item theme-red" href="#" onClick={handleLogout}>
                                                <i data-feather="power" className="avatar avatar-18 me-1" /> Logout
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="navbar-toggler btn btn-link btn-link-header btn-square btn-icon" type="button" onClick={toggleSidebar}>
                                <i data-feather="grid" className="closebtn" />
                            </button>
                        </div>
                    </div>
                </nav>
            </header>
        </>
    );
}

export default Header;
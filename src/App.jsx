import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import { onMessage } from 'firebase/messaging';
import { messaging } from './firebase';
import DownloadButton from "./components/DownloadButton";

import Header from './components/Header';
import Footer from './components/Footer';
import SideBar from './components/SideBar';
import Login from './pages/Login';
import Password from './pages/Password';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Loans from './pages/Loans';
import Ledger from './pages/Ledger';
import Calculator from './pages/Calculator';
import LoanApplication from './pages/LoanApplication';
import Loan from './pages/Loan';
import Profile from './pages/Profile';
import Statement from './pages/Statement';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';
import Updates from './pages/Updates';

const App = () => {
  const [userSession, setUserSession] = useState(null);
  const entityId = "3002";

  useEffect(() => {
    const session = localStorage.getItem("session");
    if (session) {
      const parsedSession = JSON.parse(session);
      setUserSession(null);
      // Check if the session has expired
      if (Date.now() > parsedSession.expiry) {
        localStorage.removeItem("session");
        setUserSession(null);
      } else {
        setUserSession(parsedSession);

        // Set a timeout to log the user out when the session expires
        const timeRemaining = parsedSession.expiry - Date.now();
        const expiryTimeout = setTimeout(() => {
          localStorage.removeItem("session");
          setUserSession(null);
        }, timeRemaining);

        return () => clearTimeout(expiryTimeout); // Clear timeout on component unmount
      }
    }
  }, []);

  useEffect(() => {
    const fetchEntityCinfigurations = async () => {
        try {
            const response = await fetch(
                "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/EntityCinfigurations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        phoneNumber: "",
                        entityId: parseInt(entityId),
                        requestFlag: 0,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();

                console.log("Entity Data: ",data);
                
                const EntityCinfigurationData = {
                  EntityId: entityId,
                  EntityName: data.EntityName,
                  primaryColor: data.primaryColor,
                  secondaryColor: data.secondaryColor,
                  driveFolder: data.ggDriveFolder,
                  PrimaryLogo: data.PrimaryLogo,
                  lightLogo: data.lightLogo,
                  logoIcon: data.logoIcon,
                };
                localStorage.setItem("configuration", JSON.stringify(EntityCinfigurationData));
            } else {
                console.error("Failed to fetch entity settings");
            }
        } catch (error) {
            console.error("Error fetching entity settings:", error);
        }
    };

    if (entityId) {
      fetchEntityCinfigurations();
    }
  }, [entityId]);

  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log('📥 Foreground message received:', payload);

      // Optional: Show native browser notification
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/service-suite-cloud-192.png'
        });
      }

      // ✅ Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch((e) => console.warn('Audio play blocked:', e));
    });
  }, []);

  const logout = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("account_info");
    localStorage.removeItem("account_photo");
    setUserSession(null);
  };

  const checkAlerts = async () => {
    try {
      const session = localStorage.getItem("session");
      if (!session) return;
      const sessionData = JSON.parse(session);
      const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/GetAlerts`, {
            method: 'POST',
            headers: {
                accept: 'text/plain',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData.userId),
        });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("alerts", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error checking alerts:", error);
    }
  };

  useEffect(() => {
    checkAlerts(); // Initial check on mount
    const interval = setInterval(checkAlerts, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [userSession]);

  return (
    <Router>
      <DownloadButton/>
      {userSession ? (
        <>
          <Header userSession={userSession} logout={logout} />
          <div className="adminuiux-wrap">
            <SideBar logout={logout}/>
            <main className="adminuiux-content has-sidebar" style={{"paddingTop":"70px"}}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard logout={logout}/></PrivateRoute>} />
                <Route path="/loans" element={<PrivateRoute><Loans logout={logout} /></PrivateRoute>} />
                <Route path="/ledger" element={<PrivateRoute><Ledger logout={logout} /></PrivateRoute>} />
                <Route path="/calculator" element={<PrivateRoute><Calculator logout={logout} /></PrivateRoute>} />
                <Route path="/application" element={<PrivateRoute><LoanApplication logout={logout} /></PrivateRoute>} />
                <Route path="/loan/:loanId" element={<PrivateRoute><Loan logout={logout} /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile logout={logout} /></PrivateRoute>} />
                <Route path="/statement" element={<PrivateRoute><Statement logout={logout} /></PrivateRoute>} />
                <Route path="/contacts" element={<PrivateRoute><Contacts logout={logout} /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings logout={logout} /></PrivateRoute>} />
                <Route path="/updates" element={<PrivateRoute><Updates logout={logout} /></PrivateRoute>} />
              </Routes>
            </main>
          </div>
          <Footer />
        </>
      ) : (
        <Routes>
          <Route path="/" element={<Login setUserSession={setUserSession} />} />
          <Route path="/password" element={<Password setUserSession={setUserSession} />} />
          <Route path="/register" element={<Register setUserSession={setUserSession} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
};

export default App;
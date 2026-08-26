import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
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
import Welcome from './pages/Welcome';
import Crunch from './pages/eco/Crunch';
import Pay from './pages/eco/Pay';
import Ratiba from './pages/eco/Ratiba';
import Why from './pages/eco/Why';
import Ladder from './pages/eco/Ladder';
import Exposure from './pages/eco/Exposure';
import Consent from './pages/eco/Consent';
import Preview from './pages/eco/Preview';

/**
 * The preview harness is mounted only in development, or when a build is made
 * with VITE_PREVIEW=1. A production build evaluates this to false and Rollup
 * removes the routes and the component with it — there is no hidden URL.
 */
const PREVIEW = import.meta.env.DEV || import.meta.env.VITE_PREVIEW === '1';
import { loadTenant, applyTenantTheme, cachedTenant, ENTITY_ID } from './lib/tenant';

/**
 * Has this browser been through the ecosystem door yet?
 *
 * The Micro Eazy welcome is an INTRODUCTION, not a gate: it is shown once, and
 * a customer who has already installed the app and signed in should never see
 * it again. Kept in localStorage rather than in the session so it survives
 * signing out, which is when a returning customer would find it most annoying.
 */
const WELCOMED_KEY = 'eazy_welcomed';
const hasBeenWelcomed = () => {
  try {
    return localStorage.getItem(WELCOMED_KEY) === '1';
  } catch {
    return false; // private mode — show it, it is only one tap
  }
};

/**
 * The ecosystem door, with somewhere to go.
 *
 * A separate component because it needs `useNavigate`, and App itself renders
 * the <Router> — a hook cannot reach a context its own component provides. This
 * is also the single place that decides where "Get started" lands, which is the
 * property that keeps the old self-referential loop from returning.
 */
function WelcomeRoute({ tenant, onDone }) {
  const navigate = useNavigate();
  return (
    <Welcome
      tenant={tenant}
      onContinue={() => {
        onDone();
        navigate('/login', { replace: true });
      }}
    />
  );
}

const App = () => {
  const [userSession, setUserSession] = useState(null);
  const [tenant, setTenant] = useState(cachedTenant);
  const [welcomed, setWelcomed] = useState(hasBeenWelcomed);
  const entityId = ENTITY_ID;

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

  // Resolve the lender behind this deployment and repaint the app in their
  // colours.
  //
  // The version of this effect that lived here read "data.EntityName" straight
  // off the response. EntityCinfigurations answers a JSON **array**, so every
  // field it cached was undefined and the tenant theme never applied — the
  // app has been running on the template's default palette. lib/tenant.js
  // unwraps the array, keeps the legacy localStorage shape the other pages read,
  // and falls back to ecosystem branding when a lender's row is blank.
  useEffect(() => {
    let cancelled = false;
    loadTenant().then((t) => {
      if (cancelled) return;
      setTenant(t);
      applyTenantTheme(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  /**
   * Remember that this browser has been introduced to the ecosystem.
   *
   * Deliberately NOT cleared by logout(): signing out is exactly when a
   * returning customer would be most irritated to be shown the intro again.
   */
  const markWelcomed = () => {
    try {
      localStorage.setItem(WELCOMED_KEY, '1');
    } catch {
      /* private mode — they will see the intro again, which is survivable */
    }
    setWelcomed(true);
  };

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
      {/* The floating install banner is suppressed on the ecosystem door, which
          carries its own install button. Both listen for `beforeinstallprompt`
          and both call preventDefault() on it, so showing them together put two
          competing install prompts on the first screen a customer ever sees —
          and the banner sat on top of the lender-of-record line. */}
      {welcomed && <DownloadButton/>}
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
                <Route path="/crunch" element={<PrivateRoute><Crunch tenant={tenant} /></PrivateRoute>} />
                <Route path="/pay" element={<PrivateRoute><Pay tenant={tenant} /></PrivateRoute>} />
                <Route path="/auto-repay" element={<PrivateRoute><Ratiba tenant={tenant} /></PrivateRoute>} />
                <Route path="/why" element={<PrivateRoute><Why tenant={tenant} /></PrivateRoute>} />
                <Route path="/limit" element={<PrivateRoute><Ladder tenant={tenant} /></PrivateRoute>} />
                <Route path="/credit-file" element={<PrivateRoute><Exposure tenant={tenant} /></PrivateRoute>} />
                <Route path="/permissions" element={<PrivateRoute><Consent tenant={tenant} /></PrivateRoute>} />
                {PREVIEW && <Route path="/preview" element={<Preview />} />}
                {PREVIEW && <Route path="/preview/crunch" element={<Preview mode="crunch" />} />}
          {PREVIEW && <Route path="/preview/screen" element={<Preview mode="screen" />} />}
              </Routes>
            </main>
          </div>
          <Footer />
        </>
      ) : (
        // ── THE APEX, IN TWO STEPS ──────────────────────────────────────────
        // A customer who has never been here meets Micro Eazy first — the
        // ecosystem, its promise and the install — and only then their own
        // lender's sign-in, in that lender's colours. Every visit after the
        // first goes straight to the lender.
        //
        // `enterApp` is the ONLY thing the welcome screen is given to navigate
        // with, which is what keeps the old bug from coming back: the previous
        // landing page linked its call to action at "/", and "/" rendered the
        // landing page, so the button looped to itself and nobody could get
        // past it. There is no href here to point at the wrong place.
        <Routes>
          <Route
            path="/"
            element={
              welcomed ? (
                <Login setUserSession={setUserSession} tenant={tenant} />
              ) : (
                <WelcomeRoute tenant={tenant} onDone={markWelcomed} />
              )
            }
          />
          {/* Reachable on purpose: "how does this look to a new customer?" is a
              question that gets asked in a demo, and clearing localStorage on a
              projector is not the answer. */}
          <Route path="/welcome" element={<WelcomeRoute tenant={tenant} onDone={markWelcomed} />} />
          <Route path="/login" element={<Login setUserSession={setUserSession} tenant={tenant} />} />
          <Route path="/password" element={<Password setUserSession={setUserSession} tenant={tenant} />} />
          <Route path="/register" element={<Register setUserSession={setUserSession} />} />
          {PREVIEW && <Route path="/preview" element={<Preview />} />}
          {PREVIEW && <Route path="/preview/crunch" element={<Preview mode="crunch" />} />}
          {PREVIEW && <Route path="/preview/screen" element={<Preview mode="screen" />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </Router>
  );
};

export default App;
import React, { useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import feather from 'feather-icons';

const SideBar = ({ logout }) => {
  useEffect(() => {
    feather.replace();
  }, []);

  const handleLinkClick = () => {
    console.log("Screen Width: "+window.innerWidth);
    if (window.innerWidth < 1000 && document.body.classList.contains('sidebar-open')) {
      document.body.classList.remove('sidebar-open');
      document.body.classList.add('sidebar-close');
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate("/"); // Redirect to login page after logout
  };

  return (
    <div className="adminuiux-sidebar" style={{ paddingTop: "70px" }}>
      <div className="adminuiux-sidebar-inner">
        <ul className="nav flex-column menu-active-line">
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-columns-gap" />{" "}
              <span className="menu-name">Dashboard</span>
            </Link>
          </li>
          {/* <li className="nav-item">
            <Link to="/" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-wallet" />{" "}
              <span className="menu-name">Perfomance</span>
            </Link>
          </li> */}
          {/* <li className="nav-item">
            <Link to="/calculator" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-calculator" />{" "}
              <span className="menu-name">Calculator</span>
            </Link>
          </li> */}
          <li className="nav-item">
            <Link to="/application" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-node-plus" />{" "}
              <span className="menu-name">New Loan</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/loans" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-bank" />{" "}
              <span className="menu-name">My Loans</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/statement" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-bar-chart-line" />{" "}
              <span className="menu-name">Statement</span>
            </Link>
          </li>

          {/* ── The ecosystem screens ────────────────────────────────────────
              Everything else in this menu is Micromart's core banking. These
              five are what the ecosystem adds on top. They are grouped rather
              than interleaved because they authenticate differently: the first
              one a customer opens asks for an SMS code, and that is less
              surprising when the group is visibly its own thing. */}
          <li className="nav-item">
            <Link to="/pay" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-phone" />{" "}
              <span className="menu-name">Pay by M-PESA</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/auto-repay" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-arrow-repeat" />{" "}
              <span className="menu-name">Auto-repay</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/crunch" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-file-earmark-bar-graph" />{" "}
              <span className="menu-name">Statement crunch</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/why" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-eye" />{" "}
              <span className="menu-name">Why this decision</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/limit" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-graph-up-arrow" />{" "}
              <span className="menu-name">Your limit</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/credit-report" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-file-earmark-text" />{" "}
              <span className="menu-name">Get a CRB report</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/credit-file" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-clipboard-data" />{" "}
              <span className="menu-name">Your credit file</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/permissions" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-shield-check" />{" "}
              <span className="menu-name">Permissions</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/ledger" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-calculator" />{" "}
              <span className="menu-name">Ledger</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-person-bounding-box" />{" "}
              <span className="menu-name">Profile</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/contacts" className="nav-link" onClick={handleLinkClick}>
              <i className="menu-icon bi bi-headset" />{" "}
              <span className="menu-name">Support</span>
            </Link>
          </li>
        </ul>
        <div className="mt-auto" />
        <div className="px-3 mb-3 not-iconic">
          <h6 className="mb-3 fw-medium">Quick Links</h6>
          <div className="card adminuiux-card">
            <div className="card-body p-2">
              <div className="row gx-2">
                <div className="col-12 d-flex justify-content-between">
                  <Link to="/contacts" className="btn btn-square btn-link theme-red" onClick={handleLinkClick}>
                    <span className="position-relative">
                      <i data-feather="help-circle" />
                    </span>
                  </Link>
                  <Link to="/ledger" className="btn btn-square btn-link" onClick={handleLinkClick}>
                    <span className="position-relative">
                      <i data-feather="bar-chart-2" />
                    </span>
                  </Link>
                  <Link to="/settings" className="btn btn-square btn-link" onClick={handleLinkClick}>
                    <i data-feather="settings" />
                  </Link>
                  <Link to="/" className="btn btn-square btn-link" onClick={handleLogout}>
                    <i data-feather="log-out" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
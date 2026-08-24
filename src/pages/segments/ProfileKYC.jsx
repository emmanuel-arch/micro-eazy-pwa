import React from 'react';
import { Link, useNavigate } from "react-router-dom";

function ProfileKYC({ nextStep, profileOptions }) {
  return (
    <div className="container mt-4" id="main-content">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card adminuiux-card overflow-hidden mb-4">
            <div className="card-body text-center">
              <div className="card adminuiux-card text-center bg-gradient-5 mb-4">
                <div className="card-body">
                  <span className="avatar avatar-100 bg-theme-1-subtle rounded text-theme-1 my-3 my-lg-4">
                    <i className="h1 bi bi-person-vcard"></i>
                  </span>
                </div>
              </div>
              <h4>Start your KYC Verification</h4>
              <p>
                To protect against fraudulent activity, all participants will be required to complete identity verification (KYC/AML).
              </p>
              <p className="text-secondary small">
                You will have to submit your necessary documents to verify your identity. Please keep your identity proof and address proof handy and make sure your camera is working fine before proceeding with this.
              </p>
              <button onClick={nextStep} className="btn btn-theme btn-lg">
                Let's Start KYC <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
          {/* <div className="text-center mb-4">
            <p>If you have any queries. feel free to connect with us at info@adminuiux.coms.</p>
            <a href="investment-help-center.html">Need more help?</a>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ProfileKYC;
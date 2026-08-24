import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Settings (){
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState("");
    // const [account, setAccount] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setconfirmPassword] = useState("");
    const navigate = useNavigate();
    const [hidePassword, setHidePassword] = useState(true);
    const [hideNewPassword, setHideNewPassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const entityId = "3002";
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loginSuccess, setLoginSuccess] = useState("");

    useEffect(() => {
        // Simulating loading delay
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timeout);
    });

    const passwordSwitcher = (e) => {
        e.preventDefault();
    
        if(hidePassword){
            setHidePassword(false);
        }else{
            setHidePassword(true);
        }
    };

    const newPasswordSwitcher = (e) => {
        e.preventDefault();
    
        if(hideNewPassword){
            setHideNewPassword(false);
        }else{
            setHideNewPassword(true);
        }
    };

    const confirmPasswordSwitcher = (e) => {
        e.preventDefault();
    
        if(hideConfirmPassword){
            setHideConfirmPassword(false);
        }else{
            setHideConfirmPassword(true);
        }
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginSuccess("");

        // Validate new password and confirm password match
        if (newPassword !== confirmPassword) {
            setLoginError("New password and confirm password do not match.");
            return;
        }

        setLoggingIn(true);

        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);

        console.log("Session Data: ", sessionData);

        try {
            const response = await fetch(
                "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/ChangePassword",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${sessionData.token}`
                    },
                    body: JSON.stringify({
                        AccountNumber: sessionData.accountNumber,
                        Password: currentPassword,
                        NewPassword: newPassword,
                        EntityID: parseInt(entityId),
                    }),
                }
            );
                         
            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                sessionData.token = newToken;
                localStorage.setItem('session', JSON.stringify(sessionData));
            }

            if (response.ok) {
                setLoginSuccess("Password changes successfully.");
                setLoggingIn(false);
            } else {
                try {
                    const errorData = await response.json();
                    if (errorData) {
                        setLoginSuccess("");
                        setLoginError(errorData.message);
                    } else {
                        setLoginSuccess("");
                        setLoginError("Login failed, invalid information provided.");
                    }
                } catch (parseError) {
                        setLoginSuccess("");
                    setLoginError("Login failed, try again.");
                }
                setLoggingIn(false);
                ///console.error("Login failed");
                ///alert(response.text() || "Login failed, Invalid credentials.");
            }
        } catch (error) {
            setLoggingIn(false);
            setLoginSuccess("");
            ///console.error("Login failed:", error);
            setLoginError("Login failed, Try again later.");
        }
    };
  
    return (
    <>
        <div className="h-100 py-3 px-3">
            <form onSubmit={handleSubmit} className="row h-100 align-items-center justify-content-center">
                <div className="col-11 col-sm-8 col-md-11 col-xl-11 col-xxl-10 login-box">
                    <div className="text-center mb-4">
                        <h1 className="mb-3">Change Password</h1>
                        {/* <p className="text-secondary">Login to your account</p> */}
                    </div>

                    <div className="position-relative">
                        <div className="form-floating mb-3">
                            <input type={hidePassword?'password':'text'}  className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" required/>
                            <label htmlFor="checkstrength">Current Password</label>
                        </div>
                        <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={passwordSwitcher}>
                            {hidePassword? <i className="bi bi-eye" />:<i className="bi bi-eye-slash" />}
                        </button>
                    </div>

                    <div className="position-relative">
                        <div className="form-floating mb-3">
                            <input type={hideNewPassword?'password':'text'}  className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required/>
                            <label htmlFor="checkstrength">New Password</label>
                        </div>
                        <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={newPasswordSwitcher}>
                            {hideNewPassword? <i className="bi bi-eye" />:<i className="bi bi-eye-slash" />}
                        </button>
                    </div>
                    
                    <div className="position-relative">
                        <div className="form-floating mb-3">
                            <input type={hideConfirmPassword?'password':'text'}  className="form-control" value={confirmPassword} onChange={(e) => setconfirmPassword(e.target.value)} placeholder="Confirm new password" required/>
                            <label htmlFor="checkstrength">Confirm Password</label>
                        </div>
                        <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={confirmPasswordSwitcher}>
                            {hideConfirmPassword? <i className="bi bi-eye" />:<i className="bi bi-eye-slash" />}
                        </button>
                    </div>

                    {loginError && <div className="alert alert-danger my-3">{loginError}</div>}
                    {loginSuccess && <div className="alert alert-success my-3">{loginSuccess}</div>}
                    {loggingIn?
                    <>
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3 height-150 mb-3 text-center">
                            <div className="loader10 mb-3 mx-auto " />
                        </div>
                    </>
                    :
                    <>
                        <button type="submit" className="btn btn-lg btn-theme w-100 mb-4">SAVE</button>
                    </>}
                </div>
            </form>
        </div>
    </>
    );
};
  
export default Settings;  
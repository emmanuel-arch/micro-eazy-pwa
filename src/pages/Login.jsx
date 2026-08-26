import React, { useEffect, useState } from "react";
import { ENTITY_ID } from '../lib/tenant';
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import IntroSlider from '../components/IntroSlider';

const Login = ({ setUserSession, tenant }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [hidePassword, setHidePassword] = useState(true);
    const entityId = ENTITY_ID;
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState("");

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
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoggingIn(true);
        try {
            const response = await fetch(
                "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/Login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        AccountNumber: account,
                        password: password,
                        entityId: parseInt(entityId),
                    }),
                }
            );

            if (response.ok) {
                const response_data = await response.json();

                const dummySessionData = {
                    userId: response_data.borrowerId,
                    accountNumber: response_data.accountNo,
                    name: response_data.firstName,
                    fullname: response_data.firstName+' '+response_data.otherName,
                    token: response_data.token,
                    role: "borrower",
                    expiry: Date.now() + 60 * 60 * 24000,
                };
            
                // Save session data in localStorage
                localStorage.setItem("session", JSON.stringify(dummySessionData));
                setUserSession(dummySessionData); // Update state

                setLoginError("");
                setLoggingIn(false);
            
                // Redirect to Dashboard
                navigate("/dashboard");
            } else {
                try {
                    const errorData = await response.json();
                    if (errorData) {
                        setLoginError(errorData.message);
                    } else {
                        setLoginError("Login failed, invalid information provided.");
                    }
                } catch (parseError) {
                    setLoginError("Login failed, try again.");
                }
                setLoggingIn(false);
                ///console.error("Login failed");
                ///alert(response.text() || "Login failed, Invalid credentials.");
            }
        } catch (error) {
            setLoggingIn(false);
            ///console.error("Login failed:", error);
            setLoginError("Login failed, Try again later.");
        }
    };
  
    return (
    <>
        {isLoading &&
            <div className="pageloader">
                <div className="container h-100">
                    <div className="row justify-content-center align-items-center text-center h-100">
                        <div className="col-12 mb-auto pt-4" />
                        <div className="col-auto">
                            <img src="icon.png" alt="Service Suite Cloud" className="height-60 mb-3" />
                            <p className="h6 mb-0">{(tenant?.name || '').toUpperCase()}</p>
                            <p className="h3 mb-4">{tenant?.tagline || ''}</p>
                            <div className="loader10 mb-2 mx-auto" />
                        </div>
                        <div className="col-12 mt-auto pb-4">
                            <p className="text-secondary">Wait a second...</p>
                        </div>
                    </div>
                </div>
            </div>
        }
        
        <main className="flex-shrink-0 pt-0 h-100">
            <div className="container-fluid">
                <div className="auth-wrapper">
                    <div className="row">
                        <div className="col-12 col-md-6 col-xl-4 minvheight-100 d-flex flex-column px-0">
                            <header className="adminuiux-header">
                                <nav className="navbar">
                                    <div className="container-fluid">
                                        <a className="navbar-brand" href="#">
                                            <img data-bs-img="light" src="icon.png" alt="Service Suite Cloud" /> 
                                            <img data-bs-img="dark" src="icon_light.png" alt="Service Suite Cloud" />
                                            <div>
                                                <span className="h4">{tenant?.name || ''}</span>
                                                <p className="company-tagline">{tenant?.tagline || ''}</p>
                                            </div>
                                        </a>
                                        <div className="ms-auto" />
                                        <div className="ms-auto" />
                                    </div>
                                </nav>
                            </header>
                            <div className="h-100 py-3 px-3">
                                <form onSubmit={handleSubmit} className="row h-100 align-items-center justify-content-center">
                                    <div className="col-11 col-sm-8 col-md-11 col-xl-11 col-xxl-10 login-box">
                                        <div className="text-center mb-4">
                                            <h1 className="mb-3">Welcome Back</h1>
                                            <p className="text-secondary">Login to your account</p>
                                        </div>
                                        <div className="form-floating mb-4">
                                            <input type="tel" className="form-control" id="account-no" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Enter phone number" required/> 
                                            <label htmlFor="account-no">Phone Number</label>
                                        </div>
                                        <div className="position-relative">
                                            <div className="form-floating mb-1">
                                                <input type={hidePassword?'password':'text'}  className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required/>
                                                <label htmlFor="checkstrength">Password</label>
                                            </div>
                                            <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={passwordSwitcher}>
                                                {hidePassword? <i className="bi bi-eye" />:<i className="bi bi-eye-slash" />}
                                            </button>
                                        </div>
                                        {loginError && <div className="alert alert-danger my-3">{loginError}</div>}
                                        {loggingIn?
                                        <>
                                            <div className="col-12 col-sm-6 col-md-4 col-lg-3 height-150 mb-3 text-center">
                                                <div className="loader10 mb-3 mx-auto " />
                                            </div>
                                        </>
                                        :
                                        <>
                                            <div className="d-flex jusify-content-between mt-1 mb-3">
                                                <span className="flex-grow-1">Forgot password?</span> <a href="/password">Reset Here</a>.
                                            </div>
                                            <button type="submit" className="btn btn-lg btn-theme w-100 mb-4">Sign In</button>
                                            <div className="text-center mt-3">
                                                Don't have account? <a href="/register">Create Account</a> here.
                                            </div>
                                        </>}
                                    </div>
                                </form>
                            </div>
                            <footer className="adminuiux-footer mt-auto">
                                <div className="container-fluid text-center">
                                    <span className="small">© {new Date().getFullYear()} {tenant?.name || ''} · Powered by Micro Eazy</span>
                                </div>
                            </footer>
                        </div>
                        <div className="col-12 col-md-6 col-xl-8 p-4 d-none d-md-block">
                            <IntroSlider tenant={tenant} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </>
    );
};
  
export default Login;  
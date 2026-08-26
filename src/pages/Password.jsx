import React, { useEffect, useState } from "react";
import { ENTITY_ID } from '../lib/tenant';
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import IntroSlider from '../components/IntroSlider';

const Password = ({ setUserSession, tenant }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [hidePassword, setHidePassword] = useState(true);
    const entityId = ENTITY_ID;
    const [loggingIn, setLoggingIn] = useState(false);
    const [reset, setReset] = useState(false);

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

        setLoggingIn(true);
        try {
            const response = await fetch(
                "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/ResetPassword",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        AccountNumber: account,
                        password: account,
                        entityId: parseInt(entityId),
                    }),
                }
            );

            if (response.ok) {
                // Redirect to Login
                // navigate("/login");
                setReset(true);
                setLoggingIn(false);
            } else {
                setLoggingIn(false);
                console.error("Password reset failed");
            }
        } catch (error) {
            setLoggingIn(false);
            console.error("Password reset failed:", error);
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
                            <p className="h6 mb-0">MICROMART AFRICA LTD</p>
                            <p className="h3 mb-4">Exceeding The Incredible</p>
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
                                                <span className="h4">Micromart <b>Africa</b> LTD</span>
                                                <p className="company-tagline">Exceeding The Incredible</p>
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
                                            <h1 className="mb-3">Reset Password</h1>
                                            <p className="text-secondary">Enter your Phone number, a temporary password will be sent to you via SMS</p>
                                        </div>
                                        <div className="form-floating mb-4">
                                            <input type="tel" className="form-control" id="account-no" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Enter phone number" required/> 
                                            <label htmlFor="account-no">Phone Number</label>
                                        </div>
                                        {/* <div className="position-relative">
                                            <div className="form-floating mb-4">
                                                <input type={hidePassword?'password':'text'}  className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required/>
                                                <label htmlFor="checkstrength">Password</label>
                                            </div>
                                            <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={passwordSwitcher}>
                                                {hidePassword? <i className="bi bi-eye" />:<i className="bi bi-eye-slash" />}
                                            </button>
                                        </div> */}
                                        {reset ?
                                            <div className="alert alert-success text-center" role="alert">
                                                <h4 className="alert-heading">Password Reset Successful!</h4>
                                                <p>Login to your account with the password sent to your phone number, remember to change password after login.</p>
                                                <a href="/login">Login Here.</a>
                                            </div>
                                        :
                                            <>
                                                {loggingIn?
                                                <>
                                                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 height-150 mb-3 text-center">
                                                        <div className="loader10 mb-3 mx-auto " />
                                                    </div>
                                                </>
                                                :
                                                <>
                                                    <button type="submit" className="btn btn-lg btn-theme w-100 mb-4">Reset Now</button>
                                                    <div className="text-center mt-3">
                                                        Already have password? <a href="/login">Login</a> Here.
                                                    </div>
                                                </>}
                                            </>
                                        }
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
                            <IntroSlider/>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </>
    );
};
  
export default Password;  
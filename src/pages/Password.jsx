import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import IntroSlider from '../components/IntroSlider';
import { resetPasswordAcrossBooks } from "../lib/signin";
import { SUPPORT_PHONE } from "../lib/entity";

const Password = ({ setUserSession }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [hidePassword, setHidePassword] = useState(true);
    // Was `const entityId = "3002"`, so a Micromart Fintech customer asking for
    // a reset was told nothing had gone wrong and never received a message.
    // resetPasswordAcrossBooks() walks the books in order and stops at the
    // first that answers — one reset, one SMS. See src/lib/signin.js.
    const [loggingIn, setLoggingIn] = useState(false);
    const [reset, setReset] = useState(false);
    const [resetError, setResetError] = useState("");

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
        setResetError("");
        try {
            const result = await resetPasswordAcrossBooks(account);

            if (result.kind === "ok") {
                setReset(true);
                setLoggingIn(false);
                return;
            }

            // The screen used to log these to the console and leave the customer
            // staring at a spinner that had stopped. Say what happened.
            setResetError(
                result.kind === "unreachable"
                    ? "We could not reach Micromart just now. Please check your connection and try again."
                    : result.kind === "referred"
                    ? `This number is registered with ${result.name}. Please contact Micromart customer support on ${SUPPORT_PHONE}.`
                    : result.kind === "several"
                    ? `More than one account uses this phone number. Please contact Micromart customer support on ${SUPPORT_PHONE}.`
                    : result.kind === "not-registered"
                    ? "There is no Micromart Fintech account for this phone number. Go back and create your account."
                    : `We could not reset that account. Please check the number, or contact customer support on ${SUPPORT_PHONE}.`
            );
            setLoggingIn(false);
        } catch {
            setLoggingIn(false);
            setResetError("Password reset failed. Please try again.");
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
                                        {resetError && <div className="alert alert-danger my-3">{resetError}</div>}
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
                                    <span className="small">Copyright @2025, <a href="https://techcrast.co.ke" target="_blank">TechCrast Software Solutions LTD</a></span>
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
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import IntroSlider from '../components/IntroSlider';
import { signInAcrossBooks } from "../lib/signin";
import { writeSession, setConfigurationEntity } from "../lib/session";
import { SUPPORT_PHONE } from "../lib/entity";

const Login = ({ setUserSession }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [hidePassword, setHidePassword] = useState(true);
    // No entity here any more. WHICH BOOK this customer is on is discovered by
    // signInAcrossBooks() and stored on the session — see src/lib/signin.js.
    // This screen used to carry `const entityId = "3002"`, never importing
    // lib/entity at all, which is why every Micromart Fintech customer was
    // refused regardless of what VITE_ENTITY_ID said.
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
            // The phone number is placed on a book FIRST (Micromart's GetEntity),
            // so each refusal below says the true reason — see src/lib/signin.js.
            const result = await signInAcrossBooks(account, password);

            if (result.kind === "several") {
                setLoginError(
                    `More than one account uses this phone number, so we cannot sign you in safely. `
                    + `Please contact Micromart customer support on ${SUPPORT_PHONE}.`
                );
                setLoggingIn(false);
                return;
            }

            if (result.kind === "unreachable") {
                // NOT "no such account". Saying that to a real customer whose
                // signal dropped invites them to register a second time, and a
                // duplicate account is the thing all of this is cleaning up.
                setLoginError("We could not reach Micromart just now. Please check your connection and try again.");
                setLoggingIn(false);
                return;
            }

            if (result.kind === "referred") {
                // A real customer of a book this app does not serve (Micromart
                // Africa). No session, and never "create an account" — that
                // would open a duplicate on Fintech.
                setLoginError(
                    `This number is registered with ${result.name}. `
                    + `Please contact Micromart customer support on ${SUPPORT_PHONE}.`
                );
                setLoggingIn(false);
                return;
            }

            if (result.kind === "not-registered") {
                setLoginError("There is no Micromart Fintech account for this phone number. Create your account below — it starts with a scan of your ID.");
                setLoggingIn(false);
                return;
            }

            if (result.kind === "bad-password") {
                setLoginError("The password is incorrect. If you have forgotten it, use Reset Here below.");
                setLoggingIn(false);
                return;
            }

            const response_data = result.data;

            const dummySessionData = {
                userId: response_data.borrowerId,
                accountNumber: response_data.accountNo,
                name: response_data.firstName,
                fullname: response_data.firstName+' '+response_data.otherName,
                token: response_data.token,
                role: "borrower",
                // THE FIELD THAT MAKES ONE BUILD SERVE BOTH BOOKS. Every
                // authenticated call reads it back through activeEntityId().
                entityId: result.entityId,
                expiry: Date.now() + 60 * 60 * 24000,
            };

            writeSession(dummySessionData);
            // Before navigating: the screens that read their entity from the
            // cached config must not still be holding the pre-login default.
            setConfigurationEntity(result.entityId);
            setUserSession(dummySessionData); // Update state

            setLoginError("");
            setLoggingIn(false);

            // Redirect to Dashboard
            navigate("/dashboard");
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
                                                Don't have account? <Link to="/register">Create Account</Link> here.
                                            </div>
                                        </>}
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
  
export default Login;  
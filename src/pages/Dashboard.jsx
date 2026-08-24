import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopLoans from "./sections/TopLoans";
import { requestPermission } from '../notificationPermission';

const Dashboard = ({logout}) => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [userId, setuserId] = useState("");
    const [AccountData, setAccountData] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const session = localStorage.getItem("session");
        if (session) {
            const parsedSession = JSON.parse(session);
            setName(parsedSession.name);
            setuserId(parsedSession?.userId);

            if (!localStorage.getItem('fcm_permission_requested')) {
                requestPermission();
                localStorage.setItem('fcm_permission_requested', 'true');
            }
        }

        fetchAccountData("1").then(()=>{
          setIsLoading(false);
        });
    }, [userId]);

    const fetchAccountData = async (origin) => {
        console.log("Request Origin",origin);
    
        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);
    
        if(sessionData.userId){
            try {
                const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/AccountPreview`, {
                    method: 'POST',
                    headers: {
                    accept: 'text/plain',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionData.token}`
                    },
                    // body: JSON.stringify(sessionData.userId),
                });

                console.log("Response Status: ", response.status);

                if (response.status === 401) {
                    console.log("Logging out");
                    // Unauthorized, redirect to login
                    logout();
                    navigate("/");
                    return;
                }else{
                    const newToken = response.headers.get('X-New-Token');
                    if (newToken) {
                        sessionData.token = newToken;
                        localStorage.setItem('session', JSON.stringify(sessionData));
                    }
        
                    if (response.ok) {
                        const data = await response.json();
                        ///console.log("Account Data: ",data)
                        localStorage.setItem("account_info", JSON.stringify(data));
                        localStorage.setItem("account_photo", data?.Table[0]?.borrowerPhoto);
                        setAccountData(data);
                    } else {
                        console.error("Failed to fetch onboarding settings");
                    }
                }
            } catch (error) {
                ///console.error("Error fetching onboarding settings:", error);
                console.log("Logging out");
                // Unauthorized, redirect to login
                logout();
                navigate("/");
            }
        }
    };
    
    function getGreeting() {
        const now = new Date();
        const hour = now.getHours();
      
        if (hour >= 5 && hour < 12) {
          return "Good Morning,";
        } else if (hour >= 12 && hour < 17) {
          return "Good Afternoon,";
        } else if (hour >= 17 && hour < 22) {
          return "Good Evening,";
        } else {
          return "Hello,"; // Covers hours 22-4 (or 10PM to 4AM)
        }
    }

    const greeting = getGreeting();

    return (
        <div className="container mt-4" id="main-content">
            <div className="row align-items-center">
                <div className="col-12 col-lg-8 mb-4">
                    <div className="card adminuiux-card">
                        <div className="card-body z-index-1">
                            <div className="row">
                                <div className="col mb-4">
                                    <h3 className="fw-normal mb-0 text-secondary">{greeting}</h3>
                                    <h1>{name}</h1>
                                </div>
                                <div className="col-auto d-flex align-items-start">
                                    {isLoading?
                                    <><div className="loader1 mb-2 mx-auto" /></>
                                    :
                                    <>
                                        {AccountData && Number(AccountData?.Table[0]?.CreditScore)>0?
                                            <div className="badge badge-light text-bg-success"><i className="bi bi-person-circle my-3"></i> {AccountData?.Table[0]?.CreditScore} POINTS</div>
                                        :
                                            <div className="badge badge-light text-bg-danger"><i className="bi bi-person-circle my-3"></i> 0.00 POINTS</div>}
                                    </>}
                                </div>
                            </div>
                            <div className="row mt-4">
                                <div className="col mb-4 mb-md-0">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between">
                                                <div>
                                                    <p className="text-secondary mb-2">Loan Limit</p>
                                                    <h4 className="fw-medium mb-0">{isLoading?<><div className="loader1 mb-2 mx-auto" /></>:<>{AccountData && AccountData?.Table[0]?.LoanLimitFormated}</>}</h4>
                                                </div>
                                                <div className="avatar avatar-60 bg-theme-1-subtle text-theme-1 rounded">
                                                    <i className="bi bi-cash-coin h4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between">
                                                <div>
                                                    <div className="text-secondary mb-2">Active Loan: {isLoading?<><div className="loader1 mb-2 mx-auto" /></>:<>{AccountData && AccountData?.Table1[0]?.Loans}</>}</div>
                                                    <h4 className="fw-medium mb-0">{isLoading?<><div className="loader1 mb-2 mx-auto" /></>:<>{AccountData && AccountData?.Table1[0]?.LoanAmount}</>}</h4>
                                                </div>
                                                <div className="avatar avatar-60 bg-theme-1-subtle text-theme-1 rounded">
                                                    <i className="bi bi-bank h4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-4">
                    <div className="row">
                        <div className="col-6 mb-4">
                            <Link to="/application" className="card adminuiux-card style-none text-center h-100">
                                <div className="card-body py-4">
                                    <i className="avatar avatar-40 text-theme-1 h3 bi bi-plus-square mb-2" />
                                    <p className="text-secondary small">New Loan</p>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 mb-4">
                            <Link to="/loans" className="card adminuiux-card style-none text-center h-100">
                                <div className="card-body py-4">
                                    <i className="avatar avatar-40 text-theme-1 h3 bi bi-credit-card mb-2" />
                                    <p className="text-secondary small">Repay Loan</p>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 mb-4">
                            <Link to="/statement" className="card adminuiux-card style-none text-center h-100">
                                <div className="card-body py-4">
                                    <i className="avatar avatar-40 text-theme-1 h3 bi bi-card-list mb-2" />
                                    <p className="text-secondary small">Statement</p>
                                </div>
                            </Link>
                        </div>
                        <div className="col-6 mb-4">
                            <Link to="/updates" className="card adminuiux-card style-none text-center h-100">
                                <div className="card-body py-4">
                                    <i className="avatar avatar-40 text-theme-1 h3 bi bi-bell mb-2" />
                                    <p className="text-secondary small">Updates</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <TopLoans/>
            {/* <div className="row">
                <div className="col-12 col-md-6 col-lg-6 mb-4">
                    <TopTransactions/>
                </div>
                <div className="col-12 col-md-6 col-lg-6 mb-4">
                    <TopActivity/>
                </div>
            </div> */}
        </div>
    );
};

export default Dashboard;

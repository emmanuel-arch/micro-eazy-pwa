import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Link, useNavigate } from "react-router-dom";
import { Navigation, Pagination } from 'swiper/modules';
import Terms from './Terms';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const LoanApplication = ({logout}) => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [loanApplicationProducts, setLoanApplicationProducts] = useState(null);
    const [selectedLoanProduct, setSelectedLoanProduct] = useState(null);
    const swiperRef = useRef(null);
    const [AccountData, setAccountData] = useState("");
    const [newLoanAmount, setNewLoanAmount] = useState('');
    const [newLoanSchedule, setNewLoanSchedule] = useState(null);
    const [minPrincipalWarning, setMinPrincipalWarning] = useState(false);
    const [maxPrincipalWarning, setMaxPrincipalWarning] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [applicationSuccess, setApplicationSuccess] = useState(null);
    const [submittingLoan, setSubmittingLoan] = useState(false);
    const [topUpChargeWaitError, setTopUpChargeError] = useState(null);
    const [topUpChargeWait, setTopUpChargeWait] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState("");
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showStkModal, setShowStkModal] = useState(false);
    const [stkAmount, setStkAmount] = useState(0);
    const [stkFormatedAmount, setStkFormatedAmount] = useState(0);
    const [stkPhoneNumber, setStkPhoneNumber] = useState("");
    const [stkPrompt, setStkPrompt] = useState("");
    const [stkPrompted, setStkPrompted] = useState(false);
    const [stkWait, setStkWait] = useState(false);

    useEffect(() => {
        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);
        console.log("Calculator Session Data: ", sessionData);
        setUserId(sessionData?.userId);

        if (sessionData?.userId) {
            getLoanProducts();
            fetchAccountData();
        }
    }, []);

    const fetchAccountData = async () => {
        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);
    
        if(sessionData.userId){
          try {
            const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/LoanApplicationPreview`, {
                method: 'POST',
                headers: {
                    accept: 'text/plain',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionData.token}`
                },
                // body: JSON.stringify(sessionData.userId),
            });

            if (response.status === 401) {
                console.log("Logging out");
                // Unauthorized, redirect to login
                logout();
                navigate("/");
                return;
            }else{
                if (response.ok) {
                    const newToken = response.headers.get('X-New-Token');
                    if (newToken) {
                        sessionData.token = newToken;
                        localStorage.setItem('session', JSON.stringify(sessionData));
                    }
                    
                    const data = await response.json();
                    console.log("Account Data: ",data)
                    setAccountData(data);
                } else {
                    console.error("Failed to fetch onboarding settings");
                }
            }
          } catch (error) {
              console.error("Error fetching onboarding settings:", error);
          }
        }
    };

    const getLoanProducts = async () => {
        const storedConfigurationData = localStorage.getItem('configuration');
        const configurationDataJson = JSON.parse(storedConfigurationData);

        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);

        if (sessionData?.userId && configurationDataJson?.EntityId) {
            try {
                const response = await fetch("https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/AvailableLoanProducts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${sessionData.token}`
                    },
                    body: JSON.stringify({
                        PhoneNumber: `${sessionData.userId}`,
                        EntityId: parseInt(sessionData.userId),
                        RequestFlag: 0,
                    }),
                });

                if (response.status === 401) {
                    console.log("Logging out");
                    // Unauthorized, redirect to login
                    logout();
                    navigate("/");
                    return;
                }else{
                    if (response.ok) {
                        const newToken = response.headers.get('X-New-Token');
                        if (newToken) {
                            sessionData.token = newToken;
                            localStorage.setItem('session', JSON.stringify(sessionData));
                        }

                        const data = await response.json();
                        console.log("Loan Products", data);
                        setLoanApplicationProducts(data);
                    } else {
                        console.error("Failed to fetch products");
                    }
                }
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        }
    };

    const handleLoanProductSelection = (product) => {
        setValidationError("");
        setNewLoanSchedule(null);
        setNewLoanAmount(null);
        // console.log("Selected Product: ",product);
        // console.log("Loan Limit: ",AccountData);
        // console.log("Loan Limit: ",AccountData[0]);
        // console.log("Loan Limit: ",AccountData[0].LoanLimit);
        if(AccountData[0].LoanLimit<product.MinPrincipal){
            setValidationError("Your loan limit is Ksh "+AccountData[0].LoanLimit);
        }else{
            ///if loan limit is less than or equal to the product maximum, set laon amount as loan limit
            if(AccountData[0].LoanLimit<=product.MaxPrincipal){
                setNewLoanAmount(AccountData[0].LoanLimit);
            }

            ///if maximum loan limit is greater than the product maximum, set laon amount as maximum principal
            if(AccountData[0].LoanLimit>product.MaxPrincipal){
                setNewLoanAmount(product.MaxPrincipal);
            }
            
            setSelectedLoanProduct(product);
        }
    };

    useEffect(() => {
        if (selectedLoanProduct && newLoanAmount) {
            handleCalculateLoan();
        }
        // eslint-disable-next-line
    }, [selectedLoanProduct, newLoanAmount]);

    const handleLoanAmountChange = (e) => {
        setMinPrincipalWarning(false);
        setMaxPrincipalWarning(false);
        setValidationError("");
        setNewLoanSchedule(null);

        if(e.target.value<selectedLoanProduct.MinPrincipal){
            setMinPrincipalWarning(true);
        }else if(e.target.value>selectedLoanProduct.MaxPrincipal){
            setMaxPrincipalWarning(true);
        }
        
        setNewLoanAmount(e.target.value);
    };

    const handleCalculateLoan = async () => {
        setValidationError("");
        setNewLoanSchedule(null);

        if (!selectedLoanProduct) {
            setValidationError("Select loan products...");
            return;
        };

        if (!newLoanAmount) {
            setValidationError("Enter loan amount...");
            return;
        };

        if (minPrincipalWarning) {
            setValidationError("Enter loan amount greater than "+selectedLoanProduct.MinPrincipal);
            return;
        };

        if (maxPrincipalWarning) {
            setValidationError("Enter loan amount less than "+selectedLoanProduct.MaxPrincipal);
            return;
        };

        const storedConfigurationData = localStorage.getItem('configuration');
        const configurationDataJson = JSON.parse(storedConfigurationData);

        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);

        try {
            const response = await fetch("https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/LoanPreview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${sessionData.token}`
                },
                body: JSON.stringify({
                    productId: selectedLoanProduct.ID,
                    principal: parseFloat(newLoanAmount),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Loan Schedule", data);
                setNewLoanSchedule(data);
            } else {
                console.error("Failed to fetch schedule");
            }
        } catch (error) {
            console.error("Error fetching schedule:", error);
        }
    };

    // {showTermsModal && (
        
    // )}

    const validateLoanApplication = async () => {
        setSubmittingLoan(true);

        // Validate terms and conditions
        if (!acceptedTerms) {
            setTermsError("You must accept the terms and conditions.");
            setSubmittingLoan(false);
            return;
        } else {
            setTermsError("");
            setValidationError("");
            if (!selectedLoanProduct || !newLoanAmount) {
                setValidationError("Select Product & Enter loan amount!"); return;
            }

            const storedConfigurationData = localStorage.getItem('configuration');
            const configurationDataJson = JSON.parse(storedConfigurationData);
            const session = localStorage.getItem("session");
            const sessionData = JSON.parse(session);

            try {
                const response = await fetch("https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/LoanApplicationValidation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        borrowerAccount: sessionData.accountNumber,
                        borrowedAmount: parseFloat(newLoanAmount),
                        borrowerId: sessionData.userId,
                        entityId: configurationDataJson.EntityId,
                        productId: selectedLoanProduct.ID,
                        borrowerType: 1,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    ///console.log("Loan Application", data);
    
                    if(data.code===200){
                        setSubmittingLoan(false);
                        setValidationError("");
                        setSelectedLoanProduct(null);
                        setNewLoanSchedule(null);
                        setApplicationSuccess("Loan #"+data.loanID+" applied successfully.");
                    }else{
                        setSubmittingLoan(false);
                        setValidationError(data.Response);
                    }
                } else {
                    setSubmittingLoan(false);
                    setValidationError("Loan application Failed, Try again");
                    ///console.error("Failed, Try again");
                }
            } catch (error) {
                setSubmittingLoan(false);
                setValidationError("Loan application Failed, Try again later");
                ///console.error("Error", error);
            }
        }
    };

    const topUpCharges = async () => {
        setTopUpChargeWait(true);
        setTopUpChargeError(null);
        setStkPrompted(false);
        await fetchAccountData();
        if (
            AccountData &&
            AccountData[0] &&
            newLoanSchedule &&
            newLoanSchedule.Table &&
            newLoanSchedule.Table[0] &&
            AccountData[0].Savings >= newLoanSchedule.Table[0].UpFrontCharges
        ) {
            setTopUpChargeWait(false);
            setTopUpChargeError(null);
            const modal = window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('stkPushModal'));
            if (modal) modal.hide();
        }else{
            setTopUpChargeWait(false);
            setTopUpChargeError("Top Up Failed, Try again");
        }
    };

    const formatDueDateMinus2Days = (dateStr) => {
        if (!dateStr) return "";
        // Try to parse date in DD/MM/YYYY or YYYY-MM-DD format
        let parts;
        let dateObj;
        if (dateStr.includes("/")) {
            // Format: DD/MM/YYYY
            parts = dateStr.split("/");
            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
            // Assume ISO or YYYY-MM-DD
            dateObj = new Date(dateStr);
        }
        if (isNaN(dateObj)) return dateStr;
        dateObj.setDate(dateObj.getDate() - 2);
        // Format back to DD/MM/YYYY
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const handleStkPay = async () => {
        setTopUpChargeWait(true);
        setStkPrompted(false);
        setTopUpChargeError("");
        try {
            const session = JSON.parse(localStorage.getItem("session"));
            const response = await fetch("https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/Repayment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${session.token}`
                },
                body: JSON.stringify({
                    Amount: stkAmount,
                    PhoneNumber: stkPhoneNumber,
                    EntityId: 7
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setStkPrompted(true);
                setTopUpChargeWait(false);
                setTopUpChargeError(data.message || "STK push sent. Please check your phone to complete payment.");
                ///setShowStkModal(false);
            } else {
                setTopUpChargeWait(false);
                setStkPrompted(false);
                setTopUpChargeError(data.message || "Failed to send STK push.");
            }
        } catch (err) {
            setTopUpChargeWait(false);
            setStkPrompted(false);
            setTopUpChargeError("Error sending payment request, try again");
        }
    };

    return (
        <div className="container mt-4" id="main-content">
            <div className="card mb-4">
                <div className="card-body pb-0">
                    <div className='swiper-container'>
                        {AccountData && AccountData[0].LoanLimit> 0 ? (
                            <div className="p-3">
                                <div className="text-center text-muted">You do not have any eligible loan products available.</div>
                            </div>
                        ) : AccountData && loanApplicationProducts && loanApplicationProducts.length > 0 && (
                            <>
                                { loanApplicationProducts.filter(product => AccountData[0].LoanLimit >= product.MinPrincipal).length === 0 ? (
                                    <div className="p-3">
                                        <div className="text-center text-muted">You do not have any eligible loan products available.</div>
                                    </div>
                                ) : (
                                    <>
                                        <Swiper
                                            ref={swiperRef}
                                            modules={[Navigation, Pagination]}
                                            spaceBetween={15}
                                            slidesPerView={1}
                                            loop={true}
                                            pagination={{ clickable: true }}
                                            breakpoints={{
                                                640: { slidesPerView: 1 },
                                                768: { slidesPerView: 2 },
                                                1024: { slidesPerView: 3 },
                                            }}
                                        >
                                            {loanApplicationProducts.filter(product => AccountData[0].LoanLimit >= product.MinPrincipal)
                                            .map(product => {
                                                if (AccountData[0].LoanLimit < product.MaxPrincipal) {
                                                    product.MaxPrincipal = AccountData[0].LoanLimit;
                                                    product.MaxPrincipalFormated = "Ksh " + parseFloat(AccountData[0].LoanLimit).toLocaleString('en-KE');
                                                }

                                                return (
                                                    <SwiperSlide key={product.ID}>
                                                        <div
                                                            className={`card selectable anyone mb-3 ${selectedLoanProduct?.ID === product.ID ? 'active' : ''}`}
                                                            onClick={() => handleLoanProductSelection(product)}
                                                        >
                                                            <div className="card-body pb-0">
                                                                <div className="row align-items-center mb-3">
                                                                    <div className="col">
                                                                        <h5 className="mb-0 fw-medium">{product.ProductName}</h5>
                                                                        <p className="small text-secondary">{product.ProductDesc.substring(0, 35)}...</p>
                                                                    </div>
                                                                    {/* <div className="col-auto text-end">
                                                                        <h5 className="mb-1">{product.InterestTypeValue}</h5>
                                                                        <p className="small text-secondary">{product.methodName}</p>
                                                                    </div> */}
                                                                </div>
                                                                <div className="row align-items-center">
                                                                    <div className="col mb-3">
                                                                        <p className="mb-1">{product.MinPrincipalFormated} - {product.MaxPrincipalFormated}</p>
                                                                        <p className="small text-secondary">
                                                                            <i className="bi bi-calendar-event me-1"></i> {product.RepaymentPeriod} {product.RepaymentPeriodName}(s)
                                                                        </p>
                                                                    </div>
                                                                    <div className="col-auto text-end mb-3">
                                                                        <button className="btn btn-square btn-link">
                                                                            <i className="bi bi-plus-lg"></i> SELECT
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </SwiperSlide>
                                                )
                                            })}
                                        </Swiper>
                                        <div className="swiper-button-prev" onClick={() => swiperRef.current.swiper.slidePrev()}>
                                            <i className='bi bi-arrow-left'></i>
                                        </div>
                                        <div className="swiper-button-next" onClick={() => swiperRef.current.swiper.slideNext()}>
                                            <i className='bi bi-arrow-right'></i>
                                        </div>
                                    </>
                                )}
                                
                            </>
                        )}
                    </div>

                    {selectedLoanProduct && (
                        <div className="row align-items-center mb-4 mt-3">
                            <div className="col-auto">
                                <div className="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1">
                                    <i className="bi bi-cash-coin  h1"></i>
                                </div>
                            </div>
                            <div className="col">
                                {newLoanAmount && (
                                    <h5 className="text-theme-1 mb-1">
                                        Ksh {parseFloat(newLoanAmount).toLocaleString('en-KE')}
                                    </h5>
                                )}
                                {/* <h5 className="text-theme-1 mb-1">{selectedLoanProduct.ProductName}</h5> */}
                                <p className="text-secondary">Loan Amount</p>
                            </div>
                            <div className='col-md-7'>
                                <div className='bg-light p-2 rounded mt-3 mt-md-0 mb-3 mb-md-0'>
                                    <div className='d-flex justify-content-between'>
                                        <b className={minPrincipalWarning ? 'text-warning' : 'text-success'}>
                                            {selectedLoanProduct.MinPrincipalFormated}
                                        </b>
                                        <b className={maxPrincipalWarning ? 'text-warning' : 'text-success'}>
                                            {selectedLoanProduct.MaxPrincipalFormated}
                                        </b>
                                    </div>
                                    <div className="mt-1 position-relative">
                                        <input
                                            type="range"
                                            className="form-range"
                                            min={selectedLoanProduct.MinPrincipal}
                                            max={selectedLoanProduct.MaxPrincipal}
                                            step="500"
                                            value={newLoanAmount}
                                            onChange={(e) => {
                                                setNewLoanAmount(e.target.value);
                                                handleLoanAmountChange(e);
                                            }}
                                        />
                                        {/* Step indicators */}
                                        <div className="slider-indicators">
                                            {Array.from(
                                                { length: (selectedLoanProduct.MaxPrincipal - selectedLoanProduct.MinPrincipal) / 500 + 1 },
                                                (_, index) => (
                                                    <span key={index} className="slider-point"></span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/*<div className="col">
                                <div className="d-flex flex-row flex-md-column justify-content-between align-items-end">
                                    
                                    <button
                                        className="btn btn-outline-secondary mt-2 mt-md-0"
                                        type="button"
                                        id="button-addon2"
                                        onClick={handleCalculateLoan}
                                    >
                                        Calculate<i className="bi bi-plus-circle ms-2"></i>
                                    </button>
                                </div>
                            </div>*/}
                        </div>
                    )}
                </div>
            </div>

            {validationError&&(
                <div className='col-12'><div className="alert alert-warning my-3" role="alert">{validationError}</div></div>
            )}

            {applicationSuccess&&(
                <div className='col-12'><div className="alert alert-success my-3" role="alert">{applicationSuccess}</div></div>
            )}

            {newLoanSchedule && newLoanSchedule.Table && newLoanSchedule.Table.length > 0 && (
                <>
                    <div className='row'>
                        <div className='col-md-5'>
                            <div className='card mb-4'>
                                <div className="card-header"><h6>Overview</h6></div>
                                <div className='card-body'>
                                    <div className='row'>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].PrincipleFormated}</h6>
                                            <p className="small opacity-75">Loan AMount</p>
                                        </div>
                                        {/* <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].LoanAmountFormated}</h6>
                                            <p className="small opacity-75">Total Loan</p>
                                        </div> */}
                                        {/* <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].InterestAmountFormated}</h6>
                                            <p className="small opacity-75">Interest</p>
                                        </div> */}
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].InstallmentAmountFormated}</h6>
                                            <p className="small opacity-75">Installment</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].Installments}</h6>
                                            <p className="small opacity-75">Duration</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].UpFrontChargesFormated}</h6>
                                            <p className="small opacity-75">Upfront Charges</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].DeductedFormated}</h6>
                                            <p className="small opacity-75">Deducted Charges</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].ProratedFormated}</h6>
                                            <p className="small opacity-75">Prorated Charges</p>
                                        </div>
                                        {/* <div className="col-6">
                                            <h6 className="mb-1">{newLoanSchedule?.Table[0].ExpectedClearDateFormated}</h6>
                                            <p className="small opacity-75">Clear Date</p>
                                        </div> */}
                                        
                                        <div className='col-12'>
                                            {submittingLoan?
                                                <>
                                                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 text-center">
                                                        <div className="loader10 mb-3 mx-auto " />
                                                    </div>
                                                </>
                                                :
                                                <>
                                                    {newLoanSchedule?.Table[0].UpFrontCharges>0 && AccountData[0].Savings<newLoanSchedule?.Table[0].UpFrontCharges?
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-theme"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#stkPushModal"
                                                            onClick={() => {
                                                                const upFront = newLoanSchedule.Table[0].UpFrontCharges || 0;
                                                                const savings = AccountData[0]?.Savings || 0;
                                                                let topUpAmt = upFront - savings;
                                                                if (topUpAmt < 0) topUpAmt = 0;
                                                                setStkPhoneNumber(AccountData[0].AccountNo);
                                                                setStkAmount(topUpAmt);
                                                            }}
                                                        >
                                                            Top Up <i className="bi bi-arrow-up-right-circle ms-3"></i>
                                                        </button>
                                                    :
                                                        <>
                                                            <div className='col-12'>
                                                                <div className='d-flex'>
                                                                    <div className="flex-grow-1">
                                                                        <div className="form-check" data-bs-toggle="modal" data-bs-target="#termsModal"
                                                                                    style={{ textDecoration: "underline", cursor: "pointer" }}>
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                id="acceptTerms"
                                                                                checked={acceptedTerms}
                                                                                onChange={e => {
                                                                                    setAcceptedTerms(e.target.checked);
                                                                                    if (e.target.checked) setTermsError("");
                                                                                }}
                                                                            />
                                                                            <label className="form-check-label" htmlFor="acceptTerms">
                                                                                I accept the terms and conditions
                                                                            </label>
                                                                        </div>
                                                                        {termsError && <p className="text-danger">{termsError}</p>}
                                                                    </div>
                                                                    <button type="button" className="btn btn-outline-theme" onClick={validateLoanApplication}>Complete <i className="bi bi-arrow-up-right-circle ms-3"></i></button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    }
                                                </>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-7'>
                            {newLoanSchedule && newLoanSchedule.Table1 && newLoanSchedule.Table1.length > 0 && (
                                <div className='card mb-4'>
                                    <div className='card-body'>
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>#REF</th>
                                                        <th>Amount</th>
                                                        <th>Due Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {newLoanSchedule.Table1.map((installment, index) => (
                                                        <tr key={index}>
                                                            <td>{installment.InstallmentNumber}</td>
                                                            <td>{installment.InstallmentAmountFormated}</td>
                                                            <td>{formatDueDateMinus2Days(installment.DueDateFormated)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal fade" id='termsModal' data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="termsModalLabel" aria-hidden="true" tabIndex={-1}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className='modal-header'>
                                    <h5 className="modal-title" id="termsModalLabel">MICROMART AFRICA TERMS AND CONDITIONS</h5>
                                </div>
                                <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                    <Terms />
                                </div>
                                <div className="modal-footer">
                                    <button
                                    type="button"
                                    className="btn btn-theme"
                                    data-bs-dismiss="modal"
                                    >
                                    Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal fade" id="stkPushModal" tabIndex="-1" aria-labelledby="stkPushModalLabel" aria-hidden="true">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                {newLoanSchedule && newLoanSchedule.Table && newLoanSchedule.Table.length > 0 && (
                                    <>
                                        {/** Calculate top up amount */}
                                        {(() => {
                                            return (
                                                <>
                                                    <div className="modal-header">
                                                        <p className="modal-title h5" id="stkPushModalLabel">Top Up Upfront Charges</p>
                                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                    <div className="modal-body">
                                                        <p>
                                                            A prompt will be sent to your phone <b>{stkPhoneNumber}</b> to pay <b>
                                                                {stkAmount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                                            </b>. Please enter your pin to complete the transaction and verify to proceed.
                                                        </p>
                                                        <div className="mb-3">
                                                            <label className="form-label">Payment Number</label>
                                                            <input
                                                                type="tel"
                                                                className="form-control"
                                                                placeholder="e.g. 07XXXXXXXX"
                                                                value={stkPhoneNumber}
                                                                onChange={e => setStkPhoneNumber(e.target.value)}
                                                            />
                                                        </div>
                                                        {stkPrompted?<></>
                                                        :
                                                        <>
                                                            {topUpChargeWaitError && (
                                                                <div className="alert alert-danger my-3" role="alert">{topUpChargeWaitError}</div>
                                                            )}
                                                        </>}
                                                    </div>
                                                    {topUpChargeWait ?
                                                        <div className="col-12 col-sm-6 col-md-4 col-lg-3 text-center">
                                                            <div className="loader10 mx-auto " />
                                                        </div>
                                                        :
                                                        <div className="modal-footer d-flex justify-content-between">
                                                            {stkPrompted?
                                                                <button type="button" className="btn btn-theme" onClick={topUpCharges}>Verify</button>
                                                            :
                                                            <>
                                                                <button type="button" className="btn btn-secondary" onClick={() => setShowStkModal(false)}>
                                                                    Close
                                                                </button>
                                                                <button type="button" className="btn btn-theme" onClick={handleStkPay}>
                                                                    Pay Now
                                                                </button>
                                                            </>}
                                                        </div>
                                                    }
                                                </>
                                            );
                                        })()}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Swiper Custom Styles */}
            <style jsx>{`
                .position-relative {
                    position: relative;
                }
                .slider-indicators {
                    position: absolute;
                    top: 7px;
                    left: 0;
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    pointer-events: none;
                }
                .slider-point {
                    width: 10px;
                    height: 10px;
                    background-color: rgb(157 175 193);
                    border-radius: 5px;
                    opacity: 0.5;
                }
                .swiper-container {
                    position: relative;
                }
                .swiper-button-prev, .swiper-button-next {
                    position: absolute;
                    top: 60%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 40px;
                    background-color: rgba(0, 0, 0, 0.5);
                    color: #fff;
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    z-index: 10;
                    cursor: pointer;
                }

                .swiper-button-prev {
                    left: -30px;
                }

                .swiper-button-next {
                    right: -30px;
                }

                .swiper-button-prev:hover, .swiper-button-next:hover {
                    background-color: rgba(0, 0, 0, 0.7);
                }

                .swiper-pagination-bullet {
                    background-color: #ccc;
                }

                .swiper-pagination-bullet-active {
                    background-color: #007bff;
                }
            `}</style>
        </div>
    );
}

export default LoanApplication;
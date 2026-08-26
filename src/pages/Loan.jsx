// Loan.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Loan = ({logout}) => {
    const navigate = useNavigate();
    const { loanId } = useParams();
    const [loanDetails, setLoanDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progressPercentage, setProgressPercentage]=useState(0);
    const [showStkModal, setShowStkModal] = useState(false);
    const [stkAmount, setStkAmount] = useState(0);
    const [stkFormatedAmount, setStkFormatedAmount] = useState(0);
    const [stkPhoneNumber, setStkPhoneNumber] = useState("");
    const [stkPrompt, setStkPrompt] = useState("");
    const [stkPrompted, setStkPrompted] = useState(false);
    const [stkWait, setStkWait] = useState(false);

    useEffect(() => {
        fetchLoanDetails();
    }, [loanId]);

    
    const fetchLoanDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const storedConfigurationData = localStorage.getItem('configuration');
            const configurationDataJson = JSON.parse(storedConfigurationData);
            const session = localStorage.getItem("session");
            const sessionData = JSON.parse(session);

            const response = await fetch("https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/LoanDetails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${sessionData.token}`
                },
                body: JSON.stringify({
                    ProductId:loanId,
                    EntityId: parseInt(configurationDataJson.EntityId),
                    AgentId: parseInt(sessionData.userId),
                    PhoneNumber:'',
                }),
            });

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
                    setLoanDetails(data);

                    setProgressPercentage(calculateProgress(data.Table[0].LoanAmount,data.Table[0].LoanBalance));
                }else{
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    const calculateProgress = (loanAmount,balance) => {
        const totalLoanAmount = parseFloat(loanAmount);
        const loanBalance = parseFloat(balance);
        if (isNaN(totalLoanAmount) || isNaN(loanBalance) || totalLoanAmount === 0) {
        return 0; // Handle invalid or zero values
        }
        return (1 - (loanBalance / totalLoanAmount)) * 100;
    };

    if (loading) {
        return <div className="container mt-4" id="main-content"><div className="loader10" /></div>;
    }

    if (error) {
        return <div className="container mt-4" id="main-content">Failed: {error}</div>;
    }

    if (!loanDetails) {
        return <div className="container mt-4" id="main-content">Loan not found.</div>;
    }

  
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

    const parseDate = (str) => {
        if (!str) return null;
        if (str.includes("/")) {
        const [dd, mm, yyyy] = str.split("/");
        return new Date(`${yyyy}-${mm}-${dd}`);
        }
        return new Date(str);
    };

    const handleStkPay = async () => {
        setStkWait(true);
        setStkPrompted(false);
        setStkPrompt("");
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
                setStkWait(false);
                setStkPrompt(data.message || "STK push sent. Please check your phone to complete payment.");
                ///setShowStkModal(false);
            } else {
                setStkWait(false);
                setStkPrompted(false);
                setStkPrompt(data.message || "Failed to send STK push.");
            }
        } catch (err) {
            setStkWait(false);
            setStkPrompted(false);
            setStkPrompt("Error sending payment request, try again");
        }
    };

    return (
        <div className='container mt-4' id=''>
            <div className='row'>
                <div className="col-md-4">
                    <div className="card adminuiux-card mb-4">
                        <div className="card-body z-index-1">
                            <div className="row align-items-center">
                                <div className="col">
                                    <h4 className="fw-medium text-success">
                                    {loanDetails.Table[0].LoanBalanceFormated}
                                    </h4>
                                    <p>
                                    <span className="text-secondary">{loanDetails.Table[0].LoanStatus}</span>
                                    </p>
                                </div>
                                <div className='col-auto'>
                                    <div className="avatar avatar-60 position-relative mx-auto text-center">
                                        <div
                                            id="circleprogressgreen1"
                                            style={{ position: 'relative' }} // Added style for relative positioning
                                        >
                                            <svg viewBox="0 0 100 100" style={{ display: 'block', width: '100%' }}>
                                            <path
                                                d="M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90"
                                                stroke="#eaf4d8"
                                                strokeWidth="10"
                                                fillOpacity="0"
                                            ></path>
                                            <path
                                                d="M 50,50 m 0,-45 a 45,45 0 1 1 0,90 a 45,45 0 1 1 0,-90"
                                                stroke="rgb(145,195,0)"
                                                strokeWidth="10"
                                                fillOpacity="0"
                                                style={{
                                                strokeDasharray: '282.783, 282.783',
                                                strokeDashoffset: 282.783 - (282.783 * progressPercentage) / 100,
                                                }}
                                            ></path>
                                            </svg>
                                            <div
                                            className="progressbar-text"
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                padding: '0px',
                                                margin: '0px',
                                                transform: 'translate(-50%, -50%)',
                                                color: 'rgb(145, 195, 0)',
                                            }}
                                            >
                                            {Math.round(progressPercentage)}
                                            <small>%<small></small></small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card adminuiux-card theme-teal mb-4">
                        <div className="card-body z-index-1">
                            {loanDetails.Table[0].LoanStatus === 'ACTIVE' ?
                                <>
                                    <h4 className="fw-medium">{loanDetails.Table[0].LoanElapsedDays} / {loanDetails.Table[0].LoanDurationDays} Days</h4>
                                    <p><span className="text-secondary">Duration</span></p>
                                </>
                            :
                                <>
                                    <h4 className="fw-medium">{loanDetails.Table[0].LoanStatus}</h4>
                                    <p><span className="text-secondary">Status</span></p>
                                </>
                            }
                            
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card adminuiux-card mb-4">
                        <div className="card-body z-index-1">
                            {loanDetails.Table[0].DueAmount && loanDetails.Table[0].DueAmount>0?
                                <div className="row align-items-center">
                                    <div className="col">
                                        <h4 className="fw-medium text-theme-1 theme-red">
                                        {loanDetails.Table[0].DueFormated}
                                        </h4>
                                        <p>
                                        <span className="text-theme-1 theme-red">Amount Due</span>
                                        </p>
                                    </div>
                                    <div className="col-auto">
                                        <button
                                            className="btn btn-sm btn-outline-theme"
                                            onClick={() => {
                                                setStkAmount(loanDetails.Table[0].DueAmount);
                                                setStkFormatedAmount(loanDetails.Table[0].DueFormated);
                                                setStkPhoneNumber(loanDetails.Table[0].PhoneNumber);
                                                setShowStkModal(true);
                                            }}
                                        >
                                            <i className="bi bi-arrow-up-right me-1"></i> Pay
                                        </button>
                                    </div>
                                </div>
                            :
                                <>
                                    {loanDetails.Table[0].UpcommingDue && loanDetails.Table[0].UpcommingDue>0?
                                        <div className="row align-items-center">
                                            <div className="col">
                                                <h4 className="fw-medium text-theme-1 theme-orange">
                                                {loanDetails.Table[0].UpcommingDueFormated}
                                                </h4>
                                                <p>
                                                <span className="text-theme-1 theme-orange">Next Payment</span>
                                                </p>
                                            </div>
                                            <div className="col-auto">
                                                <button
                                                    className="btn btn-sm btn-outline-theme"
                                                    onClick={() => {
                                                        setStkAmount(loanDetails.Table[0].UpcommingDue);
                                                        setStkFormatedAmount(loanDetails.Table[0].UpcommingDueFormated);
                                                        setStkPhoneNumber(loanDetails.Table[0].PhoneNumber);
                                                        setShowStkModal(true);
                                                    }}
                                                >
                                                    <i className="bi bi-arrow-up-right me-1"></i> Pay
                                                </button>
                                            </div>
                                        </div>
                                    :
                                        <div>No pending payments</div>
                                    }
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {loanDetails && loanDetails.Table && loanDetails.Table.length > 0 && (
                <>
                    <div className='row'>
                        <div className='col-md-5'>
                            <div className='card mb-4'>
                                <div className="card-header"><h6>{loanDetails?.Table[0].ProductName}</h6></div>
                                <div className='card-body'>
                                    <div className='row'>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">#{loanDetails?.Table[0].id}</h6>
                                            <p className="small opacity-75">Loan Ref</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanDetails?.Table[0].LoanAmountFormated}</h6>
                                            <p className="small opacity-75">Loan Amount</p>
                                        </div>
                                        {/* <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanDetails?.Table[0].PrincipleFormated}</h6>
                                            <p className="small opacity-75">Principal</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanDetails?.Table[0].InterestFormated}</h6>
                                            <p className="small opacity-75">Interest</p>
                                        </div> */}
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanDetails?.Table[0].InstallmentFormated}</h6>
                                            <p className="small opacity-75">Installment</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanDetails?.Table[0].Installments}</h6>
                                            <p className="small opacity-75">Installments</p>
                                        </div>
                                        <div className="col-6">
                                            <h6 className="mb-1">{loanDetails?.Table[0].BorrowDateFormated}</h6>
                                            <p className="small opacity-75">Borrow Date</p>
                                        </div>
                                        <div className="col-6">
                                            <h6 className="mb-1">{loanDetails?.Table[0].ExpectedClearDateFormated}</h6>
                                            <p className="small opacity-75">Expected Clear Date</p>
                                        </div>
                                        {/* <div className='col-6'>
                                            <button type="button" className="btn btn-outline-theme">Apply <i class="bi bi-arrow-up-right-circle ms-3"></i></button>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-7'>
                            {loanDetails && loanDetails.Table1 && loanDetails.Table1.length > 0 && (
                                <div className='card mb-4'>
                                    <div className='card-body'>
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Amt Due</th>
                                                        <th>Due Date</th>
                                                        <th>Payment</th>
                                                        <th>Payment Date</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loanDetails.Table1.map((installment, index) => {
                                                        // Status logic
                                                        let statusLabel = "";
                                                        let statusClass = "";

                                                        if (installment.Status === 1 || installment.Status === "1") {
                                                            statusLabel = "Paid";
                                                            statusClass = "text-success";
                                                        } else {
                                                            statusLabel = "Unpaid";
                                                            statusClass = "text-warning";
                                                        }
                                                        return (
                                                            <tr key={index}>
                                                                <td>{installment.InstallmentNumber}</td>
                                                                <td>{installment.InstallmentAmountFormated}</td>
                                                                <td>{formatDueDateMinus2Days(installment.DueDateFormated)}</td>
                                                                <td>{installment.AmountPaidFormated ? installment.AmountPaidFormated:'-'}</td>
                                                                <td>{installment.PaidDateFormated ? installment.PaidDateFormated:'-'}</td>
                                                                <td className={statusClass}>{statusLabel}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* STK Modal */}
            {showStkModal && (
                <div className="modal fade show" style={{ display: "block" }} tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Pay Loan</h5>
                                <button type="button" className="btn-close" onClick={() => setShowStkModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {stkWait?
                                    <div className='p-3 align-items-center'>
                                        <div className="loader10" />
                                        <p>Please wait, A prompt will be send to <b>{stkPhoneNumber}</b> to pay <b>{stkAmount}</b>, enter M-pesa pin to complete transaction</p>
                                    </div>
                                :
                                    <>
                                        {stkPrompted?
                                            <p>A prompt has been send to <b>{stkPhoneNumber}</b> to pay <b>{stkAmount}</b>, enter M-pesa pin to complete transaction and click <b>VIFRIFY</b> button below.</p>
                                        :
                                            <>
                                                <div className="mb-3">
                                                    <label className="form-label">Amount</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={stkAmount}
                                                        min={1}
                                                        onChange={e => setStkAmount(Number(e.target.value))}
                                                    />
                                                </div>
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
                                                <p>Click <b>Pay Now</b> to get a prompt on the payment number above to pay <b>{stkAmount}</b> </p>
                                                {stkPrompt && <p className='bg-light p-3 text-warning'>{stkPrompt}</p>}
                                            </>
                                        }
                                    </>
                                }
                            </div>
                            {stkWait?<></>:
                                <div className="modal-footer justify-content-between">
                                    {stkPrompted?
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowStkModal(false);
                                                setStkPrompted(false);
                                                fetchLoanDetails();
                                            }}
                                        >
                                            VERIFY
                                        </button>
                                    :
                                        <>
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowStkModal(false)}>
                                                Close
                                            </button>
                                            <button type="button" className="btn btn-theme" onClick={handleStkPay}>
                                                Pay Now
                                            </button>
                                        </>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Loan;
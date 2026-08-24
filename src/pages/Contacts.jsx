import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Contacts() {
    const [ledgerTransactions, setLedgerTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);


    useEffect(() => {
        const session = localStorage.getItem("session");
        if (session) {
            const parsedSession = JSON.parse(session);
            setUserId(parsedSession?.userId);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchLedger();
        }
    }, [userId]);

    const fetchLedger = async () => {
        setLoading(true);
    
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
                                
                const newToken = response.headers.get('X-New-Token');
                if (newToken) {
                    sessionData.token = newToken;
                    localStorage.setItem('session', JSON.stringify(sessionData));
                }

                if (response.ok) {
                    const data = await response.json();
                    console.log("Account Data: ",data)
                    setLedgerTransactions(data);
                    setLoading(false);
                } else {
                    console.error("Failed to fetch onboarding settings");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching onboarding settings:", error);
                setLoading(false);
            }
        }
    };

    function formatPhoneNumber(phone) {
        if (!phone) return '';
        // Remove all non-digit characters
        let digits = phone.replace(/\D/g, '');
        // If starts with 0, replace with +254
        if (digits.startsWith('0')) {
            digits = '+254' + digits.substring(1);
        } else if (digits.startsWith('254')) {
            digits = '+254' + digits.substring(3);
        } else if (!digits.startsWith('+254')) {
            digits = '+254' + digits;
        }
        // Format as +254 7XX XXX XXX
        return digits.replace(/(\+254)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }

    if (loading) {
        return <div className="container mt-4 p-5">Loading...</div>;
    }

    if (error) {
        return (<div className="container mt-4 p-5">Error: {error.message}</div>);
    }

  return (
    <div className="container mt-4" id="main-content">
        <div className="row">
            <div className="col-12">
                <div className="d-flex justify-content-between mb-3">
                    <h3 className="m-0">Support Contacts</h3>
                    
                </div>
                
                {ledgerTransactions?
                <>
                    {ledgerTransactions.Table4 && ledgerTransactions.Table4.length > 0 && (
                        <div>
                            {ledgerTransactions.Table4.map((txn, idx) => (
                                <div className="card mb-3" key={txn.ID || idx}>
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-auto">
                                                <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                    <i className="bi bi-briefcase h5"></i>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <div className="d-flex align-items-center gap-3 mb-1">
                                                    {txn.EntityName && txn.EntityName.trim() !== "" &&
                                                        <span className="text-secondary">{txn.EntityName}</span>
                                                    }
                                                </div>
                                                <p className="m-0">{formatPhoneNumber(txn.EntityPhoneNo)}</p>
                                            </div>
                                            <div className="col-md-auto text-end mt-3 mt-md-0 d-flex flex-column gap-2 justify-content-end">
                                                <button
                                                    className="btn btn-outline-theme"
                                                    onClick={() => {
                                                        if (txn.EntityPhoneNo) {
                                                            window.location.href = `tel:${txn.EntityPhoneNo.replace(/\D/g, '')}`;
                                                        }
                                                    }}
                                                >
                                                    <i className="bi bi-telephone-outbound"></i> CALL
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {ledgerTransactions.Table5 && ledgerTransactions.Table5.length > 0 && (
                        <div>
                            {ledgerTransactions.Table5.map((txn, idx) => (
                                <div className="card mb-3" key={txn.ID || idx}>
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-auto">
                                                <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                    <i className="bi bi-person h5"></i>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <div className="d-flex align-items-center gap-3 mb-1">
                                                    {txn.FirstName && txn.FirstName.trim() !== "" &&
                                                        <span className="text-secondary">{txn.FirstName}</span>
                                                    }
                                                    {txn.OtherName && txn.OtherName.trim() !== "" &&
                                                        <span className="text-secondary">{txn.OtherName}</span>
                                                    }
                                                </div>
                                                <p className="m-0">{formatPhoneNumber(txn.PhoneNumber)}</p>
                                            </div>
                                            <div className="col-md-auto text-end mt-3 mt-md-0 d-flex flex-column gap-2 justify-content-end">
                                                <button
                                                    className="btn btn-outline-theme"
                                                    onClick={() => {
                                                        if (txn.PhoneNumber) {
                                                            window.location.href = `tel:${txn.PhoneNumber.replace(/\D/g, '')}`;
                                                        }
                                                    }}
                                                >
                                                    <i className="bi bi-telephone-outbound"></i> CALL
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
                :
                <>
                    <div className="col-12 text-center mb-4">
                    No contacts found...
                    </div>
                </>}
            </div>
        </div>
    </div>
  );
}

export default Contacts;
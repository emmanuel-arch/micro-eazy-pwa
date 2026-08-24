import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Statement() {
    const [ledgerTransactions, setLedgerTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [downloading, setDownloading] = useState(false);

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
            const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/AccountStatement`, {
                method: 'POST',
                headers: {
                    accept: 'text/plain',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionData.token}`
                },
                ///body: JSON.stringify(sessionData.userId),
            });
      
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

    const downloadStatement = async () => {
        try {
            setDownloading(true);
            const session = localStorage.getItem("session");
            const sessionData = JSON.parse(session);
        
            const response = await fetch('https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/DownloadStatement', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionData.token}`, 
                }
            });

            if (!response.ok) {
                setDownloading(false);
                const errorData = await response.json();
                alert('Failed to download statement');
                throw new Error(errorData.message || 'Failed to download statement');
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'Statement.pdf';

            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1];
            }

            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                sessionData.token = newToken;
                localStorage.setItem('session', JSON.stringify(sessionData));
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            setDownloading(false);
        } catch (error) {
            setDownloading(false);
            alert(error.message);
        }
    };


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
                    <div className="flex-grow-1">
                        <h3 className="m-0">Statement</h3>
                        {ledgerTransactions.Table && ledgerTransactions.Table.length > 0 &&
                            <span className="text-secondary">
                                {ledgerTransactions.Table[0].Statementdate
                                ? (() => {
                                    const d = new Date(ledgerTransactions.Table[0].Statementdate);
                                    const month = d.toLocaleString('en-US', { month: 'short' });
                                    const day = d.getDate();
                                    const year = d.getFullYear();
                                    return `${month}, ${day} ${year}`;
                                })()
                                : ''}
                            </span>
                        }
                    </div>
                    {downloading?
                        <div className="loader10" />
                    :
                        <button type="button" className="btn btn-theme" onClick={() => downloadStatement()}><i className="bi bi-funnel me-3"></i>Download</button>
                    }
                </div>
                {ledgerTransactions.Table && ledgerTransactions.Table.length > 0 && (() => {
                    const totals = ledgerTransactions.Table[0];
                    const olb = parseFloat(totals.olb) || 0;
                    const totalIn = parseFloat(totals.totalIn) || 0;
                    const totalOut = parseFloat(totals.totalOut) || 0;
                    const sum = totalIn + totalOut;

                    const percent = (val) => sum > 0 ? ((val / sum) * 100).toFixed(1) : "0.0";

                    return (
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <div className="card adminuiux-card mb-4">
                                    <div className="card-body z-index-1">
                                        <div className="row">
                                            <div className="col-auto">
                                                <div className="avatar avatar-60 bg-primary-subtle text-primary rounded">
                                                    <i className="bi bi-cash-coin h4" />
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h4 className="fw-medium">
                                                    {totals.olbFormated}
                                                </h4>
                                                <p className="text-secondary">
                                                    Balance 
                                                    {/* <span className="text-success fs-14 ms-2">
                                                        <i className="bi bi-opencollective" /> {percent(expenses)}%
                                                    </span> */}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="card adminuiux-card mb-4">
                                    <div className="card-body z-index-1">
                                        <div className="row">
                                            <div className="col-auto">
                                                <div className="avatar avatar-60 bg-success-subtle text-success rounded">
                                                    <i className="bi bi-chevron-double-up h4" />
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h4 className="fw-medium">
                                                    {totals.totalInFormated}
                                                </h4>
                                                <p className="text-secondary">
                                                    Money In 
                                                    <span className="text-success fs-14 ms-2">
                                                        <i className="bi bi-opencollective" /> {percent(totalIn)}%
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="card adminuiux-card mb-4">
                                    <div className="card-body z-index-1">
                                        <div className="row">
                                            <div className="col-auto">
                                                <div className="avatar avatar-60 bg-warning-subtle text-warning rounded">
                                                    <i className="bi bi-chevron-double-down h4" />
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h4 className="fw-medium">
                                                    {totals.totalOutFormated}
                                                </h4>
                                                <p className="text-secondary">
                                                    Payments
                                                    <span className="text-warning fs-14 ms-2">
                                                        <i className="bi bi-opencollective" /> {percent(totalOut)}%
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
                {ledgerTransactions?
                <>
                    {ledgerTransactions.Table1 && ledgerTransactions.Table1.length > 0 && (
                        <div>
                            {ledgerTransactions.Table1.map((txn, idx) => (
                                <div className="card mb-3" key={txn.ID || idx}>
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            {txn.TransType === 1 || txn.TransType === "1" ?
                                                <div className="col-auto">
                                                    <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                        <i className="bi bi-chevron-double-up h5"></i>
                                                    </div>
                                                </div>
                                            :
                                                <div className="col-auto">
                                                    <div className="avatar avatar-50 bg-warning-subtle text-warning rounded">
                                                        <i className="bi bi-cash-chevron-double-down h5"></i>
                                                    </div>
                                                </div>
                                            }
                                            <div className="col">
                                                <div className="d-flex align-items-center gap-3 mb-1">
                                                    <span className="text-secondary">
                                                        {txn.TransactionDate
                                                        ? (() => {
                                                            const d = new Date(txn.TransactionDate);
                                                            const month = d.toLocaleString('en-US', { month: 'short' });
                                                            const day = d.getDate();
                                                            const year = d.getFullYear();
                                                            return `${month}, ${day} ${year}`;
                                                        })()
                                                        : ''}
                                                    </span>
                                                    {txn.Reference && txn.Reference.trim() !== "" &&
                                                        <span className="text-secondary border-start border-2 ps-2">{txn.Reference}</span>
                                                    }
                                                    {txn.LoanId &&
                                                        <span className="text-secondary border-start border-2 ps-2">#{txn.LoanId}</span>
                                                    }
                                                </div>
                                                <p className="m-0">{txn.Narration || ''}</p>
                                            </div>
                                            <div className="col-md-auto text-end mt-3 mt-md-0 d-flex flex-column gap-2 justify-content-end">
                                                <span>
                                                    <b>{txn.TransactionAmount}</b>
                                                </span>
                                                <span className="text-secondary">
                                                    {txn.TransactionDate
                                                    ? (() => {
                                                        const d = new Date(txn.TransactionDate);
                                                        const time = d.toLocaleString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        });
                                                        return `${time}`;
                                                    })()
                                                    : ''}
                                                </span>
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
                    No Transactions found...
                    </div>
                </>}
            </div>
        </div>
    </div>
  );
}

export default Statement;
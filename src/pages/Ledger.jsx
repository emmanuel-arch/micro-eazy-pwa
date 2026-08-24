import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Ledger() {
    const [ledgerTransactions, setLedgerTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [filterType, setFilterType] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [filterFormType, setFilterFormType] = useState("");
    const [filterFormStartDate, setFilterFormStartDate] = useState("");
    const [filterFormEndDate, setFilterFormEndDate] = useState("");
    const [submittingFilter, setSubmittingFilter] = useState(false);
    const [filterFormError, setFilterFormError] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [transactionType, setTransactionType] = useState("");
    const [transactedAmount, setTransactedAmount] = useState("");
    const [transactedDate, setTransactedDate] = useState("");
    const [narration, setNarration] = useState("");
    const [transactionFormError, setTransactionFormError] = useState("");
    const [transactionFormSuccess, setTransactionFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [editingTransaction, setEditingTransaction] = useState(null);
    const [deleteTransaction, setDeleteTransaction] = useState(null);
    const [transactionDeleteError, setTransactionDeleteError] = useState("");
    const [transactionDeleteSuccess, setTransactionDeleteSuccess] = useState("");
    const [deleting, setDeletting] = useState(false);

    useEffect(() => {
        if (editingTransaction) {
            setTransactionType(editingTransaction.TransactionType?.toString() || "");
            setTransactedAmount(editingTransaction.Amount?.toString() || "");
            setTransactedDate(editingTransaction.TransactionDate?.slice(0, 10) || "");
            setNarration(editingTransaction.TransactionNarration || "");
        } else {
            setTransactionType("");
            setTransactedAmount("");
            setTransactedDate("");
            setNarration("");
        }
    }, [editingTransaction]);

    useEffect(() => {
        const session = localStorage.getItem("session");
        if (session) {
            const parsedSession = JSON.parse(session);
            setUserId(parsedSession?.userId);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            const today = new Date();
            const _endDate = today.toISOString().split('T')[0];
            const past = new Date();
            past.setDate(today.getDate() - 30);
            const _startDate = past.toISOString().split('T')[0];
            setFilterStartDate(_startDate);
            setFilterEndDate(_endDate);
            setFilterType(0);
            fetchLedger(0, _startDate, _endDate);
            setLoading(false);
        }
    }, [userId]);

    const fetchLedger = async (type = 0, startDate = null, endDate = null) => {
        setLoading(true);
        setError(null);

        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);

        try {
            const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/GetAccountLeger?type=${type}&startDate=${startDate}&endDate=${endDate}`, {
                method: 'GET',
                headers: {
                accept: 'text/plain',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionData.token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                sessionData.token = newToken;
                localStorage.setItem('session', JSON.stringify(sessionData));
            }

            const data = await response.json();
            setLedgerTransactions(data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitTransaction = async (e) => {
        e.preventDefault();

        setTransactionFormError("");
        setTransactionFormSuccess("");
        setSubmitting(true);

        if (!transactionType) {
            setTransactionFormError("Please select a transaction type.");
            setTransactionFormSuccess("");
            setSubmitting(false);
            return;
        }
        if (!transactedAmount || isNaN(transactedAmount) || Number(transactedAmount) <= 0) {
            setTransactionFormError("Please enter a valid amount.");
            setTransactionFormSuccess("");
            setSubmitting(false);
            return;
        }
        if (!transactedDate) {
            setTransactionFormError("Please select a transaction date.");
            setTransactionFormSuccess("");
            setSubmitting(false);
            return;
        }
        if (!narration || narration.trim().length === 0) {
            setTransactionFormError("Please enter a narration.");
            setTransactionFormSuccess("");
            setSubmitting(false);
            return;
        }

        try {
            const session = localStorage.getItem("session");
            const sessionData = JSON.parse(session);

            if(editingTransaction){
                // console.log("Editing transaction: ", editingTransaction);
                // console.log("Transaction ID: ", editingTransaction.Id);
                const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/EditAccountLedgerEntry/${editingTransaction.Id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json",'Authorization': `Bearer ${sessionData.token}` },
                    body: JSON.stringify({
                        Id: editingTransaction.Id,
                        BorrowerId: userId,
                        Amount: transactedAmount,
                        TransactionDate: transactedDate,
                        TransactionType: transactionType,
                        TransactionNarration: narration,
                    }),
                });

                if (!response.ok) {
                    setTransactionFormError("Failed to update transaction, Try again");
                    setTransactionFormSuccess("");
                    setSubmitting(false);
                    return;
                }else{
                    const newToken = response.headers.get('X-New-Token');
                    if (newToken) {
                        sessionData.token = newToken;
                        localStorage.setItem('session', JSON.stringify(sessionData));
                    }
                }
            }else{
                const response = await fetch("https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/NewAccountLedgerEntry", {
                    method: "POST",
                    headers: { "Content-Type": "application/json",'Authorization': `Bearer ${sessionData.token}` },
                    body: JSON.stringify({
                        Id: 0,
                        BorrowerId: userId,
                        Amount: transactedAmount,
                        TransactionDate: transactedDate,
                        TransactionType: transactionType,
                        TransactionNarration: narration,
                    }),
                });

                if (!response.ok) {
                    setTransactionFormError("Failed to save transaction, Try again");
                    setTransactionFormSuccess("");
                    setSubmitting(false);
                    return;
                }else{
                    const newToken = response.headers.get('X-New-Token');
                    if (newToken) {
                        sessionData.token = newToken;
                        localStorage.setItem('session', JSON.stringify(sessionData));
                    }
                }
            }
            
            // Optionally reset form and close modal
            setTransactionType("");
            setTransactedAmount("");
            setTransactedDate("");
            setNarration("");

            setTransactionFormSuccess(editingTransaction ? "Transaction updated successfully!" : "Transaction saved successfully!");
            setTransactionFormError("");

            // If the transaction date is within the current filter, refresh ledger
            if (
                filterStartDate &&
                filterEndDate &&
                transactedDate >= filterStartDate &&
                transactedDate <= filterEndDate
            ) {
                const closeBtn = document.querySelector('#transactionFormModal .btn-close');
                if (closeBtn) closeBtn.click();
                await fetchLedger(filterType, filterStartDate, filterEndDate);
            }
        } catch (err) {
            setTransactionFormError("Failed to save transaction, Try again");
            setTransactionFormSuccess("");
            setSubmitting(false);
            ///alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFilter = async (e) => {
        e.preventDefault();
        setSubmittingFilter(true);
        setFilterFormError("");

        if (!filterFormType && filterFormType !== 0 && filterFormType !== "0") {
            setFilterFormError("Please select a transaction type.");
            setSubmittingFilter(false);
            return;
        }
        if (!filterFormStartDate) {
            setFilterFormError("Please select a start date.");
            setSubmittingFilter(false);
            return;
        }
        if (!filterFormEndDate) {
            setFilterFormError("Please select an end date.");
            setSubmittingFilter(false);
            return;
        }
        if (filterFormStartDate > filterFormEndDate) {
            setFilterFormError("Start date cannot be after end date.");
            setSubmittingFilter(false);
            return;
        }
        
        await fetchLedger(filterFormType, filterFormStartDate, filterFormEndDate);

        // Set the filter state for display
        setFilterType(filterFormType);
        setFilterStartDate(filterFormStartDate);
        setFilterEndDate(filterFormEndDate);

        setSubmittingFilter(false);
        setFilterFormError("");
        setShowFilter(false);
    };

    const handleDeleteTransaction = async () => {
        if (!deleteTransaction?.Id) return;
        setTransactionDeleteError("");
        setTransactionDeleteSuccess("");
        setDeletting(true);

        try {
            const session = localStorage.getItem("session");
            const sessionData = JSON.parse(session);
            const id = deleteTransaction.Id;
            const response = await fetch(
                `https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/DeleteAccountLedgerEntry/${id}`,
                { method: "DELETE",headers: {'Authorization': `Bearer ${sessionData.token}` }, }
            );

            if (!response.ok) {
                setTransactionDeleteError("Failed to delete transaction. Try again.");
                setTransactionDeleteSuccess("");
                setDeletting(false);
                return;
            }

            setTransactionDeleteSuccess("Transaction deleted successfully!");
            setTransactionDeleteError("");
            setDeleteTransaction(null);

            // Close modal
            const closeBtn = document.querySelector('#deleteTransactionModal .btn-close');
            if (closeBtn) closeBtn.click();

            // Refresh ledger
            await fetchLedger(filterType, filterStartDate, filterEndDate);
        } catch (err) {
            setTransactionDeleteError("Failed to delete transaction. Try again.");
        } finally {
            setDeletting(false);
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
            <div className="col">
                <h3 className="m-0">Ledger</h3>
                <div className="d-flex gap-3">
                    {filterType !== "" &&
                        <span className="text-secondary">
                            {filterType === 1 || filterType === "1"
                                ? 'Purchases'
                                : filterType === 2 || filterType === "2"
                                ? 'Sales'
                                : filterType === 3 || filterType === "3"
                                ? 'Expenses'
                                : 'All Transactions'}
                        </span>
                    }
                    {filterStartDate&&
                        <>
                            <span>From:</span>
                            <span className="text-secondary">
                                {filterStartDate
                                ? (() => {
                                    const d = new Date(filterStartDate);
                                    const month = d.toLocaleString('en-US', { month: 'short' });
                                    const day = d.getDate();
                                    const year = d.getFullYear();
                                    return `${month}, ${day} ${year}`;
                                })()
                                : ''}
                            </span>
                        </>
                    }
                    {filterEndDate&&
                        <>
                            <span>To:</span>
                            <span className="text-secondary">
                                {filterEndDate
                                ? (() => {
                                    const d = new Date(filterEndDate);
                                    const month = d.toLocaleString('en-US', { month: 'short' });
                                    const day = d.getDate();
                                    const year = d.getFullYear();
                                    return `${month}, ${day} ${year}`;
                                })()
                                : ''}
                            </span>
                        </>
                    }
                </div>
            </div>
            <div className="col-auto">
                <button type="button" className="btn btn-theme" data-bs-toggle="modal" data-bs-target="#transactionFormModal" onClick={() => setEditingTransaction(null)}><i className="bi bi-plus-lg me-3"></i>ADD</button>
            </div>
            <div className="col-auto">
                <button type="button" className="btn btn-theme" onClick={() => setShowFilter(true)}><i className="bi bi-funnel me-3"></i>Filter</button>
            </div>
        </div>
        {showFilter && (
            <div className="card my-3">
                <div className="card-body">
                    <form onSubmit={handleFilter}>
                        {filterFormError && <div className="alert alert-danger">{filterFormError}</div>}
                        <div className="row align-items-end">
                            <div className="col-md-4">
                                <label htmlFor="transactionType" className="form-label">Transaction Type</label>
                                <select className="form-select" name="transactionType" id="transactionType" value={filterFormType} onChange={(e) => setFilterFormType(e.target.value)}>
                                    <option value={0}>All Transactions</option>
                                    <option value={1}>Purchases</option>
                                    <option value={2}>Sales</option>
                                    <option value={3}>Expenses</option>
                                </select>
                            </div>
                            <div className="col-md-3 mt-3 mt-md-0">
                                <label htmlFor="transactedDateFrom" className="form-label">Transaction Start</label>
                                <input type="date" className="form-control" id="transactedDateFrom" value={filterFormStartDate} onChange={(e) => setFilterFormStartDate(e.target.value)} />
                            </div>
                            <div className="col-md-3 mt-3 mt-md-0">
                                <label htmlFor="transactedDateTo" className="form-label">Transaction End</label>
                                <input type="date" className="form-control" id="transactedDateTo" value={filterFormEndDate} onChange={(e) => setFilterFormEndDate(e.target.value)} />
                            </div>
                            <div className="col-md-2 gap-2 d-flex justify-content-between mt-3 mt-md-0">
                                {submittingFilter ?
                                    <div className="loader10 mb-3 mx-auto " />
                                :
                                    <>
                                        <button type="submit" className="btn btn-theme"><i className="bi bi-funnel me-3"></i>Filter</button>
                                        <button type="button" className="btn btn-outline-danger" onClick={() => setShowFilter(false)}><i className="bi bi-x-lg"></i></button>
                                    </>
                                }
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )}
        <div className="modal fade" id="transactionFormModal" tabIndex={-1} aria-labelledby="transactionFormModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        {editingTransaction ? <h5 className="modal-title" id="transactionFormModalLabel">Edit Transaction</h5> : <h5 className="modal-title" id="transactionFormModalLabel">New Transaction</h5>}
                        
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                    </div>
                    <form onSubmit={handleSubmitTransaction}>
                        <div className="modal-body">
                            {transactionFormError && <div className="alert alert-danger">{transactionFormError}</div>}
                            {transactionFormSuccess && <div className="alert alert-success">{transactionFormSuccess}</div>}
                            <label className="form-label">Transaction Type</label>
                            <div className="mb-3">
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" id="transactionType1" value="1" checked={transactionType === "1"} onChange={(e) => setTransactionType(e.target.value)} />
                                    <label className="form-check-label" htmlFor="transactionType1">Purchase</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" id="transactionType2" value="2" checked={transactionType === "2"} onChange={(e) => setTransactionType(e.target.value)} />
                                    <label className="form-check-label" htmlFor="transactionType2">Sale</label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input className="form-check-input" type="radio" id="transactionType3" value="3" checked={transactionType === "3"} onChange={(e) => setTransactionType(e.target.value)} />
                                    <label className="form-check-label" htmlFor="transactionType3">Expense</label>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="transactedAmount" className="form-label">Amount Transacted</label>
                                <input type="number" className="form-control" id="transactedAmount" placeholder="0.00" value={transactedAmount} onChange={(e) => setTransactedAmount(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="transactedDate" className="form-label">Transaction Date</label>
                                <input type="date" className="form-control" id="transactedDate" value={transactedDate} onChange={(e) => setTransactedDate(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="transactedDate" className="form-label">Transaction Narration</label>
                                <textarea className="form-control"  rows="5" value={narration} onChange={(e) => setNarration(e.target.value)}></textarea>
                            </div>
                        </div>
                        <div className="modal-footer d-flex justify-content-between">
                            {submitting ?
                                <div className="col-12 col-sm-6 col-md-4 col-lg-3 text-center">
                                    <div className="loader10 mb-3 mx-auto " />
                                </div>
                            :
                                <>
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="submit" className="btn btn-theme">Save Transaction</button>
                                </>
                            }
                            
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div className="modal fade" id="deleteTransactionModal" tabIndex={-1} aria-labelledby="deleteTransactionModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="deleteTransactionModalLabel">Delete Transaction Record</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                    </div>
                    {deleteTransaction && (
                        <>
                            <div className="modal-body">
                                {transactionDeleteError && <div className="alert alert-danger">{transactionDeleteError}</div>}
                                {transactionDeleteSuccess && <div className="alert alert-success">{transactionDeleteSuccess}</div>}
                                
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <div className="card adminuiux-card border mb-4">
                                            <div className="card-body z-index-1">
                                                <div className="row">
                                                    {deleteTransaction.TransactionType === 1 || deleteTransaction.TransactionType === "1" ?
                                                        <div className="col-auto">
                                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                                <i className="bi bi-bag h5"></i>
                                                            </div>
                                                        </div>
                                                    : deleteTransaction.TransactionType === 2 || deleteTransaction.TransactionType === "2" ?
                                                        <div className="col-auto">
                                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                                <i className="bi bi-receipt h5"></i>
                                                            </div>
                                                        </div>
                                                    : deleteTransaction.TransactionType === 3 || deleteTransaction.TransactionType === "3" ?
                                                        <div className="col-auto">
                                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                                <i className="bi bi-cash-coin h5"></i>
                                                            </div>
                                                        </div>
                                                    : 
                                                        <div className="col-auto">
                                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                                <i className="bi bi-cash-coin h5"></i>
                                                            </div>
                                                        </div>
                                                    }
                                                    <div className="col">
                                                        <div className="d-flex gap-3 mb-1">
                                                            <span>
                                                                <b>Ksh {parseFloat(deleteTransaction.Amount).toLocaleString('en-KE')}</b>
                                                            </span>
                                                            <span>|</span>
                                                            <span>{deleteTransaction.TransactionTypeTitle}</span>
                                                            <span>|</span>
                                                            <span className="text-secondary">
                                                                {deleteTransaction.TransactionDate
                                                                ? (() => {
                                                                    const d = new Date(deleteTransaction.TransactionDate);
                                                                    const month = d.toLocaleString('en-US', { month: 'short' });
                                                                    const day = d.getDate();
                                                                    const year = d.getFullYear();
                                                                    return `${month}, ${day} ${year}`;
                                                                })()
                                                                : ''}
                                                            </span>
                                                        </div>
                                                        <p className="m-0">{deleteTransaction.TransactionNarration || ''}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p>Are you sure you want to delete this transaction? Click <b>Close</b> to cancel or <b>Confirm</b> to delete the record.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer d-flex justify-content-between">
                                {deleting ?
                                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 text-center">
                                        <div className="loader10 mb-3 mx-auto " />
                                    </div>
                                :
                                    <>
                                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                        <button type="button" className="btn btn-theme" onClick={handleDeleteTransaction}>Confirm</button>
                                    </>
                                }
                                
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

      <div className="row">
        <div className="col-12 mb-4">
        </div>
        <div className="col-12">
          {ledgerTransactions?
          <>
            {ledgerTransactions.Table1 && ledgerTransactions.Table1.length > 0 && (() => {
                const totals = ledgerTransactions.Table1[0];
                const purchase = parseFloat(totals.TotalPurchases) || 0;
                const sales = parseFloat(totals.TotalSales) || 0;
                const expenses = parseFloat(totals.TotalExpenses) || 0;
                const sum = purchase + sales + expenses;

                const profitOrLoss = sales - (purchase + expenses);
                const profitOrLossPercent = sum > 0 ? ((profitOrLoss / sum) * 100).toFixed(1) : "0.0";

                const percent = (val) => sum > 0 ? ((val / sum) * 100).toFixed(1) : "0.0";

                return (
                    <div className="row">
                        <div className="col-md-3 mb-3">
                            <div className="card adminuiux-card mb-4">
                                <div className="card-body z-index-1">
                                    <div className="row">
                                        <div className="col-auto">
                                            <div className="avatar avatar-60 bg-success-subtle text-success rounded">
                                                <i className="bi bi-bag h4" />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4 className="fw-medium">
                                                Ksh {purchase.toLocaleString('en-KE')}
                                            </h4>
                                            <p className="text-secondary">
                                                Purchases 
                                                <span className="text-success fs-14 ms-2">
                                                    <i className="bi bi-opencollective" /> {percent(purchase)}%
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card adminuiux-card mb-4">
                                <div className="card-body z-index-1">
                                    <div className="row">
                                        <div className="col-auto">
                                            <div className="avatar avatar-60 bg-success-subtle text-success rounded">
                                                <i className="bi bi-receipt h4" />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4 className="fw-medium">
                                                Ksh {sales.toLocaleString('en-KE')}
                                            </h4>
                                            <p className="text-secondary">
                                                Sales 
                                                <span className="text-success fs-14 ms-2">
                                                    <i className="bi bi-opencollective" /> {percent(sales)}%
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card adminuiux-card mb-4">
                                <div className="card-body z-index-1">
                                    <div className="row">
                                        <div className="col-auto">
                                            <div className="avatar avatar-60 bg-success-subtle text-success rounded">
                                                <i className="bi bi-cash-coin h4" />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4 className="fw-medium">
                                                Ksh {expenses.toLocaleString('en-KE')}
                                            </h4>
                                            <p className="text-secondary">
                                                Expenses 
                                                <span className="text-success fs-14 ms-2">
                                                    <i className="bi bi-opencollective" /> {percent(expenses)}%
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className={`card adminuiux-card mb-4 ${profitOrLoss >= 0 ? 'border-success' : 'border-danger'}`}>
                                <div className="card-body z-index-1">
                                    <div className="row">
                                        <div className="col-auto">
                                            <div className={`avatar avatar-60 rounded ${profitOrLoss >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                <i className={`bi ${profitOrLoss >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'} h4`} />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <h4 className="fw-medium">
                                                Ksh {profitOrLoss.toLocaleString('en-KE')}
                                            </h4>
                                            <p className={`text-${profitOrLoss >= 0 ? 'success' : 'danger'}`}>
                                                {profitOrLoss >= 0 ? 'Profit' : 'Loss'}
                                                <span className={`ms-2 fs-14 text-${profitOrLoss >= 0 ? 'success' : 'danger'}`}>
                                                    <i className="bi bi-opencollective" /> {profitOrLossPercent}%
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
            
            {ledgerTransactions.Table && ledgerTransactions.Table.length > 0 && (
                <div>
                    {ledgerTransactions.Table.map((txn, idx) => (
                        <div className="card mb-3" key={txn.ID || idx}>
                            <div className="card-body">
                                <div className="row align-items-center">
                                    {txn.TransactionType === 1 || txn.TransactionType === "1" ?
                                        <div className="col-auto">
                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                <i className="bi bi-bag h5"></i>
                                            </div>
                                        </div>
                                    : txn.TransactionType === 2 || txn.TransactionType === "2" ?
                                        <div className="col-auto">
                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                <i className="bi bi-receipt h5"></i>
                                            </div>
                                        </div>
                                    : txn.TransactionType === 3 || txn.TransactionType === "3" ?
                                        <div className="col-auto">
                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                <i className="bi bi-cash-coin h5"></i>
                                            </div>
                                        </div>
                                    : 
                                        <div className="col-auto">
                                            <div className="avatar avatar-50 bg-success-subtle text-success rounded">
                                                <i className="bi bi-cash-coin h5"></i>
                                            </div>
                                        </div>
                                    }
                                    <div className="col">
                                        <div className="d-flex gap-3 mb-1">
                                            <span>
                                                <b>Ksh {parseFloat(txn.Amount).toLocaleString('en-KE')}</b>
                                            </span>
                                            <span>|</span>
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
                                        </div>
                                        <p className="m-0">{txn.TransactionNarration || ''}</p>
                                    </div>
                                    <div className="col-md-auto mt-3 mt-md-0 d-flex gap-2 justify-content-between">
                                        <button className="btn btn-outline-theme">{txn.TransactionTypeTitle}</button>
                                        <button
                                            className="btn btn-sm btn-outline-warning"
                                            data-bs-toggle="modal"
                                            data-bs-target="#transactionFormModal"
                                            onClick={() => setEditingTransaction(txn)}
                                        >
                                            <i className="bi bi-pencil-square me-2"></i> Edit
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            data-bs-toggle="modal"
                                            data-bs-target="#deleteTransactionModal"
                                            onClick={() => setDeleteTransaction(txn)}
                                        >
                                            <i className="bi bi-trash me-2"></i> Delete
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
              No Transactions found...
            </div>
          </>}
          
        </div>
      </div>
    </div>
  );
}

export default Ledger;
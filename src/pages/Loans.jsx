import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Loans = ({logout}) => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
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
      fetchLoans();
    }
  }, [userId]);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    const session = localStorage.getItem("session");
    const sessionData = JSON.parse(session);
    try {
      const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/Loans?Limit=${limit}&Offset=${offset}`, {
          method: 'GET',
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
          setLoans(data);
        }else{
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getCardClasses = (loan) => {
    let classes = "card adminuiux-card mb-4";
    if (loan.LoanStatus === "PENDING") {
      classes = "card border-theme-1 theme-yellow mb-4";
    } else if (loan.LoanStatus === "COMPLETED") {
      classes = "card border-theme-1 theme-green overflow-hidden mb-4";
    }
    return classes;
  };

  const getCardBodyClasses = (loan) => {
    let classes = "card-body z-index-1";
    if (loan.LoanStatus === "COMPLETED") {
      classes = "card-body z-index-1 bg-theme-1-subtle";
    }
    return classes;
  };

  const getTitleClasses = (loan) => {
    return loan.LoanStatus === "PENDING" || loan.LoanStatus === "COMPLETED"
      ? "style-none text-theme-1"
      : "style-none";
  };

  if (loading) {
    return <div className="container mt-4" id="main-content"><div className="loader10" /></div>;
  }

  if (error) {
    return <div className="container mt-4" id="main-content">Failed: {error.message}</div>;
  }

  return (
    <div className="container mt-4" id="main-content">
      <div className="input-group mb-4">
        <input
          className="form-control border-end-0"
          placeholder="Search Loans"
        />
        <button className="btn btn-lg btn-theme btn-square">
          <i className="bi bi-search"></i>
        </button>
      </div>
      <div className="row">
        <div className="col-12 mb-4">
        </div>
        <div className="col-12">
          {loans && loans.length>0?
          <>
            {/* <h6>Showing '{loans.length}' search result...</h6> */}
            <div className="row">
              {loans.map((loan) => (
                <div className="col-md-6 mb-3" key={loan.id}>
                  <div className={getCardClasses(loan)}>
                    <div className="card-header border-bottom">
                      <div className="row gx-3 align-items-center">
                        <div className="col-auto">
                          <div className="avatar avatar-50 bg-theme-1-subtle text-theme-1 rounded">
                            <i className="bi bi-wallet2 h5"></i>
                          </div>
                        </div>
                        <div className="col">
                          <a href="#" className={getTitleClasses(loan)}>
                            <h5 className="mb-0">{loan.ProductName}</h5>
                          </a>
                          <p className="text-secondary small">
                            Loan Account: #{loan.id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={getCardBodyClasses(loan)}>
                      <div className="row gx-3 align-items-center">
                        <div className="col">
                          <h4 className="fw-medium mb-0">
                            {loan.LoanBalanceFormated}
                          </h4>
                          <p className="text-secondary small">
                            {loan.LoanStatus === "COMPLETED"
                              ? `Loan completed on ${loan.DateCleared}` // Assuming DateCleared exists, adjust as needed
                              : `Installment: ${loan.InstallmentFormated} | Status: ${loan.LoanStatus}`}
                          </p>
                        </div>
                        <div className="col-auto">
                          <Link to={`/loan/${loan.id}`} className="btn btn-square btn-link">
                            <i className="bi bi-arrow-right"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {loans.length>=limit&&
              <div className="col-12 text-center mb-4">
                <a href="#" className="btn btn-link">
                  Load more...
                </a>
              </div>
            }
          </>
          :
          <>
            <div className="col-12 text-center mb-4">
              No loans found, <Link to="/loans" className="btn btn-link">Apply Loan</Link>
            </div>
          </>}
          
        </div>
      </div>
    </div>
  );
}

export default Loans;
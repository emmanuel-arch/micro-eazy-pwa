import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Updates() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [userId, setUserId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);


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
    try {
        const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/GetNotifications`, {
            method: 'POST',
            headers: {
                accept: 'text/plain',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userId),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setLoans(data);
    } catch (err) {
        setError(err);
    } finally {
        setLoading(false);
    }
  };

  const getCardClasses = (loan) => {
    let classes = "list-group-item border mb-3 p-3";
    if (loan.IsRead === 0) {
      classes = "list-group-item p-3 mb-3 bg-light";
    }
    return classes;
  };

  const getIconClasses = (loan) => {
    return loan.IsRead === 0
      ? "bi bi-bell text-yellow align-middle"
      : "bi bi-bell text-secondary align-middle";
  };

  function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);

    if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    if (diffMonth < 3) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;

    // If more than 3 months ago, show formatted date
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

  const handleOpenModal = async (loan) => {
    setSelectedLoan(loan);
    setShowModal(true);

    if(loan.IsRead === 0) {
        // Post notification update (mark as read)
        try {
            const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/UpdateNotification`, {
                method: 'POST',
                headers: {
                    accept: 'text/plain',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loan.id),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setLoans(loans =>
                loans.map(l =>
                    l.id === loan.id ? { ...l, IsRead: 1 } : l
                )
            );
        } catch (err) {
            // Optionally handle error
            console.error("Failed to update notification:", err);
        }
    }
};

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mt-4" id="main-content">
        <div className="row">
            <div className="col-12">
                {loans && loans.length>0?
                    <>
                        <div className="list-group adminuiux-list-group list-group-flush hover-highlight-list bg-none">
                            {loans.map((loan) => (
                                <div 
                                    className={getCardClasses(loan)} 
                                    key={loan.id}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleOpenModal(loan)}>
                                    <div className="row gx-3">
                                        <div className="col-auto align-self-center">
                                            <i className={getIconClasses(loans)}></i>
                                        </div>
                                        <div className="col">
                                            <div className="d-flex align-items-center">
                                                <p className="mb-0 flex-grow-1">{loan.fcmTitle}</p>
                                                <span>{timeAgo(loan.DateSend)}</span>
                                            </div>
                                            <p className="m-0 text-secondary">{loan.fcmBody}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Modal */}
                        {showModal && selectedLoan && (
                            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <div className="d-flex">
                                                <div className="avatar avatar-50 bg-theme-1-subtle text-theme-1 rounded">
                                                    <i className="bi bi-bell h5"></i>
                                                </div>
                                                <div className="flex-grow-1 ms-2">
                                                    <h5 className="modal-title mb-0">{selectedLoan.fcmTitle}</h5>
                                                    <small className="text-secondary">{timeAgo(selectedLoan.DateSend)}</small>
                                                </div>
                                            </div>
                                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            <p>{selectedLoan.fcmBody}</p>
                                        </div>
                                        {/* <div className="modal-footer">
                                            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                            Close
                                            </button>
                                        </div> */}
                                    </div>
                                </div>
                                {/* Modal backdrop */}
                                {/* <div className="modal-backdrop fade show"></div> */}
                            </div>
                        )}
                    </>
                :
                <>
                    <div className="col-12 text-center mb-4">
                        No notifications found...
                    </div>
                </>}
            </div>
        </div>
    </div>
  );
}

export default Updates;
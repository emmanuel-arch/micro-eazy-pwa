import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Link, useNavigate } from "react-router-dom";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function TopLoans() {
  const [userId, setuserId] = useState("");
  const [loansData, setLoansData] = useState([]); // Initialize as an empty array
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("session");
    if (session) {
      const parsedSession = JSON.parse(session);
      setuserId(parsedSession?.userId);
    }

    fetchLoansData("1").then(() => {
      setIsLoading(false);
    });
  }, [userId]);

  const fetchLoansData = async (origin) => {
    ///console.log("Request Origin", origin);

    const session = localStorage.getItem("session");
    const sessionData = JSON.parse(session);

    if (sessionData.userId) {
      try {
        const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/Loans?Limit=10&Offset=0`, {
            method: 'GET',
            headers: {
            accept: 'text/plain',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionData.token}`
            },
            // body: JSON.stringify(sessionData.userId),
        });

        if (response.ok) {
          const newToken = response.headers.get('X-New-Token');
          if (newToken) {
              sessionData.token = newToken;
              localStorage.setItem('session', JSON.stringify(sessionData));
          }

          const data = await response.json();
          console.log("Loans Data: ", data);
          setLoansData(data);
        } else {
          console.error("Failed to fetch loans data");
        }
      } catch (error) {
        console.error("Error fetching loans data:", error);
      }
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Swiper
      spaceBetween={20}
      slidesPerView={1}
      breakpoints={{
        768: { slidesPerView: 2 },
        1200: { slidesPerView: 3 },
      }}
      navigation={false}
      pagination={{ clickable: true }}
      modules={[Navigation, Pagination]}
    >
      {loansData.map((loan) => (
        <SwiperSlide key={loan.id}>
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
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export default TopLoans;
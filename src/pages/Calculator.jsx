import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

function Calculator() {
    const [userId, setUserId] = useState(null);
    const [loanProducts, setLoanProducts] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const swiperRef = useRef(null);
    const [loanAmount, setLoanAmount] = useState('');
    const [loanSchedule, setLoanSchedule] = useState(null);

    useEffect(() => {
        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);
        console.log("Calculator Session Data: ", sessionData);
        setUserId(sessionData?.userId);

        if (sessionData?.userId) {
            getLoanProducts();
        }
    }, []);

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
                    },
                    body: JSON.stringify({
                        PhoneNumber: `${sessionData.userId}`,
                        EntityId: parseInt(sessionData.userId),
                        RequestFlag: 0,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Loan Products", data);
                    setLoanProducts(data);
                } else {
                    console.error("Failed to fetch loan products");
                }
            } catch (error) {
                console.error("Error fetching loan products:", error);
            }
        }
    };

    const handleProductSelection = (product) => {
        setSelectedProduct(product);
        setLoanSchedule(null);
    };

    const handleLoanAmountChange = (e) => {
        setLoanAmount(e.target.value);
    };

    const handleCalculateLoan = async () => {
        if (!selectedProduct || !loanAmount) return;

        const storedConfigurationData = localStorage.getItem('configuration');
        const configurationDataJson = JSON.parse(storedConfigurationData);
        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);

        try {
            const response = await fetch("https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/LoanPreview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId: selectedProduct.ID,
                    principal: parseFloat(loanAmount),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Loan Schedule", data);
                setLoanSchedule(data);
            } else {
                console.error("Failed to fetch loan schedule");
            }
        } catch (error) {
            console.error("Error fetching loan schedule:", error);
        }
    };

    return (
        <div className="container mt-4" id="main-content">
            <div className="card mb-4">
                <div className="card-body pb-0">
                    <div className='swiper-container'>
                        {loanProducts && loanProducts.length > 0 && (
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
                                    {loanProducts.map((product) => (
                                        <SwiperSlide key={product.ID}>
                                            <div
                                                className={`card selectable anyone mb-3 ${selectedProduct?.ID === product.ID ? 'active' : ''}`}
                                                onClick={() => handleProductSelection(product)}
                                            >
                                                <div className="card-body pb-0">
                                                    <div className="row align-items-center mb-3">
                                                        <div className="col">
                                                            <h5 className="mb-0 fw-medium">{product.ProductName}</h5>
                                                            <p className="small text-secondary">{product.ProductDesc.substring(0, 35)}...</p>
                                                        </div>
                                                        <div className="col-auto text-end">
                                                            <h5 className="mb-1">{product.InterestTypeValue}</h5>
                                                            <p className="small text-secondary">{product.methodName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="row align-items-center">
                                                        <div className="col mb-0">
                                                            <p className="mb-0"><i className="bi bi-calendar-event me-1"></i> {product.RepaymentPeriod} {product.RepaymentPeriodName}(s)</p>
                                                            {/* <p className="small text-secondary">
                                                                <i className="bi bi-calendar-event me-1"></i> {product.RepaymentPeriod} {product.RepaymentPeriodName}(s)
                                                            </p> */}
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
                                    ))}
                                </Swiper>
                                <div className="swiper-button-prev" onClick={() => swiperRef.current.swiper.slidePrev()}>
                                    <i className='bi bi-arrow-left'></i>
                                </div>
                                <div className="swiper-button-next" onClick={() => swiperRef.current.swiper.slideNext()}>
                                    <i className='bi bi-arrow-right'></i>
                                </div>
                            </>
                        )}
                    </div>

                    {selectedProduct && (
                        <div className="row align-items-center mb-4 mt-3">
                            <div className="col-auto">
                                <div className="avatar avatar-60 rounded bg-theme-1-subtle text-theme-1">
                                    <i className="bi bi-wallet2 h1"></i>
                                </div>
                            </div>
                            <div className="col">
                                <h5 className="text-theme-1 mb-1">{selectedProduct.ProductName}</h5>
                                <p className="text-secondary">{selectedProduct.RepaymentPeriod} {selectedProduct.RepaymentPeriodName}(s)</p>
                            </div>
                            <div className="col-auto text-end">
                                <h5 className="text-success mb-1">{selectedProduct.InterestTypeValue}</h5>
                                <p className="text-secondary small">{selectedProduct.methodName}</p>
                            </div>
                            <div className='col-md-6'>
                                <div className='bg-theme p-2 rounded'>
                                    <small>Enter Loan amount and continue</small>
                                    <div className="input-group mt-1">
                                        <span className="input-group-text" id="basic-addon1">Ksh</span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Loan amount"
                                            aria-label="0.00"
                                            aria-describedby="basic-addon1"
                                            value={loanAmount}
                                            onChange={handleLoanAmountChange}
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            id="button-addon2"
                                            onClick={handleCalculateLoan}
                                        >
                                            Calculate<i className="bi bi-plus-circle ms-2"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {loanSchedule && loanSchedule.Table && loanSchedule.Table.length > 0 && (
                <>
                    <div className='row'>
                        <div className='col-md-5'>
                            <div className='card mb-4'>
                                <div className="card-header"><h6>Overview</h6></div>
                                <div className='card-body'>
                                    <div className='row'>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].PrincipleFormated}</h6>
                                            <p className="small opacity-75">Principal</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].LoanAmountFormated}</h6>
                                            <p className="small opacity-75">Total Loan</p>
                                        </div>
                                        {/* <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].InterestAmountFormated}</h6>
                                            <p className="small opacity-75">Interest</p>
                                        </div> */}
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].UpFrontChargesFormated}</h6>
                                            <p className="small opacity-75">Upfront Charges</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].DeductedFormated}</h6>
                                            <p className="small opacity-75">Deducted Charges</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].ProratedFormated}</h6>
                                            <p className="small opacity-75">Prorated Charges</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].InstallmentAmountFormated}</h6>
                                            <p className="small opacity-75">Installment</p>
                                        </div>
                                        <div className="col-6 mb-4">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].Installments}</h6>
                                            <p className="small opacity-75">Duration</p>
                                        </div>
                                        <div className="col-6">
                                            <h6 className="mb-1">{loanSchedule?.Table[0].ExpectedClearDateFormated}</h6>
                                            <p className="small opacity-75">Clear Date</p>
                                        </div>
                                        {/* <div className='col-6'>
                                            <button type="button" className="btn btn-outline-theme">Apply <i class="bi bi-arrow-up-right-circle ms-3"></i></button>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='col-md-7'>
                            {loanSchedule && loanSchedule.Table1 && loanSchedule.Table1.length > 0 && (
                                <div className='card mb-4'>
                                    <div className='card-body'>
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>#REF</th>
                                                        {/* <th>Principal</th>
                                                        <th>Interest</th> */}
                                                        <th>Amount</th>
                                                        <th>Due Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loanSchedule.Table1.map((installment, index) => (
                                                        <tr key={index}>
                                                            <td>{installment.InstallmentNumber}</td>
                                                            {/* <td>{installment.InstallmentPrincipleFormated}</td>
                                                            <td>{installment.InstallmentInterestFormated}</td> */}
                                                            <td>{installment.InstallmentAmountFormated}</td>
                                                            <td>{installment.DueDateFormated}</td>
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
                </>
            )}

            {/* Swiper Custom Styles */}
            <style jsx>{`
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

export default Calculator;
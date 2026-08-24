import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import GoogleDriveImage from '../sections/GoogleDriveImage';

function Account(profileOptions) {
    const [name, setName] = useState("");
    const [userId, setuserId] = useState("");
    const [AccountData, setAccountData] = useState("");
    const [borrowerPhotoUrl, setBorrowerPhotoUrl] = useState(null);
    const [nationalIdFrontPhotoUrl, setnationalIdFrontPhotoUrl] = useState(null);
    const [nationalIdBackPhotoUrl, setnationalIdBackPhotoUrl] = useState(null);
    const [passportPhotoUrl, setPassportPhotoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const session = localStorage.getItem("session");
        if (session) {
            const parsedSession = JSON.parse(session);
            setName(parsedSession.name);
            setuserId(parsedSession?.userId);
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

                const newToken = response.headers.get('X-New-Token');
                if (newToken) {
                    sessionData.token = newToken;
                    localStorage.setItem('session', JSON.stringify(sessionData));
                }
        
                if (response.ok) {
                    const data = await response.json();
                    console.log("Account Data: ",data)
                    setAccountData(data);

                    if(data?.Table[0]?.borrowerPhoto){fetchImage(data?.Table[0]?.borrowerPhoto,1)};
                    if(data?.Table[0]?.idFrontPhoto){fetchImage(data?.Table[0]?.idFrontPhoto,2)};
                    if(data?.Table[0]?.idBackPhoto){fetchImage(data?.Table[0]?.idBackPhoto,3)};
                    if(data?.Table[0]?.passportPhoto){fetchImage(data?.Table[0]?.passportPhoto,4)};
                } else {
                    console.error("Failed to fetch onboarding settings");
                }
            } catch (error) {
                console.error("Error fetching onboarding settings:", error);
            }
        }
    };

    const fetchImage = async (fileId,type) => {
        try {
          const response = await fetch(`https://micromartafrica.co.ke/MicromartAPI/api/app/ViewImage?fileid=${fileId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch image from Google Drive.');
          }
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);

          if(type===1){
            setBorrowerPhotoUrl(objectUrl);
          }

          if(type===2){
            setnationalIdFrontPhotoUrl(objectUrl);
          }

          if(type===3){
            setnationalIdBackPhotoUrl(objectUrl);
          }
          
          if(type===4){
            setPassportPhotoUrl(objectUrl);
          }
        } catch (err) {
          //setError(err);
        } finally {
          ///setLoading(false);
        }
    };

    const displayRecordItem = (formId, formDetails) => {
        if (formDetails.formId === formId) {
          // No async operations inside this function
          return (
            <>
                {formDetails.stringValue&&
                    <div className="col-md-6 pl-3 border-start border-3 mb-4"  key={formDetails.ID}>
                        <p className="m-0 fw-semibold">{formDetails.stringValue}</p>
                        <em>{formDetails.profileTitle}</em>
                    </div>
                }
            </>
          );
        } else {
          return null;
        }
    };

    return (
        <div className="container mt-0" id="main-content">
            <div className="position-relative w-100 z-index-0 mb-4 pt-5">
                <div className="coverimg h-100 w-100 rounded start-0 top-0 position-absolute overlay-gradiant overflow-hidden" style={{backgroundImage: 'url("assets/img/17744.jpg")'}}>
                    <img src="assets/img/17744.jpg" alt style={{display: 'none'}} />
                </div>
                <br /><br />
                <div className="w-100 p-3 bottom-0 position-relative z-index-1">
                    {/* <figure className="avatar avatar-140 rounded bg-white p-3 mb-4">
                    <img src="assets/img/logo-512.png" alt className="w-100 d-block" />
                    </figure> */}
                    {borrowerPhotoUrl?
                        <figure
                            className="avatar avatar-140 rounded bg-white p-3 mb-4"
                        >
                            <img
                            src={`${borrowerPhotoUrl}`}
                            alt=""
                            className="w-100 d-block"
                            />
                        </figure>
                    :
                    <>
                        {AccountData && AccountData?.Table[0]?.Gender===1?
                            <figure
                                className="avatar avatar-140 rounded bg-white p-3 mb-4"
                            >
                                <img
                                src="url(assets/img/male.svg)"
                                alt=""
                                className="w-100 d-block"
                                />
                            </figure>
                        :
                            <figure
                                className="avatar avatar-140 rounded bg-white p-3 mb-4"
                            >
                                <img
                                    src="url(assets/img/female.svg)"
                                    alt=""
                                    className="w-100 d-block"
                                />
                            </figure>
                        }
                    </>
                    }
                    {AccountData&&
                        <div className="row text-white align-items-end">
                            <div className="col-12 col-md mb-3 mb-md-0">
                                <h4>{AccountData?.Table[0]?.firstName} {AccountData?.Table[0]?.otherName}</h4>
                                <p className="opacity-75"><i class="bi bi-person-bounding-box"></i> {AccountData?.Table[0]?.AccountNo} 
                                    <span className="mx-2">|</span> <i className="bi bi-clock"></i> {AccountData?.Table[0]?.StatusTitle} 
                                    {/* <span className="mx-2">|</span> <i className="bi bi-coin"></i> {AccountData?.Table[0]?.LoanLimitFormated} */}
                                </p>
                            </div>
                            <div className="col-12 col-md-auto text-md-end">
                                <div className="d-flex flex-wrap justify-content-between justify-content-md-end">
                                    <button className="btn btn-light mx-2 mb-1">
                                        <i class="bi bi-award"></i> <span>{AccountData?.Table[0]?.CreditScore} POINTS</span>
                                    </button>
                                    {/* <button className="btn btn-light mb-1">
                                        <i className="bi bi-coin"></i> <span>Message</span>
                                    </button> */}
                                    <Link to="/settings" className="btn btn-square btn-light align-middle mb-1"><i class="bi bi-gear"></i></Link>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>

            <div className="row">
                <div className="col-12 col-md-12 col-lg-12 col-xxl-8">
                    {AccountData&&
                    <>
                        <div className="row align-items-center mb-4">
                            <div className="col-md-4 mb-3">
                                <h5 className="mb-1">{AccountData?.Table[0]?.NationalID}</h5>
                                <p className="text-secondary small">
                                    <i className="bi bi-person-vcard"></i> National ID
                                </p>
                            </div>
                            {AccountData?.Table[0]?.EmailAddress&&
                                <div className="col-md-4 mb-3">
                                    <h5 className="mb-1">{AccountData?.Table[0]?.EmailAddress}</h5>
                                    <p className="text-secondary small">
                                        <i className="bi bi-envelope-at"></i> Email Address
                                    </p>
                                </div>
                            }
                            {AccountData?.Table[0]?.PostalAddress&&
                                <div className="col-md-4 mb-3">
                                    <h5 className="mb-1">{AccountData?.Table[0]?.PostalAddress}</h5>
                                    <p className="text-secondary small">
                                        <i className="bi bi-envelope-arrow-down"></i> Postal Address
                                    </p>
                                </div>
                            }
                            {AccountData?.Table[0]?.PhysicalAddress&&
                                <div className="col-md-4 mb-3">
                                    <h5 className="mb-1">{AccountData?.Table[0]?.PhysicalAddress}</h5>
                                    <p className="text-secondary small">
                                        <i className="bi bi-geo-alt"></i> Physical Address
                                    </p>
                                </div>
                            }
                            {AccountData?.Table[0]?.GenderTitle&&
                                <div className="col-md-4 mb-3">
                                    <h5 className="mb-1">{AccountData?.Table[0]?.GenderTitle}</h5>
                                    <p className="text-secondary small">
                                        {AccountData?.Table[0]?.Gender===1?<i className="bi bi-gender-male"></i>:<i className="bi bi-gender-female"></i>} Gender
                                    </p>
                                </div>
                            }
                            {AccountData?.Table[0]?.Age&&
                                <div className="col-md-4 mb-3">
                                    <h5 className="mb-1">{AccountData?.Table[0]?.Age} <small>yr</small></h5>
                                    <p className="text-secondary small">
                                        <i className="bi bi-cake me-1"></i> {AccountData?.Table[0]?.DOB}
                                    </p>
                                </div>
                            }
                        </div>
                        {AccountData?.Table2?.length > 0 && AccountData?.Table3?.length > 0 && (
                            <div className="accordion" id="accordionExample">
                                {AccountData.Table2.map((form) => (
                                    <div className="accordion-item" key={form.ID}>
                                        <div className="accordion-header">
                                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={'#collapse'+form.ID} aria-expanded="false" aria-controls={'collapse'+form.ID}>
                                                {form.Title}
                                            </button>
                                        </div>
                                        <div id={'collapse'+form.ID} className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                                            <div className="accordion-body px-4">
                                                <div className="row">
                                                    {AccountData.Table3.filter(
                                                        (formDetails) => formDetails.formId === form.ID
                                                    ).map((formDetails) => (
                                                        displayRecordItem(form.ID, formDetails)
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>}
                </div>
                <div className="col-12 col-md-12 col-lg-12 col-xxl-4 position-sticky">
                    <div className="row">
                        {nationalIdFrontPhotoUrl&&
                            <div className="col-6">
                                <div className="card">
                                    <img src={nationalIdFrontPhotoUrl} className="card-img-top" alt="National ID - Front" />
                                    <div className="card-body">
                                        <p className="card-title">National ID - Front</p>
                                    </div>
                                </div>
                            </div>
                        }
                        {nationalIdBackPhotoUrl&&
                            <div className="col-6">
                                <div className="card">
                                    <img src={nationalIdBackPhotoUrl} className="card-img-top" alt="National ID - Front" />
                                    <div className="card-body">
                                        <p className="card-title">National ID - Back</p>
                                    </div>
                                </div>
                            </div>
                        }
                        {passportPhotoUrl&&
                            <div className="col-6">
                                <div className="card">
                                    <img src={passportPhotoUrl} className="card-img-top" alt="National ID - Front" />
                                    <div className="card-body">
                                        <p className="card-title">Passport Photo</p>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Account;
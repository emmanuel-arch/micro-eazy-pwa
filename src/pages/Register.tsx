import React, { useEffect, useState, useRef } from "react";
import { ENTITY_ID } from '../lib/tenant';
import { Link, UNSAFE_getPatchRoutesOnNavigationFunction, useNavigate } from "react-router-dom";
import { type OnboardingSettings }  from "./formsections/OnboardingSettings";
import { useForm, SubmitHandler, FieldName, set } from 'react-hook-form';
import OnboardingValidationRules from './formsections/OnboardingValidationRules'; 
import IntroSlider from '../components/IntroSlider';
import OnboardingID from './segments/OnboardingID';
import Terms from './Terms';

interface RegisterFormData {
    firstName: string;
    otherName: string;
    dob: string;
    gender: string;
    nationalID: string;
    phone: string;
    emailAddress: string;
    password?: string;
    confirmPassword?: string;
    postalAddress: string;
    physicalAddress: string;
    acceptTerms?: boolean;
}

interface OcrResponse {
  filePath: string;
  extractedText: string;
  idInfo: {
    idNumber: string;
    surname: string;
    givenNames: string;
    sex: string;
    dateOfBirth: string;
  };
}

interface Office {
    unitid: number;
    UnitTitle: string;
    latitude: number;
    longitude: number;
    radius: number;
}

interface ValidationRules {
    [fieldName: string]: {
      required?: string;
      unique?: string;
      pattern?: {
        value: RegExp;
        message: string;
      };
      validate?: (value: any) => boolean | string;
      // Add other possible validation rules here as needed
    };
}

type Location = {
    latitude: number | null;
    longitude: number | null;
};

const Register = ({ setUserSession }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [step, setStep] = useState(0);
    const [photoStep, setPhotoStep] = useState(1);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState('assets/img/id_front.png');
    const [uploadError, setUploadError] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedIdFront, setUploadedIdFront] = useState<File | null>(null);
    const [ocrData, setOcrData] = useState<OcrResponse | null>(null);
    const [uploadedIdBack, setUploadedIdBack] = useState<File | null>(null);
    const [uploadedSelfie, setUploadedSelfie] = useState<File | null>(null);
    const [ocrLockedFields, setOcrLockedFields] = useState<string[]>([]);
    const navigate = useNavigate();
    const [validationRules, setValidationRules] = useState<ValidationRules | null>(null);
    const [hidePassword, setHidePassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [onboardingSettings, setOnboardingSettings] = useState<OnboardingSettings | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);
    const [onboardingError, setOnboardingError] = useState<string | null>(null);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [location, setLocation] = useState<Location>({
        latitude: null,
        longitude: null,
      });
    const [locationErrorMessage, setLocationErrorMessage] = useState("");
    const [offices, setOffices] = useState<Office[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [referralCode, setReferralCode] = useState("");

    const [showTermsModal, setShowTermsModal] = useState(false);
    
    const entityId = ENTITY_ID;

    const getUserLocation = () => {
        if (!navigator.geolocation) {
          setLocationErrorMessage("Geolocation is not supported by your browser.");
          return;
        }
    
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationEnabled(true);
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationErrorMessage("");
          },
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                setLocationErrorMessage("Location permission denied. Please enable it in settings.");
                setLocationEnabled(false);
                break;
              case error.POSITION_UNAVAILABLE:
                setLocationErrorMessage("Location unavailable. Please check your device settings.");
                break;
              case error.TIMEOUT:
                setLocationErrorMessage("Location request timed out.");
                break;
              default:
                setLocationErrorMessage("An unknown error occurred.");
                break;
            }
          }
        );
    };

    useEffect(() => {
        getUserLocation();
    }, []);

    const { register, handleSubmit, formState: { errors }, trigger, watch, setValue } = useForm<RegisterFormData>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
    });

    useEffect(() => {
        const fetchOnboardingSettings = async () => {
            try {
                const response = await fetch(
                    "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/OnboardingSettings",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            phoneNumber: "",
                            entityId: parseInt(entityId),
                            requestFlag: 0,
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setOnboardingSettings(data);

                    console.log("Onboarding Settings:", data); // Check settings data
                    const rules: Record<string, any> = OnboardingValidationRules(data);
                    setValidationRules(rules);
                    console.log("Validation rules:", rules); // Check generated rules
                } else {
                    console.error("Failed to fetch onboarding settings");
                }
            } catch (error) {
                console.error("Error fetching onboarding settings:", error);
            }
        };

        const fetchOffices = async () => {
            try {
              const response = await fetch(
                "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/GetOfficesList", // Replace with actual endpoint
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    phoneNumber: "",
                    entityId: parseInt(entityId),
                    requestFlag: 0,
                }),
                }
              );
          
              if (response.ok) {
                const data: Office[] = await response.json(); // use the Office interface
                setOffices(data);
          
                console.log("Fetched Offices:", data);
              } else {
                console.error("Failed to fetch offices");
              }
            } catch (error) {
              console.error("Error fetching offices:", error);
            }
        };
        
        if (entityId) {
            fetchOnboardingSettings();
            fetchOffices();
        }
    }, []);

    const findUserOffice = (
    userLat: number,
    userLng: number,
    offices: Office[]
    ): Office | null => {
    console.log("Find nearest branch for user location:", userLat, userLng);

    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Earth radius in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);
        const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in km
    };

    let closestOffice: Office | null = null;
    let minDistance = Infinity;

    for (const office of offices) {
        const distance = haversineDistance(
        userLat,
        userLng,
        office.latitude,
        office.longitude
        );

        console.log("Branch Distance:", office.UnitTitle, office.longitude, office.latitude, distance);

        // Check if the office is within the radius and has the shortest distance
        if (distance <= office.radius && distance < minDistance) {
        closestOffice = office;
        minDistance = distance;
        }
    }

    if (closestOffice) {
        console.log("Closest Branch Found:", closestOffice.UnitTitle, closestOffice.longitude, closestOffice.latitude, minDistance);
    } else {
        console.log("No branch found within the radius.");
    }

    return closestOffice; // Returns the closest office within the radius, or null if none found
    };

    const handleOfficeChange = (unitid: number) => {
        const office = offices.find((o) => o.unitid === unitid) || null;
        setSelectedOffice(office);
    };
    
    const nextStep = async () => {
        let fieldsToValidate: FieldName<RegisterFormData>[] = [];

        switch (step) {
            case 1:
                fieldsToValidate = ["firstName", "otherName", "dob", "gender", "nationalID", "phone", "emailAddress", "postalAddress", "physicalAddress"];
                console.log("Fields to validate:", fieldsToValidate);

                const isValid = await trigger(fieldsToValidate);

                console.log("Validation result:", isValid);
                console.log("Errors:", errors);

                if (isValid) {
                    setOnboardingError("");

                    const nearestOffice = findUserOffice(location.latitude!, location.longitude!, offices);

                    if (nearestOffice == null) {
                        setStep(step + 1);
                    } else {
                        setSelectedOffice(nearestOffice); // Update the state with the nearest office
                        setStep(step + 2);
                    }
                } else {
                    setOnboardingError("Validations failed, correct to continue");
                    console.log("Validation failed for step:", step);
                }
                break;
            case 2:
                if(selectedOffice==null) {
                    setOnboardingError("Select branch to proceed.");
                    console.log("Validation failed for step:", step);
                }else{
                    setStep(step + 1);
                }
                break;
            case 4:
                fieldsToValidate = ["password", "confirmPassword"];
                console.log("Fields to validate:", fieldsToValidate);

                const passwordValid = await trigger(fieldsToValidate);

                console.log("Validation result:", passwordValid);
                console.log("Errors:", errors);

                if (passwordValid) {
                    setStep(step + 1);
                    setOnboardingError("");
                } else {
                    setOnboardingError("Validations failed, correct to continue");
                    console.log("Validation failed for step:", step);
                }
                break;
            default:
                setStep(step + 1);
                break;
        }
    };
    
    const prevStep = () => {
        setStep(step - 1);
    };

    const passwordSwitcher = (e) => {
        e.preventDefault();
    
        if(hidePassword){
            setHidePassword(false);
        }else{
            setHidePassword(true);
        }
    };

    const confirmPasswordSwitcher = (e) => {
        e.preventDefault();
    
        if(hideConfirmPassword){
            setHideConfirmPassword(false);
        }else{
            setHideConfirmPassword(true);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                switch(photoStep){
                        case 1:
                            return(
                                <div className="container mt-4" id="main-content">
                                    <div className="row justify-content-center">
                                        <div className="col-12">
                                            <div className="card adminuiux-card overflow-hidden mb-4">
                                                <div className="card-body text-center">
                                                    <div
                                                        className="card adminuiux-card text-center bg-gradient-5 mb-4"
                                                        // onClick={handleCardClick}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="card-body">
                                                            {isUploading ? (
                                                                <img
                                                                src="assets/img/uploading.gif"
                                                                alt="Loading..."
                                                                style={{ height: '100px' }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                                                                    {previewUrl && (
                                                                        <div>
                                                                            <div className="d-inline-block position-relative w-auto mx-auto my-3">
                                                                                <figure className="avatar preview-250 coverimg rounded" style={{ backgroundImage: `url('${previewUrl}')` }}>
                                                                                    <img src={previewUrl} alt="" style={{ display: 'none' }} />
                                                                                </figure>
                                                                                <div className="position-absolute bottom-0 start-0 z-index-1 h-auto">
                                                                                    <button type='button' onClick={() => fileInputRef.current && fileInputRef.current.click()} className="btn btn-lg btn-theme btn-square">
                                                                                        <i className="bi bi-upload" />
                                                                                    </button> 
                                                                                    <input
                                                                                        type="file"
                                                                                        onChange={handleFileChange}
                                                                                        ref={fileInputRef}
                                                                                        style={{ display: 'none' }}
                                                                                        accept="image/*"
                                                                                    />
                                                                                </div>
                                                                                <div className="position-absolute bottom-0 end-0 z-index-1 h-auto">
                                                                                    <button type='button' onClick={() => cameraInputRef.current && cameraInputRef.current.click()} className="btn btn-lg btn-theme btn-square">
                                                                                        <i className="bi bi-camera" />
                                                                                    </button> 
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        capture="environment"
                                                                                        style={{ display: 'none' }}
                                                                                        ref={cameraInputRef}
                                                                                        onChange={handleFileChange}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <h4>National ID - Front Photo</h4>
                                                    <p>Upload clear photo of the front side of your national ID card. Make sure all details are visible.</p>
                                                    {/* {numericPhotoRef===3  && !isUploading &&
                                                    <button
                                                    onClick={() => switchPhotoType(3)}
                                                    className="btn btn-theme btn-lg"
                                                    ><i className="bi bi-arrow-left mr-3" /> Use Passport
                                                    </button>} */}
                                                    {selectedFile && (
                                                        <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleProfilePhotoUpload(
                                                                selectedFile
                                                            )
                                                        }
                                                        className="btn btn-theme btn-lg"
                                                        disabled={!selectedFile || isUploading}
                                                        >
                                                        {isUploading ? 'Uploading...please wait' : 'Upload Photo'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        case 2:
                            return(
                                <div className="container mt-4" id="main-content">
                                    <div className="row justify-content-center">
                                        <div className="col-12">
                                            <div className="card adminuiux-card overflow-hidden mb-4">
                                                <div className="card-body text-center">
                                                    <div
                                                        className="card adminuiux-card text-center bg-gradient-5 mb-4"
                                                        // onClick={handleCardClick}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="card-body">
                                                            {isUploading ? (
                                                                <img
                                                                src="assets/img/uploading.gif"
                                                                alt="Loading..."
                                                                style={{ height: '100px' }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                                                                    {previewUrl && (
                                                                        <div>
                                                                            <div className="d-inline-block position-relative w-auto mx-auto my-3">
                                                                                <figure className="avatar preview-250 coverimg rounded" style={{ backgroundImage: `url('${previewUrl}')` }}>
                                                                                    <img src={previewUrl} alt="" style={{ display: 'none' }} />
                                                                                </figure>
                                                                                <div className="position-absolute bottom-0 start-0 z-index-1 h-auto">
                                                                                    <button type='button' onClick={() => fileInputRef.current && fileInputRef.current.click()} className="btn btn-lg btn-theme btn-square">
                                                                                        <i className="bi bi-upload" />
                                                                                    </button> 
                                                                                    <input
                                                                                        type="file"
                                                                                        onChange={handleFileChange}
                                                                                        ref={fileInputRef}
                                                                                        style={{ display: 'none' }}
                                                                                        accept="image/*"
                                                                                    />
                                                                                </div>
                                                                                <div className="position-absolute bottom-0 end-0 z-index-1 h-auto">
                                                                                    <button type='button' onClick={() => cameraInputRef.current && cameraInputRef.current.click()} className="btn btn-lg btn-theme btn-square">
                                                                                        <i className="bi bi-camera" />
                                                                                    </button> 
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        capture="environment"
                                                                                        style={{ display: 'none' }}
                                                                                        ref={cameraInputRef}
                                                                                        onChange={handleFileChange}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <h4>National ID - Back Photo</h4>
                                                    <p>Upload clear photo of the back side of your national ID card. Make sure all details are visible.</p>
                                                    {selectedFile && (
                                                        <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleProfilePhotoUpload(
                                                                selectedFile
                                                            )
                                                        }
                                                        className="btn btn-theme btn-lg"
                                                        disabled={!selectedFile || isUploading}
                                                        >
                                                        {isUploading ? 'Uploading...please wait' : 'Upload Photo'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        case 3:
                            return(
                                <div className="container mt-4" id="main-content">
                                    <div className="row justify-content-center">
                                        <div className="col-12">
                                            <div className="card adminuiux-card overflow-hidden mb-4">
                                                <div className="card-body text-center">
                                                    <div
                                                        className="card adminuiux-card text-center bg-gradient-5 mb-4"
                                                        // onClick={handleCardClick}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="card-body">
                                                            {isUploading ? (
                                                                <img
                                                                src="assets/img/uploading.gif"
                                                                alt="Loading..."
                                                                style={{ height: '100px' }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
                                                                    {previewUrl && (
                                                                        <div>
                                                                            <div className="d-inline-block position-relative w-auto mx-auto my-3">
                                                                                <figure className="avatar preview-250 coverimg rounded" style={{ backgroundImage: `url('${previewUrl}')` }}>
                                                                                    <img src={previewUrl} alt="" style={{ display: 'none' }} />
                                                                                </figure>
                                                                                <div className="position-absolute bottom-0 start-0 z-index-1 h-auto">
                                                                                    <button type='button' onClick={() => fileInputRef.current && fileInputRef.current.click()} className="btn btn-lg btn-theme btn-square">
                                                                                        <i className="bi bi-upload" />
                                                                                    </button> 
                                                                                    <input
                                                                                        type="file"
                                                                                        onChange={handleFileChange}
                                                                                        ref={fileInputRef}
                                                                                        style={{ display: 'none' }}
                                                                                        accept="image/*"
                                                                                    />
                                                                                </div>
                                                                                <div className="position-absolute bottom-0 end-0 z-index-1 h-auto">
                                                                                    <button type='button' onClick={() => cameraInputRef.current && cameraInputRef.current.click()} className="btn btn-lg btn-theme btn-square">
                                                                                        <i className="bi bi-camera" />
                                                                                    </button> 
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        capture="user"
                                                                                        style={{ display: 'none' }}
                                                                                        ref={cameraInputRef}
                                                                                        onChange={handleFileChange}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <h4>Selfie / Passport Size Photo</h4>
                                                    <p>
                                                        Click on the avatar above to upload a passport size photo. The face should be well-lit and visible without obstructions.
                                                    </p>
                                                    {selectedFile && (
                                                        <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleProfilePhotoUpload(
                                                                selectedFile
                                                            )
                                                        }
                                                        className="btn btn-theme btn-lg"
                                                        disabled={!selectedFile || isUploading}
                                                        >
                                                        {isUploading ? 'Uploading...please wait' : 'Upload Photo'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        default: return null;
                    }
          case 1:
            return  <>
                    <p>Basic Information</p>
                    <div className="row">
                        <div className="col">
                            <div className="form-floating mb-3">
                                <input 
                                    type="text" 
                                    className="form-control"
                                    ///{...register("firstName", validationRules.firstName)}
                                    {...register("firstName",validationRules?.firstName)}
                                    placeholder="First Name"
                                    readOnly={ocrLockedFields.includes("firstName")} /> 
                                <label htmlFor="firstName">First Name</label>
                                {errors.firstName && <p className="text-danger">{errors.firstName.message}</p>}
                            </div>
                        </div>
                        <div className="col">
                            <div className="form-floating mb-3">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    {...register("otherName",validationRules?.otherName)}
                                    placeholder="Last Name"
                                    readOnly={ocrLockedFields.includes("otherName")} /> 
                                <label htmlFor="otherName">Last Name</label>
                                {errors.otherName && <p className="text-danger">{errors.otherName.message}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="form-floating mb-4">
                        <input
                            type="date"
                            className="form-control"
                            {...register("dob",validationRules?.DOB)}
                            placeholder="Date of Birth"
                            readOnly={ocrLockedFields.includes("dob")} />
                        <label htmlFor="dob">Date Of Birth</label>
                        {errors.dob && <p className="text-danger">{errors.dob.message}</p>}
                    </div>
                    <div className="mb-3">
                        <div className="d-flex align-items-center">
                            <div className='flex-grow-1'>
                                <label className="form-label fw-bold w-100 mb-0">Gender</label>
                                <small>Select gender</small>
                            </div>
                            <div className="form-check me-3">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="male"
                                    value="male"
                                    readOnly={ocrLockedFields.includes("gender")}
                                    tabIndex={ocrLockedFields.includes("gender") ? -1 : 0}
                                    style={ocrLockedFields.includes("gender") ? { pointerEvents: "none" } : {}}
                                    {...register("gender",validationRules?.Gender)}
                                />
                                <label className="form-check-label" htmlFor="male">
                                    Male
                                </label>
                            </div>
                            <div className="form-check ml-4">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    id="female"
                                    value="female"
                                    readOnly={ocrLockedFields.includes("gender")}
                                    tabIndex={ocrLockedFields.includes("gender") ? -1 : 0}
                                    style={ocrLockedFields.includes("gender") ? { pointerEvents: "none" } : {}}
                                    {...register("gender",validationRules?.Gender)}
                                />
                                <label className="form-check-label" htmlFor="female">
                                    Female
                                </label>
                            </div>
                        </div>
                        {errors.gender && <p className="text-danger">{errors.gender.message}</p>}
                    </div>
                    <div className="form-floating mb-4">
                        <input
                            type="text"
                            className="form-control"
                            {...register("nationalID",validationRules?.NationalID)}
                            placeholder="National ID"
                            readOnly={ocrLockedFields.includes("nationalID")}
                        />
                        <label htmlFor="nationalID">National ID</label>
                        {errors.nationalID && <p className="text-danger">{errors.nationalID.message}</p>}
                    </div>
                    <p>Contact Information</p>
                    <div className="form-floating mb-4">
                        <input
                            type="tel"
                            className="form-control"
                            {...register("phone",validationRules?.PhoneNumber)}
                            placeholder="Enter phone number"
                        />
                        <label htmlFor="phone">Phone Number</label>
                        {errors.phone && <p className="text-danger">{errors.phone.message}</p>}
                    </div>
                    {!onboardingSettings?.emailAddress?.includes("Hide")&&(
                        <div className="form-floating mb-4">
                            <input
                                type="email"
                                className="form-control"
                                {...register("emailAddress",validationRules?.EmailAddress)}
                                placeholder="Enter Email Address"
                            />
                            <label htmlFor="email">Email Address</label>
                            {errors.emailAddress && <p className="text-danger">{errors.emailAddress.message}</p>}
                        </div>
                    )}
                    {!onboardingSettings?.postalAddress?.includes("Hide")&&(
                        <div className="form-floating mb-4">
                            <input
                                type="text"
                                className="form-control"
                                {...register("postalAddress",validationRules?.postalAddress)}
                                placeholder="Your Postal Address"
                            />
                            <label htmlFor="postalAddress">Postal Address</label>
                            {errors.postalAddress && <p className="text-danger">{errors.postalAddress.message}</p>}
                        </div>
                    )}
                    {!onboardingSettings?.physicalAddress?.includes("Hide")&&(
                        <div className="form-floating mb-4">
                            <input
                                type="text"
                                className="form-control"
                                {...register("physicalAddress",validationRules?.physicalAddress)}
                                placeholder="Your Physical Address"
                            />
                            <label htmlFor="physicalAddress">Physical Address</label>
                            {errors.physicalAddress && <p className="text-danger">{errors.physicalAddress.message}</p>}
                        </div>
                    )}
                </>;
          case 2:
            return <>
                    <h3>Select nearest branch: </h3>
                    <p>You are not within any branch radius. Please select your branch.</p>
                    {offices.map((office) => (
                        // <label key={office.unitid}>
                        //     <input
                        //     type="radio"
                        //     name="office"
                        //     checked={selectedOffice?.unitid === office.unitid}
                        //     onChange={() => handleOfficeChange(office.unitid)}
                        //     />
                        //     {office.UnitTitle}
                        //     <br />
                        // </label>
                        <div className="form-check mb-3" key={office.unitid}>
                            <input 
                                className="form-check-input" 
                                type="radio"
                                name="office"
                                checked={selectedOffice?.unitid === office.unitid}
                                onChange={() => handleOfficeChange(office.unitid)}
                                id={`office_${office.unitid}`}/>
                            <label className="form-check-label" htmlFor={`office_${office.unitid}`}>
                                {office.UnitTitle}
                            </label>
                        </div>
                    ))}
                </>;
          case 3:
            return <>
                    <h3>Referral</h3>
                    <p>If you have been reffered by one of our agents, enter the agent's phone number below:</p>
                    <div className="form-floating mb-4">
                        <input
                            className="form-control"
                            id="referralCode"
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            placeholder="Enter Agent Phone Number" />
                        <label htmlFor="referralCode">Referral Agent (optional)</label>
                    </div>
                </>;
          case 4:
            return (
                <>
                    <p>Account Security</p>
                    <div className="position-relative">
                        <div className="form-floating mb-4">
                            <input
                                type={hidePassword ? 'password' : 'text'}
                                className="form-control"
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                                    // pattern: {
                                    //     value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                    //     message: "Password must contain at least one uppercase, lowercase, number, and special character",
                                    // },
                                })}
                                placeholder="Password"
                            />
                            <label htmlFor="checkstrength">Password</label>
                        </div>
                        <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={passwordSwitcher}>
                            {hidePassword ? <i className="bi bi-eye" /> : <i className="bi bi-eye-slash" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-danger">{errors.password.message}</p>}
                    <div className="position-relative">
                        <div className="form-floating mb-4">
                            <input
                                type={hideConfirmPassword ? 'password' : 'text'}
                                className="form-control"
                                {...register("confirmPassword", {
                                    required: "Confirm password is required",
                                    validate: (value) => value === watch("password") || "Passwords do not match",
                                })}
                                placeholder="Confirm Password"
                            />
                            <label htmlFor="checkstrength">Confirm Password</label>
                        </div>
                        <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={confirmPasswordSwitcher}>
                            {hideConfirmPassword ? <i className="bi bi-eye" /> : <i className="bi bi-eye-slash" />}
                        </button>
                    </div>
                    {errors.confirmPassword && <p className="text-danger">{errors.confirmPassword.message}</p>}
                </>
            );
          case 5:
            return <>
                    <p>Account Details</p>
                    <table className="table table-borderd border">
                        <tbody>
                            <tr>
                                <td className="bg-transparent"><b>First Name</b></td>
                                <td className="bg-transparent">{watch("firstName")}</td>
                            </tr>
                            <tr>
                                <td className="bg-transparent"><b>Last Name</b></td>
                                <td className="bg-transparent">{watch("otherName")}</td>
                            </tr>
                            <tr>
                                <td className="bg-transparent"><b>Date of Birth</b></td>
                                <td className="bg-transparent">{watch("dob")}</td>
                            </tr>
                            <tr>
                                <td className="bg-transparent"><b>Gender</b></td>
                                <td className="bg-transparent">{watch("gender")}</td>
                            </tr>
                            <tr>
                                <td className="bg-transparent"><b>National ID</b></td>
                                <td className="bg-transparent">{watch("nationalID")}</td>
                            </tr>
                            <tr>
                                <td className="bg-transparent"><b>Phone Number</b></td>
                                <td className="bg-transparent">{watch("phone")}</td>
                            </tr>
                            {!onboardingSettings?.emailAddress?.includes("Hide") && (
                                <tr>
                                    <td className="bg-transparent"><b>Email Address</b></td>
                                    <td className="bg-transparent">{watch("emailAddress")}</td>
                                </tr>
                            )}
                            {!onboardingSettings?.postalAddress?.includes("Hide") && (
                                <tr>
                                    <td className="bg-transparent"><b>Postal Address</b></td>
                                    <td className="bg-transparent">{watch("postalAddress")}</td>
                                </tr>
                            )}
                            {!onboardingSettings?.physicalAddress?.includes("Hide") && (
                                <tr>
                                    <td className="bg-transparent"><b>Physical Address</b></td>
                                    <td className="bg-transparent">{watch("physicalAddress")}</td>
                                </tr>
                            )}
                            <tr>
                                <td className="bg-transparent"><b>Branch</b></td>
                                <td className="bg-transparent">{selectedOffice?.UnitTitle}</td>
                            </tr>
                            <tr>
                                <td className="bg-transparent"><b>Referral Agent</b></td>
                                <td className="bg-transparent">{referralCode}</td>
                            </tr>
                            <tr>
                            <td className="bg-transparent" colSpan={2}>
                                <div className="form-check" data-bs-toggle="modal" data-bs-target="#termsModal"
                                            style={{ textDecoration: "underline", cursor: "pointer" }}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="acceptTerms"
                                        {...register("acceptTerms", { required: "You must accept the terms and conditions" })}
                                    />
                                    <label className="form-check-label" htmlFor="acceptTerms">
                                        I accept the terms and conditions
                                    </label>
                                </div>
                                {errors.acceptTerms && (
                                    <p className="text-danger">{errors.acceptTerms.message}</p>
                                )}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </>;
          default:
            return null;
        }
    };

    useEffect(() => {
        // Simulating loading delay
        const timeout = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timeout);
    });

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            if (!file.type.startsWith('image/')) {
                setUploadError('Please select an image file.');
                setSelectedFile(null);
                setPreviewUrl('assets/img/id_front.png'); // Reset to default on error
                return;
            }

        setUploadError("");
        setSelectedFile(file);
        const reader = new FileReader();

        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                setPreviewUrl(reader.result);
            } else {
                setPreviewUrl('assets/img/id_front.png'); // fallback/default image
            }
        };

        reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreviewUrl('assets/img/id_front.png'); // Reset to default on cancel
        }
    };

    const handleCardClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleProfilePhotoUpload = async(file) => {
        setIsUploading(true);
        setOnboardingError("");
        ///const storedConfigurationData = localStorage.getItem('configuration');
        ///const configurationDataJson = JSON.parse(storedConfigurationData);
    
        const formData = new FormData();
        formData.append('file', file);
        ///formData.append('folderId', '1mj4MfZTpCgi2fgV0GDQwpja9aiYp0KWb');
    
        if(photoStep === 1){
            ////Perform OCR to extract ID data
            try {
                const response = await fetch('https://micromartafrica.co.ke/MicromartAPI/vision/ocr/id', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    setIsUploading(false);
                    setOnboardingError('Upload failed');
                    throw new Error(errorText || 'Upload failed');
                }

                const data = await response.json();

                if (!validateIdResponse(data)) {
                    setIsUploading(false);
                    setOnboardingError('Invalid ID data detected, Upload a valid national ID with all information clearly visible.');
                    return;
                }

                setOcrData(data);

                // if (data.idInfo) {
                //     setValue("firstName", data.idInfo.givenNames || "");
                //     setValue("otherName", data.idInfo.surname || "");
                //     setValue("nationalID", data.idInfo.idNumber || "");
                //     setValue("dob", data.idInfo.dateOfBirth || "");
                //     setValue("gender", data.idInfo.sex?.toLowerCase() || "");
                // }

                setUploadedIdFront(file);
                setPreviewUrl('assets/img/id_back.png');
                setPhotoStep(2);
                setIsUploading(false);
                setOnboardingError("");
            } catch (err) {
                setIsUploading(false);
                setOnboardingError('Something went wrong, Try again.');
            }
        }else if(photoStep === 2){
            setUploadedIdBack(file);
            setIsUploading(false);
            setOnboardingError("");
            setPreviewUrl('assets/img/male.svg');
            setPhotoStep(3);
        }else if(photoStep === 3){
            setUploadedSelfie(file);
            setIsUploading(false);
            setOnboardingError("");
            setPreviewUrl('assets/img/male.svg');
            ///setPhotoStep(3);
            setStep(1);
        }else{
            setStep(1);
        }
    };

    function validateIdResponse(data) {
        if (!data || !data.idInfo) return false;

        const { idNumber, surname, givenNames, sex, dateOfBirth } = data.idInfo;
        const locked: string[] = [];

        if (
            !idNumber || typeof idNumber !== 'string' || !/^\d{7,10}$/.test(idNumber.trim())
        ){
            return false;
        }else{
            console.log("ID Number:", idNumber);
            setValue("nationalID", idNumber || "");
            locked.push("nationalID");
        }

        if (!surname || typeof surname !== 'string' || surname.trim().length === 0){
            return false;
        }else{
            setValue("firstName", surname || "");
            console.log("First Name:", surname);
            locked.push("firstName");
        }

        if (!givenNames || typeof givenNames !== 'string' || givenNames.trim().length === 0){
            return false;
        }else{
            setValue("otherName", givenNames || "");
            console.log("Other Name:", givenNames);
            locked.push("otherName");
        }

        if (
            !sex ||
            typeof sex !== 'string' ||
            !['MALE', 'FEMALE'].includes(sex.trim().toUpperCase())
        ){
            return false;
        }else{
            setValue("gender", sex.trim().toLowerCase() || "");
            console.log("Gender:", sex);
            locked.push("gender");
        }

        if (!dateOfBirth || !isValidDate(dateOfBirth.trim())){
            return false;
        }else{
            console.log("DOB:", dateOfBirth);
            const parts = dateOfBirth.trim().split(/[.\-\/]/);
            const [day, month, year] = parts.map(Number);
            const date = new Date(year, month - 1, day);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            setValue("dob", `${yyyy}-${mm}-${dd}`);
            locked.push("dob");
        }

        setOcrLockedFields(locked);
        return true;
    }

    // Helper to check valid date format (dd.mm.yyyy or yyyy-mm-dd, etc)
    function isValidDate(dateStr) {
        // Try parsing dd.mm.yyyy (Kenya ID format)
        const parts = dateStr.split(/[.\-\/]/);
        if (parts.length === 3) {
            const [day, month, year] = parts.map(Number);
            const date = new Date(year, month - 1, day);
            return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
            );
        }
        // fallback: try Date.parse
        return !isNaN(Date.parse(dateStr));
    }

    const uploadFile = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', '1mj4MfZTpCgi2fgV0GDQwpja9aiYp0KWb');

        try {
            const response = await fetch('https://micromartafrica.co.ke/MicromartAPI/api/app/UploadFile', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const text = await response.text();
                console.error("HTTP error:", response.status, text);
                return null;
            }
            const textData = await response.text();
            const fileId = textData.trim();
            if (!fileId) {
                console.error("Could not extract fileId from text response.");
                return null;
            }
            return fileId;
        } catch (error) {
            console.error('Profile photo upload error:', error);
            return null;
        }
    };

    const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        setLoggingIn(true);
        setOnboardingError("");

        let id_front="";
        if(uploadedIdFront){
            id_front = await uploadFile(uploadedIdFront) || "";
        }
        
        let id_back="";
        if(uploadedIdBack){
            id_back = await uploadFile(uploadedIdBack) || "";
        }
        
        let id_selfie="";
        if(uploadedSelfie){
            id_selfie = await uploadFile(uploadedSelfie) || "";
        }
        
        // Proceed if no errors
        if (!passwordError && !confirmPasswordError) {
            console.log("Form Data:", data);
            // Submit Registration
            try {
                const response = await fetch(
                    "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/Registration",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            firstName: data.firstName,
                            otherName: data.otherName,
                            dob: data.dob,
                            gender: (data.gender==='male'?1:2),
                            nationalID: data.nationalID,
                            phoneNumber: data.phone,
                            emailAddress: data.emailAddress,
                            postalAddress: data.postalAddress,
                            physicalAddress: data.physicalAddress,
                            password: data.password,
                            latitude: location.latitude,
                            longitude: location.longitude,
                            branch: selectedOffice?.unitid,
                            referralCode: referralCode,
                            entityId: parseInt(entityId),
                            selfie: id_selfie,
                            idFront: id_front,
                            idBack: id_back,
                        }),
                    }
                );

                if (response.ok) {
                    const response_data = await response.json();

                    if(response_data.id>0){
                        const dummySessionData = {
                            userId: response_data.id,
                            accountNumber: response_data.AccountNo,
                            name: data.firstName,
                            token: response_data.token,
                            role: "borrower",
                            expiry: Date.now() + 60 * 60 * 24000,
                        };
                    
                        // Save session data in localStorage
                        localStorage.setItem("session", JSON.stringify(dummySessionData));
                        setUserSession(dummySessionData); // Update state
                        setLoggingIn(false);
                    
                        // Redirect to Dashboard
                        navigate("/profile");
                    }else{
                        setLoggingIn(false);
                        setOnboardingError(response_data.message);
                    }
                } else if (response.status === 400) {
                    try {
                        const errorData = await response.json();
                        if (errorData) {
                            setOnboardingError(errorData.message);
                        } else {
                            setOnboardingError("Account creation failed, invalid information provided.");
                        }
                    } catch (parseError) {
                        setOnboardingError("Account creation failed, try again.");
                    }
                    setLoggingIn(false);
                } else {
                    setLoggingIn(false);
                    setOnboardingError("Account creation, Try again.");
                }
            } catch (error) {
                setLoggingIn(false);
                setOnboardingError(error);
            }
        }else{
            setLoggingIn(false);
        }
    };

    return (
    <>
        {isLoading &&
            <div className="pageloader">
                <div className="container h-100">
                    <div className="row justify-content-center align-items-center text-center h-100">
                        <div className="col-12 mb-auto pt-4" />
                        <div className="col-auto">
                            <img src="icon.png" alt="Service Suite Cloud" className="height-60 mb-3" />
                            <p className="h6 mb-0">MICROMART AFRICA LTD</p>
                            <p className="h3 mb-4">Exceeding The Incredible</p>
                            <div className="loader10 mb-2 mx-auto" />
                        </div>
                        <div className="col-12 mt-auto pb-4">
                            <p className="text-secondary">Wait a minute...</p>
                        </div>
                    </div>
                </div>
            </div>
        }
        
        <main className="flex-shrink-0 pt-0 h-100">
            <div className="container-fluid">
                <div className="auth-wrapper">
                    <div className="row">
                        <div className="col-12 col-md-6 col-xl-4 minvheight-100 d-flex flex-column px-0">
                            <header className="adminuiux-header">
                                <nav className="navbar">
                                    <div className="container-fluid">
                                        <a className="navbar-brand" href="#">
                                            <img data-bs-img="light" src="icon.png" alt="Service Suite Cloud" /> 
                                            <img data-bs-img="dark" src="icon_light.png" alt="Service Suite Cloud" />
                                            <div>
                                                <span className="h4">Micromart <b>Africa</b> LTD</span>
                                                <p className="company-tagline">Exceeding The Incredible</p>
                                            </div>
                                        </a>
                                        <div className="ms-auto" />
                                        <div className="ms-auto" />
                                    </div>
                                </nav>
                            </header>
                            <div className="h-100 py-3 px-3">
                                <form onSubmit={handleSubmit(onSubmit)} className="row h-100 align-items-center justify-content-center">
                                    <div className="col-11 col-sm-8 col-md-11 col-xl-11 col-xxl-10 login-box">
                                        <div className="text-center mb-4">
                                            <h1 className="mb-3">Welcome To Service Suite</h1>
                                            <p className="text-secondary">Create a new account</p>
                                        </div>
                                        {renderStep()}      
                                        {onboardingError&&(
                                            <div className="alert alert-warning my-3" role="alert">{onboardingError}</div>
                                        )}
                                        {loggingIn?
                                        <>
                                            <div className="col-12 col-sm-6 col-md-4 col-lg-3 height-150 mb-3 text-center">
                                                <div className="loader10 mb-3 mx-auto " />
                                            </div>
                                        </>
                                        :
                                        <>
                                            {!locationEnabled && (
                                                <div style={{ color: "red" }}>
                                                Please enable location services in your browser/device settings.
                                                </div>
                                            )}
                                            {location.latitude !== null && location.longitude !== null ? (
                                                // <p>
                                                //     Latitude: {location.latitude} <br />
                                                //     Longitude: {location.longitude}
                                                // </p>
                                                <>
                                                    <div className="d-flex justify-content-between mb-4">
                                                        {step > 1 && <button type="button" className="btn btn-lg btn-theme mb-4" onClick={prevStep}><i className="bi bi-arrow-left ml-2"></i> Previous</button>}
                                                        {step < 5 && step > 0 && <button type="button" className="btn btn-lg btn-theme mb-4" onClick={nextStep}>Continue <i className="bi bi-arrow-right ml-2"></i></button>}
                                                        {step === 5 && <button type="submit" className="btn btn-lg btn-theme mb-4">Complete <i className="bi bi-box-arrow-right ml-2"></i></button>}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <p>{locationErrorMessage || "Fetching location..."}</p>
                                                    <button type="button" className="btn btn-lg btn-theme mb-4" onClick={getUserLocation}>Re-Set Location</button>
                                                </>
                                            )}
                                            <div className="text-center mb-3">
                                                Alredy have an account? <a href="/login">Sign In</a> here.
                                            </div>
                                        </>}
                                    </div>
                                </form>
                            </div>
                            <footer className="adminuiux-footer mt-auto">
                                <div className="container-fluid text-center">
                                    <span className="small">Copyright @2025, <a href="https://techcrast.co.ke" target="_blank">TechCrast Software Solutions LTD</a></span>
                                </div>
                            </footer>
                        </div>
                        <div className="col-12 col-md-6 col-xl-8 p-4 d-none d-md-block">
                            <IntroSlider/>
                        </div>
                    </div>
                </div>
            </div>
        </main>

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
    </>
    );
};
  
export default Register;  
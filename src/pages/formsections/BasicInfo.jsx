import React from 'react';
import { useForm } from 'react-hook-form';
import createValidationRules from './OnboardingValidationRules'; 

const BasicInfo = ({ formData, handleChange, onboardingSettings }) => {
    const validationRules = createValidationRules(onboardingSettings);

    const { register, handleSubmit, formState: { errors } } = useForm({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: formData,
        resolver: undefined, // You might need a resolver for more complex validation
    });

    // const isFieldRequired = (fieldName) => {
    //     if (!onboardingSettings) return true; // Default to required if settings are not loaded
    //     const setting = onboardingSettings[fieldName];
    //     return setting && setting.includes("Required");
    // };

    // const isFieldUnique = (fieldName) => {
    //     if (!onboardingSettings) return false;
    //     const setting = onboardingSettings[fieldName];
    //     return setting && setting.includes("Unique");
    // };

    // const getFieldLabel = (fieldName) => {
    //     if (!onboardingSettings) return fieldName;
    //     const setting = onboardingSettings[fieldName];
    //     if (setting) {
    //         return setting.replace(/,Unique|Required/g, '').trim();
    //     }
    //     return fieldName;
    // };

    return (
        <>
            <p>Basic Information</p>
            <div className="row">
                <div className="col">
                    <div className="form-floating mb-3">
                        <input 
                            type="text" 
                            className="form-control" 
                            id="firstName" 
                            name="firstName" 
                            value={formData.firstName}
                            {...register("firstName", validationRules.firstName)}
                            placeholder={validationRules.firstName?.placeholder || "First Name"} 
                            onChange={handleChange}/> 
                        <label htmlFor="firstName">First Name</label>
                        {errors.firstName && <p className="text-danger">{errors.firstName.message}</p>}
                    </div>
                </div>
                <div className="col">
                    <div className="form-floating mb-3">
                        <input 
                            type="text" 
                            className="form-control" 
                            id="lastName" 
                            name="lastName"
                            value={formData.lastName} 
                            onChange={handleChange}
                            {...register("lastName", validationRules.lastName)}
                            placeholder={validationRules.lastName?.placeholder || "Last Name"} /> 
                        <label htmlFor="lastName">Last Name</label>
                        {errors.lastName && <p className="text-danger">{errors.lastName.message}</p>}
                    </div>
                </div>
            </div>
            <div className="form-floating mb-4">
                <input
                    type="date"
                    className="form-control"
                    name='dateOfBirth'
                    {...register("dateOfBirth", validationRules.dob)}
                    placeholder={validationRules.dob?.placeholder || "Date of Birth"}
                />
                <label htmlFor="dateOfBirth">Date Of Birth</label>
                {errors.dateOfBirth && <p className="text-danger">{errors.dateOfBirth.message}</p>}
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
                            name="gender"
                            id="male"
                            value="male"
                            {...register("gender", validationRules.gender)}
                        />
                        <label className="form-check-label" htmlFor="male">
                            Male
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            name="gender"
                            id="female"
                            value="female"
                            {...register("gender", validationRules.gender)}
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
                    name='nationalId'
                    {...register("nationalId", validationRules.nationalID)}
                    placeholder={validationRules.nationalID?.placeholder || "National ID"}
                />
                <label htmlFor="nationalId">National ID</label>
                {errors.nationalId && <p className="text-danger">{errors.nationalId.message}</p>}
            </div>
        </>
    );
};

export default BasicInfo;
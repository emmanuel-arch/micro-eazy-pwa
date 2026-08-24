import React from 'react';
import { useForm } from 'react-hook-form';
import createValidationRules from './OnboardingValidationRules'; // Adjust the path

const ContactInfo = ({ formData, handleChange, onboardingSettings }) => {
    const validationRules = createValidationRules(onboardingSettings);

    const { register, handleSubmit, formState: { errors } } = useForm({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: formData,
        resolver: undefined,
    });

    const onSubmit = (data) => {
        // Handle form submission if needed
        console.log(data);
    };

    return (
        <>
            <p>Contact Information</p>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-floating mb-4">
                    <input
                        type="tel"
                        className="form-control"
                        name='phone'
                        {...register("phone", validationRules.phoneNumber)}
                        placeholder={validationRules.phoneNumber?.placeholder || "Enter phone number"}
                    />
                    <label htmlFor="phone">Phone Number</label>
                    {errors.phone && <p className="text-danger">{errors.phone.message}</p>}
                </div>
                <div className="form-floating mb-4">
                    <input
                        type="email"
                        className="form-control"
                        name='email'
                        {...register("email", validationRules.emailAddress)}
                        placeholder={validationRules.emailAddress?.placeholder || "Enter Email Address"}
                    />
                    <label htmlFor="email">Email Address</label>
                    {errors.email && <p className="text-danger">{errors.email.message}</p>}
                </div>
            </form>
        </>
    );
};

export default ContactInfo;
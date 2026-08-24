// src/components/Password.jsx
import React from 'react';

const Password = ({ formData, handleChange, hidePassword, passwordSwitcher, hideConfirmPassword, confirmPasswordSwitcher }) => {
    return (
        <>
            <p>Account Security</p>
            <div className="position-relative">
                <div className="form-floating mb-4">
                    <input type={hidePassword?'password':'text'}  className="form-control" name='password' value={formData.password} onChange={handleChange} placeholder="Enter your password" required/>
                    <label htmlFor="checkstrength">Password</label>
                </div>
                <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={passwordSwitcher}>
                    {hidePassword? <i className="bi bi-eye" />:<i className="bi bi-eye-slash" />}
                </button>
            </div>
            <div className="position-relative">
                <div className="form-floating mb-4">
                    <input type={hideConfirmPassword?'password':'text'}  className="form-control" name='confirmPassword' value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required/>
                    <label htmlFor="checkstrength">Confirm Password</label>
                </div>
                <button className="btn btn-square btn-link text-theme-1 position-absolute end-0 top-0 mt-2 me-2" onClick={confirmPasswordSwitcher}>
                    {hideConfirmPassword? <i className="bi bi-eye" />:<i className="bi bi-eye-slash" />}
                </button>
            </div>
        </>
    );
};

export default Password;
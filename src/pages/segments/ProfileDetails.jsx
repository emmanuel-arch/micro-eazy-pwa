import React, { useState, useEffect } from 'react';

function ProfileDetails({ nextStep,profileOptions }) {
    const [currentFormIndex, setCurrentFormIndex] = useState(0);
    const [formItems, setFormItems] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [skippedThisRender, setSkippedThisRender] = useState(false);
    const [currentForm, setCurrentForm] = useState(null);

    if (!profileOptions || !profileOptions.borrowerForms) {
        return <div className="container mt-4">No borrower forms available.</div>;
    }

    const borrowerForms = profileOptions.borrowerForms;

    const handleNextForm = (success) => {
        if (success) {
            setCurrentFormIndex((prevIndex) => prevIndex + 1);
            setFormItems(null);
            setFormData({});
            setSkippedThisRender(false);
        }
    };

    const skipCurrentForm = () => {
        console.log("Skipping form from - ", currentFormIndex);
        setCurrentFormIndex((prevIndex) => {
            const newIndex = prevIndex + 1;
            console.log("Skipping form this - ", prevIndex);
            console.log("Skipping form to - ", newIndex);
            return newIndex;
        });
        setFormItems(null);
        setFormData({});
        setSkippedThisRender(true);
    };

    useEffect(() => {
        console.log("currentFormIndex updated:", currentFormIndex);
    }, [currentFormIndex]);

    useEffect(() => {
        console.log("Forms", borrowerForms.length);
        console.log("Current Form", currentFormIndex);

        if (currentFormIndex < borrowerForms.length) {
            const form = borrowerForms[currentFormIndex];
            setCurrentForm(form);
            if (profileOptions.filledData && profileOptions.filledData.some((item) => item === form.ID) && !skippedThisRender) {
                console.log("Skip this form if it's in filledData for - ", form);
                skipCurrentForm();
            }
        } else {
            nextStep();
        }

        setFormItems(null); //reset form items when current form index changes.

    }, [currentFormIndex, profileOptions.filledData, borrowerForms]);

    useEffect(() => {
        if (currentForm) {
            console.log("Fetch fields for", currentForm);
            fetchData();
        }
    },[currentForm])

    const fetchData = async () => {
        if (!currentForm) return; // Prevent fetching if currentForm is null
        setLoading(true);
        try {
            const response = await fetch('https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/GetBorrowerFormsItems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: "", // Set phoneNumber as needed
                    entityId: currentForm.ID,
                    requestFlag: 0,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setFormItems(data);
        } catch (error) {
            console.error('Error fetching form items:', error);
            setFormItems(null); // Handle error by setting formItems to null
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (itemId, value) => {
        setFormData({ ...formData, [itemId]: value });
    };

    const renderFormFields = () => {
        if (!formItems) return null;

        return formItems.map((item) => {
            let inputField;
            const itemId = `item_${item.ID}`;

            const value = formData[itemId] || '';

            if (item.htmlType === 'textarea') {
                inputField = <textarea id={itemId} name={itemId} className="form-control" value={value} onChange={(e) => handleInputChange(itemId, e.target.value)} required />;
            } else if (item.htmlType === 'select') {
                if (item.itemOptionsId !== '0') {
                    const elementItems = item.SelectOptions;
                    inputField = (
                        <select id={itemId} name={itemId} className="form-control" value={value} onChange={(e) => handleInputChange(itemId, e.target.value)} required>
                            <option value="">Select an option</option>
                            {elementItems.map((element) => (
                                <option key={element.ID} value={element.ID}>{element.Title}</option>
                            ))}
                        </select>
                    );
                } else {
                    const itemOptionsArray = item.itemOptions.split(',');
                    inputField = (
                        <select id={itemId} name={itemId} className="form-control" value={value} onChange={(e) => handleInputChange(itemId, e.target.value)} required>
                            <option value="">Select an option</option>
                            {itemOptionsArray.map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    );
                }
            } else if (item.htmlType === 'checkbox') {
                if (item.itemOptionsId !== '0') {
                    const elementItems = item.SelectOptions;
                    inputField = (
                        <div>
                            {elementItems.map((element) => (
                                <div key={element.ID} className="form-check form-switch form-switch-lg mb-3" dir="ltr">
                                    <input type="checkbox" className="form-check-input" id={`<span class="math-inline">\{itemId\}\_</span>{element.ID}`} name={itemId} value={element.ID} checked={formData[`<span class="math-inline">\{itemId\}\_</span>{element.ID}`] || false} onChange={(e) => handleInputChange(`<span class="math-inline">\{itemId\}\_</span>{element.ID}`, e.target.checked)} />
                                    <label className="form-check-label" htmlFor={`<span class="math-inline">\{itemId\}\_</span>{element.ID}`}>{element.Title}</label>
                                </div>
                            ))}
                        </div>
                    );
                } else {
                    const itemOptionsArray = item.itemOptions.split(',');
                    inputField = (
                        <div>
                            {itemOptionsArray.map((option, index) => (
                                <div key={index} className="form-check form-switch form-switch-lg mb-3" dir="ltr">
                                    <input type="checkbox" className="form-check-input" id={`<span class="math-inline">\{itemId\}\_</span>{option}`} name={itemId} value={option} checked={formData[`<span class="math-inline">\{itemId\}\_</span>{option}`] || false} onChange={(e) => handleInputChange(`<span class="math-inline">\{itemId\}\_</span>{option}`, e.target.checked)} />
                                    <label className="form-check-label" htmlFor={`<span class="math-inline">\{itemId\}\_</span>{option}`}>{option}</label>
                                </div>
                            ))}
                        </div>
                    );
                }
            } else if (item.htmlType === 'radio') {
                if (item.itemOptionsId !== '0') {
                    const elementItems = item.SelectOptions;
                    inputField = (
                        <div>
                            {elementItems.map((element) => (
                                <div key={element.ID} className="form-check form-switch form-switch-lg mb-3" dir="ltr">
                                    <input type="radio" className="form-check-input" id={`<span class="math-inline">\{itemId\}\_</span>{element.ID}`} name={itemId} value={element.ID} checked={formData[itemId] === element.ID.toString()} onChange={() => handleInputChange(itemId, element.ID.toString())} />
                                    <label className="form-check-label" htmlFor={`<span class="math-inline">\{itemId\}\_</span>{element.ID}`}>{element.Title}</label>
                                </div>
                            ))}
                        </div>
                    );
                } else {
                    const itemOptionsArray = item.itemOptions.split(',');
                    inputField = (
                        <div>
                            {itemOptionsArray.map((option, index) => (
                                <div key={index} className="form-check form-switch form-switch-lg mb-3" dir="ltr">
                                    <input type="radio" className="form-check-input" id={`<span class="math-inline">\{itemId\}\_</span>{option}`} name={itemId} value={option} checked={formData[itemId] === option} onChange={() => handleInputChange(itemId, option)} />
                                    <label className="form-check-label" htmlFor={`<span class="math-inline">\{itemId\}\_</span>{option}`}>{option}</label>
                                </div>
                            ))}
                        </div>
                    );
                }
            } else if (item.htmlType === 'file') {
                inputField = <input type="file" id={itemId} name={itemId} className="form-control" onChange={(e) => handleInputChange(itemId, e.target.files[0])} />;
            } else {
                inputField = <input type={item.htmlType} id={itemId} name={itemId} className="form-control" value={value} onChange={(e) => handleInputChange(itemId, e.target.value)} required />;
            }

            return (
                <div key={item.ID}>
                    <div className="row">
                        <div className="col-md-6">
                            <p className="mb-0">{item.itemName}</p>
                            <small>{item.itemDescription}</small>
                        </div>
                        <div className="col-md-6">{inputField}</div>
                    </div>
                    <hr />
                </div>
            );
        });
    };

    const handleSubmit = async () => {
        if (!formItems) return;

        setIsSubmitting(true); // Start submitting
        const records = formItems.map((item) => {
            const itemId = `item_${item.ID}`;
            let itemValue = formData[itemId];
            let itemValueRef = "0";

            if (item.itemOptionsId >0){
                ///has options
                if (item.htmlType === 'checkbox') {
                    itemValue = [];
                    item.SelectOptions.forEach(element => {
                        if (formData[`${itemId}_${element.ID}`]) {
                            itemValue.push(element.Title.toString());
                        }
                    });
                    itemValue = itemValue.join(',');
                }else{
                    console.log("selectedElement for",item);
                    const elementItems = item.SelectOptions;
                    const selectedElement = elementItems.find(option => option.ID === Number(itemValue));
                    console.log("selectedElement",selectedElement);
                    itemValueRef = itemValue;
                    itemValue = selectedElement.Title;
                }
                
            }else{
                if (item.htmlType === 'checkbox') {
                    itemValue = [];
                    item.itemOptions.split(',').forEach(option => {
                        if (formData[`${itemId}_${option}`]) {
                            itemValue.push(option);
                        }
                    });
                    itemValue = itemValue.join(',');
                }
            }

            const session = localStorage.getItem("session");
            const sessionData = JSON.parse(session);

            return {
                BorrowerId: sessionData.userId,
                FormId: currentForm.ID,
                ItemId: item.ID,
                ItemValue: itemValue ? itemValue.toString() : null,
                ItemType: item.itemType,
                itemValueRef: itemValueRef,
            };
        });

        try {
            const session = localStorage.getItem("session");
            const sessionData = JSON.parse(session);
            const response = await fetch('https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/InsertBorrowerDetails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.token}`
                },
                body: JSON.stringify(records),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                sessionData.token = newToken;
                localStorage.setItem('session', JSON.stringify(sessionData));
            }
            const result = await response.json();
            console.log('Form submitted successfully:', result);

            if(currentFormIndex < borrowerForms.length - 1){
                setIsSubmitting(false); // Stop submitting
                handleNextForm(true); // Move to next form on success
            }else{
                nextStep();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setIsSubmitting(false); // Stop submitting
            handleNextForm(false); // Do not move to next form on failure.
        }
    };

    return (
        <>
            {currentForm && formItems && formItems.length>0&&
                <div className="container mt-4" id="main-content">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-8 col-lg-6">
                            <div className="card adminuiux-card overflow-hidden mb-4">
                                <div className="card-body">
                                    <h5 className="card-title">{currentForm.Title}</h5>
                                    <p className="card-text">{currentForm.Description}</p>
        
                                    {loading && <p>Loading form items...</p>}
        
                                    {formItems && renderFormFields()}
        
                                    <div className="d-flex justify-content-between mt-3">
                                        {/* {currentFormIndex > 0 && (
                                            <button className="btn btn-secondary" onClick={handlePreviousForm}>
                                                Previous
                                            </button>
                                        )} */}
                                        {formItems && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleSubmit}
                                                disabled={isSubmitting} // Disable button while submitting
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Save'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </>
    );
}

export default ProfileDetails;
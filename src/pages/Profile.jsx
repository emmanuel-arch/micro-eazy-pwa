import React, {useState,useEffect} from 'react';
import ProfileKYC from './segments/ProfileKYC';
import ProfilePhoto from './segments/ProfilePhoto';
import ProfileID from './segments/ProfileID';
import ProfileDetials from './segments/ProfileDetails';
import ProfileAttachments from './segments/ProfileAttachments'
import Account from './segments/Account'

function Profile() {
  const [configurationData, setConfigurationData] = useState(null);
  const [userId, setuserId] = useState("");
  const [entityId, setEntityId] = useState("");
  const [profileOptions, setProfileOptions] = useState("");
  const [gdFolder, setDdFolder] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [initialIncompleteStep, setInitialIncompleteStep] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const storedConfigurationData = localStorage.getItem('configuration');
    if (storedConfigurationData) {
      try {
        const configurationDataJson = JSON.parse(storedConfigurationData);
        ///console.log("Configuration Data: ",configurationDataJson);
        setConfigurationData(configurationDataJson); 
        setDdFolder(configurationDataJson.driveFolder);
        setEntityId(configurationDataJson.EntityId)
      } catch (error) {
        console.error('Error parsing data:', error);
      }
    }

    const session = localStorage.getItem("session");
    if (session) {
        const sessionData = JSON.parse(session);
        console.log("Session Data: ",sessionData);
        setuserId(sessionData?.userId);
    }

    fetchInitialOnboardingSettings().then(()=>{
      setIsLoading(false);
    });
  }, [userId, entityId]);

  const fetchInitialOnboardingSettings = async () => {
    // Fetch only on initial load to get initialIncompleteStep
    const storedConfigurationData = localStorage.getItem('configuration');
    const configurationDataJson = JSON.parse(storedConfigurationData);
    const session = localStorage.getItem("session");
    const sessionData = JSON.parse(session);

    if (sessionData.userId && configurationDataJson.EntityId) {
        try {
            const response = await fetch(
                "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/ProfileProgress",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        phoneNumber: "",
                        entityId: parseInt(configurationDataJson.EntityId),
                        requestFlag: sessionData.userId,
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log("Initial Profile Options", data);
                setProfileOptions(data);

                if (data?.profileComplete?.isComplete) {
                    setStep(5);
                } else if (data?.profileComplete?.incompleteStep) {
                    setInitialIncompleteStep(data?.profileComplete?.incompleteStep);
                    setStep(data?.profileComplete?.incompleteStep);
                }
            } else {
                console.error("Failed to fetch initial onboarding settings");
            }
        } catch (error) {
            console.error("Error fetching initial onboarding settings:", error);
        }
    }
  };

  const fetchOnboardingSettings = async (origin) => {
    console.log("Request Origin",origin);

    const storedConfigurationData = localStorage.getItem('configuration');
    const configurationDataJson = JSON.parse(storedConfigurationData);
    const session = localStorage.getItem("session");
    const sessionData = JSON.parse(session);

    if(sessionData.userId && configurationDataJson.EntityId){
      try {
        
        const response = await fetch(
            "https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/ProfileProgress",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",'Authorization': `Bearer ${sessionData.token}`
                },
                body: JSON.stringify({
                    phoneNumber: "",
                    entityId: parseInt(configurationDataJson.EntityId),
                    requestFlag: sessionData.userId,
                }),
            }
        );
  
        if (response.ok) {
            const data = await response.json();
            console.log("Profile Options",data)
            setProfileOptions(data);

            // if(data?.profileComplete?.isComplete){
            //   if(step!=5){
            //     setStep(5);
            //   }
            // }else{
            //   if(data?.profileComplete?.incompleteStep){
            //     if(data?.profileComplete?.incompleteStep!=step){
            //       setStep(data?.profileComplete?.incompleteStep);
            //     }
            //   }
            // }
            // if (data?.profileComplete?.isComplete) {
            //   setStep(5);
            // } else if (data?.profileComplete?.incompleteStep) {
            //     setInitialIncompleteStep(data?.profileComplete?.incompleteStep);
            //     setStep(data?.profileComplete?.incompleteStep);
            // }
        } else {
            console.error("Failed to fetch onboarding settings");
        }
      } catch (error) {
          console.error("Error fetching onboarding settings:", error);
      }
    }
  };

  {profileOptions && profileOptions.Profile && (
    console.log("Photo ID", profileOptions.Profile.borrowerPhoto)
  )}

  const nextStep = () => {
    if (userId && entityId) {
      setIsLoading(true);
      fetchOnboardingSettings("2").then(() => {
          setIsLoading(false);
      });
    }
    setStep(step + 1)
  };

  const renderStep = () =>{
    switch (step){
      case 1:
        // return <ProfileKYC nextStep={nextStep}/>;
        // console.log("Photo 1",profileOptions);
        // console.log("Photo 2",profileOptions.profile);
        // console.log("Photo 3",profileOptions?.profile?.borrowerPhoto);
        if (profileOptions?.profile?.borrowerPhoto){
          setStep(2);
          return null;
        }else{
          return <ProfilePhoto nextStep={nextStep} onUpload={handleProfilePhotoUpload}/>;
        }
      case 2:
        if (profileOptions?.profile?.IdentificationDoc==3){
          ///Passport Or National ID - All or Either
          ///If passport or Id front and Back set
          if (profileOptions?.profile.passportPhoto){///passport photo set, exit
            setStep(3);
            return null;
          }else{///request passport photo
            if(profileOptions?.profile.idFrontPhoto){///if id front photo is set, request back photo
              if(profileOptions?.profile.idBackPhoto){///id back photo is set, exit
                setStep(3);
                return null;
              }else{
                return <ProfileID 
                nextStep={nextStep} 
                photoType="2" 
                photoRef={profileOptions?.profile?.IdentificationDoc}
                passportPhoto={profileOptions?.profile.passportPhoto}
                idFrontPhoto={profileOptions?.profile.idFrontPhoto}
                idBackPhoto={profileOptions?.profile.idBackPhoto}
                onUpload={handleProfilePhotoUpload}/>;
              }
            }else { ///request passport, can skip to ID
              return <ProfileID 
              nextStep={nextStep} 
              photoType="3" 
              photoRef={profileOptions?.profile?.IdentificationDoc}
              passportPhoto={profileOptions?.profile.passportPhoto}
              idFrontPhoto={profileOptions?.profile.idFrontPhoto}
              idBackPhoto={profileOptions?.profile.idBackPhoto}
              onUpload={handleProfilePhotoUpload}/>;
            }
          }
        }else if (profileOptions?.profile?.IdentificationDoc==2){
          ///National ID only
          if(profileOptions?.profile.idFrontPhoto){///id front photo set, request back
            if(profileOptions?.profile.idBackPhoto){///id back photo is set, exit
              setStep(3);
              return null;
            }else{
              return <ProfileID 
              nextStep={nextStep} 
              photoType="2" 
              photoRef={profileOptions?.profile?.IdentificationDoc}
              passportPhoto={profileOptions?.profile.passportPhoto}
              idFrontPhoto={profileOptions?.profile.idFrontPhoto}
              idBackPhoto={profileOptions?.profile.idBackPhoto}
              onUpload={handleProfilePhotoUpload}/>;
            }
          }else{///request ID front
            return <ProfileID 
            nextStep={nextStep} 
            photoType="1" 
            photoRef={profileOptions?.profile?.IdentificationDoc}
            passportPhoto={profileOptions?.profile.passportPhoto}
            idFrontPhoto={profileOptions?.profile.idFrontPhoto}
            idBackPhoto={profileOptions?.profile.idBackPhoto}
            onUpload={handleProfilePhotoUpload}/>;
          }
        }else{
          ///Passport Only
          if(profileOptions?.profile.passportPhoto){///passport photo
            return <ProfileID 
            nextStep={nextStep} 
            photoType="3" 
            photoRef={profileOptions?.profile?.IdentificationDoc}
            passportPhoto={profileOptions?.profile.passportPhoto}
            idFrontPhoto={profileOptions?.profile.idFrontPhoto}
            idBackPhoto={profileOptions?.profile.idBackPhoto}
            onUpload={handleProfilePhotoUpload}/>;
          }else{
            setStep(3);
            return null;
          }
        }
      case 3:
        ///additional details
        return <ProfileDetials nextStep={nextStep} profileOptions={profileOptions}/>;
      case 4:
        ///additional attachments
        return <ProfileAttachments nextStep={nextStep} profileOptions={profileOptions} onUpload={handleProfilePhotoUpload}/>;
      case 5:
        ///additional attachments
        return <Account profileOptions={profileOptions} />;
      default:
        return null;
    }
  }

  const handleProfilePhotoUpload = (file, photoType, photoRef, attachmentName, attachmentDesc, callback) => {
    const storedConfigurationData = localStorage.getItem('configuration');
    const configurationDataJson = JSON.parse(storedConfigurationData);
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', '1mj4MfZTpCgi2fgV0GDQwpja9aiYp0KWb');
  
    fetch('https://micromartafrica.co.ke/MicromartAPI/api/app/UploadFile', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then(text => {
            console.error("HTTP error:", response.status, text);
            throw new Error(`HTTP error! status: ${response.status}`);
          });
        }
        return response.text();
      })
      .then((textData) => {
        console.log('Profile photo upload response (text):', textData);
  
        const fileId = textData.trim();
  
        if (!fileId) {
          console.error("Could not extract fileId from text response.");
          callback(false);
          return;
        }
  
        const session = localStorage.getItem("session");
        const sessionData = JSON.parse(session);

        if(photoType>0){
          fetch('https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/UpdateBorrowerPhotos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.token}`
            },
            body: JSON.stringify({
              borrowerId: userId,
              photoType: photoType,
              fileId: fileId,
            }),
          }).then((updateResponse) => {
            if (!updateResponse.ok) {
              return updateResponse.text().then(text => {
                console.error("Update HTTP error:", updateResponse.status, text);
                throw new Error(`HTTP error! status: ${updateResponse.status}`);
              });
            }
            
            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                sessionData.token = newToken;
                localStorage.setItem('session', JSON.stringify(sessionData));
            }
            return updateResponse.text(); // Get the response as text
          }).then((updateTextData) => {
            console.log('Photo update response (text):', updateTextData);
            ///setStep(step + 1);
            callback(true, fileId); //provide the fileId on success.
          }).catch((updateError) => {
            console.error('Error updating borrower photos:', updateError);
            callback(false, null);
          });
        }else{
          const session = localStorage.getItem("session");
          const sessionData = JSON.parse(session);

          const payload = [
            {
                BorrowerId: sessionData.userId, // Make sure borrowerId prop is passed
                FormId: photoRef,
                ItemName: attachmentName,
                ItemType: attachmentDesc,
                ItemValue: fileId,
                ItemId: 0,
                Latitude: 0.0,
                Longitude: 0.0,
                AttachmentAddress: "0",
                AttachmentLocation: "0",
            },
          ];

          fetch('https://micromartafrica.co.ke/MicromartAPI/Mobile/Application/InsertBorrowerAttachments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionData.token}`
            },
            body: JSON.stringify(payload),
          }).then((updateResponse) => {
            if (!updateResponse.ok) {
              return updateResponse.text().then(text => {
                ///console.error("Update HTTP error:", updateResponse.status, text);
                throw new Error(`HTTP error! status: ${updateResponse.status}`);
              });
            }

            const newToken = response.headers.get('X-New-Token');
            if (newToken) {
                sessionData.token = newToken;
                localStorage.setItem('session', JSON.stringify(sessionData));
            }
            return updateResponse.text(); // Get the response as text
          }).then((updateTextData) => {
            ///console.log('Photo update response (text):', updateTextData);
            ///setStep(step + 1);
            callback(true, fileId); //provide the fileId on success.
          }).catch((updateError) => {
            ///console.error('Error updating borrower photos:', updateError);
            callback(false, null);
          });
        }
      })
      .catch((error) => {
        console.error('Profile photo upload error:', error);
        callback(false);
      });
  };

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }
  
  return (
    <>
      {renderStep()}
    </>
  );
}

export default Profile;
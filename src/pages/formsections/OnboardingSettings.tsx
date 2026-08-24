interface OnboardingSettings {
    firstName: string; // e.g., "Required"
    otherName: string; // e.g., "Required"
    dob: string; // e.g., "Required"
    gender: string; // e.g., "Required"
    nationalID: string; // e.g., "Required,Unique"
    phoneNumber: string; // e.g., "Required,Unique"
    emailAddress: string; // e.g., "Required,Unique"
    postalAddress: string | null; // e.g., null or a string
    physicalAddress: string | null; // e.g., null or a string
    passportPhoto: number;
    identificationDoc: number;
    identificationDocReq: number;
}
  
export type { OnboardingSettings };
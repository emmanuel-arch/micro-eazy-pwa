import { type OnboardingSettings } from "./OnboardingSettings";

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

const OnboardingValidationRules = (onboardingSettings: OnboardingSettings[] | null | undefined): ValidationRules => {
    if (!onboardingSettings || onboardingSettings.length === 0) {
        console.log("onboardingSettings is empty or undefined");
        return {};
    }

    const rules: ValidationRules = {};
    const settings = onboardingSettings[0];

    if (settings) {
        for (const fieldName in settings) {
            if (typeof settings[fieldName] === "string") {
                const setting = settings[fieldName];
                const isRequired = setting.includes("Required");
                const isUnique = setting.includes("Unique");

                if (isRequired) {
                    rules[fieldName] = {
                        required: "This field is required.",
                    };
                }

                if (fieldName === "emailAddress" && isRequired) {
                    if (!rules[fieldName]) {
                        rules[fieldName] = {};
                    }
                    rules[fieldName].pattern = {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address.",
                    };
                }

                if (fieldName === "phoneNumber" && isRequired) {
                    if (!rules[fieldName]) {
                        rules[fieldName] = {};
                    }
                    rules[fieldName].pattern = {
                        value: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im,
                        message: "Invalid Phone number",
                    };
                }

                if (fieldName === "nationalID" && isRequired) {
                    if (!rules[fieldName]) {
                        rules[fieldName] = {};
                    }
                    rules[fieldName].pattern = {
                        value: /^[0-9]{7,8}$/,
                        message: "Invalid National ID",
                    };
                }

                if (fieldName === "dob" && isRequired) {
                    if (!rules[fieldName]) {
                        rules[fieldName] = {};
                    }
                    rules[fieldName].validate = (value) => {
                        console.log("DOB value received:", value);

                        if (!value) {
                            return "Date of birth is required.";
                        }

                        const birthDate = new Date(value);

                        if (isNaN(birthDate.getTime())) {
                            return "Invalid date format.";
                        }

                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const month = today.getMonth() - birthDate.getMonth();

                        if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }

                        console.log("Your Age: ", age);

                        if (age < 18) {
                            return "You must be 18 or older.";
                        }
                        return true;
                    };
                }

                if (fieldName === "password" && isRequired) {
                    if (!rules[fieldName]) {
                        rules[fieldName] = {};
                    }
                    rules[fieldName].validate = (value) => {
                        if (!value) {
                            return "Password is required.";
                        }
                        if (value.length < 8) {
                            return "Password must be at least 8 characters.";
                        }
                        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)) {
                            return "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
                        }
                        return true;
                    };
                }

                if (fieldName === "confirmPassword" && isRequired) {
                  if (!rules[fieldName]) {
                    rules[fieldName] = {};
                  }
                  rules[fieldName].validate = (value) => {
                    if (!value) {
                      return "Confirm Password is required.";
                    }
                    return true;
                  };
                }
            }
        }
    }

    console.log("Generated rules:", rules);
    return rules;
};

export default OnboardingValidationRules;
import { z } from "zod";
import { PROGRAM_OPTIONS, QUOTA_OPTIONS } from "@/app/constants/dropdownOptions";

export const userRegisterSchema = z.object({
    firstName: z.string().min(1, "Please provide a name").max(60, "Name cannot be more than 60 characters"),
    middleName: z.string().max(60, "Name cannot be more than 60 characters").optional(),
    lastName: z.string().min(1, "Please provide a name").max(60, "Name cannot be more than 60 characters"),
    email: z.string().email("Please provide a valid email"),
    mobileNumber: z.string().min(5, "Please provide a valid mobile number").max(20, "Please provide a valid mobile number"),
    gender: z.string().min(1, "Please provide a gender"),
    dob: z.string().min(1, "Please provide a date of birth"),
    applyingYear: z.string().min(4, "Please provide an valid applying year"),
    quota: z.enum(QUOTA_OPTIONS).refine(val => val, { message: "Please select a valid quota" }),
    program: z.enum(PROGRAM_OPTIONS).refine(val => val, { message: "Please select a valid program" }),
    aadharNo: z.string().min(12, "Please provide a valid aadhar number").max(12, "Please provide a valid aadhar number"),
    religion: z.string().min(1, "Please provide a religion"),
    cast: z.string().min(1, "Please provide a cast"),
});

export const userLoginSchema = z.object({
    email: z.string().email("Please provide a valid email"),
    password: z.string().min(8, "Password must be atleast 8 characters"),
    role: z.enum(["admin", "user"]).optional(),
});

const addressSchema = z.object({
    houseName: z.string().min(1, "House name is required"),
    state: z.string().min(1, "State is required"),
    district: z.string().min(1, "District is required"),
    city: z.string().min(1, "City is required"),
    pincode: z.string().min(6, "Enter valid pincode").max(6, "Enter valid pincode"),
});

const parentDetailsSchema = z.object({
    guardian: z.string().min(1, "Guardian name is required"),
    occupation: z.string().min(1, "Occupation is required"),
    sponsor: z.string().min(1, "NRI Sponsor name is required"),
    relation: z.string().min(1, "Sponsor relation is required"),
});

export const personalDetailsSchema = z.object({
    // Personal Information
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    mobileNumber: z
        .string()
        .min(5, "Mobile number must be at least 5 digits")
        .max(20, "Mobile number must be at most 20 digits"),
    keralaMobileNumber: z
        .string()
        .min(10, "Kerala mobile number must be 10 digits")
        .max(10, "Kerala mobile number must be 10 digits"),
    dob: z.string().min(1, "Date of birth is required"),

    // Photo will need separate handling for file upload
    photo: z.string().optional(),

    // Contact Address
    contactAddress: addressSchema,

    // Permanent Address
    permanentAddress: addressSchema,

    // Parent Details
    parentDetails: parentDetailsSchema,
});

// Type for the form data
export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;

// Validation function for use in the server action
export const validatePersonalDetails = (data: unknown) => {
    return personalDetailsSchema.parse(data);
};

export const EducationalDetailsSchema = z.object({
    _10thSchool: z.string().min(1, "10th School is required"),
    _10thBoard: z.string().min(1, "10th Board is required"),
    _10thMarklist: z.string().min(1, "10th Marklist is required"),
    _12thSchool: z.string().optional().default(""),
    _12thBoard: z.string().optional().default(""),
    _12thMarklist: z.string().optional().default(""),
    KeamYear: z.string().optional(),
    KeamRollNo: z.string().optional(),
    KeamRank: z.string().optional(),
    PaperOneScore: z.string().optional(),
    PaperTwoScore: z.string().optional(),
    KeamScore: z.string().optional(),
    KeamMarklist: z.string().optional().default(""),
});

export type EducationalDetailsFormData = z.infer<typeof EducationalDetailsSchema>;
"use client";
import { useEffect, useState, useCallback } from "react";
import DropDownInput from "../DropDownInput";
import { Button } from "@heroui/react";
import { Checkbox } from "@heroui/react";
import FileUploadInput from "../FileUploadInput";
import { useSession } from "next-auth/react";
import { isBranchAvailable } from "@/app/actions/branch-Actions";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateDeclerationDetails } from "@/app/actions/onboarding-actions";
import { Branch } from "@/types/userTypes";
import useUserStore from "@/app/store/userStore";
import CustomToast from "../CustomToast";
import { BRANCH_OPTIONS, getBranchCodeFromDisplayName, getBranchDisplayName } from "@/app/constants/dropdownOptions";

// Define the validation schema with Zod
const declarationSchema = z.object({
  branch: z.enum(BRANCH_OPTIONS, {
    required_error: "Branch selection is required",
    invalid_type_error: "Branch must be one of the available options",
  }),
  signature: z.string().min(1, "Applicant signature is required"),
  parentSignature: z.string().min(1, "Parent signature is required"),
  agreementChecked: z
    .boolean()
    .refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    })
    .default(false),
});

type DeclarationFormData = z.infer<typeof declarationSchema>;

// Define the expected response type from isBranchAvailable
interface BranchAvailabilityResponse {
  totalSets: number;
  occupiedSets: number;
  nriSeats: number;
  occupiedNri: number;
  superSeats: number;
  occupiedSuper: number;
}

export default function Declaration() {
  const [branchAlert, setbranchAlert] = useState<string | null>(null);
  const [academic, setacademic] = useState(0);
  const session = useSession();

  const { userData, fetchUserData } = useUserStore();

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DeclarationFormData>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      branch: "" as Branch,
      signature: "",
      parentSignature: "",
      agreementChecked: false,
    },
  });

  const formValues = watch();

  // Memoize handleBranchChange to prevent its reference from changing on every render.
  const handleBranchChange = useCallback(async (value: Branch) => {
    setValue("branch", value);
    const response = (await isBranchAvailable(academic, value)) as BranchAvailabilityResponse | null;
    console.log(response);
    
    if (response) {
      // Get user's quota from userData
      const userQuota = userData?.["Student Details"]?.["Quota"];
      
      let isAvailable = false;
      let alertMessage = "";
      
      if (userQuota === "NRI") {
        // Check NRI seat availability
        isAvailable = response.occupiedNri < response.nriSeats;
        alertMessage = isAvailable 
          ? `Branch is available (NRI seats: ${response.occupiedNri}/${response.nriSeats})` 
          : `Branch is not available (NRI seats full: ${response.occupiedNri}/${response.nriSeats})`;
      } else if (userQuota === "OCI" || userQuota === "CIWG" || userQuota === "PIO") {
        // Check Super seat availability for OCI, CIWG, PIO
        isAvailable = response.occupiedSuper < response.superSeats;
        alertMessage = isAvailable 
          ? `Branch is available (Super seats: ${response.occupiedSuper}/${response.superSeats})` 
          : `Branch is not available (Super seats full: ${response.occupiedSuper}/${response.superSeats})`;
      } else {
        // Fallback to total seat check if quota is not recognized
        isAvailable = response.totalSets !== response.occupiedSets;
        alertMessage = isAvailable ? "Branch is available" : "Branch is not available";
      }
      
      setbranchAlert(alertMessage);
    } else {
      setbranchAlert("Branch is not available");
    }
  }, [academic, setValue, userData]);

  // Use effect to pre-fill form data from userData when available.
  useEffect(() => {
    if (userData) {
      // Set branch if available
      const branch = userData["Branch Details"]?.Branch as Branch;
      if (branch) {
        setValue("branch", branch);
        // Check branch availability when pre-filling
        handleBranchChange(branch);
      }

      // Set signature if available
      const signature = userData["Uploads"]?.studentSignature;
      if (signature && signature !== "/no_img.png") {
        setValue("signature", signature);
      }

      // Set parent signature if available in userData
      const parentSignature = userData["Uploads"]?.parentSignature;
      if (parentSignature && parentSignature !== "/no_img.png") {
        setValue("parentSignature", parentSignature);
      }

      // If all required fields are filled, we can assume the user has agreed
      if (
        branch &&
        userData["Uploads"]?.studentSignature &&
        userData["Uploads"]?.parentSignature &&
        userData["Uploads"]?.studentSignature !== "/no_img.png" &&
        userData["Uploads"]?.parentSignature !== "/no_img.png"
      ) {
        setValue("agreementChecked", true);
      }
    }
  }, [userData, setValue, handleBranchChange]);

  const setFileLink = (
    fieldName: keyof Pick<DeclarationFormData, "signature" | "parentSignature">,
    url: string
  ) => {
    setValue(fieldName, url);
  };

  const onSubmit = async (data: DeclarationFormData) => {
    console.log(data);
    
    // Validate applicant signature
    if (!data.signature || data.signature.trim() === "") {
      CustomToast({ 
        title: "Applicant Signature Required", 
        description: "Please upload the applicant's signature before saving."
      });
      return;
    }

    // Validate parent signature
    if (!data.parentSignature || data.parentSignature.trim() === "") {
      CustomToast({ 
        title: "Parent Signature Required", 
        description: "Please upload the parent's signature before saving."
      });
      return;
    }

    // Check branch availability before submission
    const branchResponse = await isBranchAvailable(academic, data.branch) as BranchAvailabilityResponse;
    const userQuota = userData?.["Student Details"]?.["Quota"];
    
    let canProceed = false;
    if (userQuota === "NRI") {
      canProceed = branchResponse.occupiedNri < branchResponse.nriSeats;
    } else if (userQuota === "OCI" || userQuota === "CIWG" || userQuota === "PIO") {
      canProceed = branchResponse.occupiedSuper < branchResponse.superSeats;
    } else {
      canProceed = branchResponse.totalSets !== branchResponse.occupiedSets;
    }

    if (!canProceed) {
      CustomToast({ 
        title: "Branch Not Available", 
        description: `No seats available in ${getBranchDisplayName(data.branch)} for your quota category. Please select a different branch.`
      });
      return;
    }

    // Handle form submission
    const { branch, signature, parentSignature } = data;
    const response = await updateDeclerationDetails({
      branch: branch as Branch,
      signature,
      signatureGuardian: parentSignature,
    });
    if (response.success) {
      CustomToast({
        title: "Declaration details saved successfully!",
      });
      
      // Refresh user data after successful submission
      if (session?.data?.user?.id) {
        await fetchUserData(session.data.user.id);
      }
      
    } else {
      CustomToast({
        title: "Failed to save declaration details.",
      });

    }
  };


  useEffect(() => {
    const fetchData = async () => {
      if (session?.data?.user?.id) {
        const userDetails = await fetchUserData(session.data.user.id);
        const academicYear = userDetails?.['Student Details']?.['Academic Year'];
        setacademic(academicYear);
      }
    };
    fetchData();
  }, [session, fetchUserData]);

  const year = academic.toString();
  return (
    <div className="flex flex-col items-center justify-center w-full p-3">
      <div className="bg-textBoxBackground relative shadow-xl rounded-3xl p-4 sm:p-8 w-full max-w-[100%] sm:max-w-4xl ">
        <h2 className="text-2xl font-semibold mb-6 text-center text-muthootRed">
          Branch Selection
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <Controller
              name="branch"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <DropDownInput
                    id="branch"
                    label="Branch"
                    required={true}
                    options={BRANCH_OPTIONS.map(getBranchDisplayName)}
                    onChange={(e) =>
                      handleBranchChange(getBranchCodeFromDisplayName(e.target.value))
                    }
                    value={getBranchDisplayName(field.value)}
                  />
                  {errors.branch && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.branch.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
          {branchAlert && (
            <div className="p-2">
              {branchAlert.includes("Branch is available") ? (
                <span className="text-green-600">{branchAlert}</span>
              ) : (
                <span className="text-red-600">{branchAlert}</span>
              )}
            </div>
          )}
          <p className="text-xl my-6 text-center underline">Instructions</p>
          <div className="w-full space-y-4 p-2">
            <p className="font-semibold ">
              1. GROUP A branches [ECE, CSE, Artificial Intelligence, AI&DS,
              CyberSecurity]
            </p>
            <p>
              {`I am aware about the criteria followed by "Muthoot Institute
            of Technology and Science", for the B-Tech NRI Quota admission for
            the year ${year}, such that my ward has to attain 80% Marks for
            Mathematics individually and 80% put together in Physics, Chemistry
            & Mathematics, in the 12th standard, for Qualifying
            examination(CBSE/ISC) OR attain 80% Marks for Mathematics
            individually and 80% put together in Physics, Chemistry &
            Mathematics, in the 12th standard(Terminal Evaluation TE), for
            Qualifying examination(State Board). If my ward failed to do so,
            there is no claim, from my side for the admission`}
            </p>
            <p className="font-semibold ">2. GROUP B branches [CE, ME, EEE,]</p>
            <p>
              {`I am aware about the criteria followed by "Muthoot Institute of
            Technology and Science", for the B-Tech NRI Quota admission for the
            year ${year}, such that my ward has to attain 75% Marks for Mathematics
            individually and 75% put together in Physics, Chemistry &
            Mathematics, in the 12th standard, for Qualifying
            examination(CBSE/ISC) OR attain 75% Marks for Mathematics
            individually and 75% put together in Physics, Chemistry &
            Mathematics, in the 12th standard(Terminal Evaluation TE), for
            Qualifying examination(State Board). If my ward failed to do so,
            there is no claim, from my side for the admission`}
            </p>
          </div>

          <div className="w-full space-y-4 p-2 border-[3px] rounded-md mt-3 border-orange-500">
            <p className="text-center font-semibold text-orange-500">
              EXIT OPTION{" "}
            </p>
            <p>
              1. A student can opt to <b className="text-orange-500">EXIT</b>{" "}
              from NRI quota before <b>5 </b>
              days, after the publication of{" "}
              <b className="text-orange-500">
                KEAM {year} SCORE/answer key
              </b>{" "}
              whichever is earlier and will be reimbursed with the entire amount
              after deducting Rs
              <b> 1000</b> as processing fee. However, a student will be
              automatically considered for MITS Management Merit Quota from NRI
              quota if he desires so and has to{" "}
              <b className="text-orange-500">freeze</b> the registration in MITS
              by sending an email to admissions@mgits.ac.in .
              <b className="text-orange-500">Request for exit</b> should be
              mailed to{" "}
              <b className="text-orange-500">admissions@mgits.ac.in</b> within
              the stipulated time. There after the registered choice will be
              frozen and will not be eligible for any refund, if the admission
              is cancelled after 5 days from the date of KEAM SCORE publication.
            </p>

            <p>
              <b>2. </b> I hereby declare that I have read all the instructions,
              Exit options and undertake that all the information furnished
              above are true and correct and I will obey the rules and
              regulations of the institution if admitted
            </p>
          </div>
          <Controller
            name="agreementChecked"
            control={control}
            render={({ field }) => (
              <div>
                <Checkbox
                  isSelected={field.value}
                  onValueChange={(isSelected) =>
                    setValue("agreementChecked", isSelected)
                  }
                  required={true}
                >
                  I have clearly read the instructions mentioned above and would
                  like to proceed further
                </Checkbox>
                {errors.agreementChecked && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.agreementChecked.message}
                  </p>
                )}
              </div>
            )}
          />

          <div className="space-y-6">
            <div>
              <FileUploadInput
                id="signature"
                label="Signature of Applicant"
                required={formValues.signature ? false : true}
                setFileLink={(url) => setFileLink("signature", url)}
                value={formValues.signature}
              />
              {formValues.signature && (
                <div className="text-sm text-green-600 ml-2 mt-1">
                  Applicant signature uploaded successfully
                </div>
              )}
              {errors.signature && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.signature.message}
                </p>
              )}
            </div>

            <div>
              <FileUploadInput
                id="parentSignature"
                label="Signature of Parent"
                required={formValues.signature ? false : true}
                setFileLink={(url) => setFileLink("parentSignature", url)}
                value={formValues.parentSignature}
              />
              {formValues.parentSignature && (
                <div className="text-sm text-green-600 ml-2 mt-1">
                  Parent signature uploaded successfully
                </div>
              )}
              {errors.parentSignature && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.parentSignature.message}
                </p>
              )}
            </div>
          </div>
          <h1 className="text-muthootRed">
            the image should be of filetype (jpeg/png) of size less than 2MB*
          </h1>
          <Button
            type="submit"
            className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Save
          </Button>
        </form>
      </div>
    </div>
  );
}

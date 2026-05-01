import { useEffect, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import InputDate from "../InputDate";
import DropDownInput from "../DropDownInput";
import { Button } from "@heroui/react";
import { Checkbox } from "@heroui/checkbox";
import FileUploadInput from "../FileUploadInput";
import { personalDetailsAction } from "../../actions/onboarding-actions";
import { type PersonalDetailsFormData } from "@/schemas";
import { COUNTRY_CODES, COUNTRY_CODES_VALUES } from "../../constants/dropdownOptions";

import useUserStore from "@/app/store/userStore";
import { useSession } from "next-auth/react";
import CustomToast from "../CustomToast";

export default function PersonalDetails() {
  const [isSelected, setIsSelected] = useState(false);
  // const [fileLink, setFileLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);

  const session = useSession();
  // console.log("Session Data:", session.data);
  const { fetchUserData, userData } = useUserStore();

  // Initialize form state with proper types
  const [formData, setFormData] = useState<PersonalDetailsFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    mobileNumber: "",
    keralaMobileNumber: "",
    dob: "",
    photo: "",
    contactAddress: {
      houseName: "",
      state: "",
      district: "",
      city: "",
      pincode: "",
    },
    permanentAddress: {
      houseName: "",
      state: "",
      district: "",
      city: "",
      pincode: "",
    },
    parentDetails: {
      guardian: "",
      occupation: "",
      sponsor: "",
      relation: "",
    },
  });

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (session?.data?.user?.id) {
        await fetchUserData(session.data.user.id);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [session, fetchUserData]);

  // Populate form data when userData changes
  useEffect(() => {
    if (userData) {
      // Extract name parts
      const fullName = userData["Student Details"]["Name"] || "";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName =
        nameParts.length > 2
          ? nameParts[2] || ""
          : nameParts.length > 1
          ? nameParts[1] || ""
          : "";
      const middleName = nameParts.length > 2 ? nameParts[1] || "" : "";

      // Fix date formatting
      let dobString = "";
      const dobFromUser = userData["Student Details"]["Date of Birth"];
      if (dobFromUser && dobFromUser !== "Not provided") {
        try {
          // Handle different date formats and ensure proper conversion
          const dobDate = new Date(dobFromUser);

          // Check if the date is valid
          if (!isNaN(dobDate.getTime())) {
            // Format as YYYY-MM-DD for date input
            const year = dobDate.getFullYear();
            const month = String(dobDate.getMonth() + 1).padStart(2, "0");
            const day = String(dobDate.getDate()).padStart(2, "0");
            dobString = `${year}-${month}-${day}`;
          } else {
            // Try to parse DD-MM-YYYY or DD/MM/YYYY format
            const dateParts = dobFromUser.split(/[-\/]/);
            if (dateParts.length === 3) {
              // Assume DD-MM-YYYY or DD/MM/YYYY format
              const day = dateParts[0].padStart(2, "0");
              const month = dateParts[1].padStart(2, "0");
              const year = dateParts[2];
              dobString = `${year}-${month}-${day}`;
            }
          }
          console.log("Parsed DOB:", dobString);
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      }

      // Parse mobile number for country code
      let parsedMobile = userData["Student Details"]["Phone"] || "";
      let parsedCountryCode = COUNTRY_CODES[0];
      if (parsedMobile.startsWith("+")) {
        const foundCode = COUNTRY_CODES.find((displayStr) => {
          const callingCode = COUNTRY_CODES_VALUES[displayStr];
          return parsedMobile.startsWith(callingCode);
        });
        
        if (foundCode) {
          parsedCountryCode = foundCode;
          parsedMobile = parsedMobile.slice(COUNTRY_CODES_VALUES[foundCode].length);
        }
      }
      setCountryCode(parsedCountryCode);

      setFormData({
        firstName,
        middleName,
        lastName,
        mobileNumber: parsedMobile,
        keralaMobileNumber: userData["Student Details"]["Kerala Phone"] || "",
        dob: dobString,
        photo:
          userData["Uploads"]?.["studentPhoto"] !== "/no_img.png"
            ? userData["Uploads"]?.["studentPhoto"] || undefined
            : undefined,
        contactAddress: {
          houseName: userData["Contact Address"]?.["House Name"] || "",
          state: userData["Contact Address"]?.["State"] || "",
          district:
            userData["Contact Address"]?.["District, City"]
              ?.split(",")[0]
              ?.trim() === "undefined"
              ? ""
              : userData["Contact Address"]?.["District, City"]
                  ?.split(",")[0]
                  ?.trim() || "",
          city:
            userData["Contact Address"]?.["District, City"]
              ?.split(",")[1]
              ?.trim() === "undefined"
              ? ""
              : userData["Contact Address"]?.["District, City"]
                  ?.split(",")[1]
                  ?.trim() || "",
          pincode: userData["Contact Address"]?.["Pin"]?.toString() || "",
        },
        permanentAddress: {
          houseName: userData["Permanent Address"]?.["House Name"] || "",
          state: userData["Permanent Address"]?.["State"] || "",
          district:
            userData["Contact Address"]?.["District, City"]
              ?.split(",")[0]
              ?.trim() === "undefined"
              ? ""
              : userData["Contact Address"]?.["District, City"]
                  ?.split(",")[0]
                  ?.trim() || "",
          city:
            userData["Contact Address"]?.["District, City"]
              ?.split(",")[1]
              ?.trim() === "undefined"
              ? ""
              : userData["Contact Address"]?.["District, City"]
                  ?.split(",")[1]
                  ?.trim() || "",
          pincode: userData["Permanent Address"]?.["Pin"]?.toString() || "",
        },
        parentDetails: {
          guardian: userData["Student Details"]["Parent Name"] || "",
          occupation: userData["Student Details"]["Parent Occupation"] || "",
          sponsor: userData["Student Details"]["NRI Sponsor"] || "",
          relation:
            userData["Student Details"]["Relationship with Applicant"] || "",
        },
      });

      // Check if permanent address is same as contact address and set checkbox
      const contactAddr = userData["Contact Address"];
      const permAddr = userData["Permanent Address"];

      if (
        contactAddr &&
        permAddr &&
        contactAddr["House Name"] === permAddr["House Name"] &&
        contactAddr["State"] === permAddr["State"] &&
        contactAddr["District, City"] === permAddr["District, City"] &&
        contactAddr["Pin"] === permAddr["Pin"]
      ) {
        setIsSelected(true);
      }
    }
  }, [userData]);

  useEffect(() => {
    if (isSelected) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: {
          ...prev.permanentAddress,
          houseName: prev.contactAddress.houseName,
          state: prev.contactAddress.state,
          district: prev.contactAddress.district,
          city: prev.contactAddress.city,
          pincode: prev.contactAddress.pincode,
        },
      }));
    }
  }, [
    isSelected,
    formData.contactAddress?.houseName,
    formData.contactAddress?.state,
    formData.contactAddress?.district,
    formData.contactAddress?.city,
    formData.contactAddress?.pincode,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;

    // Map form field IDs to schema fields
    const fieldMappings: Record<
      string,
      { section: keyof PersonalDetailsFormData; field: string }
    > = {
      // Personal details
      firstName: { section: "firstName", field: "firstName" },
      middleName: { section: "middleName", field: "middleName" },
      lastName: { section: "lastName", field: "lastName" },
      contactNumber: { section: "mobileNumber", field: "mobileNumber" },
      contactNumberKerala: {
        section: "keralaMobileNumber",
        field: "keralaMobileNumber",
      },
      dob: { section: "dob", field: "dob" },
      photo: { section: "photo", field: "photo" },

      // Contact address
      houseName: { section: "contactAddress", field: "houseName" },
      state: { section: "contactAddress", field: "state" },
      district: { section: "contactAddress", field: "district" },
      city: { section: "contactAddress", field: "city" },
      pinCode: { section: "contactAddress", field: "pincode" },

      // Permanent address
      houseNamePermanent: { section: "permanentAddress", field: "houseName" },
      statePermanent: { section: "permanentAddress", field: "state" },
      districtPermanent: { section: "permanentAddress", field: "district" },
      cityPermanent: { section: "permanentAddress", field: "city" },
      pinCodePermanent: { section: "permanentAddress", field: "pincode" },

      // Parent details
      guardian: { section: "parentDetails", field: "guardian" },
      occupation: { section: "parentDetails", field: "occupation" },
      sponsor: { section: "parentDetails", field: "sponsor" },
      sponsorRelation: { section: "parentDetails", field: "relation" },
    };

    const mapping = fieldMappings[id];
    if (!mapping) return;

    setFormData((prev) => {
      if (
        mapping.section === "contactAddress" ||
        mapping.section === "permanentAddress" ||
        mapping.section === "parentDetails"
      ) {
        return {
          ...prev,
          [mapping.section]: {
            ...prev[mapping.section],
            [mapping.field]: value,
          },
        };
      }
      return {
        ...prev,
        [mapping.section]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if photo is uploaded
    if (!formData.photo || formData.photo.trim() === "") {
      CustomToast({ 
        title: "Photo Required", 
        description: "Please upload a photo before saving your personal details."
      });
      return;
    }

    try {
      CustomToast({ title: "Saving" });
      const selectedCallingCode = COUNTRY_CODES_VALUES[countryCode] || "+91";
      const finalMobileNumber = selectedCallingCode === "+91" 
        ? formData.mobileNumber 
        : `${selectedCallingCode}${formData.mobileNumber}`;

      const dataToSubmit = {
        ...formData,
        mobileNumber: finalMobileNumber,
      };

      console.log("Submitting personal details", dataToSubmit);
      const response = await personalDetailsAction(dataToSubmit);
      if (response.success) {
        console.log(response.message);

        // Refresh user data after successful submission
        if (session?.data?.user?.id) {
          await fetchUserData(session.data.user.id);
          CustomToast({ title: "Saved" });
        }
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error submitting personal details", error);
      CustomToast({ title: "Error", description: "Error submitting details" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Loading user data...
      </div>
    );
  }

  return (
    <form
      className="flex flex-col items-center justify-center w-full p-3"
      onSubmit={handleSubmit}
    >
      <div className="bg-textBoxBackground relative shadow-xl rounded-3xl p-4 sm:p-8 w-full max-w-[100%] sm:max-w-7xl ">
        <h1 className="p-4 text-2xl">Personal Details</h1>
        <div className="flex flex-col grid-rows-4 gap-10 md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-1 flex-col gap-10 ">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"firstName"}
                  label={"First Name"}
                  autoComplete="given-name"
                  required={true}
                  onChange={handleChange}
                  value={formData.firstName}
                />
                <FloatingLabelInput
                  id={"middleName"}
                  label={"Middle Name"}
                  autoComplete="additional-name"
                  onChange={handleChange}
                  value={formData.middleName}
                />
                <FloatingLabelInput
                  id={"lastName"}
                  label={"Last Name"}
                  required={true}
                  autoComplete="family-name"
                  onChange={handleChange}
                  value={formData.lastName}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <div className="flex w-full space-x-4">
                  <div className="flex-none w-1/3 sm:w-[150px]">
                    <DropDownInput
                      id={"countryCode"}
                      label={"Code"}
                      required={true}
                      options={COUNTRY_CODES}
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <FloatingLabelInput
                      id={"contactNumber"}
                      label={"Contact Ph. No"}
                      required={true}
                      type={"number"}
                      onChange={handleChange}
                      value={formData.mobileNumber}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"contactNumberKerala"}
                  label={"Kerala Ph. No"}
                  required={true}
                  type={"number"}
                  onChange={handleChange}
                  value={formData.keralaMobileNumber}
                />
                <InputDate
                  id={"dob"}
                  label={"Date of Birth"}
                  required={true}
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FileUploadInput
                  id="studentPhoto"
                  label="Photo"
                  required={!formData.photo}
                  setFileLink={(url) => {
                    setFormData((prev) => ({
                      ...prev,
                      photo: url,
                    }));
                  }}
                  onChange={handleChange}
                  value={formData.photo}
                />
              </div>
              {formData.photo ? (
                <span className="text-green-500 font-thin text-small">
                  File already uploaded
                </span>
              ) : (
                <span className="text-red-500 font-thin text-small">
                  Upload an image file of size less than 2mb
                </span>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <h1>Contact Address</h1>

              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"houseName"}
                  label={"House Name"}
                  required={true}
                  autoComplete="family-name"
                  onChange={handleChange}
                  value={formData.contactAddress.houseName}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"state"}
                  label={"State"}
                  required={true}
                  autoComplete="state"
                  onChange={handleChange}
                  value={formData.contactAddress.state}
                />
                <FloatingLabelInput
                  id={"district"}
                  label={"District"}
                  required={true}
                  autoComplete="district"
                  onChange={handleChange}
                  value={formData.contactAddress.district}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"city"}
                  label={"City"}
                  required={true}
                  autoComplete="city"
                  onChange={handleChange}
                  value={formData.contactAddress.city}
                />
                <FloatingLabelInput
                  id={"pinCode"}
                  label={"Pin Code"}
                  required={true}
                  autoComplete="pincode"
                  onChange={handleChange}
                  value={formData.contactAddress.pincode}
                  type="number"
                />
              </div>
              <div className="flex flex-row gap-4 md:flex-row ">
                <Checkbox
                  color="warning"
                  onValueChange={() => {
                    setIsSelected(!isSelected);
                  }}
                  isSelected={isSelected}
                ></Checkbox>{" "}
                <span>Use Contact address as Permanent address</span>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-10">
            <div className="flex flex-col gap-4">
              <h1>Permanent Address</h1>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"houseNamePermanent"}
                  label={"House Name"}
                  required={true}
                  autoComplete="family-name"
                  onChange={handleChange}
                  value={formData.permanentAddress.houseName}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"statePermanent"}
                  label={"State"}
                  required={true}
                  autoComplete="state"
                  onChange={handleChange}
                  value={formData.permanentAddress.state}
                />
                <FloatingLabelInput
                  id={"districtPermanent"}
                  label={"District"}
                  required={true}
                  autoComplete="district"
                  onChange={handleChange}
                  value={formData.permanentAddress.district}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"cityPermanent"}
                  label={"City"}
                  required={true}
                  autoComplete="city"
                  onChange={handleChange}
                  value={formData.permanentAddress.city}
                />
                <FloatingLabelInput
                  id={"pinCodePermanent"}
                  label={"Pin Code"}
                  required={true}
                  autoComplete="pincode"
                  onChange={handleChange}
                  value={formData.permanentAddress.pincode}
                  type="number"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h1>Parental Details</h1>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"guardian"}
                  label={"Parent/Guardian"}
                  required={true}
                  autoComplete="parent"
                  onChange={handleChange}
                  value={formData.parentDetails.guardian}
                />
                <FloatingLabelInput
                  id={"occupation"}
                  label={"Occupation"}
                  required={true}
                  autoComplete="occupation"
                  onChange={handleChange}
                  value={formData.parentDetails.occupation}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"sponsor"}
                  label={"NRI Sponsor"}
                  required={true}
                  autoComplete="family-name"
                  onChange={handleChange}
                  value={formData.parentDetails.sponsor}
                />
              </div>
              <div className="flex flex-col gap-4 md:flex-row ">
                <FloatingLabelInput
                  id={"sponsorRelation"}
                  label={"Relationship with NRI Sponsor"}
                  required={true}
                  autoComplete="off"
                  onChange={handleChange}
                  value={formData.parentDetails.relation}
                />
              </div>
            </div>
            <div className="flex w-full items-center justify-around">
              <span className="text-red-400">
                Note: make sure you click save button before proceeding
              </span>{" "}
              <Button color="danger" type="submit">
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

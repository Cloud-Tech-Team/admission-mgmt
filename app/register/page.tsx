"use client";
import FloatingLabelInput from "../components/FloatingLabelInput";
import NavbarMain from "@/app/components/NavbarMain";
import DropDownInput from "../components/DropDownInput";
import InputDate from "../components/InputDate";
import { GENDER_OPTIONS, PROGRAM_OPTIONS, QUOTA_OPTIONS, COUNTRY_CODES, COUNTRY_CODES_VALUES } from "../constants/dropdownOptions";
import { registerAction } from "../actions/auth-actions";
import { userRegisterSchema } from "@/schemas";
import { useRouter } from "next/navigation";
import { getActiveYears } from "../actions/seat-Management-Actions";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import CustomToast from "../components/CustomToast";
import Contact from "../components/Contact";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    countryCode: COUNTRY_CODES[0],
    mobileNumber: "",
    gender: "",
    dob: "",
    applyingYear: "",
    quota: "",
    program: "",
    aadharNo: "",
    religion: "",
    cast: "",
  });
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCallingCode = COUNTRY_CODES_VALUES[formData.countryCode];
      const finalMobileNumber = selectedCallingCode === "+91" 
        ? formData.mobileNumber 
        : `${selectedCallingCode}${formData.mobileNumber}`;

      const dataToValidate = {
        ...formData,
        mobileNumber: finalMobileNumber,
      };

      const validatedData = userRegisterSchema.parse(dataToValidate);
      if (!validatedData) {
        throw new Error("Invalid data");
      }
      const response: RegisterActionResult = await registerAction(validatedData);
      if (response?.success) {
        console.log("redirecting to login");
        router.push("/login");
      } else {
        console.log(response.error);
        throw new Error(response.error || "Registration failed");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error : any) {
      console.log(error);
      CustomToast({ title: "Error", description: error.message || "An error occurred during registration" });
    }
  };

  useEffect(() => {
    (async () => {
      const years = await getActiveYears();
      console.log("active years", years);
      setAvailableYears(years);
    })();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <NavbarMain />

      <div className="flex flex-auto items-center justify-center w-full m-3 p-3">
        <div className="bg-textBoxBackground  relative shadow-xl rounded-3xl p-8 max-w-2xl w-full">
          <h2 className="text-2xl font-semibold mb-6 text-center text-muthootRed">Registration</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <FloatingLabelInput
                id={"firstName"}
                label={"First Name"}
                autoComplete="given-name"
                required={true}
                onChange={handleChange}
              />
              <FloatingLabelInput
                id={"middleName"}
                label={"Middle Name"}
                autoComplete="additional-name"
                onChange={handleChange}
              />
              <FloatingLabelInput
                id={"lastName"}
                label={"Last Name"}
                required={true}
                autoComplete="family-name"
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <FloatingLabelInput
                id={"email"}
                label={"Email"}
                required={true}
                autoComplete="email"
                type={"email"}
                onChange={handleChange}
              />
              <div className="flex w-full space-x-4">
                <div className="flex-none w-1/3 sm:w-[120px]">
                  <DropDownInput
                    id={"countryCode"}
                    label={"Code"}
                    required={true}
                    options={COUNTRY_CODES}
                    value={formData.countryCode}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex-1">
                  <FloatingLabelInput
                    id={"mobileNumber"}
                    label={"Mobile Number"}
                    required={true}
                    type={"number"}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <DropDownInput
                id={"gender"}
                label={"Gender"}
                required={true}
                options={GENDER_OPTIONS}
                onChange={handleChange}
                value={formData.gender}
              />
              <InputDate
                id={"dob"}
                label={"Date of Birth"}
                required={true}
                value={formData.dob}
                onChange={handleChange}
              />
              <DropDownInput
                id={"applyingYear"}
                label={"Applying Year"}
                required={true}
                options={availableYears.map((year) => year.toString())}
                onChange={handleChange}
                value={formData.applyingYear}
              />
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <FloatingLabelInput
                id={"religion"}
                label={"Religion"}
                required={true}
                autoComplete="off"
                onChange={handleChange}
              />
              <FloatingLabelInput
                id={"cast"}
                label={"Caste"}
                required={true}
                autoComplete="off"
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <DropDownInput
                id={"quota"}
                label={"Quota"}
                required={true}
                options={QUOTA_OPTIONS}
                onChange={handleChange}
                value={formData.quota}
              />
              <DropDownInput
                id={"program"}
                label={"Program"}
                required={true}
                options={PROGRAM_OPTIONS}
                onChange={handleChange}
                value={formData.program}
              />
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <FloatingLabelInput
                id={"aadharNo"}
                label={"Aadhar No."}
                autoComplete="off"
                type={"number"}
                required={true}
                onChange={handleChange}
              />
            </div>
            <h1 className="text-center">
              <span className="text-muthootRed">* </span>Please be advised that the fields mentioned above are not
              editable in any subsequent stages
            </h1>
            <Button
              type="submit"
              className="w-full bg-muthootRed text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Submit
            </Button>
          </form>
        </div>
      </div>

      <Contact />
    </div>
  );
}

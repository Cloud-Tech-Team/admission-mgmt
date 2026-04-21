"use client";
//import Navbar from "../components/navbar";
import { Image, Button, Spinner, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/*Icons */
import {
  MdOutlineEmail,
  MdOutlineDateRange,
  MdPhone,
  MdPeopleAlt,
  MdHomeFilled,
  MdLogout,
  MdPrint,
  MdAccountCircle,
  MdLocationOn,
} from "react-icons/md";
import { FaGraduationCap, FaIdCard } from "react-icons/fa";
import useUserStore from "../store/userStore";
import { useSession, signOut } from "next-auth/react";
import ThemeToggle from "../components/ThemeToggle";
import { StructuredUserData } from "@/types/userTypes";
import { usePrintPDF } from "../hooks/usePrintPDF";
import { getBranchDisplayName } from "@/app/constants/dropdownOptions";

export default function Register() {
  const { userData, fetchUserData, clearUserData, isLoading, error } =
    useUserStore();
  const session = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const router = useRouter();
  const { data: sessionData, status: sessionStatus } = session;
  const { generatePDF } = usePrintPDF();
  
  const handlePrintStudent = async (student: StructuredUserData) => {
    await generatePDF(student);
  };

  useEffect(() => {
    // In a real app, you would get the userId from authentication
    // This is just a placeholder - replace with your auth logic
    console.log("Session Data:", sessionData);
    const storedUserId = sessionData?.user?.id;
    if (storedUserId) {
      setUserId(storedUserId);
      fetchUserData(storedUserId);
    } else {
      // Redirect to login if no user ID
      // router.push("/login");
      console.log("No user ID found, redirecting to login...");
    }
    setHasInitialized(true);
  }, [fetchUserData, router, sessionData, sessionStatus]);

  const handleLogout = () => {
    clearUserData();
    signOut({ callbackUrl: "/login" });
  };

  // Show loading if we haven't initialized yet or if we're actively loading
  if (!hasInitialized || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <p className="mt-4">Loading user data...</p>
      </div>
    );
  }

  // Only show error state if we have initialized and there's an actual error or no data
  if (hasInitialized && (error || !userData)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">
          Error loading user data. Please try again.
        </p>
        <Button
          onPress={() => userId && fetchUserData(userId)}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  // If we reach here, we should have userData, but let's add a safety check
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <p className="mt-4">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header Section */}
      <div className="relative">
        <div
          className="h-[25dvh] md:h-[35dvh]  bg-cover bg-center"
          style={{
            backgroundImage: "url('background_image.png')",
            backgroundBlendMode: "overlay",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
        />
        
        {/* Top Navigation Bar */}
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              color="danger"
              variant="bordered"
              size="sm"
              onPress={handleLogout}
              startContent={<MdLogout className="w-4 h-4" />}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-center gap-6">
              <Image
                alt="Student Picture"
                className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-full border-4 border-primary/20 shadow-lg"
                src={userData["Uploads"]["studentPhoto"] || "no_img.png"}
              />
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {userData["Student Details"]["Name"]}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 text-lg">
                  <FaIdCard className="w-5 h-5" />
                  Application ID: {userData.applicationNo}
                </p>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="flex-shrink-0">
              <Button
                color="primary"
                size="lg"
                onPress={() => handlePrintStudent(userData)}
                startContent={<MdPrint className="w-5 h-5" />}
                className="font-semibold"
              >
                Download Application
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* Personal Information Card */}
          <Card className="shadow-lg border border-border/20 bg-textBoxBackground">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-foreground">
                <MdAccountCircle className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Personal Information</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <MdOutlineDateRange className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">{userData["Student Details"]["Date of Birth"]}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MdOutlineEmail className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{userData["Student Details"]["Email"]}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MdPhone className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{userData["Student Details"]["Phone"]}</p>
                </div>
              </div>
              
              {userData["Student Details"]["Kerala Phone"] && (
                <div className="flex items-start gap-3">
                  <MdPhone className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Kerala Phone</p>
                    <p className="text-sm font-medium">{userData["Student Details"]["Kerala Phone"]}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Academic Information Card */}
          <Card className="shadow-lg border border-border/20 bg-textBoxBackground">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-foreground">
                <FaGraduationCap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Academic Details</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Course & Program</p>
                  <p className="text-sm font-medium">{userData["Student Details"]["Course"]}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Branch Opted</p>
                  <p className="text-sm font-medium">{getBranchDisplayName(userData["Branch Details"]["Branch"])}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quota</p>
                  <p className="text-sm font-medium">{userData["Student Details"]["Quota"]}</p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Academic Year</p>
                  <p className="text-sm font-medium">{userData["Student Details"]["Academic Year"]}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Parent/Guardian Information Card */}
          <Card className="shadow-lg border border-border/20 bg-textBoxBackground">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-foreground">
                <MdPeopleAlt className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Parent/Guardian Details</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Parent/Guardian Name</p>
                <p className="text-sm font-medium">{userData["Student Details"]["Parent Name"]}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Occupation</p>
                <p className="text-sm font-medium">{userData["Student Details"]["Parent Occupation"]}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Relationship</p>
                <p className="text-sm font-medium">{userData["Student Details"]["Relationship with Applicant"]}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">NRI Sponsor</p>
                <p className="text-sm font-medium">{userData["Student Details"]["NRI Sponsor"]}</p>
              </div>
            </CardBody>
          </Card>

          {/* Contact Address Card */}
          <Card className="shadow-lg border border-border/20 bg-textBoxBackground">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-foreground">
                <MdLocationOn className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Contact Address</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-1">
                <p className="text-sm font-medium">{userData["Contact Address"]["House Name"]}</p>
                <p className="text-sm text-muted-foreground">{userData["Contact Address"]["District, City"]}</p>
                <p className="text-sm text-muted-foreground">
                  {userData["Contact Address"]["State"]}, {userData["Contact Address"]["Pin"]}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Permanent Address Card */}
          <Card className="shadow-lg border border-border/20 bg-textBoxBackground">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-foreground">
                <MdHomeFilled className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Permanent Address</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-1">
                <p className="text-sm font-medium">{userData["Permanent Address"]["House Name"]}</p>
                <p className="text-sm text-muted-foreground">{userData["Permanent Address"]["District, City"]}</p>
                <p className="text-sm text-muted-foreground">
                  {userData["Permanent Address"]["State"]}, {userData["Permanent Address"]["Pin"]}
                </p>
              </div>
            </CardBody>
          </Card>

        </div>
      </div>
    </div>
  );
}

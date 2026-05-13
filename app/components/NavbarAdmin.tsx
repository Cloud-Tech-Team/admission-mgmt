"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import DropDownInput from "./DropDownInput";
import { PROGRAM_OPTIONS } from "../constants/dropdownOptions";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from "@heroui/react";
import { FaPowerOff, FaPlus } from "react-icons/fa";
import { FiMenu } from "react-icons/fi";
import { getAllAvailableYears } from "../actions/seat-Management-Actions";
import { addYear } from "../actions/branch-Actions";
import useAdminStore from "../store/adminStore";
import { signOut } from "next-auth/react";
import useUserStore from "../store/userStore";
import CustomToast from "./CustomToast";

// Add navigation options
const NAV_ITEMS = [
  { key: "adminHome", label: "Home", href: "/admin/adminHome" },
  { key: "adminNRI", label: "Admissions", href: "/admin/registrations" },
  //{ key: "approval", label: "Approval", href: "/admin/approval" },
  { key: "settings", label: "Settings", href: "/admin/status" },
  // { key: "logout", label: "Logout", href: "/logout" },
];

interface NavbarAdminProps {
  mode?: "dark";
}

const NavbarAdmin: React.FC<NavbarAdminProps> = ({ mode = "" }) => {
  const router = useRouter();

  const { setYears, years, setSelectedYear, selectedYear } = useAdminStore();
  const { clearUserData } = useUserStore();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  
  // Add Year modal state
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [year, setYear] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogout = () => {
    clearUserData();
    signOut({ callbackUrl: "/login" });
  };

  // Add a new year function
  const handleAddYear = async () => {
    if (!year) {
      setErrorMsg("Year is required");
      return;
    }

    try {
      setLoading(true);
      const result = await addYear(year);

      if (result.success) {
        console.log("Year added successfully:");
        
        // Update years list in the store
        const updatedYears = years ? [...years, year].sort((a, b) => b - a) : [year];
        setYears(updatedYears);
        
        // Automatically select the newly added year
        setSelectedYear(year);
        
        setYear(undefined);
        onClose();
        
        // Show success message
        CustomToast({
          title: "Year Added",
          description: `Year ${year} has been added successfully and is now selected`
        });
        
        // Redirect to status page
        router.push("/admin/status");
      } else {
        console.error("Failed to add year:", result.message);
        setErrorMsg(result.message || "Failed to add year");
      }
    } catch (err) {
      console.error("Error adding year:", err);
      setErrorMsg("An error occurred while adding the year");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      console.log("Fetching years...");
      const fetchedYears = await getAllAvailableYears();
      setYears(fetchedYears);
      console.log("Years fetched:", fetchedYears);
      
      // Automatically select the first (most recent) year if no year is selected
      if (fetchedYears.length > 0 && selectedYear === null) {
        setSelectedYear(fetchedYears[0]);
        console.log("Auto-selected year:", fetchedYears[0]);
      }
    })();
  }, [setYears, selectedYear, setSelectedYear]);

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handleNavigation = (key: string) => {
    const item = NAV_ITEMS.find((item) => item.key === key);
    if (item) {
      router.push(item.href);
    }
  };

  return (
    <div className="relative z-10 bg-white bg-opacity-[7%] shadow w-full max-w-none mt-5 mx-1 md:mx-4 rounded-3xl px-3 md:px-6">
      {/* Mobile Layout */}
      <div className="flex md:hidden items-center justify-between h-[60px] gap-2">
        {/* Left side - Menu and Logo */}
        <div className="flex items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" size="sm" className="text-default-500">
                <FiMenu className="h-5 w-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Navigation Menu" onAction={(key) => handleNavigation(key.toString())}>
              {NAV_ITEMS.map((item) => (
                <DropdownItem key={item.key}>{item.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <div className="w-[80px]">
            <Image
              src="/MITS.png"
              alt="Muthoot Logo"
              width={80}
              height={24}
              loading="eager"
              priority
              className="cursor-pointer object-contain h-auto w-full"
            />
          </div>
        </div>

        {/* Right side - Essential controls */}
        <div className="flex items-center gap-1">
          <div className={`${mode === "dark" ? "hidden" : ""}`}>
            <ThemeToggle />
          </div>
          <Button isIconOnly color={"danger"} variant="shadow" size="sm" aria-label="Logout" onPress={handleLogout}>
            <FaPowerOff className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Mobile Controls Row */}
      <div className="flex md:hidden items-center justify-between pb-3 gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex-1 max-w-[120px]">
            <DropDownInput
              options={years.map(String)}
              id="year-mobile"
              label="Year"
              labelPlacement="inside"
              size="sm"
              value={selectedYear?.toString() || ""}
              onChange={handleYearChange}
            />
          </div>
          <Button
            isIconOnly
            size="sm"
            color="success"
            variant="solid"
            onPress={onOpen}
            aria-label="Add Year"
            className="!w-8 !h-8 !min-w-8 flex-shrink-0"
          >
            <FaPlus className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 max-w-[140px]">
          <DropDownInput
            options={PROGRAM_OPTIONS}
            id="program-mobile"
            label="Program"
            labelPlacement="inside"
            size="sm"
            value={selectedProgram}
            onChange={handleProgramChange}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center h-[60px] gap-2 md:gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Navigation Dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" className="text-default-500">
                <FiMenu className="h-6 w-6" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Navigation Menu" onAction={(key) => handleNavigation(key.toString())}>
              {NAV_ITEMS.map((item) => (
                <DropdownItem key={item.key}>{item.label}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          
          {/* Logo */}
          <div className="w-[120px] lg:w-[170px] hidden md:block">
            <Image
              src="/MITS.png"
              alt="Muthoot Logo"
              width={120}
              height={40}
              className="cursor-pointer object-contain h-auto w-full"
            />
          </div>
        </div>

        {/* Desktop Navigation Links - Only on very large screens */}
        <div className="hidden 2xl:flex items-center gap-4 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href} className="text-lg headerButton whitespace-nowrap">
              {item.label}
            </Link>
          ))}
        </div>

        {/* Center/Right - Controls */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
          <div className="flex items-center gap-2">
            <div className="w-[100px] md:w-[120px]">
              <DropDownInput
                options={PROGRAM_OPTIONS}
                id="program"
                label="Program"
                labelPlacement="inside"
                size="sm"
                value={selectedProgram}
                onChange={handleProgramChange}
              />
            </div>
            <div className="w-[80px] md:w-[100px]">
              <DropDownInput
                options={years.map(String)}
                id="year"
                label="Year"
                labelPlacement="inside"
                size="sm"
                value={selectedYear?.toString() || ""}
                onChange={handleYearChange}
              />
            </div>
            <Button
              isIconOnly
              size="sm"
              color="success"
              variant="solid"
              onPress={onOpen}
              aria-label="Add Year"
              className="!w-8 !h-8 !min-w-8 flex-shrink-0"
            >
              <FaPlus className="h-3 w-3" />
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-2">
            <div className={`${mode === "dark" ? "hidden" : ""}`}>
              <ThemeToggle />
            </div>
            <Button isIconOnly color={"danger"} variant="shadow" aria-label="Logout" onPress={handleLogout}>
              <FaPowerOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add Year Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>
            <h2>Add New Academic Year</h2>
          </ModalHeader>
          <ModalBody>
            {errorMsg && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorMsg}
              </div>
            )}
            <Input
              label="Academic Year"
              value={year?.toString() || ""}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setErrorMsg(null); // Clear error when user types
              }}
              type="number"
              min={2020}
              max={2050}
              required
              placeholder="Enter academic year (e.g., 2026)"
              description="Enter the year for the new academic session"
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              className="bg-green-600 text-white" 
              onPress={handleAddYear} 
              isDisabled={!year || loading}
            >
              {loading ? "Adding..." : "Add Year"}
            </Button>
            <Button 
              variant="bordered" 
              onPress={() => {
                onClose();
                setErrorMsg(null);
                setYear(undefined);
              }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default NavbarAdmin;

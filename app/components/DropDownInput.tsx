"use client";
import React from "react";
import { Select, SelectItem } from "@heroui/react";

interface DropDownInputProps {
  options: string[];
  id: string;
  label: string;
  required?: boolean;
  value?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "default" | undefined;
  variant?: "bordered" | "flat" | "faded" | "underlined";
  labelPlacement?: "inside" | "outside" | "outside-left";
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const DropDownInput: React.FC<DropDownInputProps> = ({
  options,
  id,
  label,
  required = false,
  variant = "bordered",
  onChange,
  color = undefined,
  labelPlacement = "inside",
  size = "md",
  disabled = false,
  value = "", // Add default value
}) => {
  // Find the index of the value in options array
  const selectedIndex = options.findIndex(option => option === value);
  
  // Convert to string index or empty if not found
  const selectedValue = selectedIndex >= 0 ? selectedIndex.toString() : "";

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      const event = {
        target: { id, value: options[Number(e.target.value)] },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
  };

  return (
    <Select
      size={size}
      label={label}
      id={id}
      isDisabled={disabled}
      className="w-full"
      variant={variant}
      isRequired={required}
      color={color}
      onChange={handleSelect}
      labelPlacement={labelPlacement}
      placeholder={labelPlacement === "outside" ? " " : ""}
      selectedKeys={selectedValue ? [selectedValue] : []} // Set selected value
      defaultSelectedKeys={selectedValue ? [selectedValue] : []} // Also set default selected
    >
      {options.map((option, index) => (
        <SelectItem key={index}>{option}</SelectItem>
      ))}
    </Select>
  );
};

export default DropDownInput;
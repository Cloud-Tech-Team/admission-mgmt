"use client";
import React from "react";
import { getBranchDisplayName } from "@/app/constants/dropdownOptions";

interface TableDisplayContentProps {
  id: string;
  className?: string;
  rows?: { [field: string]: string | number };
}

const TableDisplayContent: React.FC<TableDisplayContentProps> = ({ id, rows = [], className = "" }) => {
  return (
    <div className={`flex flex-col w-full p-2 rounded-lg shadow-md border border-background ${className}`} id={id}>
      {Object.entries(rows).map(([key, value]) => (
        <div key={key} className="flex flex-row justify-between p-1">
          <div className="font-light">{key}:</div>
          <div className="font-bold">{key === "Branch" ? getBranchDisplayName(String(value)) : value}</div>
        </div>
      ))}
    </div>
  );
};

export default TableDisplayContent;

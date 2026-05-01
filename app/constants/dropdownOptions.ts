import { Branch, Quota, Program } from "../../prisma/branchTypes"; // Adjust the import path as necessary
import { customList } from "country-codes-list";

type NonEmptyArray<T> = [T, ...T[]];

const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));

const rawData = customList("countryCode", "{countryCode},{countryCallingCode}");
const uniqueCodesMap = new Map<string, string>();

Object.values(rawData).forEach((val) => {
  const [code, callingCodeRaw] = (val as string).split(",");
  const callingCode = `+${callingCodeRaw.replace(/\s+/g, "")}`;
  if (!uniqueCodesMap.has(callingCode)) {
    uniqueCodesMap.set(callingCode, `${getFlagEmoji(code)} ${callingCode}`);
  }
});

const uniqueCodes = Array.from(uniqueCodesMap.entries())
  .map(([callingCode, display]) => ({ callingCode, display }))
  .sort((a, b) => {
    const numA = parseInt(a.callingCode.replace("+", ""), 10);
    const numB = parseInt(b.callingCode.replace("+", ""), 10);
    return numA - numB;
  });

const indiaIndex = uniqueCodes.findIndex((c) => c.callingCode === "+91");
const indiaOption = indiaIndex > -1 ? uniqueCodes.splice(indiaIndex, 1)[0] : { callingCode: "+91", display: "🇮🇳 +91" };

export const COUNTRY_CODES: NonEmptyArray<string> = [
  indiaOption.display,
  ...uniqueCodes.map((c) => c.display),
] as NonEmptyArray<string>;

export const COUNTRY_CODES_VALUES: Record<string, string> = {
  [indiaOption.display]: indiaOption.callingCode,
  ...Object.fromEntries(uniqueCodes.map((c) => [c.display, c.callingCode]))
};

export const GENDER_OPTIONS: NonEmptyArray<string> = ["Male", "Female", "Other"];

// Use the Prisma enum values
export const QUOTA_OPTIONS: NonEmptyArray<string> = Object.values(Quota) as NonEmptyArray<string>;

// Use the Prisma enum values
export const PROGRAM_OPTIONS: NonEmptyArray<string> = Object.values(Program) as NonEmptyArray<string>;

export const _12TH_BOARD: NonEmptyArray<string> = ["CBSE", "ICSE", "STATE"];

export const _10TH_BOARD: NonEmptyArray<string> = ["CBSE", "ICSE", "STATE"];

export const REGISTER_STEPS: NonEmptyArray<string> = [
  "Personal Details",
  "Educational Details",
  "Declaration",
  "Final Verification",
  "Payment",
];

export const RELIGIONS: NonEmptyArray<string> = [""];

// Use the Prisma enum values
export const BRANCH_OPTIONS: NonEmptyArray<string> = Object.values(Branch) as NonEmptyArray<string>;

export const BRANCH_DISPLAY_NAMES: Record<Branch, string> = {
  CSE: "CSE",
  ECE: "ECE",
  ME: "ME",
  CE: "CE",
  AIDS: "AI & DS",
  EEE: "EEE",
  CSAI: "CSAI",
  CY: "CY",
  VLSI: "Electronics(VLSI)",
};

export const getBranchDisplayName = (branch?: string | null) => {
  if (!branch) {
    return "";
  }

  return BRANCH_DISPLAY_NAMES[branch as Branch] ?? branch;
};

export const getBranchCodeFromDisplayName = (displayName: string) => {
  const normalizedDisplayName = displayName.trim();
  const matchedBranch = Object.entries(BRANCH_DISPLAY_NAMES).find(([, label]) => label === normalizedDisplayName);

  return (matchedBranch?.[0] as Branch | undefined) ?? (normalizedDisplayName as Branch);
};

// Use the Branch type from Prisma
export type BranchCodeType = Branch;
export type QuotaCodeType = "NRI" | "CIWG" | "OCI" | "PIO";
export type ProgramCodeType = "BTech" | "MCA" | "MTech";

export const BANK_ACCOUNT = {
  name: "Muthoot M George Institute of Technology",
  address: "Varikoli, Puthencruz - 682308",
  phone: "0484-2732100",
  bank: "FEDERAL BANK",
  "bank address": "PUTHENCRUZ",
  branch: "Puthencruz",
  "branch phone": "0484-2731259",
  IFSC: "FDRL0001223",
  MICR: "682049055",
  "account number": "12230200217387",
};

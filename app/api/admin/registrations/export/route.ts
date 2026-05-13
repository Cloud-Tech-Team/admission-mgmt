export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/prisma/prisma";

function toCsvValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (stringValue.includes("\"") || stringValue.includes(",") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/\"/g, "\"\"")}"`;
  }

  return stringValue;
}

function toIsoDate(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  return date.toISOString();
}

function parseDateRange(startDate: string | null, endDate: string | null) {
  const range: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    range.gte = new Date(`${startDate}T00:00:00.000Z`);
  }

  if (endDate) {
    range.lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  return range;
}

function parseRegistrationNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function hasConfirmedPayment(user: { payment?: { transactionNumber?: string | null; transactionSlip?: string | null } | null }) {
  const transactionNumber = user.payment?.transactionNumber;
  const transactionSlip = user.payment?.transactionSlip;
  return Boolean(transactionNumber && transactionSlip);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return new Response("Year is required", { status: 400 });
    }

    const registrationStart = parseRegistrationNumber(searchParams.get("registrationStart"));
    const registrationEnd = parseRegistrationNumber(searchParams.get("registrationEnd"));
    const quota = searchParams.get("quota");
    const program = searchParams.get("program");
    const branch = searchParams.get("branch");
    const seatConfirmed = searchParams.get("seatConfirmed");
    const canOnboard = searchParams.get("canOnboard");
    const paymentStatus = searchParams.get("paymentStatus");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (year !== "all") {
      where.applyingYear = year;
    }

    if (quota && quota !== "all") {
      where.quota = quota as any;
    }

    if (program && program !== "all") {
      where.program = program;
    }

    if (branch && branch !== "all") {
      where.declaration = { is: { branch } };
    }

    if (seatConfirmed === "yes") {
      where.seatConfirmed = true;
    }

    if (seatConfirmed === "no") {
      where.seatConfirmed = false;
    }

    if (canOnboard === "yes") {
      where.canOnboard = true;
    }

    if (canOnboard === "no") {
      where.canOnboard = false;
    }

    const dateRange = parseDateRange(startDate, endDate);
    if (dateRange.gte || dateRange.lte) {
      where.createdAt = dateRange;
    }

    let users = await prisma.user.findMany({
      where,

      orderBy: { createdAt: "asc" },
    });

    if (registrationStart !== null || registrationEnd !== null) {
      users = users.filter((user) => {
        const registrationValue = parseRegistrationNumber(user.applicationNo);
        if (registrationValue === null) {
          return false;
        }

        if (registrationStart !== null && registrationValue < registrationStart) {
          return false;
        }

        if (registrationEnd !== null && registrationValue > registrationEnd) {
          return false;
        }

        return true;
      });
    }

    if (paymentStatus === "confirmed") {
      users = users.filter((user) => hasConfirmedPayment(user));
    }

    if (paymentStatus === "missing") {
      users = users.filter((user) => !hasConfirmedPayment(user));
    }

    const header = [
      "Application No",
      "Full Name",
      "Email",
      "Phone",
      "Kerala Phone",
      "Gender",
      "Date of Birth",
      "Aadhaar No",
      "Quota",
      "Program",
      "Applying Year",
      "Branch",
      "Seat Confirmed",
      "Can Onboard",
      "Created At",
      "Parent Name",
      "Parent Occupation",
      "NRI Sponsor",
      "Relationship",
      "Contact House Name",
      "Contact District",
      "Contact City",
      "Contact State",
      "Contact Pincode",
      "Permanent House Name",
      "Permanent District",
      "Permanent City",
      "Permanent State",
      "Permanent Pincode",
      "10th School",
      "10th Board",
      "12th School",
      "12th Board",
      "Keam Year",
      "Keam Roll No",
      "Keam Rank",
      "Keam Total Score",
      "Payment Transaction Number",
      "Payment Transaction Slip",
    ];

    const rows = users.map((user) => [
      user.applicationNo,
      `${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim(),
      user.email,
      user.mobileNumber,
      user.keralaMobileNumber || "",
      user.gender,
      toIsoDate(user.dob),
      user.aadharNo,
      user.quota,
      user.program,
      user.applyingYear,
      user.declaration?.branch || "",
      user.seatConfirmed ? "Yes" : "No",
      user.canOnboard ? "Yes" : "No",
      toIsoDate(user.createdAt),
      user.parentDetails?.guardian || "",
      user.parentDetails?.occupation || "",
      user.parentDetails?.sponsor || "",
      user.parentDetails?.relation || "",
      user.contactAddress?.houseName || "",
      user.contactAddress?.district || "",
      user.contactAddress?.city || "",
      user.contactAddress?.state || "",
      user.contactAddress?.pincode ?? "",
      user.permanentAddress?.houseName || "",
      user.permanentAddress?.district || "",
      user.permanentAddress?.city || "",
      user.permanentAddress?.state || "",
      user.permanentAddress?.pincode ?? "",
      user.education?.tenth?.schoolName || "",
      user.education?.tenth?.board || "",
      user.education?.twelfth?.schoolName || "",
      user.education?.twelfth?.board || "",
      user.education?.keam?.year ?? "",
      user.education?.keam?.rollNumber ?? "",
      user.education?.keam?.rank ?? "",
      user.education?.keam?.totalScore ?? "",
      user.payment?.transactionNumber || "",
      user.payment?.transactionSlip || "",
    ]);

    const csvLines = [header.map(toCsvValue).join(",")];
    rows.forEach((row) => {
      csvLines.push(row.map(toCsvValue).join(","));
    });

    const csv = csvLines.join("\n");
    const fileName = `registrations_${year}_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error exporting registrations:", error);
    return new Response("Failed to export registrations", { status: 500 });
  }
}

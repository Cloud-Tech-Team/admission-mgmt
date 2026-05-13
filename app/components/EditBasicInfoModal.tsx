"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  Chip,
} from "@heroui/react";
import { useState } from "react";
import { Pencil, User, Phone, Mail, Calendar, BookUser } from "lucide-react";
import { updateBasicInfo } from "@/app/actions/user-Actions";
import { GENDER_OPTIONS } from "@/app/constants/dropdownOptions";
import { StructuredUserData } from "@/types/userTypes";

interface EditBasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StructuredUserData;
  /** Called with the fresh structured data so the parent can re-render */
  onSaved: (updated: Partial<StructuredUserData>) => void;
}

function toInputDate(value: string | undefined): string {
  if (!value) return "";
  // value may be a localized date string like "1/1/2000"
  // or an ISO string – try to parse both
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().substring(0, 10);
}

export default function EditBasicInfoModal({
  isOpen,
  onClose,
  student,
  onSaved,
}: EditBasicInfoModalProps) {
  const details = student["Student Details"];

  const [form, setForm] = useState({
    firstName: details["Name"]?.split(" ")[0] ?? "",
    middleName:
      details["Name"]?.split(" ").length > 2
        ? details["Name"]?.split(" ").slice(1, -1).join(" ")
        : "",
    lastName: details["Name"]?.split(" ").slice(-1)[0] ?? "",
    email: details["Email"] ?? "",
    mobileNumber: details["Phone"] ?? "",
    keralaMobileNumber: details["Kerala Phone"] ?? "",
    gender: details["Geneder"] ?? "",
    dob: toInputDate(details["Date of Birth"]),
    religion: details["Religion"] ?? "",
    cast: details["Cast"] ?? "",
    aadharNo: String(details["Aadhaar No"] ?? ""),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    // Basic validation
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    const aadhaar = parseInt(form.aadharNo, 10);
    if (isNaN(aadhaar)) {
      setError("Aadhaar number must be a valid number.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateBasicInfo(student.id, {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobileNumber.trim(),
        keralaMobileNumber: form.keralaMobileNumber.trim() || undefined,
        gender: form.gender,
        dob: form.dob,
        religion: form.religion.trim(),
        cast: form.cast.trim(),
        aadharNo: aadhaar,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(true);

      // Build a partial StructuredUserData update so parent can optimistically refresh
      const nameParts = [form.firstName, form.middleName, form.lastName]
        .filter(Boolean)
        .join(" ");

      onSaved({
        "Student Details": {
          ...details,
          Name: nameParts,
          Email: form.email,
          Phone: form.mobileNumber,
          "Kerala Phone": form.keralaMobileNumber,
          "Date of Birth": new Date(form.dob).toLocaleDateString(),
          Geneder: form.gender,
          Religion: form.religion,
          Cast: form.cast,
          "Aadhaar No": aadhaar,
        },
      });

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-textBoxBackground",
        header: "border-b border-default pb-3",
        footer: "border-t border-default pt-3",
      }}
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Pencil size={18} className="text-muthootRed" />
              <span className="text-base font-semibold">Edit Basic Information</span>
              <Chip size="sm" color="warning" variant="flat" className="ml-auto">
                {student.applicationNo}
              </Chip>
            </ModalHeader>

            <ModalBody className="py-5 flex flex-col gap-5">
              {error && (
                <div className="rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">
                  ✓ Information saved successfully!
                </div>
              )}

              {/* Name section */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-default-500 text-xs uppercase tracking-wider font-semibold">
                  <User size={14} /> Name
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="First Name"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={set("firstName")}
                    isRequired
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Middle Name"
                    placeholder="Middle name (optional)"
                    value={form.middleName}
                    onChange={set("middleName")}
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Last Name"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={set("lastName")}
                    isRequired
                    variant="bordered"
                    size="sm"
                  />
                </div>
              </div>

              <Divider />

              {/* Contact section */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-default-500 text-xs uppercase tracking-wider font-semibold">
                  <Phone size={14} /> Contact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Mobile Number"
                    placeholder="Mobile number"
                    value={form.mobileNumber}
                    onChange={set("mobileNumber")}
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Kerala Mobile Number"
                    placeholder="Kerala mobile (optional)"
                    value={form.keralaMobileNumber}
                    onChange={set("keralaMobileNumber")}
                    variant="bordered"
                    size="sm"
                  />
                </div>
              </div>

              <Divider />

              {/* Email section */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-default-500 text-xs uppercase tracking-wider font-semibold">
                  <Mail size={14} /> Email & Identity
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Email"
                    placeholder="Email address"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    isRequired
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Aadhaar Number"
                    placeholder="12-digit Aadhaar"
                    value={form.aadharNo}
                    onChange={set("aadharNo")}
                    variant="bordered"
                    size="sm"
                    maxLength={12}
                  />
                </div>
              </div>

              <Divider />

              {/* Personal section */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-default-500 text-xs uppercase tracking-wider font-semibold">
                  <BookUser size={14} /> Personal Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Gender"
                    selectedKeys={form.gender ? new Set([form.gender]) : new Set()}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string;
                      setForm((p) => ({ ...p, gender: val }));
                    }}
                    variant="bordered"
                    size="sm"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g}>{g}</SelectItem>
                    ))}
                  </Select>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-default-500">Date of Birth</label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, dob: e.target.value }))
                      }
                      className="w-full rounded-lg border border-default-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-muthootRed"
                    />
                  </div>

                  <Input
                    label="Religion"
                    placeholder="Religion"
                    value={form.religion}
                    onChange={set("religion")}
                    variant="bordered"
                    size="sm"
                  />
                  <Input
                    label="Caste"
                    placeholder="Caste / Category"
                    value={form.cast}
                    onChange={set("cast")}
                    variant="bordered"
                    size="sm"
                  />
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="light" onPress={close} isDisabled={saving}>
                Cancel
              </Button>
              <Button
                className="bg-muthootRed text-white"
                onPress={handleSave}
                isLoading={saving}
                isDisabled={saving || success}
                startContent={!saving ? <Pencil size={16} /> : undefined}
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Avatar,
  Select,
  SelectItem,
  Pagination,
  Spinner,
  Chip,
  Switch,
} from "@heroui/react";

import { Save, Search } from "lucide-react";
import { getBranchDisplayName } from "@/app/constants/dropdownOptions";
import NavbarAdmin from "../../components/NavbarAdmin";
import { useState, useEffect } from "react";
import {
  getStructuredUsersByYear,
  updateOnboardingStatus,
} from "../../actions/user-Actions";
import useAdminStore from "@/app/store/adminStore";
import { StructuredUserData } from "@/types/newUserTypes";
import CustomToast from "../../components/CustomToast";

export default function ApprovalDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<StructuredUserData[]>([]);
  const [, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);


  // Track pending changes
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toastInfo, setToastInfo] = useState<{
    show: boolean;
    title: string;
    description: string;
  }>({ show: false, title: "", description: "" });

  // Fetch available academic years on component mount
  const { selectedYear } = useAdminStore();

  // Fetch users when year, page, search, or sort changes
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);

      try {
        if (!selectedYear) {
          setUsers([]);
          setTotalUsers(0);
          setTotalPages(0);
          setLoading(false);
          return;
        }

        const response = await getStructuredUsersByYear(
          selectedYear.toString(),
          currentPage,
          8,
          searchTerm,
          sortBy
        );

        if (response.success) {
          //@ts-expect-error type missmatch in response
          setUsers(response.users);
          setTotalUsers(response.totalUsers);
          setTotalPages(response.totalPages);
        } else {
          setUsers([]);
          setTotalUsers(0);
          setTotalPages(0);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [selectedYear, currentPage, searchTerm, sortBy]);

  // Function to handle toggling onboarding permission (now adds to pending changes)
  const handleTogglePermission = async (
    student: StructuredUserData,
    newStatus: boolean
  ) => {
    // Add to pending changes
    setPendingChanges((prev) => ({
      ...prev,
      [student.id]: newStatus,
    }));
  };

  // Function to save all pending changes
  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      setToastInfo({
        show: true,
        title: "No changes to save",
        description: "No permission changes were made.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const results = await Promise.all(
        Object.entries(pendingChanges).map(async ([userId, canOnboard]) => {
          const result = await updateOnboardingStatus(userId, canOnboard);
          return { userId, result };
        })
      );

      // Update local state with applied changes
      const successfulUpdates = results.filter((r) => r.result.success);
      const updatedUsers = users.map((user) => {
        if (pendingChanges[user.id] !== undefined) {
          return {
            ...user,
            canOnboard: pendingChanges[user.id],
          };
        }
        return user;
      });

      setUsers(updatedUsers);
      setPendingChanges({});

      setToastInfo({
        show: true,
        title: "Changes saved",
        description: `Updated onboarding permissions for ${successfulUpdates.length} students.`,
      });
    } catch (error) {
      console.error("Error saving changes:", error);
      setToastInfo({
        show: true,
        title: "Error saving changes",
        description: "Some changes could not be applied. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset toast after displaying
  useEffect(() => {
    if (toastInfo.show) {
      setToastInfo({ ...toastInfo, show: false });
    }
  }, [toastInfo, toastInfo.show]);

  // Check if there are any pending changes
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Users are already filtered and sorted on the server
  const filteredAndSortedUsers = users;

  return (
    <div className="flex flex-col h-screen bg-background">
      {toastInfo.show && (
        <CustomToast
          title={toastInfo.title}
          description={toastInfo.description}
        />
      )}

      <div className="h-20 flex items-center justify-center m-2">
        <NavbarAdmin />
      </div>

      <main className="flex-1 overflow-y-auto p-2 xl:px-10 bg-background">
        <Card className="shadow-sm bg-textBoxBackground p-0 lg:p-5">
          <CardHeader className="flex flex-col bg-textBoxBackground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
              <div>
                <h2 className="text-lg font-medium">
                  Student Onboarding Approval
                </h2>
                <p className="text-sm text-default-500">
                  Manage student permissions to onboard into the system
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                {hasPendingChanges && (
                  <Button
                    variant="flat"
                    className="bg-green-600 text-white"
                    startContent={<Save size={18} />}
                    isLoading={isSaving}
                    isDisabled={isSaving}
                    onPress={saveChanges}
                  >
                    Save Changes ({Object.keys(pendingChanges).length})
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between w-full py-4 gap-4">
              <div className="w-full">
                <Input
                  className="max-w-md"
                  placeholder="Search by name, ID, or email..."
                  startContent={
                    <Search className="text-default-400" size={18} />
                  }
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Sort by:</span>
                <Select
                  defaultSelectedKeys={["newest"]}
                  selectedKeys={[sortBy]}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-36"
                  size="sm"
                  aria-label="Sort by"
                >
                  <SelectItem key="newest">Newest first</SelectItem>
                  <SelectItem key="oldest">Oldest first</SelectItem>
                  <SelectItem key="name">Name (A-Z)</SelectItem>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardBody className="py-5 bg-textBoxBackground">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spinner size="lg" color="warning" />
                <p className="ml-4">Loading student data...</p>
              </div>
            ) : filteredAndSortedUsers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-default-500">
                  {searchTerm
                    ? "No students found matching your search"
                    : selectedYear 
                      ? `No students registered for the ${selectedYear} academic year`
                      : "Please select an academic year"}
                </p>
              </div>
            ) : (
              <Table
                removeWrapper
                isHeaderSticky
                aria-label="Student onboarding approval table"
                bottomContent={
                  totalPages > 0 ? (
                    <div className="flex w-full bg-textBoxBackground justify-center">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="warning"
                        page={currentPage}
                        total={totalPages}
                        onChange={setCurrentPage}
                      />
                    </div>
                  ) : null
                }
              >
                <TableHeader className="bg-textBoxBackground">
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>PROGRAM</TableColumn>
                  <TableColumn>CONTACT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ONBOARDING PERMISSION</TableColumn>
                </TableHeader>
                <TableBody className="bg-textBoxBackground">
                  {filteredAndSortedUsers.map((student) => (
                    <TableRow
                      className={`bg-textBoxBackground ${
                        pendingChanges[student.id] !== undefined
                          ? "bg-yellow-50"
                          : ""
                      }`}
                      key={student.applicationNo}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={
                              student.Uploads?.studentPhoto ||
                              "/placeholder.svg?height=40&width=40"
                            }
                            name={student["Student Details"].Name}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium">
                              {student["Student Details"].Name}
                            </div>
                            <div className="text-xs text-default-500">
                              {student.applicationNo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student["Student Details"].Course || "B.Tech"}
                          </div>
                          <div className="text-xs text-default-500">
                            {getBranchDisplayName(student["Branch Details"]?.Branch) || "Not selected"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student["Student Details"].Phone}
                          </div>
                          <div className="text-xs text-default-500 truncate max-w-[200px]">
                            {student["Student Details"].Email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Chip
                            size="sm"
                            color={
                              student["Student Details"].Quota === "NRI"
                                ? "primary"
                                : "secondary"
                            }
                            variant="flat"
                          >
                            {student["Student Details"].Quota || "N/A"}
                          </Chip>
                          <Chip
                            size="sm"
                            color={
                              student["Student Details"]["Seat Confirmed"] ===
                              "Yes"
                                ? "success"
                                : "warning"
                            }
                            variant="flat"
                          >
                            {student["Student Details"]["Seat Confirmed"] ===
                            "Yes"
                              ? "Completed"
                              : "Registered"}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={
                              pendingChanges[student.id] !== undefined
                                ? pendingChanges[student.id]
                                : student.canOnboard
                            }
                            onValueChange={(isSelected) =>
                              handleTogglePermission(student, isSelected)
                            }
                            size="sm"
                            color={
                              pendingChanges[student.id] !== undefined
                                ? "warning"
                                : "success"
                            }
                            isDisabled={isSaving}
                          />
                          <span className="text-sm">
                            {pendingChanges[student.id] !== undefined
                              ? pendingChanges[student.id]
                                ? "Enabled (pending)"
                                : "Disabled (pending)"
                              : student.canOnboard
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

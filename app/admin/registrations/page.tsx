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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Chip,
  Switch,
} from "@heroui/react";

import { Save,Download, Search, Trash2, Printer, Eye } from "lucide-react";
import { getBranchDisplayName } from "@/app/constants/dropdownOptions";
import NavbarAdmin from "../../components/NavbarAdmin";
import { useState, useEffect} from "react";
import StudentDetails from "../../components/StudentDetails";
import { usePrintPDF } from "../../hooks/usePrintPDF";
import { getStructuredUsersByYear,updateOnboardingStatus, deleteStudentById } from "../../actions/user-Actions";
import useAdminStore from "@/app/store/adminStore";
import { StructuredUserData } from "@/types/userTypes";

// Define interfaces for our data structures

// In the StudentDetails component definition
// type StudentDetailsProps = {
//   student: StructuredUserData | null | undefined;
// };

export default function RegistrationDashboard() 
{
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<StructuredUserData[]>([]);
  const [, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StructuredUserData | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { generatePDF, isGenerating } = usePrintPDF();

  // Deletion confirmation modal
  const [studentToDelete, setStudentToDelete] = useState<StructuredUserData | null>(null);
  const { 
    isOpen: isDeleteModalOpen, 
    onOpen: onDeleteModalOpen, 
    onClose: onDeleteModalClose 
  } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch available academic years on component mount
  const { selectedYear } = useAdminStore();
  // Track pending changes
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toastInfo, setToastInfo] = useState<{
    show: boolean;
    title: string;
    description: string;
  }>({ show: false, title: "", description: "" });

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
          setUsers(response.users);
          setTotalUsers(response.totalUsers);
          setTotalPages(response.totalPages);
        } else {
          // If no data for 2025 yet, show empty state
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
  const handleTogglePermission = async (student: StructuredUserData, newStatus: boolean) => {
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
  // Function to handle opening the student view modal
  const handleViewStudent = (student: StructuredUserData) => {
    console.log("Viewing student:", student);
    setSelectedStudent(student);
    onOpen();
  };

  const handleStudentDeletion = (student: StructuredUserData) => {
    setStudentToDelete(student);
    onDeleteModalOpen();
  };

  // Function to confirm and perform deletion
  const confirmStudentDeletion = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      // Call the actual deletion API
      const result = await deleteStudentById(studentToDelete.id);
      
      if (result.success) {
        // Remove from local state only if deletion was successful
        setUsers(prev => prev.filter(user => user.id !== studentToDelete.id));
        
        setToastInfo({
          show: true,
          title: "Student deleted",
          description: `${studentToDelete["Student Details"].Name} has been removed from the system.`,
        });
      } else {
        // Show error message from the server
        setToastInfo({
          show: true,
          title: "Error deleting student",
          description: result.message || "Failed to delete the student. Please try again.",
        });
      }
      
      onDeleteModalClose();
      setStudentToDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      setToastInfo({
        show: true,
        title: "Error deleting student",
        description: "Failed to delete the student. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  // Function to handle printing a student application
  const handlePrintStudent = async (student: StructuredUserData) => {
    await generatePDF(student);
  };
  
  // Users are already filtered and sorted on the server
  const filteredAndSortedUsers = users;

  // Get registration status based on creation date
  function getRegistrationStatus(user: StructuredUserData) {
    // Since we don't have the exact date in the structured data,
    // determine status based on seat confirmation
    return user["Student Details"]["Seat Confirmed"] === "Yes" ? user['Payment']['Transaction Slip'] && user['Payment']['Transaction Number'] ? "Payment confirmed" : "Payment pending" : "Registered";
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="h-20 flex items-center justify-center m-2">
        <NavbarAdmin />
      </div>

      <main className="flex-1 overflow-y-auto p-2 pb-10 xl:px-10 bg-background">
        <Card className="shadow-sm bg-textBoxBackground h-[100%] p-0  lg:p-5">
          <CardHeader className="flex flex-col bg-textBoxBackground">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
              <div>
                <h2 className="text-lg font-medium">Student Registrations</h2>
                <p className="text-sm text-default-500">Manage all registered students</p>
              </div>
              <div className="flex  md:flex-row gap-2">
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
                <Button
                  variant="flat"
                  className="bg-muthootRed text-white"
                  startContent={<Download size={18} />}
                  isDisabled={loading || filteredAndSortedUsers.length === 0}
                >
                  Export
                </Button>
              </div>

            </div>

            <div className="flex flex-col md:flex-row justify-between w-full py-4 gap-4">
              <div className="w-full">
                <Input
                  className="max-w-md"
                  placeholder="Search by name, ID, or email..."
                  startContent={<Search className="text-default-400" size={18} />}
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
                aria-label="Student registrations table"
                
              >
                <TableHeader className="bg-textBoxBackground">
                  <TableColumn>STUDENT</TableColumn>
                  <TableColumn>PROGRAM</TableColumn>
                  <TableColumn>CONTACT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                  <TableColumn>CAN ONBOARD</TableColumn>
                </TableHeader>
                <TableBody className="bg-textBoxBackground">
                  {filteredAndSortedUsers.map((student) => (
                    <TableRow className="bg-textBoxBackground" key={student.applicationNo}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={student.Uploads?.studentPhoto || "/placeholder.svg?height=40&width=40"}
                            name={student["Student Details"].Name}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium">{student["Student Details"].Name}</div>
                            <div className="text-xs text-default-500">{student.applicationNo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student["Student Details"].Course || "B.Tech"}</div>
                                  <div className="text-xs text-default-500">
                                    {getBranchDisplayName(student["Branch Details"]?.Branch) || "Not selected"}
                                  </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student["Student Details"].Phone}</div>
                          <div className="text-xs text-default-500 truncate max-w-[200px]">
                            {student["Student Details"].Email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Chip
                            size="sm"
                            color={student["Student Details"].Quota === "NRI" ? "primary" : "secondary"}
                            variant="flat"
                          >
                            {student["Student Details"].Quota || "N/A"}
                          </Chip>
                          <Chip
                            size="sm"
                            color={student["Student Details"]["Seat Confirmed"] === "Yes" ? "success" : "warning"}
                            variant="flat"
                          >
                            {getRegistrationStatus(student)}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            color="success"
                            size="sm"
                            onPress={() => handlePrintStudent(student)}
                            isLoading={isGenerating}
                            startContent={<Printer size={16} />}
                          >
                            PRINT
                          </Button>
                          <Button 
                            color="warning" 
                            size="sm" 
                            onPress={() => handleViewStudent(student)}
                            startContent={<Eye size={16} />}
                          >
                            VIEW
                          </Button>
                          <Button 
                            color="danger" 
                            size="sm" 
                            onPress={() => handleStudentDeletion(student)}
                            startContent={<Trash2 size={16} />}
                          >
                            DELETE
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={
                              pendingChanges[student.id] !== undefined ? pendingChanges[student.id] : student.canOnboard
                            }
                            onValueChange={(isSelected) => handleTogglePermission(student, isSelected)}
                            size="sm"
                            color={pendingChanges[student.id] !== undefined ? "warning" : "success"}
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
          {
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
        </Card>
      </main>

      {/* Modal for Student Details */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-textBoxBackground",
          header: "border-b-1 border-default",
          body: "p-0",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalBody className="p-0">{selectedStudent && <StudentDetails student={selectedStudent} />}</ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal for Student Deletion Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        size="md"
        classNames={{
          base: "bg-textBoxBackground",
          header: "border-b-1 border-default",
          footer: "border-t-1 border-default",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-danger">Confirm Student Deletion</h3>
              </ModalHeader>
              <ModalBody>
                {studentToDelete && (
                  <div className="space-y-4">
                    <p className="text-default-700">
                      Are you sure you want to delete the following student? This action cannot be undone.
                    </p>
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={studentToDelete.Uploads?.studentPhoto || "/placeholder.svg?height=40&width=40"}
                          name={studentToDelete["Student Details"].Name}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium text-danger-800">
                            {studentToDelete["Student Details"].Name}
                          </div>
                          <div className="text-sm text-danger-600">
                            {studentToDelete.applicationNo}
                          </div>
                          <div className="text-sm text-danger-600">
                            {studentToDelete["Student Details"].Email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-default-500">
                      This will permanently remove all student data, including personal information, 
                      educational details, and uploaded documents.
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="light"
                  onPress={onClose}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={confirmStudentDeletion}
                  isLoading={isDeleting}
                  isDisabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Student"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      
    </div>
  );
}

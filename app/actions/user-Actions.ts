"use server"
import { prisma } from "@/prisma/prisma"
import { QUOTA_OPTIONS } from "../constants/dropdownOptions";

export async function getStructuredUserData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        throw new Error("User not found")
    }
    const structuredUser = {
        applicationNo: user.applicationNo,
        canOnboard: user.canOnboard,
        onboardingStep: user.onboardingStep,
        "Student Details": {
            "Name": `${user.firstName} ${user.middleName} ${user.lastName}`,
            "Religion": user.religion,
            'Date of Birth': user.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided',
            'Geneder': user.gender,
            'Aadhaar No': user.aadharNo,
            'Phone': user.mobileNumber,
            'Kerala Phone': user.keralaMobileNumber,
            'Email': user.email,
            'Parent Name': user.parentDetails?.guardian,
            'Parent Occupation': user.parentDetails?.occupation,
            'Quota': user.quota,
            'Course': user.program,
            'Academic Year': user.applyingYear,
            'NRI Sponsor': user.parentDetails?.sponsor,
            'Relationship with Applicant': user.parentDetails?.relation,
            'Seat Confirmed': user.seatConfirmed,
        },
        "Contact Address": {
            "House Name": user.contactAddress?.houseName,
            "State": user.contactAddress?.state,
            "District, City": `${user.contactAddress?.district}, ${user.contactAddress?.city}`,
            "Pin": user.contactAddress?.pincode,
        },
        "Permanent Address": {
            "House Name": user.permanentAddress?.houseName,
            "State": user.permanentAddress?.state,
            "District, City": `${user.permanentAddress?.district}, ${user.permanentAddress?.city}`,//if there is not city and district its undefined, undefined
            "Pin": user.permanentAddress?.pincode,
        },
        "10th Mark Details": { "Name of Institution": user.education?.tenth.schoolName, "Board": user.education?.tenth.board },
        "12th Mark Details": { "Name of Institution": user.education?.twelfth.schoolName, "Board": user.education?.twelfth.board },
        "Keam Details": {
            "Year": user.education?.keam?.year,
            "Roll No": user.education?.keam?.rollNumber,
            "Rank": user.education?.keam?.rank,
            "Paper 1 score(Physics and Chemistry)": user.education?.keam?.paper1Mark,
            "Paper 2 score(Mathematics)": user.education?.keam?.paper2Mark,
            "Total Keam Score": user.education?.keam?.totalScore,
        },
        "Branch Details": {
            "Branch": user.declaration?.branch,
        },
        "Uploads": {
            "studentPhoto": user.photo,
            "studentSignature": user.declaration?.signature,
            "parentSignature": user.declaration?.signatureGuardian,
            "tenthCertificate": user.education?.tenth?.markList,
            "twelfthCertificate": user.education?.twelfth?.markList,
            "keamCertificate": user.education?.keam?.markList
        },
        "Payment": {
            "Transaction Number": user.payment?.transactionNumber,
            "Transaction Slip": user.payment?.transactionSlip
        }
    }
    return structuredUser;
}

export async function conformSeat(userId: string, quota: string, branchName: string, year: number) {
    try {
        console.log('conformSeat called with:', { userId, quota, branchName, year });
        
        const branch = await prisma.branches.findUnique({
            where: {
                name_year: {
                    name: branchName,
                    year: year
                }
            }
        });

        console.log('Found branch:', branch);

        if (!branch) {
            return { success: false, message: "Branch not found" };
        }

        if (branch.totalSets == branch.occupiedSets) {
            return { success: false, message: "No seats available" };
        }

        if (!QUOTA_OPTIONS.includes(quota)) {
            console.log('Invalid quota:', quota, 'Available options:', QUOTA_OPTIONS);
            return { success: false, message: "Invalid quota" };
        }

        const quotaField = quota.toLowerCase();
        const studentsField = `${quotaField}Students`;
        const isNriQuota = quota === 'NRI'; // Only NRI uses NRI seats
        
        console.log('Using quotaField:', quotaField, 'studentsField:', studentsField, 'isNriQuota:', isNriQuota);

        await prisma.branches.update({
            where: {
                name_year: {
                    name: branchName,
                    year: year
                }
            },
            data: {
                occupiedSets: branch.occupiedSets + 1,
                // Increment NRI occupied count only for NRI quota
                occupiedNri: isNriQuota ? branch.occupiedNri + 1 : branch.occupiedNri,
                // Increment Super occupied count for all other quotas (OCI, CIWG, PIO)
                occupiedSuper: !isNriQuota ? branch.occupiedSuper + 1 : branch.occupiedSuper,
                // Increment the quota field
                [quotaField]: { increment: 1 },
                // Add student ID to the appropriate array
                [studentsField]: { push: userId }
            }
        });
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                seatConfirmed: true,
                onboardingStep: 4, // Set to step 4 (FinalVerification completed)
            }
        });
        if (!user) {
            return { success: false, message: "User not found" };
        }


        return { success: true, message: "Seat confirmed successfully" };
    } catch (error) {
        console.error('conformSeat error:', error);
        return { success: false, message: `Seat confirmation failed: ${error instanceof Error ? error.message : "Unknown error"}` };
    }

}

export async function getStructuredUsersByYear(
    year: string, 
    page: number = 1, 
    limit: number = 10,
    searchTerm: string = "",
    sortBy: string = "newest"
) {
    try {
        // Validate input
        if (!year) {
            return {
                success: false,
                message: "Year is required",
                users: [],
                totalUsers: 0,
                totalPages: 0
            };
        }

        // Calculate pagination values
        const skip = (page - 1) * limit;

        // Build where clause with search functionality
        const whereClause: { applyingYear: string; OR?: Array<Record<string, unknown>> } = {
            applyingYear: year
        };

        // Add search filter if searchTerm is provided
        if (searchTerm && searchTerm.trim() !== "") {
            whereClause.OR = [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { middleName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
                { mobileNumber: { contains: searchTerm, mode: 'insensitive' } },
                { applicationNo: { contains: searchTerm, mode: 'insensitive' } }
            ];
        }

        // Get total count for pagination with search applied
        const totalUsers = await prisma.user.count({
            where: whereClause
        });

        // Determine sort order
        let orderBy: { createdAt?: 'asc' | 'desc'; firstName?: 'asc' | 'desc' } = { createdAt: 'desc' }; // default: newest
        
        switch (sortBy) {
            case "oldest":
                orderBy = { createdAt: 'asc' };
                break;
            case "name":
                orderBy = { firstName: 'asc' };
                break;
            case "newest":
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }

        // Get users for the specified year with search and sort
        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: orderBy,
            skip: skip,
            take: limit
        });

        // Format each user with the same structure as getStructuredUserData
        const structuredUsers = users.map(user => ({
            id: user.id,
            applicationNo: user.applicationNo,
            canOnboard: user.canOnboard,
            onboardingStep: user.onboardingStep,
            "Student Details": {
                "Name": `${user.firstName} ${user.middleName || ''} ${user.lastName}`,
                "Religion": user.religion,
                'Date of Birth': user.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided',
                'Geneder': user.gender,
                'Aadhaar No': user.aadharNo,
                'Phone': user.mobileNumber,
                'Kerala Phone': user.keralaMobileNumber,
                'Email': user.email,
                'Parent Name': user.parentDetails?.guardian,
                'Parent Occupation': user.parentDetails?.occupation,
                'Quota': user.quota,
                'Course': user.program,
                'Academic Year': user.applyingYear,
                'NRI Sponsor': user.parentDetails?.sponsor,
                'Relationship with Applicant': user.parentDetails?.relation,
                'Seat Confirmed': user.seatConfirmed ? 'Yes' : 'No',
            },
            "Contact Address": {
                "House Name": user.contactAddress?.houseName,
                "State": user.contactAddress?.state,
                "District, City": `${user.contactAddress?.district || ''}, ${user.contactAddress?.city || ''}`,
                "Pin": user.contactAddress?.pincode,
            },
            "Permanent Address": {
                "House Name": user.permanentAddress?.houseName,
                "State": user.permanentAddress?.state,
                "District, City": `${user.permanentAddress?.district || ''}, ${user.permanentAddress?.city || ''}`,
                "Pin": user.permanentAddress?.pincode,
            },
            "10th Mark Details": {
                "Name of Institution": user.education?.tenth?.schoolName,
                "Board": user.education?.tenth?.board
            },
            "12th Mark Details": {
                "Name of Institution": user.education?.twelfth?.schoolName,
                "Board": user.education?.twelfth?.board
            },
            "Keam Details": {
                "Year": user.education?.keam?.year,
                "Roll No": user.education?.keam?.rollNumber,
                "Rank": user.education?.keam?.rank,
                "Paper 1 score(Physics and Chemistry)": user.education?.keam?.paper1Mark,
                "Paper 2 score(Mathematics)": user.education?.keam?.paper2Mark,
                "Total Keam Score": user.education?.keam?.totalScore,
            },
            "Branch Details": {
                "Branch": user.declaration?.branch,
            },
            "Uploads": {
                "studentPhoto": user.photo,
                "studentSignature": user.declaration?.signature,
                "parentSignature": user.declaration?.signatureGuardian,
                "tenthCertificate": user.education?.tenth?.markList,
                "twelfthCertificate": user.education?.twelfth?.markList,
                "keamCertificate": user.education?.keam?.markList
            },
            "Payment": {
                "Transaction Number": user.payment?.transactionNumber,
                "Transaction Slip": user.payment?.transactionSlip
            }
        }));

        return {
            success: true,
            users: structuredUsers,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            message: structuredUsers.length > 0 ?
                `Found ${structuredUsers.length} users for academic year ${year}` :
                `No users found for academic year ${year}`
        };
    } catch (error) {
        console.error("Error fetching users by year:", error);
        return {
            success: false,
            message: `Failed to fetch users: ${error instanceof Error ? error.message : "Unknown error"}`,
            users: [],
            totalUsers: 0,
            totalPages: 0
        };
    }
}

export async function updateOnboardingStatus(userId: string, canOnboard: boolean) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { canOnboard }
        });
        return { success: true, message: "User onboarding status updated successfully", user };
    } catch (error) {
        console.error("Error updating onboarding status:", error);
        return { success: false, message: "Failed to update onboarding status" };
    }
}

export async function deleteStudentById(userId: string) {
    try {
        // First, check if the user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return { 
                success: false, 
                message: "Student not found" 
            };
        }

        // If the user has a confirmed seat, we need to free up the seat in the branch
        if (existingUser.seatConfirmed && existingUser.declaration?.branch) {
            const branchName = existingUser.declaration.branch;
            const year = parseInt(existingUser.applyingYear);
            const quota = existingUser.quota.toLowerCase();

            // Find the branch
            const branch = await prisma.branches.findUnique({
                where: {
                    name_year: {
                        name: branchName,
                        year: year
                    }
                }
            });

            if (branch) {
                // Determine which fields to update based on quota
                const isNriQuota = quota === 'nri'; // Only NRI uses NRI seats, all others use Super seats
                const studentsField = `${quota}Students` as 'nriStudents' | 'ociStudents' | 'ciwgStudents' | 'pioStudents';

                // Get current students array
                const currentStudents = studentsField === 'nriStudents' ? branch.nriStudents :
                                      studentsField === 'ociStudents' ? branch.ociStudents :
                                      studentsField === 'ciwgStudents' ? branch.ciwgStudents :
                                      branch.pioStudents;

                // Update branch seat allocation
                await prisma.branches.update({
                    where: {
                        name_year: {
                            name: branchName,
                            year: year
                        }
                    },
                    data: {
                        // Always decrement total occupied seats
                        occupiedSets: Math.max(0, branch.occupiedSets - 1),
                        // Decrement NRI occupied count only for NRI quota
                        occupiedNri: isNriQuota ? Math.max(0, branch.occupiedNri - 1) : branch.occupiedNri,
                        // Decrement Super occupied count for all other quotas (OCI, CIWG, PIO)
                        occupiedSuper: !isNriQuota ? Math.max(0, branch.occupiedSuper - 1) : branch.occupiedSuper,
                        // Decrease the quota-specific field count
                        [quota]: { decrement: 1 },
                        // Remove student ID from the appropriate array
                        [studentsField]: {
                            set: currentStudents.filter(id => id !== userId)
                        }
                    }
                });
            }
        }

        // Delete the user
        await prisma.user.delete({
            where: { id: userId }
        });

        return { 
            success: true, 
            message: "Student deleted successfully" 
        };

    } catch (error) {
        console.error("Error deleting student:", error);
        return { 
            success: false, 
            message: `Failed to delete student: ${error instanceof Error ? error.message : "Unknown error"}` 
        };
    }
}

export async function updateBasicInfo(
    userId: string,
    data: {
        firstName: string;
        middleName?: string;
        lastName: string;
        email: string;
        mobileNumber: string;
        keralaMobileNumber?: string;
        gender: string;
        dob: string; // ISO date string
        religion: string;
        cast: string;
        aadharNo: number;
    }
) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                middleName: data.middleName || null,
                lastName: data.lastName,
                email: data.email,
                mobileNumber: data.mobileNumber,
                keralaMobileNumber: data.keralaMobileNumber || null,
                gender: data.gender,
                dob: new Date(data.dob),
                religion: data.religion,
                cast: data.cast,
                aadharNo: data.aadharNo,
            },
        });

        // Return updated structured data so UI can refresh without a full page reload
        return {
            success: true,
            message: "Basic information updated successfully",
            updatedFields: {
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                mobileNumber: user.mobileNumber,
                keralaMobileNumber: user.keralaMobileNumber,
                gender: user.gender,
                dob: user.dob,
                religion: user.religion,
                cast: user.cast,
                aadharNo: user.aadharNo,
            },
        };
    } catch (error) {
        console.error("Error updating basic info:", error);
        return {
            success: false,
            message: `Failed to update basic info: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

export async function updateOnboardingStep(userId: string, step: number) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return { success: false, message: "User not found" };
        }

        // Only allow updating to a higher step number or same step
        if (step < user.onboardingStep) {
            return { success: false, message: "Cannot go backwards in onboarding steps" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { onboardingStep: step }
        });

        return { success: true, message: "Onboarding step updated successfully" };
    } catch (error) {
        console.error("Error updating onboarding step:", error);
        return { 
            success: false, 
            message: `Failed to update onboarding step: ${error instanceof Error ? error.message : "Unknown error"}` 
        };
    }
}
"use server";

import { prisma } from "@/prisma/prisma";
import { BRANCH_OPTIONS } from "../constants/dropdownOptions";

const branchesList = BRANCH_OPTIONS
interface BranchData {
    mngtSeats: number;
    nriSeats: number;
    superSeats: number;
    waitingList: number;
}

const DEFAULT_BRANCH_SEATS = {
    superSeats: 9,
    nriSeats: 9,
    mngtSeats: 9,
    waitingList: 0,
};

export async function ensureAllYearsHaveAllBranches() {
    const years = await prisma.branches.findMany({
        select: { year: true },
        distinct: ["year"],
    });

    if (years.length === 0) {
        return { success: true, created: 0 };
    }

    const existingBranches = await prisma.branches.findMany({
        select: {
            year: true,
            name: true,
        },
    });

    const existingPairs = new Set(
        existingBranches.map((branch) => `${branch.year}:${branch.name}`)
    );

    const missingBranches = years.flatMap(({ year }) =>
        branchesList
            .filter((name) => !existingPairs.has(`${year}:${name}`))
            .map((name) => ({
                name,
                year,
                superSeats: DEFAULT_BRANCH_SEATS.superSeats,
                nriSeats: DEFAULT_BRANCH_SEATS.nriSeats,
                mngtSeats: DEFAULT_BRANCH_SEATS.mngtSeats,
                totalSets:
                    DEFAULT_BRANCH_SEATS.superSeats +
                    DEFAULT_BRANCH_SEATS.nriSeats +
                    DEFAULT_BRANCH_SEATS.mngtSeats,
                occupiedSets: 0,
                occupiedNri: 0,
                occupiedMngt: 0,
                occupiedSuper: 0,
                nri: 0,
                oci: 0,
                ciwg: 0,
                pio: 0,
                waitingList: DEFAULT_BRANCH_SEATS.waitingList,
                nriStudents: [],
                ociStudents: [],
                ciwgStudents: [],
                pioStudents: [],
            }))
    );

    if (missingBranches.length === 0) {
        return { success: true, created: 0 };
    }

    const result = await prisma.branches.createMany({
        data: missingBranches,
    });

    return { success: true, created: result.count };
}


export async function addYear(year: number) {
    const existingBranch = await prisma.branches.findFirst({
        where: {
            year: year
        }
    });

    if (existingBranch) {
        throw new Error(`A branch for the year ${year} already exists`);
    }

    // Create year status record (default to active)
    await prisma.yearStatus.upsert({
        where: { year },
        update: {}, // No update needed if exists
        create: {
            year,
            isActive: true
        }
    });

    const newBranch = await Promise.all(branchesList.map(async (branchName) => {
        const superSeats = 9;
        const nriSeats = 9;
        const mngtSeats = 9;
        const totalSeats = superSeats + nriSeats + mngtSeats;
        return await prisma.branches.create({
            data: {
                name: branchName,
                year: year,
                superSeats: superSeats,
                nriSeats: nriSeats,
                mngtSeats: mngtSeats,
                totalSets: totalSeats,  // Sum of all seat types
                occupiedSets: 0,
                occupiedNri: 0,
                occupiedMngt: 0,
                occupiedSuper: 0,
                nri: 0,
                oci: 0,
                ciwg: 0,
                pio: 0,
                waitingList: 0
            }
        })
    }))
    return {
        success: true,
        message: "Branch added successfully",
        branch: newBranch
    }
}
export async function getAllBreanchesByYear() {
    await ensureAllYearsHaveAllBranches();

    const branches = await prisma.branches.findMany({
        select: {
            year: true,
            name: true,
            mngtSeats: true,
            nriSeats: true,
            superSeats: true,
            waitingList: true
        },
        orderBy: {
            year: 'desc'
        }
    });

    // Transform flat array into object grouped by year
    const groupedByYear = branches.reduce((acc, branch) => {
        // If this year doesn't exist in our accumulator yet, create it
        if (!acc[branch.year]) {
            acc[branch.year] = {};
        }

        // Add this branch data under its name
        acc[branch.year][branch.name] = {
            mngtSeats: branch.mngtSeats,
            nriSeats: branch.nriSeats,
            superSeats: branch.superSeats,
            waitingList: branch.waitingList
        };

        return acc;
    }, {} as Record<number, Record<string, BranchData>>);

    return groupedByYear;
}


export async function isBranchAvailable(year: number | string, branch: string) {
    // console.log("year", year, "branch", branch)
    if (typeof year === "string") {
        year = parseInt(year)
    }
    console.log("year", year, "branch", branch)
    const branchEntry = await prisma.branches.findFirst({
        where: {
            year: year,
            name: branch
        }
    });
    console.log("branchEntry", branchEntry)
    if (!branchEntry) {
        throw new Error(`Branch ${branch} not found for the year ${year}`);
    }
    return branchEntry;
}

// Year activation functions
export async function toggleYearActivation(year: number, isActive: boolean) {
    try {
        // First check if year status exists
        const existingStatus = await prisma.yearStatus.findUnique({
            where: { year }
        });

        if (existingStatus) {
            // Update existing status
            const updatedStatus = await prisma.yearStatus.update({
                where: { year },
                data: { isActive }
            });
            return {
                success: true,
                message: `Year ${year} ${isActive ? 'activated' : 'deactivated'} successfully`,
                status: updatedStatus
            };
        } else {
            // Create new status entry
            const newStatus = await prisma.yearStatus.create({
                data: {
                    year,
                    isActive
                }
            });
            return {
                success: true,
                message: `Year ${year} ${isActive ? 'activated' : 'deactivated'} successfully`,
                status: newStatus
            };
        }
    } catch (error) {
        console.error("Error toggling year activation:", error);
        return {
            success: false,
            message: `Failed to ${isActive ? 'activate' : 'deactivate'} year ${year}`
        };
    }
}

export async function getYearActivationStatus(year: number) {
    try {
        const yearStatus = await prisma.yearStatus.findUnique({
            where: { year }
        });
        
        // If no record exists, default to active (true)
        return {
            success: true,
            isActive: yearStatus?.isActive ?? true,
            year
        };
    } catch (error) {
        console.error("Error getting year activation status:", error);
        return {
            success: false,
            isActive: false,
            year
        };
    }
}

export async function deleteYear(year: number) {
    try {
        // Check if there are any users registered for this year
        const usersCount = await prisma.user.count({
            where: {
                applyingYear: year.toString()
            }
        });

        // Delete all users for this year first (if any exist)
        if (usersCount > 0) {
            await prisma.user.deleteMany({
                where: {
                    applyingYear: year.toString()
                }
            });
        }

        // Delete all branch entries for this year
        await prisma.branches.deleteMany({
            where: { year }
        });

        // Delete year status entry
        await prisma.yearStatus.deleteMany({
            where: { year }
        });

        return {
            success: true,
            message: `Year ${year} deleted successfully. ${usersCount > 0 ? `${usersCount} student(s) and ` : ''}All associated branch data removed.`
        };
    } catch (error) {
        console.error("Error deleting year:", error);
        return {
            success: false,
            message: `Failed to delete year ${year}: ${error instanceof Error ? error.message : "Unknown error"}`
        };
    }
}
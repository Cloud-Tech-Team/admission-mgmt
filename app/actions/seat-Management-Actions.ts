"use server"

import { prisma } from "@/prisma/prisma";
import { ensureAllYearsHaveAllBranches } from "./branch-Actions";

type UpdateBranchParams = {
    year: number;
    branchName: string;
    nriSeats: number;
    superSeats: number;
    mngtSeats: number;
    waitingList: number;
};

export async function getAllAvailableYears() {
    await ensureAllYearsHaveAllBranches();

    const years = await prisma.branches.findMany({
        select: {
            year: true
        },
        orderBy: {
            year: 'desc'
        },
        distinct: ['year']
    });

    // Extract the year values from the result
    const availableYears = years.map(item => item.year);

    // Sort the years in ascending or descending order
    availableYears.sort((a, b) => b - a); // Descending order (most recent first)

    return availableYears;
}

export async function getActiveYears() {

        const activeYearStatuses = await prisma.yearStatus.findMany({
            where: {
                isActive: true
            },
            select: {
                year: true
            },
            orderBy: {
                year: 'desc'
            }
        });
        // Extract just the year numbers
        const activeYears = activeYearStatuses.map(status => status.year);
        
        return activeYears;
    
}

export async function updateBranchAllocation(params: UpdateBranchParams) {
    try {
        await ensureAllYearsHaveAllBranches();

        const { year, branchName, nriSeats, superSeats, mngtSeats, waitingList } = params;

        // Find the branch if it exists
        const existingBranch = await prisma.branches.findUnique({
            where: {
                name_year: {
                    name: branchName,
                    year: year
                }
            }
        });

        if (!existingBranch) {
            console.log('branch not found');
            return {
                success: false,
                message: `Branch ${branchName} not found for year ${year}`
            };
        } else {
            // Update existing branch
            await prisma.branches.update({
                where: {
                    id: existingBranch.id
                },
                data: {
                    totalSets: nriSeats + superSeats + mngtSeats,
                    nriSeats: nriSeats,
                    superSeats: superSeats,
                    mngtSeats: mngtSeats,
                    waitingList: waitingList
                }
            });
        }

        return {
            success: true,
            message: `Branch ${branchName} allocation updated successfully for year ${year}`
        };
    } catch (error) {
        console.error("Error updating branch allocation:", error);
        return {
            success: false,
            message: "Failed to update branch allocation"
        };
    }
}
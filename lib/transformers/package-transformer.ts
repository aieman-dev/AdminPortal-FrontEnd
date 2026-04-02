// lib/transformers/package-transformer.ts

import { BackendPackageSummaryDTO, BackendPackageDetailDTO, Package, PackageItem } from "@/type/packages";

export interface AgeCategoryMapData {
    displayText: string; 
    description: string; 
}

// Transform the List/Summary View
export const transformSummaryToFrontend = (pkg: BackendPackageSummaryDTO, ageMap: Record<string, AgeCategoryMapData> = {}): Package => {
    const mappedAge = ageMap[pkg.ageCategory || ""];
    
    return {
        id: pkg.id,
        name: pkg.name || "Untitled",
        price: pkg.price ?? 0,
        point: pkg.point ?? 0,
        packageType: pkg.packageType || "N/A",
        status: pkg.status || "Draft",
        imageUrl: pkg.imageUrl || "",
        nationality: pkg.nationality || "N/A",
        ageCategory: mappedAge?.displayText || pkg.ageCategory || "N/A",
        ageDescription: mappedAge?.description || "",
        effectiveDate: "", // Not returned in summary
        lastValidDate: "", // Not returned in summary
        createdDate: pkg.createdDate || "",
        submittedBy: pkg.submittedBy || "System",
        reviewedBy: pkg.approvedBy,
        reviewedDate: pkg.reviewedDate,
        remark: "",
        remark2: "",
        durationDays: 0,
        items: [] 
    };
};

// Transform the Detailed View
export const transformDetailToFrontend = (pkg: BackendPackageDetailDTO, ageMap: Record<string, AgeCategoryMapData> = {}): Package => {
    const mappedAge = ageMap[pkg.ageCategory || ""];
    
    const finalItems: PackageItem[] = (pkg.items || []).map(item => ({
        attractionId: item.attractionId,
        itemName: item.itemName || "Unknown Item",
        price: item.price ?? 0,
        point: item.point ?? 0,
        entryQty: item.entryQty ?? 1,
        nationality: item.nationality,
        category: item.ageCategory
    }));

    return {
        id: pkg.id,
        name: pkg.name || "Untitled",
        price: pkg.price ?? 0,
        point: pkg.point ?? 0,
        packageType: pkg.packageType || "N/A",
        status: pkg.status || "Draft",
        imageUrl: pkg.imageUrl || "",
        nationality: pkg.nationality || "N/A",
        ageCategory: mappedAge?.displayText || pkg.ageCategory || "N/A",
        ageDescription: mappedAge?.description || "",
        effectiveDate: pkg.effectiveDate || "",
        lastValidDate: pkg.lastValidDate || "",
        createdDate: pkg.createdDate || "",
        submittedBy: pkg.submittedBy || "System",
        reviewedBy: pkg.approvedBy,
        reviewedDate: pkg.reviewedDate,
        remark: pkg.remark || "",
        remark2: pkg.remark2 || "",
        durationDays: pkg.validDays ?? 0,
        dayPass: pkg.dayPass ? String(pkg.dayPass) : undefined,
        items: finalItems
    };
};
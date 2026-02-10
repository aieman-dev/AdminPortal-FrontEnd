import { z } from "zod"

// Helper to clean NRIC
const transformNRIC = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (/^\d{12}$/.test(clean)) {
        return `${clean.slice(0, 6)}-${clean.slice(6, 8)}-${clean.slice(8, 12)}`;
    }
    return clean.slice(0, 15);
};

// Helper to clean Mobile
const transformMobile = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "6" + digits;
    return digits.slice(0, 13);
};

export const carParkFormSchema = z.object({
    // Search/Meta (Optional/Internal)
    searchType: z.enum(["qr", "email"]).optional(),
    searchTerm: z.string().optional(),
    
    // User Info
    accId: z.number().optional(),
    userEmail: z.string().email("Invalid email address"),
    name: z.string().min(1, "Full Name is required"),
    nric: z.string().min(1, "NRIC/Passport is required").transform(transformNRIC),
    mobileContact: z.string().min(1, "Mobile number is required").transform(transformMobile),
    officeContact: z.string().optional(),
    companyName: z.string().optional(),
    
    // Vehicles
    plate1: z.string().min(1, "Primary car plate is required").transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, "")),
    plate2: z.string().optional(),
    plate3: z.string().optional(),

    // Tandem
    isTandem: z.boolean().default(false),
    tandemEmail: z.string().optional(),
    tandemName: z.string().optional(),
    tandemNric: z.string().optional(),
    tandemMobile: z.string().optional(),
    tandemPlate1: z.string().optional(),
    
    // Location
    phase: z.string().min(1, "Phase is required"),
    unitNo: z.string().min(1, "Unit No is required"),
    
    // User Classification
    userType: z.enum(["Staff", "Tenant", "Non-Tenant", "Owner"]),
    staffId: z.string().optional(),
    department: z.string().optional(),

    // Parking Config
    parkingType: z.enum(["Normal", "Reserved"]),
    bayNo: z.string().optional(),
    seasonPackage: z.string().optional(),
    remarks: z.string().optional(),
    
    // Flags
    isMobileQr: z.boolean().default(false),
    isHomestay: z.boolean().default(false), 
    isLpr: z.boolean().default(false),
    
    // Amano / Legacy
    amanoCardNo: z.string().optional(),
    amanoExpiryDate: z.string().optional(),
});

export type CarParkFormValues = z.infer<typeof carParkFormSchema>;
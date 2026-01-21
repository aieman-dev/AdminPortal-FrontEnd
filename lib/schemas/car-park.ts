import { z } from "zod"

export const carParkFormSchema = z.object({
    // Search/Meta (Optional/Internal)
    searchType: z.enum(["qr", "email"]).optional(),
    searchTerm: z.string().optional(),
    
    // User Info
    accId: z.number().optional(),
    userEmail: z.string().email("Invalid email address"),
    name: z.string().min(1, "Full Name is required"),
    nric: z.string().min(1, "NRIC/Passport is required"),
    mobileContact: z.string().min(1, "Mobile number is required"),
    officeContact: z.string().optional(),
    companyName: z.string().optional(),
    
    // Vehicles
    plate1: z.string().min(1, "Primary car plate is required"),
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
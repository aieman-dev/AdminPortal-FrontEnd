//lib/mock-data/packages.ts

export interface Package {
  id: string | number;
  packageId: string;             
  packageName: string;
  packageType: string;          
  totalPrice: string | number;          
  ageCategory: string;              
  durationDays: number; 
  imageID?: string;
  effectiveDate?: string;
  lastValidDate?: string;
  dayPass?: string;  
  status: 'Active' | 'Expired' | 'Pending' | 'Rejected' | 'Expire Soon'| 'Draft';
  entryType?: string;     
  nationality?: string; 
  createdBy: string;      
  createdDate: string; 
  tpremark?: string;         
  approvedBy?: string;    
  approvedDate?: string;  
  financeremark?: string; 
  packageitems?: PackageItem[];

}

export interface PackageFormData {
  id: string | number;
  packageId: string;             
  packageName: string;
  packageType: string;     
  nationality: string;     
  ageCategory: string;     
  effectiveDate: string;   
  lastValidDate: string;   
  dayPass?: string;
  tpremark?: string;       
  imageID: File | string | null; 
  packageitems: PackageItem[];   
  totalPrice?: number;
}

export interface PackageItem {
  packagItemID: string | number;   
  itemName: string;       
  price?: number;          
  entryQty?: number;      
  image: string;          
}

export interface AgeCategory {
  ageCode: string;        
  categoryName: string;   
  displayText: string;    
}

const sampleImage =
  "https://images.unsplash.com/photo-1524338198850-8a2ff63aaceb?w=400&h=300&fit=crop";


// Mock data for Package Listing
export const mockPackages: Package[] = [
  {
    id: "1",
    packageId: "PKG-001",
    packageName: "Theme Park Annual Pass",
    packageType: "Annual",
    totalPrice: 1200.0,
    ageCategory: "All Ages",
    durationDays: 365,
    imageID: "img_annual_001",
    effectiveDate: "2025-01-01",
    lastValidDate: "2025-12-31",
    dayPass: "No",
    status: "Active",
    entryType: "Unlimited Access",
    nationality: "Malaysian",
    createdBy: "admin@themepark.com",
    createdDate: "2024-12-15 09:00:00",
    tpremark: "Top-selling package",
    approvedBy: "manager@themepark.com",
    approvedDate: "2024-12-16 11:30:00",
    financeremark: "Approved for Q1 launch",
    packageitems: [
      { packagItemID: "A1", itemName: "All Rides Access", price: 100, entryQty: 1, image: sampleImage },
      { packagItemID: "A2", itemName: "Water Park Entry", price: 1000, entryQty: 1, image: sampleImage },
      { packagItemID: "A3", itemName: "Free Locker Rental", price: 10000, entryQty: 5, image: sampleImage },
    ],
  },
  {
    id: "2",
    packageId: "PKG-002",
    packageName: "Family Fun Day Pass",
    packageType: "Day",
    totalPrice: 350.0,
    ageCategory: "Family (2 Adults + 2 Kids)",
    durationDays: 1,
    imageID: "img_day_002",
    effectiveDate: "2025-03-01",
    lastValidDate: "2025-06-30",
    dayPass: "Yes",
    status: "Active",
    entryType: "Single Day Access",
    nationality: "Malaysian",
    createdBy: "staff01@themepark.com",
    createdDate: "2025-02-25 14:00:00",
    tpremark: "Includes food vouchers",
    approvedBy: "supervisor@themepark.com",
    approvedDate: "2025-02-26 10:15:00",
    financeremark: "Discounted for holiday season",
    packageitems: [
      { packagItemID: "B1", itemName: "Ride Access", price: 50, entryQty: 4, image: sampleImage },
      { packagItemID: "B2", itemName: "Meal Voucher", price: 50, entryQty: 4, image: sampleImage },
    ],
  },
  {
    id: "3",
    packageId: "PKG-003",
    packageName: "Student Adventure Package",
    packageType: "Group",
    totalPrice: 600.0,
    ageCategory: "Teenagers (13–19)",
    durationDays: 2,
    imageID: "img_group_003",
    effectiveDate: "2025-04-01",
    lastValidDate: "2025-09-30",
    dayPass: "No",
    status: "Expire Soon",
    entryType: "2-Day Access",
    nationality: "Malaysian",
    createdBy: "marketing@themepark.com",
    createdDate: "2025-03-15 09:45:00",
    tpremark: "Targeted for school holidays",
    approvedBy: "manager@themepark.com",
    approvedDate: "2025-03-16 16:00:00",
    financeremark: "Limited-time promotion",
    packageitems: [
      { packagItemID: "C1", itemName: "2-Day Pass", price: 10, entryQty: 1, image: sampleImage },
      { packagItemID: "C2", itemName: "Group Photo Voucher", price: 10, entryQty: 1, image: sampleImage },
    ],
  },
  {
    id: "4",
    packageId: "PKG-004",
    packageName: "Corporate Team Building Pass",
    packageType: "Corporate",
    totalPrice: 5000.0,
    ageCategory: "Adults",
    durationDays: 3,
    imageID: "img_corporate_004",
    effectiveDate: "2025-05-01",
    lastValidDate: "2025-10-01",
    dayPass: "No",
    status: "Pending",
    entryType: "3-Day Group Access",
    nationality: "International",
    createdBy: "sales@themepark.com",
    createdDate: "2025-04-20 08:15:00",
    tpremark: "Awaiting finance approval",
    approvedBy: "",
    approvedDate: "",
    financeremark: "Under review",
    packageitems: [
      { packagItemID: "D1", itemName: "Corporate Activities", price: 5, entryQty: 3, image: sampleImage },
      { packagItemID: "D2", itemName: "Meal Packages", price: 2, entryQty: 10, image: sampleImage },
      { packagItemID: "D3", itemName: "VIP Parking", price: 3, entryQty: 5, image: sampleImage },
    ],
  },
  {
    id: "5",
    packageId: "PKG-005",
    packageName: "Weekend Couple Package",
    packageType: "Weekend",
    totalPrice: 420.0,
    ageCategory: "Adults (18+)",
    durationDays: 2,
    imageID: "img_weekend_005",
    effectiveDate: "2025-02-01",
    lastValidDate: "2025-12-31",
    dayPass: "No",
    status: "Draft",
    entryType: "Weekend Access",
    nationality: "Malaysian",
    createdBy: "admin@themepark.com",
    createdDate: "2025-01-20 09:00:00",
    tpremark: "Not yet released to public",
    approvedBy: "",
    approvedDate: "",
    financeremark: "Awaiting management decision",
    packageitems: [
      { packagItemID: "E1", itemName: "Weekend Entry", price: 10, entryQty: 2,image: sampleImage },
      { packagItemID: "E2", itemName: "Dinner Voucher",  price: 2, entryQty: 2,image: sampleImage },
    ],
  },
]

// Mock data for Package Listing Items
const sampleItems: PackageItem[] = [
  { packagItemID: 1, itemName: "Disco Walk", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 2, itemName: "Water World", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 3, itemName: "Bowl America", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 4, itemName: "Bumper Car", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 5, itemName: "DSA", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 6, itemName: "Fun Fun", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 7, itemName: "SnoWalk", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 8, itemName: "Sky City", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 9, itemName: "WynSnow", price: 0, entryQty: 0, image: sampleImage },
  { packagItemID: 10, itemName: "Ferris Wheel", price: 0, entryQty: 0, image: sampleImage },
];
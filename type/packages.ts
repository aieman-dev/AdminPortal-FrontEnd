/**
 * ----------------------------------------------
 * 📦 Package Types
 * ----------------------------------------------
 * Defines all TypeScript interfaces used for the
 * Package feature in the i-City SuperApp system.
 *
 * Each interface has a clear purpose:
 *  - `Package`: for displaying existing package details
 *  - `PackageFormData`: for creating or editing a package
 *  - `PackageItem`: for user-selected attractions inside a package
 *  - `Attraction`: for available attractions to choose from
 *  - `AgeCategory`: for dropdown age options
 */

/* -----------------------------------------------------------
   🧩 MAIN PACKAGE INTERFACE
   Used when displaying package details or list of packages.
   ----------------------------------------------------------- */
// src/type/packages.ts
export interface Package {
  id: number;             
  PackageName: string;          
  totalPrice: string;          
  category: string;       
  startDate: string;      
  endDate: string;        
  durationDays: number;   
  status: 'Active' | 'Expired' | 'Pending' | 'Rejected' | 'Expire Soon'| 'Draft';
  image: string;          
  entryType?: string;     
  nationality?: string;   
  ageCategory?: string;   
  createdBy: string;      
  createdDate: string;    
  approvedBy?: string;    
  approvedDate?: string;  
  tpremark?: string;      
  financeremark?: string; 

  // Added to make component compile
  packageitems?: PackageItem[];
  imageID?: string;
  effectiveDate?: string;
  lastValidDate?: string;
  dayPass?: string;
}

/* -----------------------------------------------------------
   📝 PACKAGE FORM DATA
   Used when submitting or editing a package form (Page 1).
   ----------------------------------------------------------- */
export interface PackageFormData {
  packageName: string;            
  packageType: string;     
  nationality: string;     
  ageCategory: string;     
  effectiveDate: string;   
  lastValidDate: string;   
  dayPass?: string;
  tpremark?: string;       
  imageID: File | string | null; 
  packageitems: PackageItem[];    // Page 2 — user-selected items
  totalPrice?: number;
}

/* -----------------------------------------------------------
   🎡 AVAILABLE ATTRACTIONS
   Represents attractions displayed for selection (Page 2).
   ----------------------------------------------------------- */
export interface Attraction {
  id: number;             
  name: string;           
  image: string;          
  description?: string;   
}

/* -----------------------------------------------------------
   🎟️ PACKAGE ITEM
   Represents a user-selected attraction inside a package.
   ----------------------------------------------------------- */
export interface PackageItem {
  attractionId: number;   /** ID of the original attraction */
  itemName: string;       /** e.g. "Snowalk Entry" */
  price?: number;          /** Price for this item (RM) */
  entryQty?: number;       /** Number of entries allowed */
  itemType: string;     /** e.g. "Entry", "Food", "Merchandise" */
  image: string;          /** Image URL for the item */
}

/* -----------------------------------------------------------
   👶 AGE CATEGORY
   Used for dropdown filters or input forms.
   ----------------------------------------------------------- */
export interface AgeCategory {
  ageCode: string;        
  categoryName: string;   
  displayText: string;    
}
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
    MAIN PACKAGE INTERFACE
   Used when displaying package details or list of packages.
   ----------------------------------------------------------- */
//type/packages.ts
export interface Package {
  id: number;             
  PackageName: string;
  PackageType?: string;          
  totalPrice:  number;          
  ageCategory: string;
  nationality: string;       
  effectiveDate: string;      
  lastValidDate: string;        
  durationDays: number;   
  status: string;    
  createdBy: string;      
  createdDate: string;    
  approvedBy?: string;    
  approvedDate?: string;  
  tpremark?: string;      
  financeremark?: string; 

  // Added to make component compile
  packageitems?: PackageItem[];
  imageID?: string;
  dayPass?: string;
}

/* -----------------------------------------------------------
    PACKAGE FORM DATA
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
    PACKAGE ITEM
   Represents a user-selected attraction inside a package.
   ----------------------------------------------------------- */
export interface PackageItem {
  attractionId: number;   
  itemName: string;       
  price?: number;         
  entryQty?: number;       
  itemType: string;     
  image: string;          
}

/* -----------------------------------------------------------
    AGE CATEGORY
   Used for dropdown filters or input forms.
   ----------------------------------------------------------- */
export interface AgeCategory {
  ageCode: string;        
  categoryName: string;   
  displayText: string;    
}

/* -----------------------------------------------------------
    AVAILABLE ATTRACTIONS
   Represents attractions displayed for selection (Page 2).
   ----------------------------------------------------------- */
export interface Attraction {
  id: number;             
  name: string;           
  image: string;          
  description?: string;   
}


/**
 * ----------------------------------------------
 * 📦 Package Types
 * ----------------------------------------------
 * Defines all TypeScript interfaces used for the
 * Package feature in the i-City SuperApp system.
 */

/* -----------------------------------------------------------
    MAIN PACKAGE INTERFACE
   Used when displaying package details or list of packages.
   ----------------------------------------------------------- */
//type/packages.ts
export interface Package {
  id: number;
  name?: string;
  price?: number;
  imageUrl?: string;
  validDays?: number;
  submittedBy?: string;
  remark?: string;       // TP Remark
  remark2?: string;      // Finance Remark
  items?: PackageItem[];
  totalEntryQty?: number;
  point?: number;
  packageType?: string;  // Note: lowercase 'p' in JSON
  
  // Legacy Fields (Maintained for backward compatibility/Forms)
  PackageName?: string;
  PackageType?: string;          
  totalPrice?:  number;          
  ageCategory?: string;
  nationality?: string;       
  effectiveDate?: string;      
  lastValidDate?: string;        
  durationDays?: number;   
  status?: string;    
  createdBy?: string;      
  createdDate?: string;    
  reviewedBy?: string;    
  reviewedDate?: string;  
  tpremark?: string;      
  financeremark?: string; 
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
  // Common Fields
  itemName: string;       
  price?: number;         
  entryQty?: number;       

  // New API Fields
  point?: number;
  nationality?: string;
  category?: string;

  // Legacy Fields
  attractionId?: number;   
  itemType?: string;     
  image?: string;          
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

/* -----------------------------------------------------------
    PACKAGE DUPLICATE RESPONSE (NEW)
   Expected structure from POST /api/package/duplicate
   ----------------------------------------------------------- */
export interface PackageDuplicateResponse {
  message: string;
  newPackageId: number;
}
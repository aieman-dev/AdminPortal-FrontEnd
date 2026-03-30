// type/shared-api.ts

export interface RawAccountDTO {
    accID: number | string;
    email?: string;
    firstName?: string;
    mobileNo?: string;
    createdDate?: string;
    recordStatus?: string;
    transactionHistory?: any[];
}

export interface VerifyUserResponse {
    accId: string | number;
    email: string;
    userName: string;
    mobileNo: string;
}

export interface BasicMessageResponse {
    message?: string;
    error?: string;
    qrId?: number;
    errors?: Record<string, string[]>;
}

export interface PaginatedBackendResponse<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface RawPassDetailDTO {
    qrId?: number;
    accId: number;
    name: string;
    email: string;
    userType?: string;
    cardNo?: string;
    plateNo1?: string;
    plateNo2?: string;
    plateNo3?: string;
    packageId?: number | string;
    packageName?: string;
    effectiveDate?: string;
    expiryDate?: string;
    isLPR?: boolean;
    isHomestay?: boolean;
    isTandem?: boolean;
    isTransfer?: boolean;
    bayNo?: string;
    remarks?: string;
    Message?: string;
    comment?: string;
    staffNo?: string;
    company?: string;
    mobileNo?: string;
    officeNo?: string;
    amanoCardNo?: string;
    createdDate: string;
    createdByName?: string;
    modifiedDate?: string;
    modifiedByName?: string;
    recordStatus?: string;
    seasonStatus?: string;
    seasonLastAccess?: string;
    iPointStatus?: string;
    IPointLastAccess?: string;
    iPointLastAccess?: string; // Capturing both casing variations just in case
}

export interface RawActivePassItemDTO {
    qrId: number;
    accId: number;
    name: string;
    email: string;
    cardNo: string;
    plateNo: string;
    packageName: string;
    expiryDate: string;
    status: string;
    isLPR: boolean;
    staffNo: string;
    unitNo: string;
}

export interface RawCarParkAppListItemDTO {
    applicationId: number;
    accountId: number;
    name: string;
    email: string;
    seasonPackage: string;
    documentUrl: string;
    status: string;
    createdDate: string;
    packageId: number;
}

export interface RawCarParkAppDetailDTO {
    applicationId: number;
    accountId: number;
    name: string;
    ic: string;
    email: string;
    hp: string;
    company: string;
    carPlateNo: string;
    type: string;
    packageId: number;
    packageName: string;
    phaseId: number | null;
    unitId: number | null;
    unitName: string;
    bayNo: string;
    documentUrl: string;
    status: string;
    reason: string;
    createdDate: string;
}

export interface RawStaffListResponse {
    staff: any[]; // You can type this properly later if you have the Staff JSON!
    totalRecords: number;
    pageNumber: number;
}
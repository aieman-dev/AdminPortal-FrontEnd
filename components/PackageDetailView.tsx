// components/PackageDetailView.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Clock, Ticket, Globe, User, FileText, CheckCircle, ArrowLeft, X, Check, Loader2, AlertCircle } from "lucide-react";
import { Package, PackageItem } from "@/type/packages";
import { packageService } from "@/services/package-services"; 
import { ApprovalModal } from "@/components/PackageModals"; 
import { useAuth } from "@/hooks/use-auth";
import { isFinanceApprover } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator"; // Import Separator

// Props: We accept ID and Source from the parent page wrapper
interface PackageDetailViewProps {
  id: string;
  source: "pending" | "active"; // 'active' = Live DB, 'pending' = Request DB
}

// FIX 2.1: Renamed from formatDate to formatDisplayDate (used for Effective Date)
const formatDisplayDate = (dateString: string | undefined) => {
  if (!dateString) return "—";

  // Use the date part to create a date object at the start of the day
  const date = new Date(dateString.split('T')[0]); 
  date.setHours(0, 0, 0, 0);
  
  return date.toLocaleString("en-GB", {
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: '2-digit', // Include time
    minute: '2-digit', // Include time
    hour12: true, // Use 24-hour format
  }).replace(',', ' ');
};

// FIX 2.2: New helper for 3:00 AM next day logic (used for Last Valid Date)
const formatExpiryDateTime = (dateString: string | undefined) => {
  if (!dateString) return "—";
  
  // 1. Get the date part and create a new Date object for the selected day in local context
  const date = new Date(dateString.split('T')[0]); 

  // 2. Advance to the next day
  date.setDate(date.getDate() + 1);
  
  // 3. Set the time to 3:00 AM (local time)
  date.setHours(3, 0, 0, 0);

  // 4. Format to include Date and Time
  return date.toLocaleString("en-GB", {
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true, // Use 24-hour format (03:00)
  }).replace(',', ' '); // Remove comma if toLocaleString adds one
};

// Helper to proxy HTTP images if needed
function getProxiedImageUrl(url: string | null | undefined): string {
  const DEFAULT_IMAGE = "/packages/DefaultPackagesImage.png";
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith("https") || url.startsWith("blob:") || url.startsWith("/")) return url;
  if (url.startsWith("http://")) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  return url;
}

export default function PackageDetailView({ id, source }: PackageDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isFinance = isFinanceApprover(user?.department);
  
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "items">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVisitedItemsTab, setHasVisitedItemsTab] = useState(false);
  
  // Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  

  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;
      try {
        setLoading(true);
        
        // LOGIC: If source is 'pending', we tell the service. 
        // If 'active', we pass undefined (service defaults to main table).
        const apiSource = source === "pending" ? "pending" : undefined;
        
        const data = await packageService.getPackageById(Number(id), apiSource);
        
        if (data) {
          setPackageData(data);
          setRejectionNotes(data.remark2 || "");
        } else {
          toast({
              title: "Error",
              description: "Failed to load package details.",
              variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error:", error);
        toast({
            title: "Error",
            description: "An unexpected error occurred while fetching details.",
            variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id, source]);

  const handleTabChange = (tab: "overview" | "items") => {
    setActiveTab(tab);
    if (tab === "items") {
      setHasVisitedItemsTab(true);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      toast({
          title: "Rejection Required",
          description: "Please provide rejection notes.",
          variant: "default"
      });
      return;
    }
      try {
        setLoading(true); 
        await packageService.updateStatus(packageData!.id, "Rejected", rejectionNotes);
        
        toast({
            title: "Package Rejected",
            description: `Package ID ${packageData!.id} was successfully rejected.`,
            variant: "destructive" // Using destructive for rejection feedback
        });
        setTimeout(() => router.push("/portal/packages"), 1500);
      } catch (error) {
        console.error(error);
        toast({
            title: "Rejection Failed",
            description: "Failed to reject package. Please try again.",
            variant: "destructive"
        });
      } finally {
        setLoading(false);
    }
 };

  const handleApproveClick = () => setIsApprovalModalOpen(true);

  const handleConfirmApprove = async () => {
    setIsApprovalModalOpen(false); 
    try {
        setLoading(true); 
        await packageService.updateStatus(packageData!.id, "Approved");

        toast({
            title: "Package Approved!",
            description: `Package ID ${packageData!.id} is now Active.`,
            variant: "success", 
            duration : 50000
        });
        setTimeout(() => router.push("/portal/packages"), 1500);
        } catch (error) {
        console.error(error);
        toast({
            title: "Approval Failed",
            description: "Failed to approve package. Please check the network.",
            variant: "destructive",
            duration : 50000
        });
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">Package not found.</p>
        <button onClick={() => router.push("/portal/packages")} className="mt-4 text-blue-600 hover:underline">
          Return to List
        </button>
      </div>
    );
  }

  // UI Helpers
  const isPending = packageData.status === "Pending";
  const packageItems: PackageItem[] = packageData.items || packageData.packageitems || [];
  const filteredItems = packageItems.filter((item: PackageItem) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayPrice = packageData.price ?? packageData.totalPrice ?? 0;
  const displayPoints = packageData.point ?? 0;
  const displayImage = getProxiedImageUrl(packageData.imageUrl || packageData.imageID);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-3 mb-4 border-b-2 border-[#E5E7EB] pb-3">
          <button onClick={() => router.push("/portal/packages")} className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {/* Dynamic Title based on Source */}
            {source === 'pending' ? 'Package Request (Pending)' : 'Package Detail'}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {["overview", "items"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as "overview" | "items")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              {tab === "overview" ? "Package Overview" : "Package Items"}
            </button>
          ))}
        </div>

        {/* Tab Content: Overview */}
        {activeTab === "overview" && (
          <div className="flex gap-4 items-start">
            <div className="w-48 flex-shrink-0">
              <img
                src={displayImage}
                alt={packageData.name || packageData.PackageName}
                className="w-full h-[220px] object-cover rounded-xl shadow-md"
                onError={(e) => (e.currentTarget.src = "/packages/DefaultPackagesImage.png")}
              />
            </div>

            <div className="flex-1 space-y-4 ml-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayPrice > 0 ? `RM ${displayPrice.toLocaleString()}` : `${displayPoints} Pts`}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${packageData.status === "Active" ? "bg-green-100 text-green-700" : packageData.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  {packageData.status}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {packageData.name || packageData.PackageName}
              </h3>

              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{formatDisplayDate(packageData.effectiveDate)}</span>
                <span className="text-gray-400">→</span>
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{formatExpiryDateTime(packageData.lastValidDate)}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Ticket className="text-indigo-600 dark:text-indigo-400" size={16} />
                  <span>{packageData.packageType || packageData.PackageType || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="text-indigo-600 dark:text-indigo-400" size={16} />
                  <span>{packageData.nationality ?? "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="text-indigo-600 dark:text-indigo-400" size={16} />
                 <span>{packageData.ageCategory ?? "-" }</span>
                </div>
              </div>

              {/* 🌟 REFINED DISPLAY BLOCK: Submitter, Approver, and Remarks */}
              <div className="space-y-3 pt-2 text-sm">
                  {/* Submitter Info */}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="text-gray-500" size={16} />
                      <span className="font-medium text-gray-900 dark:text-white">
                          {packageData.submittedBy || packageData.createdBy || "N/A"}
                      </span>
                      <span className="text-muted-foreground ml-2"> - Created on </span>
                      <span className="font-medium">
                          {formatDisplayDate(packageData.createdDate)}
                      </span>
                  </div>
                  
                  {/* TP Remark (Submitter's Remark) */}
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <FileText className="text-gray-500 mt-1 flex-shrink-0" size={16} />
                      <span className="flex-1">
                          <span className="font-medium text-gray-900 dark:text-white">Remark: </span>
                          {packageData.remark || packageData.tpremark || "No remarks provided"}
                      </span>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  {/* Approval/Rejection Info (Only show if reviewed) */}
                  {/* FIX: Ensure correct reviewer name and date fallback */}
                  {!isPending && (
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              {packageData.status === 'Active' ? (
                                  <CheckCircle className="text-green-600 dark:text-green-400" size={16} />
                              ) : (
                                  <X className="text-red-600 dark:text-red-400" size={16} />
                              )}
                              
                              <span className="font-medium text-gray-900 dark:text-white">
                                  {/* FIX 1: Use approvedBy for the reviewer, fallback to lastModifiedBy, then System */}
                                  {packageData.reviewedBy || packageData.reviewedDate || "System"} - {packageData.status} 
                              </span>
                              <span className="text-muted-foreground ml-2"> on </span>
                              
                              {/* FIX 2: Use approvedDate or modifiedDate for the timestamp, fallback to '—' */}
                              <span className="font-medium">
                                  {(packageData.reviewedDate && formatDisplayDate(packageData.reviewedDate)) || "—"}
                              </span>
                          </div>
                          
                          {/* Finance Remark (Rejection Reason/Final Note) */}
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                              <FileText className="text-gray-500 mt-1 flex-shrink-0" size={16} />
                              <span className="flex-1">
                                  <span className="font-medium text-gray-900 dark:text-white">Finance Remark: </span>
                                  {packageData.remark2  || (packageData.status === "Rejected" ? "No rejection reason provided." : "N/A")}
                              </span>
                          </div>
                      </div>
                  )}
              </div>
              {/* ---------------------------------------------------- */}

              {/* 🔴 CRITICAL FIX: Action Area Visibility */}
              {/* Only show buttons if Pending AND Finance AND source is requests */}
              {source === "pending" && isFinance && isPending && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-5 mt-5">
                  <div className="flex items-start gap-2 mb-4">
                    <FileText className="text-gray-400 mt-1" size={18} />
                    <textarea
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Enter notes or rejection reason"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white resize-none text-sm text-gray-400"
                      rows={2}
                    />
                  </div>

                  {/* Warning Message */}
                  <div className="flex items-center gap-2 text-gray-500 text-xs mb-4 justify-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>Button becomes available after verifying the package item.</span>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button onClick={handleReject} className="w-[200px] px-5 py-2.5 bg-[#B12133] hover:bg-[#9C0005] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                       Reject
                    </button>
                    <button 
                      onClick={handleApproveClick} 
                      disabled={!hasVisitedItemsTab}
                      className="w-[200px] px-5 py-2.5 bg-[#5B5FEF] hover:bg-[#7C83FF] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Items */}
        {activeTab === "items" && (
          <div>
            <div className="flex justify-end mb-4">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="bg-transparent outline-none flex-1 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                />
                <Search size={18} className="text-gray-400" />
              </div>
            </div>

            <div className="rounded-lg bg-[#ECECEC] p-2">
              {filteredItems.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">
                  No items available.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                  {filteredItems.map((item, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{item.itemName}</span>
                        <span className="text-xs text-gray-400"> </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                          {(item.price ?? 0) > 0 ? `RM ${item.price}` : `${item.point ?? 0} Pts`}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Qty: {item.entryQty ?? 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ApprovalModal 
        isOpen={isApprovalModalOpen}
        onConfirm={handleConfirmApprove}
        onCancel={() => setIsApprovalModalOpen(false)}
      />
    </>
  );
}
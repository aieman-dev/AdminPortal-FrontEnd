// components/PackageDetailView.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Calendar, Clock, Ticket, Globe, User, FileText, 
  CheckCircle, ArrowLeft, X, Check, Loader2 
} from "lucide-react";
import { Package, PackageItem } from "@/type/packages";
import { packageService } from "@/services/package-services"; 
import { ApprovalModal } from "@/components/PackageModals"; 
import { useAuth } from "@/hooks/use-auth";
import { isFinanceApprover } from "@/lib/auth";

// Props: We accept ID and Source from the parent page wrapper
interface PackageDetailViewProps {
  id: string;
  source: "pending" | "active"; // 'active' = Live DB, 'pending' = Request DB
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
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
  
  const [activeTab, setActiveTab] = useState<"overview" | "items">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  
  // Toast State (Simple local implementation for demo)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "warning">("success");

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
          setRejectionNotes(data.remark2 || data.financeremark || "");
        } else {
          showToastNotification("Failed to load package details", "warning");
        }
      } catch (error) {
        console.error("Error:", error);
        showToastNotification("An error occurred while fetching details", "warning");
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id, source]);

  const showToastNotification = (message: string, type: "success" | "warning") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      showToastNotification("Please provide rejection notes", "warning");
      return;
    }
      try {
        setLoading(true); 
        await packageService.updateStatus(packageData!.id, "Rejected", rejectionNotes);
        
        showToastNotification("Package rejected successfully", "success");
        setTimeout(() => router.push("/portal/packages"), 1500);
      } catch (error) {
        console.error(error);
        showToastNotification("Failed to reject package", "warning");
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

        showToastNotification("Package has been approved successfully", "success");
        setTimeout(() => router.push("/portal/packages"), 1500);
        } catch (error) {
        console.error(error);
        showToastNotification("Failed to approve package", "warning");
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
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toastType === "success" ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}`}>
            {toastType === "success" ? <CheckCircle size={20} /> : <X size={20} />}
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        {/* Header Navigation */}
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#E5E7EB] pb-3">
          <button onClick={() => router.push("/portal/packages")} className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {/* Dynamic Title based on Source */}
            {source === 'pending' ? 'Package Request (Pending)' : 'Package Detail'}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {["overview", "items"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "overview" | "items")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              {tab === "overview" ? "Package Overview" : "Package Items"}
            </button>
          ))}
        </div>

        {/* Tab Content: Overview */}
        {activeTab === "overview" && (
          <div className="flex gap-6 items-start">
            <div className="w-64 flex-shrink-0">
              <img
                src={displayImage}
                alt={packageData.name || packageData.PackageName}
                className="w-full h-[300px] object-cover rounded-xl shadow-md"
                onError={(e) => (e.currentTarget.src = "/packages/DefaultPackagesImage.png")}
              />
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {displayPrice > 0 ? `RM ${displayPrice.toLocaleString()}` : `${displayPoints} Pts`}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${packageData.status === "Active" ? "bg-green-100 text-green-700" : packageData.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  {packageData.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {packageData.name || packageData.PackageName}
              </h3>

              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-4">
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{formatDate(packageData.effectiveDate)}</span>
                <span className="text-gray-400">→</span>
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{formatDate(packageData.lastValidDate)}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Ticket className="text-indigo-600 dark:text-indigo-400" size={18} />
                  <span>{packageData.packageType || packageData.PackageType || "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-indigo-600 dark:text-indigo-400" size={18} />
                  <span>{packageData.nationality ?? "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-indigo-600 dark:text-indigo-400" size={18} />
                  <span>{packageData.ageCategory ?? "-"}</span>
                </div>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <User className="text-gray-400" size={18} />
                  <span>{packageData.submittedBy || packageData.createdBy}</span>
                </div>
                <div className="w-10" />
                <div className="flex items-center gap-2">
                  <FileText className="text-gray-400" size={18} />
                  <span>{packageData.remark || packageData.tpremark || "No remarks"}</span>
                </div>
              </div>

              {/* Action Area: Only for Finance & Pending Items */}
              {source === "pending" && isFinance && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <FileText className="text-gray-400 mt-1" size={20} />
                    <textarea
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Enter notes or rejection reason..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleReject} className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      <X size={20} /> Reject
                    </button>
                    <button onClick={handleApproveClick} className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                      <Check size={20} /> Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Items */}
        {activeTab === "items" && (
          <div className="rounded-lg bg-[#ECECEC] p-2">
            <div className="flex justify-end mb-6">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="bg-transparent outline-none flex-1 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <Search size={18} className="text-gray-400" />
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-10">
                No items available.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{item.itemName}</span>
                      {item.category && <span className="text-xs text-gray-400">{item.category}</span>}
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
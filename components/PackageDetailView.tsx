"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Ticket, Globe, User, FileText, CheckCircle, ArrowLeft, X, AlertCircle, SearchX } from "lucide-react";
import { Package, PackageItem } from "@/type/packages";
import { packageService } from "@/services/package-services"; 
import { ApprovalModal } from "@/components/PackageModals"; 
import { useAuth } from "@/hooks/use-auth";
import { isFinanceApprover } from "@/lib/auth";
import { BACKEND_API_BASE } from "@/lib/config";
import { getNationalityLabel } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/formatter";
import { getProxiedImageUrl, formatPackagePrice, isPointPackage } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/portal/empty-state";
import { Separator } from "@/components/ui/separator"; 
import { LoaderState } from "@/components/ui/loader-state"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge";

interface PackageDetailViewProps {
  id: string;
  source: "pending" | "active"; 
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
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const apiSource = source === "pending" ? "pending" : undefined;
        const data = await packageService.getPackageById(Number(id), apiSource);
        
        if (data) {
          setPackageData(data);
          // Standardized field: remark2
          setRejectionNotes(data.remark2 || "");
        } else {
          toast({ title: "Error", description: "Failed to load package details.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error:", error);
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id, source, toast]);

  const handleTabChange = (tab: "overview" | "items") => {
    setActiveTab(tab);
    if (tab === "items") {
      setHasVisitedItemsTab(true);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      toast({ title: "Rejection Required", description: "Please provide rejection notes.", variant: "default" });
      return;
    }
    if (!packageData) return;

    try {
      setLoading(true); 
      // Ensure we use 'packageData.id'
      await packageService.updateStatus(packageData.id, "Rejected", rejectionNotes);
      
      toast({ title: "Package Rejected", description: `Package ID ${packageData.id} rejected.`, variant: "destructive" });
      setTimeout(() => router.push("/portal/packages"), 1500);
    } catch (error) {
      console.error(error);
      toast({ title: "Rejection Failed", description: "Failed to reject package.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
 };

  const handleApproveClick = () => setIsApprovalModalOpen(true);

  const handleConfirmApprove = async () => {
    if (!packageData) return;
    setIsApprovalModalOpen(false); 
    try {
        setLoading(true); 
        await packageService.updateStatus(packageData.id, "Approved");

        toast({ title: "Package Approved!", description: `Package ID ${packageData.id} is now Active.`, variant: "success" });
        setTimeout(() => router.push("/portal/packages"), 1500);
    } catch (error) {
        console.error(error);
        toast({ title: "Approval Failed", description: "Failed to approve package.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return <LoaderState message="Loading package details..." className="min-h-[60vh] border-none bg-transparent" />
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

  // --- UI Helpers ---
  const isPending = packageData.status === "Pending";
  // FIX: Access only 'items' (Service ensures this is populated)
  const packageItems: PackageItem[] = packageData.items || [];
  
  const filteredItems = packageItems.filter((item: PackageItem) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // FIX: Access only 'imageUrl' (Service ensures this is populated)
  const displayImage = getProxiedImageUrl(packageData.imageUrl);
  
  // FIX: Access only 'packageType' (camelCase)
  const pType = (packageData.packageType || 'Entry').toLowerCase();
  const isPoint = pType.includes('point') && !pType.includes('reward');
  
  const primaryValue = isPointPackage(packageData.packageType) 
    ? (packageData.point ?? 0) 
    : (packageData.price ?? 0);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 border-b-2 border-[#E5E7EB] pb-3">
          <button onClick={() => router.push("/portal/packages")} className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
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
                alt={packageData.name}
                className="w-full h-[220px] object-cover rounded-xl shadow-md"
                onError={(e) => (e.currentTarget.src = "/packages/DefaultPackageImage.png")}
              />
            </div>

            <div className="flex-1 space-y-4 ml-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold dark:text-white">
                  <span className="text-[#5B5FEF] dark:text-indigo-500">
                    {/* FIX: Use centralized formatter */}
                    {formatPackagePrice(primaryValue, packageData.packageType)}
                  </span>
                </h2>
                <StatusBadge 
                    status={packageData.status} 
                    className="text-sm px-3 py-1 h-auto rounded-full" 
                />
              </div>
              

              {/* FIX: Use 'name' only */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {packageData.name}
              </h3>

              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{formatDate(packageData.effectiveDate)}</span>
                <span className="text-gray-400">→</span>
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{formatDate(packageData.lastValidDate)}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Ticket className="text-indigo-600 dark:text-indigo-400" size={16} />
                  {/* FIX: Use 'packageType' only */}
                  <span>{packageData.packageType === "RewardP" ? "Reward Point" : (packageData.packageType || "-")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="text-indigo-600 dark:text-indigo-400" size={16} />
                  <span>{getNationalityLabel(packageData.nationality)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="text-indigo-600 dark:text-indigo-400" size={16} />
                 <div className="flex flex-col leading-none">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {packageData.ageCategory ?? "-"}
                      </span>
                      {packageData.ageDescription && (
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {packageData.ageDescription}
                          </span>
                      )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-sm">
                  {/* Submitter Info */}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="text-gray-500" size={16} />
                      {/* FIX: Use 'submittedBy' only */}
                      <span className="font-medium text-gray-900 dark:text-white">
                          {packageData.submittedBy || "N/A"}
                      </span>
                      <span className="text-muted-foreground ml-2"> - Created on </span>
                      <span className="font-medium">
                          {formatDate(packageData.createdDate)}
                      </span>
                  </div>
                  
                  {/* TP Remark */}
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                      <FileText className="text-gray-500 mt-1 flex-shrink-0" size={16} />
                      <span className="flex-1">
                          <span className="font-medium text-gray-900 dark:text-white">Remark: </span>
                          {/* FIX: Use 'remark' only */}
                          {packageData.remark || "No remarks provided"}
                      </span>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  {!isPending && (
                      <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              {packageData.status === 'Active' ? (
                                  <CheckCircle className="text-green-600 dark:text-green-400" size={16} />
                              ) : (
                                  <X className="text-red-600 dark:text-red-400" size={16} />
                              )}
                              
                              <span className="font-medium text-gray-900 dark:text-white">
                                  {packageData.reviewedBy || "System"} - {packageData.status} 
                              </span>
                              <span className="text-muted-foreground ml-2"> on </span>
                              <span className="font-medium">
                                  {(packageData.reviewedDate && formatDate(packageData.reviewedDate)) || "—"}
                              </span>
                          </div>
                          
                          {/* Finance Remark */}
                          <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                              <FileText className="text-gray-500 mt-1 flex-shrink-0" size={16} />
                              <span className="flex-1">
                                  <span className="font-medium text-gray-900 dark:text-white">Finance Remark: </span>
                                  {/* FIX: Use 'remark2' only */}
                                  {packageData.remark2  || (packageData.status === "Rejected" ? "No rejection reason provided." : "N/A")}
                              </span>
                          </div>
                      </div>
                  )}
              </div>

              {source === "pending" && isFinance && isPending && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-5 mt-5">
                  <div className="flex items-start gap-2 mb-4">
                    <FileText className="text-gray-400 mt-1" size={18} />
                    <textarea
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Enter notes or rejection reason"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 dark:bg-gray-700 dark:text-white resize-none text-sm text-gray-900"
                      rows={2}
                    />
                  </div>

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
                <div className="h-full flex items-center justify-center py-10">
                      <EmptyState 
                          icon={SearchX} 
                          title="No items available" 
                          description="This package has no items, or they don't match your search." 
                      />
                  </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                  {filteredItems.map((item, index) => {
                    const itemVal = isPoint ? (item.point || 0) : (item.price || 0);
                    return (
                        <div key={index} className="bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col"><span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{item.itemName}</span><span className="text-xs text-gray-400"> </span></div>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">
                                {/* FIX: Use standardized formatter */}
                                {formatCurrency(itemVal, isPoint)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Qty: {item.entryQty ?? 1}</span>
                        </div>
                        </div>
                    );
                  })}
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
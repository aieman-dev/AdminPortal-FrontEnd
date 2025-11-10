// src/app/(main)/packages/pdetails/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Search, Calendar, Clock, Ticket, Globe, User, FileText, CheckCircle, ArrowLeft, X, Check 
} from "lucide-react";
import { Package, PackageItem } from "@/type/packages";

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "items">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "warning">("success");

  // Load package data from localStorage
  useEffect(() => {
    const packages: Package[] = JSON.parse(localStorage.getItem("packages") || "[]");
    const pkg = packages.find(p => p.id === Number(params.id));
    if (pkg) {
      setPackageData(pkg);
      setRejectionNotes(pkg.financeremark || "");
    }
  }, [params.id]);

  const packageItems: PackageItem[] = packageData?.packageitems  || [];

  const filteredItems = packageItems.filter((item: PackageItem) =>
  item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
);

  const showToastNotification = (message: string, type: "success" | "warning") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleReject = () => {
    if (!rejectionNotes.trim()) {
      showToastNotification("Please provide rejection notes", "warning");
      return;
    }

    const packages: Package[] = JSON.parse(localStorage.getItem("packages") || "[]");
    const updatedPackages = packages.map((p) =>
      p.id === Number(params.id)
        ? { 
            ...p,
            status: "Rejected",
            financeremark: rejectionNotes,
            rejectedDate: new Date().toISOString()
          }
        : p
    );

    localStorage.setItem("packages", JSON.stringify(updatedPackages));
    showToastNotification("Package has been rejected", "warning");

    setTimeout(() => router.push("/packages?tab=pending"), 1500);
  };

  const handleApprove = () => {
    const packages: Package[] = JSON.parse(localStorage.getItem("packages") || "[]");
    const updatedPackages = packages.map((p) =>
      p.id === Number(params.id)
        ? { 
            ...p,
            status: "Active",
            approvedDate: new Date().toISOString()
          }
        : p
    );

    localStorage.setItem("packages", JSON.stringify(updatedPackages));
    showToastNotification("Package has been approved successfully", "success");

    setTimeout(() => router.push("/packages?tab=pending"), 1500);
  };

  if (!packageData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const isPending = packageData.status === "Pending";

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
        {/* Title row */}
        <div className="flex items-center gap-3 mb-6 border-b-2 border-[#E5E7EB] pb-3">
          <button
            onClick={() => router.push("/portal/packages")}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Package Detail</h1>
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

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="flex gap-6 items-start">
            <div className="w-64 flex-shrink-0">
              <img
                src={packageData.image || "/bg/DefaultPackageImage.png"}
                alt={packageData.title}
                className="w-full h-[300px] object-cover rounded-xl shadow-md"
              />
            </div>

            <div className="flex-1 space-y-4">
              {/* Price and Status */}
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  RM {packageData.totalPrice?.toLocaleString() ?? "-"}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${packageData.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300" : packageData.status === "Pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300" : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300"}`}>
                  {packageData.status}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{packageData.title}</h3>

              {/* Dates */}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-4">
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{packageData.startDate ? new Date(packageData.startDate).toLocaleDateString() : "-"}</span>
                <span className="text-gray-400">→</span>
                <Calendar className="text-gray-400" size={16} />
                <span className="font-medium">{packageData.endDate ? new Date(packageData.endDate).toLocaleDateString() : "-"}</span>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <Clock className="text-gray-400" size={16} />
                <span className="font-medium">{packageData.durationDays ?? "-"}</span>
              </div>

              {/* Info Cards */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Ticket className="text-indigo-600 dark:text-indigo-400" size={18} />
                  <span className="text-gray-900 dark:text-white text-sm">{packageData.entryType ?? "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-indigo-600 dark:text-indigo-400" size={18} />
                  <span className="text-gray-900 dark:text-white text-sm">{packageData.nationality ?? "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-indigo-600 dark:text-indigo-400" size={18} />
                  <span className="text-gray-900 dark:text-white text-sm">{packageData.ageCategory ?? "-"}</span>
                </div>
              </div>

              {/* Creator / Remark */}
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <User className="text-gray-400" size={18} />
                  <span>{packageData.createdBy}</span>
                </div>
                <div className="w-10" />
                <div className="flex items-center gap-2">
                  <FileText className="text-gray-400" size={18} />
                  <span>{packageData.tpremark ?? "-"}</span>
                </div>
              </div>

              {/* Approval Info */}
              {packageData.status === "Active" && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 mb-6">
                  <CheckCircle className="text-green-600" size={18} />
                  <span>{packageData.approvedBy ?? "-"}</span>
                </div>
              )}

              {/* Notes / Rejection */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="text-gray-400 mt-1" size={20} />
                  <div className="flex-1">
                    {isPending ? (
                      <textarea
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                        placeholder="Enter notes or rejection reason..."
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{packageData.tpremark ?? "No notes provided"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="flex gap-3 pt-6">
                  <button onClick={handleReject} className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <X size={20} /> Reject
                  </button>
                  <button onClick={handleApprove} className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                    <Check size={20} /> Approve / Proceed
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Package Items Tab */}
        {activeTab === "items" && (
          <div className="rounded-lg bg-[#ECECEC] p-2">
            {/* Search */}
            <div className="flex justify-end mb-6">
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="bg-transparent outline-none flex-1 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <Search size={18} className="text-gray-400" />
              </div>
            </div>

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-10">
                No items available for this package.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredItems.map((item: PackageItem, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{item.itemName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{item.price ?? "-"}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">{item.entryQty ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

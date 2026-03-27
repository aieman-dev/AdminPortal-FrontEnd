"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
    Search, Clock, Ticket, Globe, User, FileText, 
    CheckCircle2, ArrowLeft, AlertCircle, SearchX, 
    ShieldCheck, ListFilter, LayoutGrid, History
} from "lucide-react";
import { Package, PackageItem } from "@/type/packages";
import { packageService } from "@/services/package-services"; 
import { ApprovalModal, ConfirmationModal } from "@/components/modules/packages/PackageModals"; 
import { useAuth } from "@/hooks/use-auth";
import { isFinanceApprover } from "@/lib/auth";
import { getNationalityLabel, getPackageTypeLabel } from "@/lib/constants"
import { formatDate, getTimeDisplay, formatCurrency, isPointPackage } from "@/lib/formatter";
import { getProxiedImageUrl } from "@/lib/utils";
import { useAppToast } from "@/hooks/use-app-toast";
import { Separator } from "@/components/ui/separator"; 
import { StatusBadge } from "@/components/shared-components/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";
import Image from "next/image";

interface PackageDetailViewProps {
  id: string;
  source: "pending" | "active"; 
}

const DetailSkeleton = () => (
  <div className="flex flex-col h-[calc(100dvh-64px)] w-full max-w-[1600px] mx-auto overflow-hidden bg-background">
    <div className="flex-shrink-0 border-b px-4 py-3 bg-background/95">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1.5">
           <Skeleton className="h-5 w-48" />
           <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
    <div className="flex-1 min-h-0 bg-muted/5 px-6 pb-6 pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
        <div className="lg:col-span-3 h-full flex flex-col">
           <div className="bg-card rounded-xl border h-full flex flex-col overflow-hidden">
              <Skeleton className="h-36 w-full rounded-none shrink-0" />
              <div className="p-4 space-y-4 flex-1 flex flex-col">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
                 <div className="mt-auto">
                    <Skeleton className="h-10 w-full rounded-md" />
                 </div>
              </div>
           </div>
        </div>
        <div className="lg:col-span-9 h-full flex flex-col">
           <div className="bg-card rounded-xl border h-full flex flex-col overflow-hidden">
              <div className="border-b px-3 py-2 bg-muted/10">
                 <Skeleton className="h-8 w-64 rounded-md" />
              </div>
              <div className="p-4 space-y-4 flex-1">
                 <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-32 rounded-xl col-span-2" />
                    <Skeleton className="h-32 rounded-xl col-span-1" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-40 rounded-xl" />
                    <Skeleton className="h-40 rounded-xl" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
);

export default function PackageDetailView({ id, source }: PackageDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isFinance = isFinanceApprover(user?.department);
  const toast = useAppToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isExpiringWarningOpen, setIsExpiringWarningOpen] = useState(false);

  const [isDenseView, setIsDenseView] = useState(true);

  // --- 1. DISABLE GLOBAL SCROLL ON MOUNT ---
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    //  Create the controller
    const controller = new AbortController();
    
    const fetchPackage = async () => {
      if (!id) return;
      try {
        setLoading(true);
        //  Pass the signal to your service
        const apiSource = source === "pending" ? "pending" : undefined;
        const data = await packageService.getPackageById(Number(id), apiSource, { 
            signal: controller.signal 
        });
        
        //  Only update state if the request wasn't aborted
        if (!controller.signal.aborted) {
            if (data) {
            setPackageData(data);
            setRejectionNotes(data.remark2 || "");
            } else {
            toast.error("Error", "Failed to load package details.");
            }
        }
      } catch (error:any) {
        if (error.name === 'AbortError') {
            logger.info(`Fetch aborted for package ${id}`);
            return; 
        }
        logger.error("Error:", { error });
        toast.error("Error", "An unexpected error occurred.");
      } finally {
        if (!controller.signal.aborted) {
            setLoading(false);
        }
      }
    };
    fetchPackage();

    // Abort the request when the component unmounts
    return () => {
        controller.abort();
    };
  }, [id, source]); 

  const handleAttemptApproval = () => {
      if (!packageData) return;

      const expiry = new Date(packageData.lastValidDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      expiry.setHours(23,59,59,999);

      if (expiry < today) {
          toast.error("Cannot Approve", "This package's Last Valid Date has already passed.");
          return;
      }

      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
          setIsExpiringWarningOpen(true);
      } else {
          setIsApprovalModalOpen(true);
      }
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      toast.info("Rejection Required", "Please provide rejection notes.");
      return;
    }
    if (!packageData) return;

    try {
      setLoading(true); 
      await packageService.updateStatus(packageData.id, "Rejected", rejectionNotes);
      toast.error("Package Rejected", `Package ID ${packageData.id} rejected.`);
      setTimeout(() => router.push("/portal/packages"), 1500);
    } catch (error) {
      toast.error("Rejection Failed", "Failed to reject package.");
    } finally {
      setLoading(false);
    }
 };

  const handleConfirmApprove = async () => {
    if (!packageData) return;
    setIsApprovalModalOpen(false); 
    setIsExpiringWarningOpen(false);
    try {
        setLoading(true); 
        await packageService.updateStatus(packageData.id, "Approved");
        toast.success("Package Approved!", `Package ID ${packageData.id} is now Active.`);
        logger.info("Package Approved by User", { packageId: packageData.id })
        setTimeout(() => router.push("/portal/packages"), 1500);
    } catch (error: any) {
        toast.error("Approval Failed", "Failed to approve package.");
        logger.error("Package Approval Failed", { packageId: packageData.id, error });
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />
  if (!packageData) return <div className="p-8 text-center text-red-500">Package not found.</div>;

  const isPending = packageData.status === "Pending";
  const packageItems: PackageItem[] = packageData.items || [];
  const filteredItems = packageItems.filter((item) => item.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
  const displayImage = getProxiedImageUrl(packageData.imageUrl);
  const primaryValue = isPointPackage(packageData.packageType) ? (packageData.point ?? 0) : (packageData.price ?? 0);
  const isActionable = source === "pending" && isFinance && isPending;

  return (
    // FIX: INCREASED HEIGHT (-100px instead of -120px)
    <div className="flex flex-col h-auto md:h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-visible md:overflow-hidden bg-background">
      
      {/* 1. HEADER */}
      <div className="sticky top-0 md:relative flex-shrink-0 flex items-center justify-between border-b px-4 py-3 bg-background/95 backdrop-blur z-20 shadow-sm md:shadow-none">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.push("/portal/packages")} className="rounded-full h-8 w-8 bg-background hover:bg-muted shadow-sm">
                <ArrowLeft size={16} />
             </Button>
             <div className="min-w-0">
                 <div className="flex items-center gap-2">
                    <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground truncate max-w-[200px] md:max-w-none">{packageData.name}</h1>
                    <StatusBadge status={packageData.status} className="px-1.5 py-0.5 text-[9px] md:text-[10px] uppercase tracking-wider shrink-0" />
                 </div>
                 <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                    <span>#{packageData.id}</span>
                 </div>
             </div>
          </div>
      </div>

      {/* 2. CONTENT WRAPPER - FIX 2: Reduced Padding (pb-2 instead of pb-6) to give more room for content */}
      <div className="flex-1 min-h-0 bg-muted/5 px-4 md:px-6 pb-2 pt-4 overflow-visible md:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto md:h-full">
            
            {/* === LEFT PANEL === */}
            <div className="lg:col-span-3 h-full flex flex-col min-h-0">
                <div className="flex flex-col h-full bg-card rounded-xl shadow-sm border ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                        
                        {/* IMAGE */}
                        <div className="relative h-48 md:h-36 w-full bg-muted shrink-0 group overflow-hidden">
                            <img 
                                src={displayImage} 
                                alt="Package" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                onError={(e) => (e.currentTarget.src = "/packages/DefaultPackageImage.png")}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />
                            <div className="absolute bottom-2.5 left-3 text-white">
                                <p className="text-[10px] font-medium uppercase tracking-wider opacity-80 mb-0.5">Total Value</p>
                                <p className="text-3xl font-bold leading-none tracking-tight">
                                    {formatCurrency(primaryValue, packageData.packageType)}
                                </p>
                            </div>
                        </div>

                        {/* LEFT SCROLLABLE AREA */}
                        {/* FIX 3: Removed 'gap-4' and adjusted padding to be more compact */}
                        <div className="flex-1 overflow-visible md:overflow-y-auto p-4 flex flex-col gap-3 scrollbar-hide">
                            
                            {/* Attributes */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center border-b pb-1.5">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wide"><Ticket className="w-3.5 h-3.5" /> Package Type</span>
                                    <span className="font-semibold text-sm">{getPackageTypeLabel(packageData.packageType)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-1.5">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wide"><Globe className="w-3.5 h-3.5" /> Nationality</span>
                                    <span className="font-semibold text-sm">{getNationalityLabel(packageData.nationality)}</span>
                                </div>
                                <div className="col-span-2 space-y-1 pt-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Age Category</span>
                                    <div className="font-medium">{packageData.ageCategory}</div>
                                    {packageData.ageDescription && (
                                         <div className="text-xs text-muted-foreground bg-muted/50 p-1.5 rounded">
                                            {packageData.ageDescription}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Action Bar - FIX 4: Sticky at bottom of THIS container */}
                            {isActionable && (
                                <div className="mt-auto space-y-2 pt-2 sticky bottom-0 bg-card z-10 pb-1">
                                    <LoadingButton 
                                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white font-semibold" 
                                        onClick={handleAttemptApproval}
                                        isLoading={loading}
                                        loadingText="Approving..."
                                        icon={CheckCircle2}
                                    >
                                        Approve
                                    </LoadingButton>
                                    
                                    <div className="bg-red-50 dark:bg-red-900/10 p-2.5 rounded-lg space-y-2 border border-red-100 dark:border-red-900/30">
                                        <span className="text-[10px] font-bold text-red-700 flex items-center gap-1 uppercase tracking-wide">
                                            <AlertCircle className="w-3 h-3" /> Rejection Reason
                                        </span>
                                        <Textarea 
                                            placeholder="Reason..." 
                                            className="min-h-[50px] text-sm resize-none bg-white dark:bg-black/20 border-red-200 focus-visible:ring-red-500"
                                            value={rejectionNotes}
                                            onChange={(e) => setRejectionNotes(e.target.value)}
                                        />
                                        <Button variant="destructive" size="sm" className="w-full h-8 text-xs" onClick={handleReject}>
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                </div>
            </div>

            {/* === RIGHT PANEL: Tabs === */}
            <div className="lg:col-span-9 h-auto md:h-full flex flex-col min-h-0 pb-2 md:pb-0">
                <div className="flex flex-col h-auto md:h-full bg-card rounded-xl border shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                    <Tabs defaultValue="overview" className="flex flex-col h-full w-full">
                        
                        <div className="flex-shrink-0 border-b px-4 py-2 bg-muted/10 flex justify-between items-center">
                            <TabsList className="bg-muted/50 p-1 h-9 border shadow-sm w-full md:w-auto grid grid-cols-2 md:flex">
                                <TabsTrigger value="overview" className="px-4 text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">Package Overview</TabsTrigger>
                                <TabsTrigger value="items" className="px-4 text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
                                    Package Items 
                                    <Badge variant="secondary" className="ml-2 h-4 px-1 bg-background/50 border text-current text-[10px]">{packageItems.length}</Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                       <div className="flex-1 overflow-visible md:overflow-y-auto p-4 md:p-3 bg-muted/5 pb-6 scrollbar-hide">
                            <TabsContent value="overview" className="mt-0 flex flex-col gap-3">
                                {/* Validity & Audit */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Validity Card */}
                                    <Card className="col-span-1 md:col-span-2 shadow-none border flex flex-col">
                                        <CardHeader className="py-2 px-3 border-b bg-muted/20">
                                            <CardTitle className="text-xs font-semibold flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-indigo-500"/> Validity Period</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3">
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="text-center md:text-left border-r last:border-0 pr-2">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Effective</span>
                                                    <div className="text-sm font-semibold">{formatDate(packageData.effectiveDate)}</div>
                                                    <div className="text-xs text-muted-foreground bg-muted/50 p-1.5 rounded mt-1 inline-block">{getTimeDisplay(packageData.effectiveDate) || "12:00 am"}</div>
                                                </div>
                                                <div className="text-center md:text-left border-r last:border-0 pr-2 pl-2">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Last Valid Date</span>
                                                    <div className="text-sm font-semibold">{formatDate(packageData.lastValidDate)}</div>
                                                    <div className="text-xs text-muted-foreground bg-muted/50 p-1.5 rounded mt-1 inline-block">{getTimeDisplay(packageData.lastValidDate) || "12:00 am"}</div>
                                                </div>
                                                <div className="text-center md:text-left border-r last:border-0 pr-2 pl-2">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Duration</span>
                                                    <div className="text-sm font-semibold">{packageData.durationDays} Days</div>
                                                </div>
                                                <div className="text-center md:text-left pl-2">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1">Day Pass</span>
                                                    <div className="text-sm font-semibold">{packageData.dayPass || "-"}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    {/* Audit Card */}
                                    <Card className="col-span-1 shadow-none border flex flex-col">
                                        <CardHeader className="py-2 px-3 border-b bg-muted/20">
                                            <CardTitle className="text-xs font-semibold flex items-center gap-2"><History className="w-3.5 h-3.5 text-slate-500"/> Package History</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 flex flex-col gap-2 justify-center flex-1">
                                            <div className="flex justify-between items-start text-xs">
                                                <span className="text-muted-foreground font-medium mt-0.5">Created By</span>
                                                <div className="text-right">
                                                    <div className="font-bold text-foreground text-sm">{packageData.submittedBy}</div>
                                                    <div className="text-[10px] text-muted-foreground">{formatDate(packageData.createdDate)}</div>
                                                </div>
                                            </div>
                                            <Separator className="bg-border/60" />
                                            <div className="flex justify-between items-start text-xs">
                                                <span className="text-muted-foreground font-medium mt-0.5">Reviewed By</span>
                                                <div className="text-right">
                                                    <div className="font-bold text-foreground text-sm">{packageData.reviewedBy || "-"}</div>
                                                    <div className="text-[10px] text-muted-foreground">{packageData.reviewedDate ? formatDate(packageData.reviewedDate) : "-"}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Remarks */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Card className="shadow-none border border-blue-200/60 dark:border-blue-900/30 flex flex-col">
                                        <CardHeader className="py-2 px-3 border-b bg-blue-50/50 dark:bg-blue-900/10">
                                            <CardTitle className="text-xs font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400 uppercase tracking-wide"><FileText className="w-3.5 h-3.5" /> Themepark Remark</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3"><p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">{packageData.remark || "No remarks provided."}</p></CardContent>
                                    </Card>
                                    <Card className="shadow-none border border-amber-200/60 dark:border-amber-900/30 flex flex-col">
                                        <CardHeader className="py-2 px-3 border-b bg-amber-50/50 dark:bg-amber-900/10">
                                            <CardTitle className="text-xs font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400 uppercase tracking-wide"><ShieldCheck className="w-3.5 h-3.5" /> Finance remark</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3"><p className={`text-sm leading-relaxed whitespace-pre-wrap font-medium ${packageData.remark2 ? "text-foreground" : "text-muted-foreground"}`}>{packageData.remark2 || "No remark yet."}</p></CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="items" className="mt-0 flex flex-col">
                                <div className="flex gap-2 mb-3 shrink-0">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Filter items..." className="pl-8 h-8 bg-background border shadow-sm text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                    <div className="flex bg-background rounded-lg border p-0.5 gap-0.5 h-8 items-center shadow-sm">
                                        <Button variant="ghost" size="icon" className={`h-6 w-7 rounded-md ${isDenseView ? 'bg-muted shadow-sm' : ''}`} onClick={() => setIsDenseView(true)} title="Grid"><LayoutGrid className="w-3.5 h-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className={`h-6 w-7 rounded-md ${!isDenseView ? 'bg-muted shadow-sm' : ''}`} onClick={() => setIsDenseView(false)} title="List"><ListFilter className="w-3.5 h-3.5" /></Button>
                                    </div>
                                </div>
                                {filteredItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/10 h-32"><SearchX className="h-8 w-8 text-muted-foreground/30 mb-2" /><p className="text-xs text-muted-foreground">No items found.</p></div>
                                ) : (
                                    <div className={`grid gap-2.5 ${isDenseView ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                                        {filteredItems.map((item, index) => {
                                            const itemVal = isPointPackage(packageData.packageType) ? (item.point || 0) : (item.price || 0);
                                            return isDenseView ? (
                                                <div key={index} className="group flex flex-col p-2.5 rounded-lg border bg-background hover:border-indigo-500/50 hover:shadow-sm transition-all duration-200">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <Badge variant="outline" className="h-4 px-1.5 font-mono text-[10px] bg-muted/50 border-transparent group-hover:bg-indigo-50 group-hover:text-indigo-700">x{item.entryQty || 1}</Badge>
                                                        <span className="text-[10px] font-mono text-muted-foreground/50">#{item.attractionId}</span>
                                                    </div>
                                                    <div className="font-semibold text-sm leading-tight line-clamp-2 mb-2 min-h-[2.4em] group-hover:text-indigo-700 transition-colors">{item.itemName}</div>
                                                    <div className="mt-auto pt-2 border-t border-dashed border-border/60 flex justify-between items-center">
                                                        <span className="text-[10px] text-muted-foreground uppercase font-medium">Unit Price</span>
                                                        <span className="font-bold text-sm">{formatCurrency(itemVal, isPointPackage(packageData.packageType))}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div key={index} className="flex items-center justify-between p-2.5 rounded-lg border bg-background hover:border-indigo-200 hover:shadow-sm transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">{item.entryQty || 1}x</div>
                                                        <div>
                                                            <div className="font-semibold text-sm text-foreground">{item.itemName}</div>
                                                            <div className="text-[10px] text-muted-foreground flex gap-2"><span className="font-mono">ID: {item.attractionId}</span>{item.category && <span>• {item.category}</span>}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right"><div className="font-bold text-sm">{formatCurrency(itemVal, isPointPackage(packageData.packageType))}</div></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
      </div>

      <ApprovalModal 
        isOpen={isApprovalModalOpen}
        onConfirm={handleConfirmApprove}
        onCancel={() => setIsApprovalModalOpen(false)}
      />

      <ConfirmationModal 
        isOpen={isExpiringWarningOpen} 
        variant="warning"
        title="Expiring Soon!"
        description={
            <div className="space-y-2">
                <p>This package will expire in less than 7 days ({formatDate(packageData.lastValidDate)}).</p>
                <p className="font-semibold">Are you sure you want to approve it anyway?</p>
            </div>
        }
        confirmLabel="Yes, Approve"
        onConfirm={handleConfirmApprove} 
        onCancel={() => setIsExpiringWarningOpen(false)} 
      />
    </div>
  );
}
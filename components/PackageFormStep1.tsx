// components/PackageFormStep1.tsx
import React, { useEffect, useState, useRef } from "react";
import { Calendar, X, Search, ChevronDown, Check, ImageIcon, Loader2, Eye } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PackageFormData } from "../type/packages";
import { packageService } from "@/services/package-services"
import { getAuthToken } from "@/lib/auth";
import { BACKEND_API_BASE } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

type Props = {
  form: PackageFormData;
  setForm: (f: PackageFormData | ((prev: PackageFormData) => PackageFormData)) => void;
  onNext: () => void;
};

interface ImageOption{
  id : string;
  name : string;
  url : string;
}

// HELPER: Convert Date to simple YYYY-MM-DD string using Local Time
const convertDateForSubmission = (date: Date): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_IMAGE = "/packages/DefaultPackageImage.png";
const IMAGE_ASSET_API_PATH = "api/Package/image-asset?id=";

function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith("https") || url.startsWith("blob:") || url.startsWith("/packages/")) return url;
  
  let targetUrl = url;
  if (url.startsWith(BACKEND_API_BASE) || url.startsWith("http://")) {
    targetUrl = url;
  } else if (url.startsWith("/")) {
    targetUrl = `${BACKEND_API_BASE}${url}`;
  } else if (url.length > 0 && !url.includes('/')) {
    targetUrl = `${BACKEND_API_BASE}/${IMAGE_ASSET_API_PATH}${url}`;
  } else {
      return DEFAULT_IMAGE;
  }
  
  if (targetUrl.startsWith(BACKEND_API_BASE) || targetUrl.startsWith("http://")) {
    return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
  }
  return DEFAULT_IMAGE;
}

const PackageFormStep1: React.FC<Props> = ({ form, setForm, onNext }) => {
  const { toast } = useToast();
  const [ageOptions, setAgeOptions] = useState<{ value: string; label: string }[]>([]);
  const [imageOptions, setImageOptions] = useState<ImageOption[]>([]);
  
  // Separate Loading States
  const [loadingAges, setLoadingAges] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isImageDropdownOpen, setIsImageDropdownOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // NEW: State to track if validation errors should be shown (triggered on click)
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const fetchCreationData = async () => {
      setLoadingAges(true);
      try {
        const authToken = getAuthToken();
        const res = await fetch("/api/proxy-create-package/creationdata", {
          method: "GET",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const categories = data.ageCategories || [];

          setAgeOptions(categories.map((c: any) => {
            const description = c.description ? ` (${c.description})` : "";
            return { 
                value: c.displayText, // Keep value clean: "A1 - Adult"
                label: `${c.displayText}${description}`
                };
          }));
        }
      } catch (err) { console.error("Failed to load age categories", err); } 
      finally { setLoadingAges(false); }
    };
    fetchCreationData();
  }, []);

  //Fetch Images (NEW SEPARATE API CALL)
  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const { images, totalRecords } = await packageService.searchImages(1, 1000);

        console.log(`Loaded ${images.length} images. Total on server: ${totalRecords}`);
        
        const mappedImages = images.map((img: any) => ({
             id: String(img.imageID), 
             name: img.fileName || "Untitled Image",
             url: getProxiedImageUrl(img.imgUrl) 
        }));

        setImageOptions(mappedImages);
      } catch (err) { 
        console.error("Failed to load images", err); 
        toast({ title: "Error", description: "Failed to load image library.", variant: "destructive" });
      } finally { 
        setLoadingImages(false); 
      }
    };
    
    fetchImages();
  }, []);

  // Handle Image Preview Updates
  useEffect(() => {
    if (typeof form.imageID === "string" && form.imageID) {
      const selectedImg = imageOptions.find(i => i.id === form.imageID);
      if (selectedImg) {
        setImagePreviewUrl(selectedImg.url);
        // Only override search query if it is empty (initial load)
        if (!imageSearchQuery) setImageSearchQuery(selectedImg.name);
      } else {
        setImagePreviewUrl(getProxiedImageUrl(form.imageID));
      }
    } else {
      setImagePreviewUrl(null);
    }
  }, [form.imageID, imageOptions]); 

  // Click Outside Handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsImageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MODIFIED: Save imageUrl to form state ---
  const handleSelectImage = (image: ImageOption) => {
    setForm({ 
        ...form, 
        imageID: image.id,
        imageUrl: image.url // Save the working proxy URL
    }); 
    setIsImageDropdownOpen(false);
  };

  // --- MODIFIED: Clear imageUrl from form state ---
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setForm(prev => ({ 
        ...prev, 
        imageID: null,
        imageUrl: undefined // Clear the URL
    }));
    setImagePreviewUrl(null);
    setIsImageDropdownOpen(true);
  };

  const filteredImages = imageOptions.filter(img => 
    img.name.toLowerCase().includes(imageSearchQuery.toLowerCase()) ||
    img.url.toLowerCase().includes(imageSearchQuery.toLowerCase())
  );

  // VALIDATION LOGIC
  const handleNextClick = () => {
      setShowErrors(true);
      const missingFields = [];
      if (!form.packageName?.trim()) missingFields.push("Package Name");
      if (!form.packageType) missingFields.push("Package Type");
      if (!form.nationality) missingFields.push("Nationality");
      if (!form.ageCategory) missingFields.push("Age Category");
      if (!form.effectiveDate) missingFields.push("Effective Date");
      if (!form.lastValidDate) missingFields.push("Last Valid Date");
      if (!form.dayPass?.trim()) missingFields.push("Day Pass");
      if (!form.tpremark?.trim()) missingFields.push("Remark");

      if (missingFields.length > 0) {
          toast({
              title: "Missing Information",
              description: `Please fill in all required fields.`,
              variant: "destructive"
          });
          return;
      }
      onNext();
  };

  const getInputClass = (value: string | null | undefined) => {
    const baseClass = "w-full rounded-md px-3 py-2 text-sm bg-white dark:bg-secondary/20 text-foreground dark:text-gray-100 outline-none placeholder:text-muted-foreground transition-all border";
    const isValid = value && value.trim() !== "";
    if (showErrors && !isValid) {
        return `${baseClass} border-red-500 focus:ring-2 focus:ring-red-500/50`;
    }
    return `${baseClass} border-input dark:border-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent`;
  };

  return (
    <div className="flex-1 text-foreground">
      <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">1. Package Details</h2>
      <div className="border-b border-border dark:border-white/10 mb-6 scrollbar-hide" />

      <div className="grid grid-cols-2 gap-8">
        {/* ... (Fields for Name, Type, Nationality, Age, Dates, Day Pass - No changes here) ... */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Package Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.packageName} onChange={(e) => setForm({ ...form, packageName: e.target.value })} className={getInputClass(form.packageName)} placeholder="Enter package name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Package Type <span className="text-red-500">*</span></label>
          <select value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value })} className={getInputClass(form.packageType)}>
            <option value="" className="dark:bg-gray-900">Select Type</option>
            <option value="Entry" className="dark:bg-gray-900">Entry</option>
            <option value="Point" className="dark:bg-gray-900">Point</option>
            <option value="RewardP" className="dark:bg-gray-900">Reward Point</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Nationality <span className="text-red-500">*</span></label>
          <select value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className={getInputClass(form.nationality)}>
            <option value="" className="dark:bg-gray-900">Select Nationality</option>
            <option value="L" className="dark:bg-gray-900">Malaysian</option>
            <option value="F" className="dark:bg-gray-900">International</option>
            <option value="All" className="dark:bg-gray-900">All</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Age Category <span className="text-red-500">*</span></label>
          <select value={form.ageCategory} onChange={(e) => setForm({ ...form, ageCategory: e.target.value })} disabled={loadingAges} className={`${getInputClass(form.ageCategory)} disabled:opacity-50`}>
            <option value="">{loadingAges ? "Loading..." : "Select Age Category"}</option>
            {ageOptions.map((opt, idx) => (<option key={idx} value={opt.value} className="dark:bg-gray-900">{opt.label}</option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Effective Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <DatePicker selected={form.effectiveDate ? new Date(form.effectiveDate) : null} onChange={(date) => setForm({ ...form, effectiveDate: date ? convertDateForSubmission(date) : "" })} dateFormat="dd/MM/yyyy" className={`${getInputClass(form.effectiveDate)} pl-10 cursor-pointer`} placeholderText="Select Date" minDate={new Date()} />
            <Calendar className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Last Valid Date <span className="text-red-500">*</span></label>
          <div className="relative">
            <DatePicker selected={form.lastValidDate ? new Date(form.lastValidDate) : null} onChange={(date) => setForm({ ...form, lastValidDate: date ? convertDateForSubmission(date) : "" })} dateFormat="dd/MM/yyyy" className={`${getInputClass(form.lastValidDate)} pl-10 cursor-pointer`} placeholderText="Select Date" minDate={form.effectiveDate ? new Date(form.effectiveDate) : new Date()} />
            <Calendar className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Day Pass <span className="text-red-500">*</span></label>
          <input type="text" value={form.dayPass || ""} onChange={(e) => setForm({ ...form, dayPass: e.target.value })} className={getInputClass(form.dayPass)} placeholder="e.g. 1 Day" />
        </div>

        {/* IMAGE SEARCHABLE DROPDOWN */}
        <div className="col-span-2 space-y-3" ref={dropdownRef}>
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Package Image</label>
          
          <div className="flex flex-col gap-4">
             <div className="relative">
                <div className="relative">
                    <input 
                        type="text"
                        value={imageSearchQuery}
                        onChange={(e) => {
                            setImageSearchQuery(e.target.value);
                            setIsImageDropdownOpen(true);
                        }}
                        onFocus={() => setIsImageDropdownOpen(true)}
                        placeholder="Search image database..."
                        className={`${getInputClass(form.imageID as string)} pl-10 pr-10`}
                    />
                    <Search className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" size={18} />
                    {loadingImages ? (
                       <Loader2 className="absolute right-3 top-2.5 text-indigo-500 animate-spin" size={18} />
                    ) : (
                       <ChevronDown className={`absolute right-3 top-2.5 text-muted-foreground pointer-events-none transition-transform ${isImageDropdownOpen ? "rotate-180" : ""}`} size={18} />
                    )}
                </div>

                {isImageDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                        {loadingImages ? (
                            <div className="p-4 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                               <Loader2 className="h-5 w-5 animate-spin" />
                               <span>Loading images...</span>
                            </div>
                        ) : filteredImages.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No images found.</div>
                        ) : (
                            filteredImages.map((img) => (
                                <div 
                                    key={img.id}
                                    onClick={() => handleSelectImage(img)}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                                >
                                    <HoverCard openDelay={200} closeDelay={100}>
                                        <HoverCardTrigger asChild>
                                            <img src={img.url} alt={img.name} className="w-10 h-10 rounded object-cover bg-gray-100 border border-gray-200 cursor-zoom-in" />
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-64 p-0 border-none bg-transparent shadow-none" side="right" align="start" sideOffset={20}>
                                            <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-white dark:border-gray-600">
                                                <img src={img.url} alt={img.name} className="w-full h-auto object-cover bg-black" />
                                                <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-white text-xs font-medium truncate">
                                                    {img.name}
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>

                                    <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 font-medium truncate">{img.name}</span>
                                    {form.imageID === img.id && <Check size={16} className="text-indigo-600" />}
                                </div>
                            ))
                        )}
                    </div>
                )}
             </div>

             {/* Selected Preview Area */}
             {imagePreviewUrl && (
                 <div className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                        <DialogTrigger asChild>
                            <div className="relative group cursor-zoom-in">
                                <img src={imagePreviewUrl} alt="Selected" className="w-24 h-24 object-cover rounded-md border border-gray-200 dark:border-gray-600 bg-white" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                    <Eye className="text-white w-6 h-6 drop-shadow-md" />
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl w-auto p-0 bg-transparent border-none shadow-none">
                            <DialogTitle className="sr-only">Selected Image Preview</DialogTitle>
                            <img src={imagePreviewUrl} alt="Full Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                        </DialogContent>
                    </Dialog>

                    <div className="flex flex-col justify-between h-24 py-1">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Selected Image</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                                {imageOptions.find(i => i.id === form.imageID)?.name || "Custom Image"}
                            </p>
                        </div>
                        <button type="button" onClick={handleRemoveImage} className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 font-medium hover:underline">
                            <X size={14} /> Remove
                        </button>
                    </div>
                 </div>
             )}

             {!imagePreviewUrl && !isImageDropdownOpen && (
                 <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <ImageIcon size={14} />
                    <span>Search and select an image from the database.</span>
                 </div>
             )}
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-foreground/80 dark:text-gray-300 mb-1">Remark <span className="text-red-500">*</span></label>
          <textarea value={form.tpremark || ""} onChange={(e) => setForm({ ...form, tpremark: e.target.value })} className={`${getInputClass(form.tpremark)} resize-none`} rows={3} placeholder="Add remarks" />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={handleNextClick} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md font-medium">Next</button>
      </div>
    </div>
  );
};

export default PackageFormStep1;
// components/PackageFormStep1.tsx
import React, { useEffect, useState, useRef } from "react";
import { Search, X, ChevronDown, Check, ImageIcon, Loader2, Eye, AlertCircle } from "lucide-react";
import { PackageFormData } from "../type/packages";
import { packageService } from "@/services/package-services"
import { getAuthToken } from "@/lib/auth";
import { BACKEND_API_BASE } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
// 1. IMPORT SHADCN SELECT
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  const [loadingAges, setLoadingAges] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isImageDropdownOpen, setIsImageDropdownOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
          setAgeOptions(categories.map((c: any) => ({ 
              value: c.displayText, 
              label: `${c.displayText}${c.description ? ` (${c.description})` : ""}`
          })));
        }
      } catch (err) { console.error("Failed to load age categories", err); } 
      finally { setLoadingAges(false); }
    };
    fetchCreationData();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const { images } = await packageService.searchImages(1, 1000);
        const mappedImages = images.map((img: any) => ({
             id: String(img.imageID), 
             name: img.fileName || "Untitled Image",
             url: getProxiedImageUrl(img.imgUrl) 
        }));
        setImageOptions(mappedImages);
      } catch (err) { 
        console.error("Failed to load images", err); 
      } finally { 
        setLoadingImages(false); 
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (typeof form.imageID === "string" && form.imageID) {
      const selectedImg = imageOptions.find(i => i.id === form.imageID);
      if (selectedImg) {
        setImagePreviewUrl(selectedImg.url);
        if (!imageSearchQuery) setImageSearchQuery(selectedImg.name);
      } else {
        setImagePreviewUrl(getProxiedImageUrl(form.imageID));
      }
    } else {
      setImagePreviewUrl(null);
    }
  }, [form.imageID, imageOptions]); 

  // Click Outside for Image Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsImageDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectImage = (image: ImageOption) => {
    setForm({ ...form, imageID: image.id, imageUrl: image.url }); 
    setIsImageDropdownOpen(false);
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setForm(prev => ({ ...prev, imageID: null, imageUrl: undefined }));
    setImagePreviewUrl(null);
    setIsImageDropdownOpen(true);
  };

  const filteredImages = imageOptions.filter(img => 
    img.name.toLowerCase().includes(imageSearchQuery.toLowerCase())
  );

  const handleNextClick = () => {
      setShowErrors(true);
      const requiredFields = ["packageName", "packageType", "nationality", "ageCategory", "effectiveDate", "lastValidDate", "dayPass", "tpremark"];
      const missing = requiredFields.some(field => !form[field as keyof PackageFormData]);

      if (missing) {
          toast({
              title: "Missing Information",
              description: `Please fill in all required fields marked with *.`,
              variant: "destructive"
          });
          return;
      }
      onNext();
  };

  const handleDateChange = (field: "effectiveDate" | "lastValidDate", date: Date | undefined) => {
    setForm((prev) => ({ ...prev, [field]: date ? convertDateForSubmission(date) : "" }));
  };

  // Helper for Input Styling with Validation State
  const getInputClass = (value: string | null | undefined) => {
    const isInvalid = showErrors && (!value || value.trim() === "");
    return cn(
        "h-9 transition-all",
        isInvalid && "border-red-500 focus-visible:ring-red-500/50"
    );
  };

  return (
    <div className="flex-1 text-foreground">
      <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">1. Package Details</h2>
      <div className="border-b border-border dark:border-white/10 mb-6" />

      <div className="grid grid-cols-2 gap-8">
        
        {/* PACKAGE NAME */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Package Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={form.packageName} 
            onChange={(e) => setForm({ ...form, packageName: e.target.value })} 
            className={`w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 ${getInputClass(form.packageName)}`}
            placeholder="Enter package name" 
          />
          {showErrors && !form.packageName && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>

        {/* PACKAGE TYPE (SHADCN SELECT) */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Package Type <span className="text-red-500">*</span></label>
          <Select value={form.packageType} onValueChange={(val) => setForm({...form, packageType: val})}>
            <SelectTrigger className={getInputClass(form.packageType)}>
                <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Entry">Entry</SelectItem>
                <SelectItem value="Point">Point</SelectItem>
                <SelectItem value="RewardP">Reward Point</SelectItem>
            </SelectContent>
          </Select>
          {showErrors && !form.packageType && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>

        {/* NATIONALITY (SHADCN SELECT) */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Nationality <span className="text-red-500">*</span></label>
          <Select value={form.nationality} onValueChange={(val) => setForm({...form, nationality: val})}>
            <SelectTrigger className={getInputClass(form.nationality)}>
                <SelectValue placeholder="Select Nationality" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="L">Malaysian</SelectItem>
                <SelectItem value="F">International</SelectItem>
                <SelectItem value="All">All</SelectItem>
            </SelectContent>
          </Select>
          {showErrors && !form.nationality && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>

        {/* AGE CATEGORY (SHADCN SELECT) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Age Category <span className="text-red-500">*</span></label>
            {loadingAges && <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />}
          </div>
          <Select value={form.ageCategory} onValueChange={(val) => setForm({...form, ageCategory: val})} disabled={loadingAges}>
            <SelectTrigger className={getInputClass(form.ageCategory)}>
                <SelectValue placeholder={loadingAges ? "Loading..." : "Select Age Category"} />
            </SelectTrigger>
            <SelectContent>
                {ageOptions.map((opt, idx) => (
                    <SelectItem key={idx} value={opt.value}>{opt.label}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          {showErrors && !form.ageCategory && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>

        {/* EFFECTIVE DATE */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Effective Date <span className="text-red-500">*</span></label>
          <DatePicker
            date={form.effectiveDate ? new Date(form.effectiveDate) : undefined}
            setDate={(date) => handleDateChange("effectiveDate", date)}
            placeholder="Select Date"
            minDate={new Date()}
            className={getInputClass(form.effectiveDate)}
          />
          {showErrors && !form.effectiveDate && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>

        {/* LAST VALID DATE */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Last Valid Date <span className="text-red-500">*</span></label>
          <DatePicker
            date={form.lastValidDate ? new Date(form.lastValidDate) : undefined}
            setDate={(date) => handleDateChange("lastValidDate", date)}
            placeholder="Select Date"
            minDate={form.effectiveDate ? new Date(form.effectiveDate) : new Date()}
            className={getInputClass(form.lastValidDate)}
          />
          {showErrors && !form.lastValidDate && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>

        {/* DAY PASS */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Day Pass <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={form.dayPass || ""} 
            onChange={(e) => setForm({ ...form, dayPass: e.target.value })} 
            className={`w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 ${getInputClass(form.dayPass)}`} 
            placeholder="e.g. 1 Day" 
          />
          {showErrors && !form.dayPass && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>

        {/* IMAGE DROPDOWN (Custom Searchable) */}
        <div className="col-span-2 space-y-1" ref={dropdownRef}>
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Package Image</label>
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
                    className="w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" size={18} />
                {loadingImages ? (
                   <Loader2 className="absolute right-3 top-2.5 text-indigo-500 animate-spin" size={18} />
                ) : (
                   <ChevronDown className={`absolute right-3 top-2.5 text-muted-foreground pointer-events-none transition-transform ${isImageDropdownOpen ? "rotate-180" : ""}`} size={18} />
                )}
            </div>

            {isImageDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    {loadingImages ? (
                        <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /><span>Loading images...</span></div>
                    ) : filteredImages.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No images found.</div>
                    ) : (
                        filteredImages.map((img) => (
                            <div key={img.id} onClick={() => handleSelectImage(img)} className="flex items-center gap-3 p-2 hover:bg-accent cursor-pointer border-b last:border-0 transition-colors">
                                <HoverCard openDelay={200} closeDelay={100}>
                                    <HoverCardTrigger asChild>
                                        <img src={img.url} alt={img.name} className="w-10 h-10 rounded object-cover border" />
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-64 p-0 border-none bg-transparent shadow-none" side="right" align="start" sideOffset={20}>
                                        <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-white dark:border-gray-600">
                                            <img src={img.url} alt={img.name} className="w-full h-auto object-cover bg-black" />
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                                <span className="text-sm flex-1 truncate">{img.name}</span>
                                {form.imageID === img.id && <Check size={16} className="text-indigo-600" />}
                            </div>
                        ))
                    )}
                </div>
            )}
          </div>
          {imagePreviewUrl && (
             <div className="flex items-start gap-4 p-3 bg-muted/50 border rounded-lg mt-2">
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogTrigger asChild>
                        <div className="relative group cursor-zoom-in">
                            <img src={imagePreviewUrl} alt="Selected" className="w-24 h-24 object-cover rounded-md border bg-background" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                <Eye className="text-white w-6 h-6 drop-shadow-md" />
                            </div>
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl w-auto p-0 bg-transparent border-none shadow-none">
                        <DialogTitle className="sr-only">Image Preview</DialogTitle>
                        <img src={imagePreviewUrl} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl" />
                    </DialogContent>
                </Dialog>
                <div className="flex flex-col justify-between h-24 py-1">
                    <div>
                        <p className="text-sm font-semibold">Selected Image</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {imageOptions.find(i => i.id === form.imageID)?.name || "Custom Image"}
                        </p>
                    </div>
                    <button type="button" onClick={handleRemoveImage} className="text-xs flex items-center gap-1 text-red-600 hover:underline">
                        <X size={14} /> Remove
                    </button>
                </div>
             </div>
          )}
        </div>

        {/* REMARK */}
        <div className="col-span-2 space-y-1">
          <label className="text-sm font-medium text-foreground/80 dark:text-gray-300">Remark <span className="text-red-500">*</span></label>
          <textarea 
            value={form.tpremark || ""} 
            onChange={(e) => setForm({ ...form, tpremark: e.target.value })} 
            className={`w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${getInputClass(form.tpremark)}`} 
            rows={3} 
            placeholder="Add remarks" 
          />
          {showErrors && !form.tpremark && <p className="text-[10px] text-red-500 flex items-center gap-1"><AlertCircle size={10}/> Required</p>}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={handleNextClick} className="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md font-medium">Next</button>
      </div>
    </div>
  );
};

export default PackageFormStep1;
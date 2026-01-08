// components/PackageFormStep1.tsx
import React, { useEffect, useState, useRef } from "react";
import { Search, X, ChevronDown, Check, Loader2, Eye } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { PackageFormValues } from "@/lib/schemas";
import { packageService } from "@/services/package-services"
import { NATIONALITY_OPTIONS } from "@/lib/constants"; 
import { getProxiedImageUrl } from "@/lib/utils";
import { useAppToast } from "@/hooks/use-app-toast";

// UI Components
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Props = {
  form: UseFormReturn<PackageFormValues>; 
  onNext: () => void;
};

interface ImageOption{ id : string; name : string; url : string; }

const convertDateForSubmission = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PackageFormStep1: React.FC<Props> = ({ form, onNext }) => {
  const toast = useAppToast();
  
  // Local UI State
  const [ageOptions, setAgeOptions] = useState<{ value: string; label: string }[]>([]);
  const [imageOptions, setImageOptions] = useState<ImageOption[]>([]);
  
  const [loadingAges, setLoadingAges] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isImageDropdownOpen, setIsImageDropdownOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState("");
  
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCreationData = async () => {
      setLoadingAges(true);
      try {
        const data = await packageService.getCreationData();
        const categories = data.ageCategories || [];
        setAgeOptions(categories.map((c: any) => ({ 
            value: c.ageCode || c.displayText, 
            label: `${c.displayText}${c.description ? ` (${c.description})` : ""}`
        })));
      } catch (err) { console.error(err); } finally { setLoadingAges(false); }
    };
    fetchCreationData();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const { images } = await packageService.searchImages(1, 100); 
        const mappedImages = images.map((img: any) => ({
             id: String(img.imageID), name: img.fileName || "Untitled", url: getProxiedImageUrl(img.imgUrl) 
        }));
        setImageOptions(mappedImages);
      } catch (err) { console.error(err); } finally { setLoadingImages(false); }
    };
    fetchImages();
  }, []);

  const currentImageID = form.watch("imageID");

  useEffect(() => {
    let objectUrl: string | null = null;
    if (currentImageID instanceof File) {
        objectUrl = URL.createObjectURL(currentImageID);
        setImagePreviewUrl(objectUrl);
        setImageSearchQuery(currentImageID.name);
    } else if (typeof currentImageID === "string" && currentImageID) {
      const selectedImg = imageOptions.find(i => i.id === currentImageID);
      if (selectedImg) {
        setImagePreviewUrl(selectedImg.url);
        if (!imageSearchQuery) setImageSearchQuery(selectedImg.name);
      } else {
        setImagePreviewUrl(getProxiedImageUrl(currentImageID));
      }
    } else {
      setImagePreviewUrl(null);
      setImageSearchQuery("");
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currentImageID, imageOptions]);

  const handleSelectImage = (image: ImageOption) => {
    form.setValue("imageID", image.id, { shouldValidate: true });
    form.setValue("imageUrl", image.url); 
    setIsImageDropdownOpen(false);
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    form.setValue("imageID", null, { shouldValidate: true });
    form.setValue("imageUrl", undefined);
    setImagePreviewUrl(null);
  };

  const filteredImages = imageOptions.filter(img => img.name.toLowerCase().includes(imageSearchQuery.toLowerCase()));

  return (
    <div className="flex-1 text-foreground pb-20 md:pb-0">
      <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white">1. Package Details</h2>
      <div className="border-b border-border dark:border-white/10 mb-6" />

      {/* MOBILE FIX: Changed grid-cols-2 to grid-cols-1 md:grid-cols-2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        <FormField control={form.control} name="packageName" render={({ field }) => (
            <FormItem>
                <FormLabel>Package Name <span className="text-red-500">*</span></FormLabel>
                <FormControl><Input {...field} placeholder="Enter package name" /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="packageType" render={({ field }) => (
            <FormItem>
                <FormLabel>Package Type <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Entry">Entry</SelectItem>
                        <SelectItem value="Point">Point</SelectItem>
                        <SelectItem value="RewardP">Reward Point</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="nationality" render={({ field }) => (
            <FormItem>
                <FormLabel>Nationality <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select Nationality" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {NATIONALITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="ageCategory" render={({ field }) => (
            <FormItem>
                <div className="flex items-center gap-2">
                    <FormLabel>Age Category <span className="text-red-500">*</span></FormLabel>
                    {loadingAges && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={loadingAges}>
                    <FormControl><SelectTrigger><SelectValue placeholder={loadingAges ? "Loading..." : "Select Age Category"} /></SelectTrigger></FormControl>
                    <SelectContent>
                        {ageOptions.map((opt, idx) => (
                            <SelectItem key={idx} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="effectiveDate" render={({ field }) => (
            <FormItem>
                <FormLabel>Effective Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                    <DatePicker 
                        date={field.value ? new Date(field.value) : undefined} 
                        setDate={(date) => field.onChange(date ? convertDateForSubmission(date) : "")} 
                        placeholder="Select Date"
                        minDate={new Date()}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="lastValidDate" render={({ field }) => (
            <FormItem>
                <FormLabel>Last Valid Date <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                    <DatePicker 
                        date={field.value ? new Date(field.value) : undefined} 
                        setDate={(date) => field.onChange(date ? convertDateForSubmission(date) : "")} 
                        placeholder="Select Date"
                        minDate={form.getValues("effectiveDate") ? new Date(form.getValues("effectiveDate")) : new Date()}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="dayPass" render={({ field }) => (
            <FormItem>
                <FormLabel>Day Pass</FormLabel>
                <FormControl><Input {...field} placeholder="e.g. 1 Day" /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        {/* IMAGE DROPDOWN - Spans full width on mobile/desktop */}
        <div className="md:col-span-2 space-y-2" ref={dropdownRef}>
            <FormLabel>Package Image <span className="text-red-500">*</span></FormLabel>
            <div className="relative">
                <div className="relative">
                    <Input 
                        type="text"
                        value={imageSearchQuery}
                        onChange={(e) => {
                            setImageSearchQuery(e.target.value);
                            setIsImageDropdownOpen(true);
                        }}
                        onFocus={() => setIsImageDropdownOpen(true)}
                        placeholder="Search image database..."
                        className="pl-10"
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
                            <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
                        ) : filteredImages.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">No images found.</div>
                        ) : (
                            filteredImages.map((img) => (
                                <div key={img.id} onClick={() => handleSelectImage(img)} className="flex items-center gap-3 p-2 hover:bg-accent cursor-pointer border-b last:border-0">
                                    <img src={img.url} alt={img.name} className="w-10 h-10 rounded object-cover border" />
                                    <span className="text-sm flex-1 truncate">{img.name}</span>
                                    {currentImageID === img.id && <Check size={16} className="text-indigo-600" />}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            
            <FormField control={form.control} name="imageID" render={() => <FormMessage />} />

            {imagePreviewUrl && (
                <div className="flex items-start gap-4 p-3 bg-muted/50 border rounded-lg mt-2">
                    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                        <DialogTrigger asChild>
                            <div className="relative group cursor-zoom-in flex-shrink-0">
                                <img src={imagePreviewUrl} alt="Selected" className="w-24 h-24 object-cover rounded-md border bg-background" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                    <Eye className="text-white w-6 h-6" />
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl w-auto p-0 bg-transparent border-none">
                            <DialogTitle className="sr-only">Image Preview</DialogTitle> 
                            <img src={imagePreviewUrl} alt="Preview" className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl" />
                        </DialogContent>
                    </Dialog>
                    <div className="flex flex-col justify-between h-24 py-1 min-w-0">
                        <div>
                            <p className="text-sm font-semibold">Selected Image</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                {imageOptions.find(i => i.id === currentImageID)?.name || "Custom Upload"}
                            </p>
                        </div>
                        <button type="button" onClick={handleRemoveImage} className="text-xs flex items-center gap-1 text-red-600 hover:underline">
                            <X size={14} /> Remove
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* REMARK - Full Width */}
        <div className="md:col-span-2">
            <FormField control={form.control} name="tpremark" render={({ field }) => (
                <FormItem>
                    <FormLabel>Remark <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                        <Textarea {...field} className="resize-none" rows={3} placeholder="Add remarks" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={onNext} className="w-full md:w-auto px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md font-medium">
            Next
        </button>
      </div>
    </div>
  );
};

export default PackageFormStep1;
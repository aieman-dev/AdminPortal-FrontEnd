// components/PackageCard.tsx
import React, { useState } from "react";
import Image from 'next/image';
import { Calendar, Globe, User, MoreHorizontal, Pencil, Copy, Trash2, Ticket, Layers, Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton"; 
import { cn } from "@/lib/utils"; 
import { formatCurrency } from "@/lib/formatter";
import { StatusBadge } from "@/components/shared-components/status-badge";

interface PackageCardProps {
  id: number;
  name: string;
  price: string;
  category: string;
  description?: string;
  packageType: string;
  dateDisplay: string;
  nationality: string;
  status: string;
  image: string;
  isBundle?: boolean;
  
  // Functional props
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  onClick?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
}

{/* 
  // DEFINE CUSTOM COLORS TO MATCH ORIGINAL CARD DESIGN
const packageStatusMap: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-transparent",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-transparent",
    draft: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-transparent",
    expiring: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-transparent",
    default: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent"
};
 */}



export default function PackageCard({
  name,
  price,
  category,
  description,
  packageType,
  dateDisplay,
  nationality,
  status,
  image,
  isBundle = false, 
  isSelectable = false,
  isSelected = false,
  onSelectChange,
  onClick,
  onDuplicate,
  onEdit,
  onDelete,
  onSubmit
}: PackageCardProps) {

  const [imageLoaded, setImageLoaded] = useState(false);
  const numericPrice = parseFloat(price) || 0;

  const getNationalityLabel = (code: string) => {
    if (code === "L") return "Local"; 
    if (code === "F") return "Intl";  
    if (!code || code === "N/A") return "All"; 
    return code;
  };

  const showActions = status.toLowerCase() === "draft";

  return (
    <div 
      onClick={onClick}
      className={`group relative flex flex-col w-full bg-white dark:bg-gray-900 rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer
        ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200 dark:border-gray-800'}
      `}
    >
      
      {/* 1. IMAGE HEADER */}
      <div className="relative h-32 w-full overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
        {!imageLoaded && (
            <Skeleton className="absolute inset-0 h-full w-full" />
        )}
        
        <Image 
          src={image} 
          alt={name}
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          placeholder="blur" 
          blurDataURL="/placeholder-tiny.png" 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top Left Badges */}
        <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1 max-w-[85%]">
            {isSelectable && (
                <div onClick={(e) => e.stopPropagation()} className="mr-1">
                    <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={(c) => onSelectChange?.(!!c)}
                        className="data-[state=checked]:bg-indigo-600 border-white bg-white/90 w-4 h-4 shadow-sm"
                    />
                </div>
            )}
            
            {isBundle && (
                 <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-100/95 text-purple-700 backdrop-blur-md shadow-sm border border-purple-200/50" title="Bundle">
                    <Layers size={12} className="stroke-[3]" />
                </span>
            )}
             <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/95 text-gray-800 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm">
                <Ticket size={10} className="stroke-[3]" /> {packageType === "RewardP" ? "Reward" : (packageType || "Pkg")}
            </span>
        </div>

        {/* Action Menu */}
        {showActions && (
            <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="h-6 w-6 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors">
                        <MoreHorizontal size={14} className="text-gray-700 dark:text-gray-200" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onSubmit && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSubmit(); }} className="text-indigo-600 focus:text-indigo-600 font-medium">
                            <Send className="mr-2 h-4 w-4" /> Submit
                        </DropdownMenuItem>
                      )}
                      {onEdit && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                      {onDuplicate && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>}
                      {onDelete && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
            </div>
        )}
      </div>

      {/* 2. BODY CONTENT */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        
        <h3 
            className="font-bold text-gray-900 dark:text-white text-xs leading-snug line-clamp-2 min-h-[2rem]" 
            title={name}
        >
            {name}
        </h3>

        <div className="text-blue-600 dark:text-blue-400 font-extrabold text-sm mb-1">
           {formatCurrency(parseFloat(price), packageType)}
        </div>

        <div className="flex flex-wrap gap-1.5">
           <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300 font-medium cursor-help">
                            <User size={10} className="text-gray-500" />
                            <span className="truncate max-w-[100px]">{category || "N/A"}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start" className="max-w-[200px] text-xs">
                        <p className="font-bold">{category}</p>
                        {description && <p className="text-muted-foreground">{description}</p>}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                <Globe size={10} className="text-gray-500" />
                <span>{getNationalityLabel(nationality)}</span>
            </div>
        </div>

        <div className="flex-1" />

        {/* 3. FOOTER */}
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium min-w-0">
                <Calendar size={10} className="shrink-0" />
                <span className="truncate">{dateDisplay}</span>
            </div>

            <StatusBadge 
                status={status}
                className="text-[10px] uppercase tracking-wider px-1.5 h-5"
            />
        </div>
      </div>
    </div>
  );
};
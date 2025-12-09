import React from "react";
import { Calendar, Globe, User, MoreHorizontal, Pencil, Copy, Trash2, Ticket, Layers } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

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
}: PackageCardProps) {
  
  const getStatusStyle = (status: string) => {
    const normalized = status.toLowerCase().replace(/\s/g, '');
    switch (normalized) {
      case "active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "draft": return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
      case "expiringsoon": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const isPoint = packageType?.toLowerCase().includes('point') && !packageType?.toLowerCase().includes('reward');
  const priceUnit = isPoint ? "Pts" : "RM";
  const displayPrice = isPoint ? `${price} ${priceUnit}` : `${priceUnit} ${price}`;

  const getNationalityLabel = (code: string) => {
    if (code === "L") return "Local"; // Shortened for thin card
    if (code === "F") return "Intl";  // Shortened for thin card
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
      
      {/* 1. IMAGE HEADER (Reduced height slightly for narrower aspect) */}
      <div className="relative h-32 w-full overflow-hidden shrink-0 bg-gray-100">
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => (e.currentTarget.src = "/packages/DefaultPackageImage.png")}
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
                      {onEdit && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                      {onDuplicate && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>}
                      {onDelete && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
            </div>
        )}
      </div>

      {/* 2. BODY CONTENT (Compacted) */}
      <div className="p-3 flex flex-col flex-1 gap-1">
        
        {/* Title: 2 lines max, slightly smaller font */}
        <h3 
            className="font-bold text-gray-900 dark:text-white text-xs leading-snug line-clamp-2 min-h-[2rem]" 
            title={name}
        >
            {name}
        </h3>

        {/* Price */}
        <div className="text-blue-600 dark:text-blue-400 font-extrabold text-sm mb-1">
            {displayPrice}
        </div>

        {/* Metadata Pills - Stacked or wrapped for narrow width */}
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

            <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wide shrink-0 whitespace-nowrap ${getStatusStyle(status)}`}>
                {status === "ExpiringSoon" ? "Expiring" : status}
            </span>
        </div>
      </div>
    </div>
  );
};
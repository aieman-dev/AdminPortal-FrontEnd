"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Car, Smartphone, FileText, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ParkingDetailData, CarParkPackage } from "@/type/car-park";

interface CarParkConfigFormProps {
  mode: "season" | "superapp";
  data: ParkingDetailData;
  packages: CarParkPackage[];
  isReadOnly: boolean;
  onDataChange: (updates: Partial<ParkingDetailData>) => void;
}

export function CarParkConfigForm({ mode, data, packages, isReadOnly, onDataChange }: CarParkConfigFormProps) {
  const labelClass = "text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block";
  const disabledStyle = "disabled:opacity-100 bg-gray-100 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 border-transparent cursor-not-allowed";
  const editableStyle = "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500";
  const inputStateClass = isReadOnly ? disabledStyle : editableStyle;
  const normalizePlate = (val: string) => val.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const isSeason = mode === "season";

  return (
    <Card className="h-full shadow-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
      <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4 px-6 pt-5">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-gray-100">
          {isSeason ? <Car className="h-5 w-5 text-indigo-600" /> : <Smartphone className="h-5 w-5 text-blue-600" />}
          {isSeason ? "Parking Information" : "SuperApp Details"}
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          {isSeason ? "Parking configuration and registered plates" : "Mobile app usage and internal notes"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {isSeason ? (
          <>
            {/* SEASON ONLY: LPR, Reserved, Homestay & MobileQr Badges */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50">
                <div className="flex items-center space-x-2 mr-4">
                    <Checkbox 
                    id="isLpr" 
                    checked={data.isLpr} 
                    onCheckedChange={(c) => onDataChange({ isLpr: !!c })} 
                    disabled={isReadOnly}
                    className="data-[state=checked]:bg-indigo-600 border-indigo-400 dark:border-indigo-600 dark:data-[state=checked]:bg-indigo-500"
                    />
                    <Label htmlFor="isLpr" className="cursor-pointer font-semibold text-indigo-900 dark:text-indigo-200">Enable LPR</Label>
                </div>
                
                <div className="h-6 w-px bg-indigo-200 dark:bg-indigo-800 mx-2 hidden md:block"></div>
                
                <div className="flex flex-wrap gap-2">
                    {/* 1. Parking Mode Badge */}
                    {data.parkingMode === "Reserved" ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 shadow-sm dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                        Reserved
                    </Badge>
                    ) : (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                        Normal
                    </Badge>
                    )}

                    {/* 2. Homestay Badge (Show always with different style if false) */}
                    {data.isHomestay ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 shadow-sm dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        Homestay
                    </Badge>
                    ) : (
                    <Badge variant="outline" className="text-gray-400 border-dashed bg-white/50 dark:bg-zinc-800/50 dark:text-gray-500">
                        No Homestay
                    </Badge>
                    )}

                    {/* 3. Mobile QR Badge (Show always with different style if false) */}
                    {data.isMobileQr ? (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 shadow-sm dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                        Mobile QR
                    </Badge>
                    ) : (
                    <Badge variant="outline" className="text-gray-400 border-dashed bg-white/50 dark:bg-zinc-800/50 dark:text-gray-500">
                        No Mobile QR
                    </Badge>
                    )}
                </div>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className={labelClass}>Season Package</Label>
                <Select value={data.seasonPackage} onValueChange={(val) => onDataChange({ seasonPackage: val })} disabled={isReadOnly}>
                  <SelectTrigger className={editableStyle}><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>{packages.map(pkg => <SelectItem key={pkg.id} value={String(pkg.id)}>{pkg.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className={labelClass}>Effective Date</Label><DatePicker date={data.effectiveDate ? new Date(data.effectiveDate) : undefined} setDate={(d) => d && onDataChange({ effectiveDate: d.toISOString().split('T')[0] })} disabled={isReadOnly} /></div>
              <div className="space-y-2"><Label className={labelClass}>Expiry Date</Label><DatePicker date={data.expiryDate ? new Date(data.expiryDate) : undefined} setDate={(d) => d && onDataChange({ expiryDate: d.toISOString().split('T')[0] })} disabled={isReadOnly} minDate={data.effectiveDate ? new Date(data.effectiveDate) : new Date()}/></div>
            </div>
            
            <Separator />
            
            <div>
              <Label className={labelClass}>Registered Vehicles</Label>
              <div className="space-y-3">
                <Input value={data.plate1} className={cn(inputStateClass, "uppercase")} onChange={(e) => {const normalized = normalizePlate(e.target.value); onDataChange({ plate1: normalized });}} disabled={isReadOnly} placeholder="Plate 1" />
                <Input value={data.plate2} className={cn(inputStateClass, "uppercase")} onChange={(e) => {const normalized = normalizePlate(e.target.value); onDataChange({ plate2: normalized });}} disabled={isReadOnly} placeholder="Plate 2" />
              </div>
            </div>
          </>
        ) : null}

        {/* SHARED/VISITOR: Internal Remarks */}
        <div className="space-y-2">
          <Label className={labelClass}><FileText className="h-3 w-3 inline mr-1" /> Internal Notes</Label>
          <Textarea 
            value={data.remarks} 
            onChange={e => onDataChange({ remarks: e.target.value })} 
            className={cn("resize-none min-h-[120px]", editableStyle)} 
            placeholder="Add notes about this user..." 
            disabled={isReadOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
}
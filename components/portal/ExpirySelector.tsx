import React, { useState, useEffect } from 'react';
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

export interface ExpiryData {
  isoString: string;
  isValid: boolean;
  displayTime: string;
}

interface ExpirySelectorProps {
  onExpiryChange: (data: ExpiryData) => void;
}

const ExpirySelector: React.FC<ExpirySelectorProps> = ({ onExpiryChange }) => {
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!date) return;

    // Check validity (must be in future)
    const now = new Date();
    const isValid = date > now;

    // Format display string
    const displayTime = date.toLocaleTimeString("en-GB", {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    onExpiryChange({
      isoString: date.toISOString(),
      isValid: isValid,
      displayTime: displayTime
    });

  }, [date, onExpiryChange]);

  const displayDateStr = date 
    ? date.toLocaleDateString("en-GB", { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-') 
    : "YYYY-MM-DD";

  const displayTimeStr = date 
    ? date.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true })
    : "--:--";

  return (
    <div className="space-y-2">
      {/* Label for the whole section */}
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Expiry Date & Time <span className="text-red-500">*</span>
      </label>

      {/* COMPACT ROW LAYOUT */}
      <div className="flex flex-col md:flex-row gap-3">
        
        {/* 1. Date Input (Left Side) */}
        <div className="flex-1">
          <DatePicker 
            date={date}
            setDate={setDate}
            minDate={new Date()}
            placeholder="Pick expiry date"
            className="w-full h-11" 
          />
        </div>

        {/*Time Input */}
        <div className="w-full md:w-[180px]">
            <TimePicker 
                date={date} 
                setDate={setDate} 
                disabled={!date}
                className="w-full"
            />
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-[0.8rem] text-muted-foreground">
        *Announcement will automatically disappear on {displayDateStr} at {displayTimeStr}
      </p>
    </div>
  );
};

export default ExpirySelector;
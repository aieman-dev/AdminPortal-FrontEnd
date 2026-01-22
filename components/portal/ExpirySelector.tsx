import React, { useState, useEffect } from 'react';
import { DatePicker } from "@/components/ui/date-picker";

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
  
  // Time State
  const [hour, setHour] = useState<string>('12');
  const [minute, setMinute] = useState<string>('00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM'); 

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    let hours24 = parseInt(hour, 10);
    if (ampm === 'PM' && hours24 < 12) hours24 += 12;
    if (ampm === 'AM' && hours24 === 12) hours24 = 0;

    const expiryDateTimeString = `${dateStr}T${hours24.toString().padStart(2, '0')}:${minute}:00`;
    const expiryDateObj = new Date(expiryDateTimeString);
    const now = new Date();

    const isValid = expiryDateObj > now;

    onExpiryChange({
      isoString: expiryDateTimeString,
      isValid: isValid,
      displayTime: `${hour}:${minute} ${ampm}`
    });

  }, [date, hour, minute, ampm, onExpiryChange]);

  const displayDateStr = date 
    ? date.toLocaleDateString("en-GB", { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-') 
    : "YYYY-MM-DD";

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
            className="w-full h-10" 
          />
        </div>

        {/* 2. Time Input Group (Right Side) */}
        <div className="flex items-center gap-2">
          
          {/* Hour */}
          <div className="relative w-[70px]">
            <select 
              value={hour} 
              onChange={(e) => setHour(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-center"
            >
              {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <span className="font-bold text-muted-foreground">:</span>

          {/* Minute */}
          <div className="relative w-[70px]">
            <select 
              value={minute} 
              onChange={(e) => setMinute(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-center"
            >
              {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* AM/PM Toggle */}
          <div className="flex h-10 rounded-md border border-input bg-background p-1 gap-1">
            <button 
              type="button" 
              className={`px-3 rounded-sm text-xs font-bold transition-colors ${ampm === 'AM' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setAmpm('AM')}
            >
              AM
            </button>
            <button 
              type="button" 
              className={`px-3 rounded-sm text-xs font-bold transition-colors ${ampm === 'PM' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
              onClick={() => setAmpm('PM')}
            >
              PM
            </button>
          </div>

        </div>
      </div>

      {/* Helper Text */}
      <p className="text-[0.8rem] text-muted-foreground">
        *Announcement will automatically disappear on {displayDateStr} at {hour}:{minute} {ampm}
      </p>
    </div>
  );
};

export default ExpirySelector;
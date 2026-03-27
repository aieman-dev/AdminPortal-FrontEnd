import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

type ConfirmationModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning';
  confirmLabel?: string;
  cancelLabel?: string;
  requireInput?: string;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Are You Sure?",
  description = "This action cannot be undone.",
  variant = 'default',
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requireInput,
}) => {
  const [inputValue, setInputValue] = useState("");

  // Reset input every time modal opens
  useEffect(() => {
    if (isOpen) setInputValue("");
  }, [isOpen]);

  const currentDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isDestructive = variant === 'destructive';
  const isWarning = variant === 'warning';
  const isConfirmDisabled = requireInput ? inputValue !== requireInput : false;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full animate-in zoom-in-95 duration-200 border border-white/20">
          
          <div className="flex flex-col items-center mb-6">
              {(isDestructive || isWarning) && (
                  <div className={`mb-4 p-3 rounded-full ${isDestructive ? "bg-red-100" : "bg-orange-100"}`}>
                      <AlertTriangle className={`w-8 h-8 ${isDestructive ? "text-red-600" : "text-orange-600"}`} />
                  </div>
              )}
              <h2 className={`text-2xl font-bold text-center ${isDestructive ? "text-red-600" : isWarning ? "text-orange-700" : "text-gray-900 dark:text-white"}`}>
                {title}
              </h2>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-5 md:p-6 mb-8 text-center border border-gray-100 dark:border-slate-700">
            <div className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
              {description}
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-medium">
               <span className="text-gray-500">Action Date:</span>
               <span className="text-gray-500">{currentDate}</span>
            </div>
          </div>

          {/* Render input field if requireInput is provided */}
          {requireInput && (
              <div className="mb-6 space-y-2">
                 <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-medium">
                    Type <span className="font-bold text-red-600 select-all">{requireInput}</span> to confirm.
                 </p>
                 <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={requireInput}
                    className="text-center font-mono font-bold tracking-widest uppercase border-red-200 focus-visible:ring-red-500"
                 />
              </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors shadow-sm"
            >
              {cancelLabel}
            </button>
            
            <button
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2
                ${isConfirmDisabled ? "opacity-50 cursor-not-allowed bg-gray-400" : 
                  isDestructive 
                    ? "bg-red-600 hover:bg-red-700" 
                    : isWarning
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-[#5B5FEF] hover:bg-[#4a4edb]"
                  }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

// --- Success Modal ---

type SuccessModalProps = {
  isOpen: boolean;
  onViewStatus: () => void;
  onCreateNew: () => void;
};

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onViewStatus,
  onCreateNew,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-xl w-full animate-scale-in">
        <div className="text-center space-y-6 md:space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Done !</h2>

          <div className="flex justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl">
              <Check size={48} className="text-white md:w-16 md:h-16" strokeWidth={3} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-800 font-medium text-lg">
              Your package has been submitted for review.
            </p>
            <p className="text-gray-600 text-sm">
              You can track its status or start creating a new package.
            </p>
          </div>

          {/* Stack buttons on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onViewStatus}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors shadow-sm"
            >
              View Package Status
            </button>
            <button
              onClick={onCreateNew}
              className="flex-1 px-6 py-3 bg-[#5B5FEF] hover:bg-[#4a4edb] text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Create New Package
            </button>
          </div>
        </div>
      </div>
    </div>
  </Portal>
  );
};

// --- Draft Modal ---

type DraftModalProps = {
  isOpen: boolean;
  onViewStatus: () => void;
  onCreateNew: () => void;
};

export const DraftModal: React.FC<DraftModalProps> = ({
   isOpen,
  onViewStatus,
  onCreateNew,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-xl w-full animate-scale-in">
        <div className="text-center space-y-6 md:space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Draft Saved</h2>

          <div className="flex justify-center">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#5B5FEF] to-[#5B5FEF] rounded-full flex items-center justify-center shadow-xl">
              <Check size={48} className="text-white md:w-16 md:h-16" strokeWidth={3} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-800 font-medium text-lg">
              Saved to Drafts
            </p>
            <p className="text-gray-600 text-sm">
              It will not be submitted until you proceed to submit it for review.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onViewStatus}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors shadow-sm"
            >
              View Package Status
            </button>
            <button
              onClick={onCreateNew}
              className="flex-1 px-6 py-3 bg-[#5B5FEF] hover:bg-[#4a4edb] text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Create New Package
            </button>
          </div>
        </div>
      </div>
    </div>
  </Portal>
  );
};

// --- Approval Modal ---

type ApprovalModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const currentDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Portal>
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full animate-scale-in">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Approve Package?
        </h2>

        <div className="bg-gray-100 rounded-xl p-5 md:p-6 mb-6 text-center space-y-2">
          <p className="text-gray-700 text-lg">
            Upon approval, the package will be <span className="font-bold text-gray-900">active</span> to use.
          </p>
          <p className="text-gray-600 text-sm">
            (Further edits will not be allowed after approval.)
          </p>
          <p className="text-gray-400 text-xs mt-4">
            Action Date : {currentDate}
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-[#5B5FEF] hover:bg-[#7C83FF] text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            Confirm Approval
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
};

// --- Warning Modal---
interface WarningModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    expiryDate: string; 
}

export const WarningModal: React.FC<WarningModalProps> = ({ 
    isOpen, 
    onConfirm, 
    onCancel, 
    expiryDate 
}) => {
    return (
        <ConfirmationModal
            isOpen={isOpen}
            variant="warning"
            title="Expiring Soon!"
            description={
                <div className="space-y-2">
                    <p>This package will expire in less than 7 days ({expiryDate}).</p>
                    <p className="font-semibold">Are you sure you want to proceed?</p>
                </div>
            }
            confirmLabel="Yes, Proceed"
            cancelLabel="Cancel"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    )
}
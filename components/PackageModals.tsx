import React from "react";
import { Check, AlertTriangle } from "lucide-react";

type ConfirmationModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
  confirmLabel?: string;
  cancelLabel?: string;
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

  const isDestructive = variant === 'destructive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-lg w-full animate-scale-in border border-white/20">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
            {isDestructive && (
                <div className="mb-4 p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="text-red-600 w-8 h-8" />
                </div>
            )}
            <h2 className={`text-2xl font-bold text-center ${isDestructive ? "text-red-600" : "text-gray-900"}`}>
            {title}
            </h2>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 md:p-6 mb-8 text-center border border-gray-100">
          <div className="text-gray-700 text-base leading-relaxed mb-4">
            {description}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-medium">
             <span className="text-gray-500">Action Date:</span>
             <span className="text-gray-500">{currentDate}</span>
          </div>
        </div>

        {/* RESPONSIVE BUTTONS: Stack on mobile, Row on Desktop */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors shadow-sm"
          >
            {cancelLabel}
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2
              ${isDestructive 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-[#5B5FEF] hover:bg-[#4a4edb]"
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      {/* Reduced padding for mobile (p-8 vs p-12) */}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
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
  );
};
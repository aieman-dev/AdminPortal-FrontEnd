// components/PackageModals.tsx
import React from "react";
import { Check } from "lucide-react";

type ConfirmationModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-scale-in">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Are You Sure?
        </h2>

        <div className="bg-gray-100 rounded-xl p-6 mb-6 text-center space-y-2">
          <p className="text-gray-700">
            Upon submission, the package will be forwarded for review
          </p>
          <p className="text-gray-600 text-sm">
            (Further edits will not be allowed after submission.)
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Current Date : {currentDate}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full mx-4 animate-scale-in">
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">All Done !</h2>

          <div className="flex justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl">
              <Check size={64} className="text-white" strokeWidth={3} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-800 font-medium">
              Your package has been submitted for review.
            </p>
            <p className="text-gray-600">
              You can track its status or start creating a new package.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onViewStatus}
              className="flex-1 px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              View Package Status
            </button>
            <button
              onClick={onCreateNew}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Create New Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full mx-4 animate-scale-in">
        <div className="text-center space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">All Done !</h2>

          <div className="flex justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-[#5B5FEF] to-[#5B5FEF] rounded-full flex items-center justify-center shadow-xl">
              <Check size={64} className="text-white" strokeWidth={3} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-gray-800 font-medium">
              Your package has been saved under the Draft tab.
            </p>
            <p className="text-gray-600">
              It will not be submitted until you proceed to submit it for review.
              You can track its status or start creating a new package.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onViewStatus}
              className="flex-1 px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              View Package Status
            </button>
            <button
              onClick={onCreateNew}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              Create New Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
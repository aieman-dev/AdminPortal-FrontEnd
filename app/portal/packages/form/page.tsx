//  src/app/(main)/packages/form/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import PackageFormStep1 from "@/components/PackageFormStep1";
import PackageFormStep2 from "@/components/PackageFormStep2";
import PackageFormStep3 from "@/components/PackageFormStep3";
import { ConfirmationModal, DraftModal, SuccessModal } from '@/components/PackageModals';
import { PackageFormData, Package } from "@/type/packages";

// Save to localStorage
const savePackageToLocal = (data: PackageFormData, status: "submitted" | "draft") => {
  const existing = JSON.parse(localStorage.getItem("packages") || "[]");

  const imageURL =
    data.imageID instanceof File
      ? URL.createObjectURL(data.imageID)
      : typeof data.imageID === "string"
      ? data.imageID
      : "/bg/DefaultPackageImage.png";

      
  const start = new Date(data.effectiveDate || "");
  const end = new Date(data.lastValidDate || "");
  const durationDays = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1 : 0;

   // Convert PackageFormData → Package
  const newPackage = {
    id: Date.now(),
    title: data.name || "Untitled Package",
    price: data.totalPrice || 0,
    startDate: data.effectiveDate || "",
    endDate: data.lastValidDate || "",
    durationDays: durationDays,
    status: status === "submitted" ? "Pending" : "Draft",
    image: imageURL,
    createdDate: new Date().toISOString(),
    createdBy: "System User - Hardcoded ", // or your logic
    entryType: data.packageType,
    nationality: data.nationality,
    ageCategory: data.ageCategory,
    tpremark: data.tpremark,
    packageitems: data.packageitems || [],
  };

  localStorage.setItem("packages", JSON.stringify([...existing, newPackage]));
};

const PackageFormPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [form, setForm] = useState<PackageFormData>({
    name: "",
    packageType: "",
    nationality: "",
    ageCategory: "",
    effectiveDate: "",
    lastValidDate: "",
    tpremark: "",
    imageID: null,
    packageitems: [],
  });
  

  // Disable Chrome scroll on this page only
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async() => {
    console.log(" Submitted package:", form);
    await savePackageToLocal(form, "submitted"); // TODO: Connect API later
    setShowConfirmation(false);
    setShowSuccess(true);
  };

  const handleSaveDraft = async() => {
  console.log("Saved draft:", form);
  await savePackageToLocal(form, "draft");
  setShowDraft(true);
};

  const handleCancelSubmit = () => {
    setShowConfirmation(false);
  };

  const handleViewStatus = () => {
    setShowSuccess(false);
    router.push("/portal/packages"); 
  };

  const handleCreateNew = () => {
    setShowSuccess(false);
    setShowDraft(false);
    // Reset form
    setForm({
      name: "",
      packageType: "",
      nationality: "",
      ageCategory: "",
      effectiveDate: "",
      lastValidDate: "",
      tpremark: "",
      imageID: null,
      packageitems: [],
    });
    setStep(1);
  };

  const handleBackToList = () => {
    router.push("/portal/packages");
  };

  return (
    <>
    <div className="h-screen flex items-start justify-center overflow-hidden">
      {/* Unified Card Container */}
      <div 
        className="w-full max-w-[1300px] flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden" 
        style={{ height: 'calc(100vh - 130px)' }}
      >
        {/* Left: Step Indicator */}
        <StepIndicator
          current={step}
          onClickStep={setStep}
          onBackClick={handleBackToList}
        />

        {/* Right: Form Steps - Scrollable */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-6">
          {step === 1 && (
            <PackageFormStep1 form={form} setForm={setForm} onNext={next} />
          )}
          {step === 2 && (
            <PackageFormStep2
              form={form}
              setForm={setForm}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <PackageFormStep3 
            form={form} 
            onBack={back} 
            onSubmit={handleSubmit} 
             onSaveDraft={handleSaveDraft} />
          )}
        </main>
      </div>
    </div>

    {/* Modals */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />

      <SuccessModal
        isOpen={showSuccess}
        onViewStatus={handleViewStatus}
        onCreateNew={handleCreateNew}
      />

      <DraftModal
        isOpen={showDraft}
        onViewStatus={handleViewStatus}
        onCreateNew={handleCreateNew}
      />
    </>
  );
};

export default PackageFormPage;
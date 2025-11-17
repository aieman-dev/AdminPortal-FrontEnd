"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Components
import StepIndicator from "@/components/StepIndicator";
import PackageFormStep1 from "@/components/PackageFormStep1";
import PackageFormStep2 from "@/components/PackageFormStep2";
import PackageFormStep3 from "@/components/PackageFormStep3";
import { ConfirmationModal, DraftModal, SuccessModal } from '@/components/PackageModals';
import { PackageFormData } from "@/type/packages";
import { packageService } from "@/services/package-services"; 

const PackageFormPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDraft, setShowDraft] = useState(false);

  const [form, setForm] = useState<PackageFormData>({
    packageName: "",
    packageType: "",
    nationality: "",
    ageCategory: "",
    effectiveDate: "",
    lastValidDate: "",
    tpremark: "",
    imageID: null,
    packageitems: [],
    dayPass: "",
    totalPrice: 0,
  });

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Navigation
  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // Handlers
  const handleCreateNew = () => {
    setShowSuccess(false);
    setShowDraft(false);
    setForm({
      packageName: "", packageType: "", nationality: "", ageCategory: "",
      dayPass: "", effectiveDate: "", lastValidDate: "", tpremark: "",
      imageID: null, packageitems: [],
      totalPrice: 0,
    });
    setStep(1);
  };

  const handleViewStatus = () => {
    setShowSuccess(false);
    router.push("/portal/packages");
  };

  const handleSaveDraft = () => {
    const existing = JSON.parse(localStorage.getItem("packages") || "[]");
    localStorage.setItem("packages", JSON.stringify([...existing, form]));
    setShowDraft(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      let finalImageID = "123"; 

      if (form.imageID instanceof File) {
        finalImageID = await packageService.uploadImage(form.imageID);
      } else if (typeof form.imageID === "string") {
        finalImageID = form.imageID;
      }

      await packageService.createPackage(form, finalImageID);
      
      console.log("Package created successfully");
      setShowSuccess(true);

    } catch (err) {
      console.error("Submit error:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Failed to submit package"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-120px)] flex items-center justify-center px-8 pb-8 pt-4">
        {/* UPDATED: Changed bg-white to bg-card and added text-card-foreground */}
        <div className="w-full max-w-[1300px] flex flex-col md:flex-row bg-white dark:bg-gray-900 text-card-foreground rounded-2xl shadow-2xl overflow-hidden border border-border"
         style={{ height: 'calc(100vh - 130px)' }}>
          <StepIndicator
            current={step}
            onClickStep={setStep}
            onBackClick={() => router.push("/portal/packages")}
          />

          <main className="flex-1 overflow-y-auto scrollbar-hide p-6">
            {step === 1 && <PackageFormStep1 form={form} setForm={setForm} onNext={next} />}
            {step === 2 && <PackageFormStep2 form={form} setForm={setForm} onNext={next} onBack={back} />}
            {step === 3 && (
              <PackageFormStep3 
                form={form} 
                onBack={back} 
                onSubmit={() => setShowConfirmation(true)} 
                onSaveDraft={handleSaveDraft} 
              />
            )}
          </main>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
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
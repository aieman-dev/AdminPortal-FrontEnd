// src/app/(main)/packages/form/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import PackageFormStep1 from "@/components/PackageFormStep1";
import PackageFormStep2 from "@/components/PackageFormStep2";
import PackageFormStep3 from "@/components/PackageFormStep3";
import { ConfirmationModal, DraftModal, SuccessModal } from '@/components/PackageModals';
import { PackageFormData } from "@/type/packages";

// --- Configuration ---
// 1. Point to your Proxy for creation (This is correct)
const CREATE_PACKAGE_URL = "/api/proxy-create-package";
const UPLOAD_IMAGE_URL = "/api/proxy-upload";

// 🔑 HARDCODED TOKEN FOR TESTING
const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUUEBlbWFpbC5jb20iLCJ1c2VySWQiOiIzIiwibmFtZSI6IlRQVGVzdCIsImRlcGFydG1lbnQiOiJUUF9BRE1JTiIsImp0aSI6ImE2YjQyYTgxLTFiYTAtNDQ3MS1iZWFmLTIyZWU2NTRmOTgzNiIsImV4cCI6MTc2MzAwNDczMywiaXNzIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NzAyOSIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6NTE3MyJ9.Xv6y4QB0xxdIT1zMKSXXnZM60uOTYfsPnOqoTm__yek";

const PackageFormPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const handleSubmit = () => setShowConfirmation(true);
  const handleCancelSubmit = () => setShowConfirmation(false);

  // --- Helper: Upload Image ---
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    // Added ngrok header here too
    const res = await fetch(UPLOAD_IMAGE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TEST_TOKEN}`, 
      },
      body: formData,
    });

    if (!res.ok) {
        let errorMessage = "Image upload failed";
        try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = await res.text() || errorMessage;
        }
        throw new Error(errorMessage);
    }
    
    const data = await res.json();
    return data.imageId; 
  };

  // --- Main Submit Logic ---
  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      let finalImageID = "123"; 

      // Step 1: Upload Image if one is selected
      if (form.imageID instanceof File) {
        try {
          finalImageID = await uploadImage(form.imageID);
        } catch (uploadErr) {
          console.error("Image upload error:", uploadErr);
          alert("Failed to upload image. Please try again.");
          setIsSubmitting(false);
          return; 
        }
      } else if (typeof form.imageID === "string") {
        finalImageID = form.imageID;
      }

      // Step 2: Build Payload
      const payload = {
        name: form.packageName || "Untitled Package",
        packageType: form.packageType || "Entry",
        price: form.totalPrice || 0,
        point: 0,
        effectiveDate: form.effectiveDate ? `${form.effectiveDate}T00:00:00` : new Date().toISOString(),
        lastValidDate: form.lastValidDate ? `${form.lastValidDate}T00:00:00` : new Date().toISOString(),
        remark: form.tpremark || "No remarks",
        nationality: form.nationality || "MY",
        ageCategory: form.ageCategory || "A1",
        imageID: finalImageID || "/bg/DefaultPackageImage.png",
        items: form.packageitems.map((item) => ({
          itemName: item.itemName,
          itemType: item.itemType || "Entry",
          value: item.price || 0, 
          entryQty: item.entryQty || 1,
        })),
      };

      console.log("Submitting Payload:", payload);

      // Step 3: Create Package (via Proxy)
      const res = await fetch(CREATE_PACKAGE_URL,
        {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            "Authorization": `Bearer ${TEST_TOKEN}`, 
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create package");
      }

      const data = await res.json();
      console.log("Package Created:", data);
      setShowSuccess(true);

    } catch (err) {
      console.error("Submit error:", err);
      alert(`Error: ${err instanceof Error ? err.message : "Failed to submit package"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const existing = JSON.parse(localStorage.getItem("packages") || "[]");
    localStorage.setItem("packages", JSON.stringify([...existing, form]));
    setShowDraft(true);
  }

  const handleViewStatus = () => {
    setShowSuccess(false);
    router.push("/portal/packages");
  };

  const handleCreateNew = () => {
    setShowSuccess(false);
    setShowDraft(false);
    setForm({
      packageName: "",
      packageType: "",
      nationality: "",
      ageCategory: "",
      dayPass: "",
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
        <div
          className="w-full max-w-[1300px] flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ height: 'calc(100vh - 130px)' }}
        >
          <StepIndicator
            current={step}
            onClickStep={setStep}
            onBackClick={handleBackToList}
          />

          <main className="flex-1 overflow-y-auto scrollbar-hide p-6">
            {step === 1 && <PackageFormStep1 form={form} setForm={setForm} onNext={next} />}
            {step === 2 && <PackageFormStep2 form={form} setForm={setForm} onNext={next} onBack={back} />}
            {step === 3 && <PackageFormStep3 form={form} onBack={back} onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} />}
          </main>
        </div>
      </div>

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
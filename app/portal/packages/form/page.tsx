// app/portal/packages/form/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form"; 
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { packageFormSchema, PackageFormValues } from "@/lib/schemas/package-management";

// Components
import StepIndicator from "@/components/StepIndicator";
import PackageFormStep1 from "@/components/PackageFormStep1";
import PackageFormStep2 from "@/components/PackageFormStep2";
import PackageFormStep3 from "@/components/PackageFormStep3";
import { ConfirmationModal, DraftModal, SuccessModal, WarningModal } from '@/components/PackageModals';
import { PackageFormData } from "@/type/packages";
import { packageService } from "@/services/package-services"; 
import { useAppToast } from "@/hooks/use-app-toast";

const PackageFormPage = () => {
  const router = useRouter();
  const toast = useAppToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // edit
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  
  // Modals
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [showExpiringWarning, setShowExpiringWarning] = useState(false);

  // 1. INITIALIZE FORM
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
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
    },
    mode: "onChange"
  });

  // ---  CONDITIONAL SCROLL LOCK ---
  // Only lock scroll on Desktop (md breakpoint ~768px). 
  // On mobile, we want native body scrolling.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "auto"; 
    };
  }, []);

  useEffect(() => {
    const fetchPackageData = async () => {
        if (!editId) return;
        
        setIsLoadingData(true);
        try {
            let data = await packageService.getPackageById(Number(editId), "pending");
            
            if (!data)  data = await packageService.getPackageById(Number(editId));

            if (data) {
                form.reset({
                    packageName: data.name,
                    packageType: data.packageType,
                    nationality: data.nationality,
                    ageCategory: data.ageCategory, 
                    effectiveDate: data.effectiveDate,
                    lastValidDate: data.lastValidDate,
                    tpremark: data.remark,
                    imageID: data.imageUrl, 
                    imageUrl: data.imageUrl, 
                    dayPass: data.dayPass || "",
                    packageitems: data.items,
                    totalPrice: data.price || data.point || 0
                });
            } else {
                toast.error( "Error",  "Package not found.")
                router.push("/portal/packages");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Error","Failed to load package details.");
        } finally {
            setIsLoadingData(false);
        }
    };

    fetchPackageData();
  }, [editId, router, toast]);

  // Navigation
  const next = async () => {
    if (step === 1) {
          const valid = await form.trigger([
              "packageName", "packageType", "nationality", "ageCategory", 
              "effectiveDate", "lastValidDate", "dayPass", "tpremark", "imageID"
          ]);
          if (!valid) {
              toast.error("Validation Error", "Please fix the errors before proceeding.");
              return;
          }
      }
      setStep((s) => Math.min(s + 1, 3));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  // Handlers
  const handleCreateNew = () => {
    setShowSuccess(false);
    setShowDraft(false);
    form.reset(); 
    setStep(1);
  };

  const handleViewStatus = () => {
    setShowSuccess(false);
    router.push("/portal/packages");
  };

  const handleSaveDraft = async() => {
    const name = form.getValues("packageName");
    if (!name.trim()) {
        toast.info("Input Required",  "Package Name is required to save a draft.");
        return;
    }
      
    setIsSubmitting(true);
    const formData = form.getValues();
    
    try {
        let finalImageID : string | null = null;
        
        if (formData.imageID instanceof File) {
            finalImageID = await packageService.uploadImage(formData.imageID);
        } else if (typeof formData.imageID === "string" && formData.imageID) {
            finalImageID = formData.imageID;
        }

        const servicePayload: any = { ...formData, imageID: finalImageID };

        if (editId) {
          await packageService.saveDraft(servicePayload, finalImageID || "", Number(editId));
        } else {
          await packageService.saveDraft(servicePayload, finalImageID || "");
        }
        
        console.log("Package saved as draft successfully");
        setShowDraft(true);

    } catch (err) {
        console.error("Save Draft error:", err);
        toast.error( "Save Failed", err instanceof Error ? err.message : "Failed to save draft package.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const validateAndPrompt = () => {
      const lastValidDate = form.getValues("lastValidDate");
      const expiry = new Date(lastValidDate);
      const today = new Date();
      today.setHours(0,0,0,0);
      expiry.setHours(23,59,59,999);

      if (expiry < today) {
          toast.error("Invalid Date", "This package expires in the past. Please update Last Valid Date.");
          return;
      }

      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
          setShowExpiringWarning(true);
      } else {
          setShowConfirmation(true);
      }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    setShowExpiringWarning(false);
    setIsSubmitting(true);
    const formData = form.getValues();

    try {
      let finalImageID : string | null = null;

      if (formData.imageID instanceof File) {
        // Case 1: A new image was uploaded. Call API to upload, and store the returned string ID.
        finalImageID = await packageService.uploadImage(formData.imageID);
      } else if (typeof formData.imageID === "string" && formData.imageID) {
        // Case 2: An existing string ID (from editing/duplicating) is present.
        finalImageID = formData.imageID;
      }

      const servicePayload: any = { ...formData, imageID: finalImageID };

      if (editId) {
        await packageService.updatePackage(Number(editId), servicePayload, finalImageID || "");
      } else {
        await packageService.createPackage(servicePayload, finalImageID || "");
      }
      
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
      <div className="h-auto md:h-[calc(100vh-120px)] flex flex-col md:flex-row items-center justify-center px-0 md:px-8 pb-4 md:pb-8 pt-0 md:pt-4 w-full">
        <div 
          className="w-full max-w-[1300px] flex flex-col md:flex-row 
                     bg-white dark:bg-slate-900/50 dark:backdrop-blur-md 
                     text-card-foreground rounded-2xl shadow-2xl overflow-hidden 
                     border border-border dark:border-white/10 transition-colors duration-300
                     h-auto md:h-[calc(100vh-130px)]"
        >
          {/* Sidebar Indicator */}
          <StepIndicator
            current={step}
            onClickStep={setStep}
            onBackClick={() => router.push("/portal/packages")}
          />

          {/* Main Form Area */}
          <main className="flex-1 overflow-visible md:overflow-y-auto scrollbar-hide p-4 md:p-6 w-full">
            <Form {...form}>
                {step === 1 && <PackageFormStep1 form={form} onNext={next} />}
                    {step === 2 && <PackageFormStep2 form={form} onNext={next} onBack={back} />}
                    {step === 3 && (
                    <PackageFormStep3 
                        form={form} 
                        onBack={back} 
                        onSubmit={validateAndPrompt} 
                        onSaveDraft={handleSaveDraft} 
                    />
                )}
            </Form>
          </main>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
      />

      <WarningModal 
        isOpen={showExpiringWarning} 
        onConfirm={handleConfirmSubmit} 
        onCancel={() => setShowExpiringWarning(false)} 
        expiryDate={form.getValues("lastValidDate")}
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
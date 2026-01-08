// app/portal/packages/form/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form"; 
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { packageFormSchema, PackageFormValues } from "@/lib/schemas";

// Components
import StepIndicator from "@/components/StepIndicator";
import PackageFormStep1 from "@/components/PackageFormStep1";
import PackageFormStep2 from "@/components/PackageFormStep2";
import PackageFormStep3 from "@/components/PackageFormStep3";
import { ConfirmationModal, DraftModal, SuccessModal } from '@/components/PackageModals';
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

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
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

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
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
      <div className="h-[calc(100vh-120px)] flex items-center justify-center px-8 pb-8 pt-4">
        <div 
          className="w-full max-w-[1300px] flex flex-col md:flex-row 
                     bg-white dark:bg-slate-900/50 dark:backdrop-blur-md 
                     text-card-foreground rounded-2xl shadow-2xl overflow-hidden 
                     border border-border dark:border-white/10 transition-colors duration-300"
          style={{ height: 'calc(100vh - 130px)' }}
        >
          {/* Sidebar Indicator */}
          <StepIndicator
            current={step}
            onClickStep={setStep}
            onBackClick={() => router.push("/portal/packages")}
          />

          {/* Main Form Area */}
          <main className="flex-1 overflow-y-auto scrollbar-hide p-6">
            <Form {...form}>
                {step === 1 && <PackageFormStep1 form={form} onNext={next} />}
                    {step === 2 && <PackageFormStep2 form={form} onNext={next} onBack={back} />}
                    {step === 3 && (
                    <PackageFormStep3 
                        form={form} 
                        onBack={back} 
                        onSubmit={() => setShowConfirmation(true)} 
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
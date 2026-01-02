// app/portal/packages/form/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Components
import StepIndicator from "@/components/StepIndicator";
import PackageFormStep1 from "@/components/PackageFormStep1";
import PackageFormStep2 from "@/components/PackageFormStep2";
import PackageFormStep3 from "@/components/PackageFormStep3";
import { ConfirmationModal, DraftModal, SuccessModal } from '@/components/PackageModals';
import { PackageFormData } from "@/type/packages";
import { packageService } from "@/services/package-services"; 
import { useToast } from "@/hooks/use-toast";
import { LoaderState } from "@/components/ui/loader-state";

const PackageFormPage = () => {
  const router = useRouter();
  const { toast } = useToast();
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

  useEffect(() => {
    const fetchPackageData = async () => {
        if (!editId) return;
        
        setIsLoadingData(true);
        try {
            let data = await packageService.getPackageById(Number(editId), "pending");
            
            if (!data) {
                 data = await packageService.getPackageById(Number(editId));
            }

            if (data) {
                setForm({
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
                toast({ title: "Error", description: "Package not found.", variant: "destructive" });
                router.push("/portal/packages");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast({ title: "Error", description: "Failed to load package details.", variant: "destructive" });
        } finally {
            setIsLoadingData(false);
        }
    };

    fetchPackageData();
  }, [editId, router, toast]);

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

  const handleSaveDraft = async() => {
    if (!form.packageName.trim()) {
        toast({ title: "Input Required", 
          description: "Package Name is required to save a draft.", 
          variant: "default" });
        return;
    }
      
    setIsSubmitting(true);
    
    try {
        let finalImageID : string | null = null;
        
        if (form.imageID instanceof File) {
            finalImageID = await packageService.uploadImage(form.imageID);
        } else if (typeof form.imageID === "string" && form.imageID) {
            finalImageID = form.imageID;
        }

        if (editId) {
          await packageService.saveDraft(form, finalImageID || "", Number(editId));
        } else {
          await packageService.saveDraft(form, finalImageID || "");
        }
        
        console.log("Package saved as draft successfully");
        setShowDraft(true);

    } catch (err) {
        console.error("Save Draft error:", err);
        toast({ 
            title: "Save Failed", 
            description: err instanceof Error ? err.message : "Failed to save draft package.",
            variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      let finalImageID : string | null = null;

      if (form.imageID instanceof File) {
        // Case 1: A new image was uploaded. Call API to upload, and store the returned string ID.
        finalImageID = await packageService.uploadImage(form.imageID);
      } else if (typeof form.imageID === "string" && form.imageID) {
        // Case 2: An existing string ID (from editing/duplicating) is present.
        finalImageID = form.imageID;
      }

      if (editId) {
        await packageService.updatePackage(Number(editId), form, finalImageID || "");
      } else {
        await packageService.createPackage(form, finalImageID || "");
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
        {/* UPDATED CONTAINER STYLES:
           - bg-white (Light Mode)
           - dark:bg-slate-900/50 (Dark Mode): Deep semi-transparent background
           - dark:backdrop-blur-md: Adds a modern glass effect
           - dark:border-white/10: Adds a subtle border to define the card against the black page
        */}
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
//  src/components/StepIndicator.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

type Props = {
  current: number;
  onClickStep?: (n: number) => void;
  onBackClick?: () => void;
};

const steps = ["Package Type & Details", "Package Item", "Package Summary"];

const StepIndicator: React.FC<Props> = ({ current, onClickStep, onBackClick }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Watch window width safely
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // -------- MOBILE (Top Bar) Layout --------
  if (isMobile) {
    return (
      <div className="sticky top-0 z-50 bg-[linear-gradient(135deg,#E7E7FE_0%,#484BBC_80%)] text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            <span className="font-medium text-sm">Back</span>
          </button>

          <div className="flex items-center gap-2">
            {steps.map((_, i) => {
              const index = i + 1;
              const isActive = index === current;
              const isDone = index < current;
              return (
                <div
                  key={i}
                  className={`w-8 h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-white w-10"
                      : isDone
                      ? "bg-[#6D28D9]"
                      : "bg-white/40"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="text-center text-xs font-medium pb-2">
          {steps[current - 1]}
        </div>
      </div>
    );
  }

  // -------- DESKTOP / TABLET (Sidebar) Layout --------
  return (
    <aside className="sticky top-4 h-[calc(100vh-2rem)] w-60 md:w-64 lg:w-60 rounded-l-2xl bg-[linear-gradient(135deg,#E7E7FE_0%,#484BBC_80%)] text-white p-6 flex flex-col justify-between shadow-lg">
      {/* Top section */}
      <div className="mb-8">
        {/* Back button */}
        <button
          onClick={onBackClick}
          className="group relative flex items-center gap-2 text-white/80 hover:text-white transition-all duration-200 mb-6 ml-1"
        >
          {/* Hover circle effect */}
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center
                      w-8 h-8 rounded-full bg-white/25
                      opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100
                      transition-all duration-300"
          ></span>

          {/* Arrow icon */}
          <ArrowLeft
            size={18}
            className="relative z-10 ml-[10px] translate-y-[0.5px] drop-shadow-[0_0_3px_rgba(0,0,0,0.25)]"
          />

          {/* Label */}
          <span className="font-medium text-sm relative z-10">Back</span>
        </button>

        {/* Steps */}
        <div className="relative flex flex-col items-start gap-8 ml-2 mt-2">
          {/* Background vertical line */}
          <div className="absolute left-[1.25rem] top-[2.5rem] bottom-[2.5rem] w-[2px] " />

          {/* Progress line */}
          <div
            className="absolute left-[1.25rem] top-[2.5rem] w-[2px] bg-[#6D28D9] transition-all duration-500"
            style={{ height: `${(current - 1) * 72}px` }}
          />

          {steps.map((label, i) => {
            const index = i + 1;
            const isActive = index === current;
            const isDone = index < current;

            return (
              <button
                key={label}
                onClick={() => onClickStep?.(index)}
                disabled={index > current}
                className={`relative z-10 flex items-center gap-4 w-full text-left transition-all duration-200 ${
                  index > current ? "cursor-not-allowed opacity-50" : "hover:translate-x-1"
                }`}
              >
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-semibold shadow-md transition-all duration-300 ${
                    isActive
                      ? "bg-white text-[#6D28D9] ring-2 ring-white/70"
                      : isDone
                      ? "bg-[#6D28D9] text-white"
                      : "bg-white/30 text-white"
                  }`}
                >
                  {index}
                </div>

                <div
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "font-semibold text-white drop-shadow-md"
                      : isDone
                      ? "text-[#6D28D9]"
                      : "text-white/70"
                  }`}
                >
                  {label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-purple-100 text-center opacity-75">
        i-City Package Form Wizard
      </div>
    </aside>
  );
};

export default StepIndicator;

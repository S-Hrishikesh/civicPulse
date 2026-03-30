import React from 'react';
import { Check } from 'lucide-react';

const ProgressBar = ({ currentStatus }) => {
  const steps = ['Lodged', 'Assigned', 'In-Progress', 'Resolved'];
  
  // Custom logic to handle the index mapping
  let currentIndex = steps.indexOf(currentStatus);
  if (currentStatus === 'Closed') currentIndex = 3;

  return (
    <div className="w-full py-8 px-4">
      <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto">
        {/* Background line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors"></div>
        
        {/* Active Progress line */}
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
          style={{ width: `calc(${currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0}% - 2rem)` }}
        ></div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center border-[4px] transition-all duration-500 ${
                  isActive 
                    ? 'bg-emerald-500 border-white dark:border-slate-800 text-white shadow-lg shadow-emerald-500/40' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-500'
                } ${isCurrent ? 'ring-4 ring-emerald-500/20 dark:ring-emerald-500/40 scale-110' : ''}`}
              >
                {isActive ? <Check size={22} strokeWidth={3} className="animate-in zoom-in duration-300" /> : <span className="font-bold text-lg">{index + 1}</span>}
              </div>
              <span className={`absolute -bottom-8 w-28 text-center text-sm font-semibold transition-colors duration-300 ${
                isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'
              } ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;

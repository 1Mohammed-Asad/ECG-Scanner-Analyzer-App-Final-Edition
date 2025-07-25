


import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { TargetIcon } from './icons/TargetIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import Spinner from './Spinner';

interface AnalysisProgressProps {
  isProcessingPdf?: boolean;
}

const steps = [
  { 
    text: 'Validating Image Quality',
    subtext: 'Checking for artifacts, baseline wander, and interference.',
    icon: <FileTextIcon className="w-7 h-7" />,
    duration: 1200,
  },
  { 
    text: 'Extracting ECG Parameters',
    subtext: 'Measuring intervals, calculating cardiac axis, and identifying key waveforms.',
    icon: <TargetIcon className="w-7 h-7" />,
    duration: 1800,
  },
  { 
    text: 'Identifying Key Findings & Artifacts',
    subtext: 'Correlating data to detect clinical abnormalities and artifacts.',
    icon: <BrainCircuitIcon className="w-7 h-7" />,
    duration: 2000,
  },
  { 
    text: 'Synthesizing Final Diagnosis',
    subtext: 'Applying clinical reasoning, generating summary, and performing self-verification.',
    icon: <CheckCircleIcon className="w-7 h-7" />,
    duration: 2500,
  },
];

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ isProcessingPdf = false }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isProcessingPdf) return; // Don't start timers if we're in PDF mode

    let delay = 0;
    const timers = steps.map((step, index) => {
      delay += step.duration;
      return setTimeout(() => {
        // Prevent setting state if we are already at the last step
        if (index < steps.length -1) {
             setCurrentStep(index + 1);
        }
      }, delay);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isProcessingPdf]);

  const containerClasses = "flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-800/50 rounded-xl border border-slate-700 p-8";

  if (isProcessingPdf) {
    return (
      <div className={containerClasses}>
        <Spinner />
        <h2 className="text-2xl font-bold text-cyan-400 mt-6">Processing PDF...</h2>
        <p className="mt-2 text-slate-400">Extracting high-resolution ECG image.</p>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <h2 className="text-2xl font-bold text-cyan-400 mb-8">Performing AI Analysis...</h2>
      <div className="w-full max-w-lg space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isInProgress = index === currentStep;
          
          let iconToShow;
          let textColor = 'text-slate-500';

          if (isCompleted) {
            iconToShow = <CheckCircleIcon className="w-7 h-7 text-green-400" />;
            textColor = 'text-slate-300';
          } else if (isInProgress) {
            iconToShow = <div className="w-7 h-7 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-t-2 border-cyan-400" /></div>;
            textColor = 'text-cyan-300 font-semibold';
          } else {
            // For pending steps, show their thematic icon
            iconToShow = React.cloneElement(step.icon, { className: 'w-7 h-7 text-slate-600' });
          }

          return (
            <div key={index} className="flex items-start space-x-4 p-3 bg-slate-800 rounded-lg transition-all duration-300 animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center mt-1">{iconToShow}</div>
              <div>
                <p className={`text-lg transition-colors duration-300 ${textColor}`}>{step.text}</p>
                {isInProgress && <p className="text-sm text-cyan-400/80 animate-fade-in">{step.subtext}</p>}
                {isCompleted && <p className="text-sm text-slate-400">Done</p>}
              </div>
            </div>
          );
        })}
      </div>
       <p className="mt-8 text-slate-400 text-sm">This process involves multiple analytical steps for accuracy.</p>
    </div>
  );
};

export default AnalysisProgress;
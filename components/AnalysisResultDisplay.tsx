





import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, PatientInfo, Annotation } from '../types';
import { HeartbeatIcon } from './icons/HeartbeatIcon';
import { UserIcon } from './icons/UserIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { IdIcon } from './icons/IdIcon';
import { ZapIcon } from './icons/ZapIcon';
import { FileIcon } from './icons/FileIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { TargetIcon } from './icons/TargetIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import InteractiveEcgViewer from './InteractiveEcgViewer';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { ListIcon } from './icons/ListIcon';
import { InfoIcon } from './icons/InfoIcon';

type ReportTab = 'summary' | 'findings' | 'details';

interface AnalysisResultProps {
  result: AnalysisResult;
  patientInfo: PatientInfo;
  fileName: string;
  imageUrl: string;
  activeAnnotationIndex: number | null;
  onAnnotationSelect: (index: number | null) => void;
  hoveredAnnotationIndex: number | null;
  onAnnotationHover: (index: number | null) => void;
}

const TabButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 p-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
        isActive
          ? 'text-cyan-300 border-cyan-400 bg-cyan-900/10'
          : 'text-slate-400 border-transparent hover:bg-slate-700/50 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

const ParameterRow: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
    if (!value || value.toLowerCase() === 'n/a' || value.toLowerCase() === 'none') {
        return null;
    }
    return (
        <>
            <dt className="font-semibold text-slate-400">{label}</dt>
            <dd className="text-slate-200">{value}</dd>
        </>
    );
};

const CertaintyBadge: React.FC<{ certainty: Annotation['certainty'] }> = ({ certainty }) => {
    if (!certainty) return null;
    let color = 'text-green-400';
    if (certainty === 'Moderate') color = 'text-yellow-400';
    if (certainty === 'Low') color = 'text-orange-400';

    return (
        <span className={`text-xs font-semibold ${color}`}>
            ({certainty} Certainty)
        </span>
    );
};

const CriticalBanner: React.FC = () => {
  return (
    <div className="bg-red-900/40 border border-red-500/50 rounded-lg p-4 mb-4 flex items-center gap-4 animate-pulse">
      <AlertTriangleIcon className="w-10 h-10 text-red-300 flex-shrink-0" />
      <div>
        <h3 className="text-xl font-extrabold text-red-200 tracking-wider">IMMEDIATE ATTENTION REQUIRED</h3>
        <p className="text-sm text-red-300">The AI has detected a potentially life-threatening condition. Expedite clinical review.</p>
      </div>
    </div>
  );
};

const AnalysisNote: React.FC<{ note: string }> = ({ note }) => {
  return (
    <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-lg p-3 mb-4 flex items-start gap-3">
      <InfoIcon className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-yellow-200">Analysis Note</h4>
        <p className="text-sm text-yellow-300/90">{note}</p>
      </div>
    </div>
  );
};

const AnalysisResultDisplay: React.FC<AnalysisResultProps> = ({ result, patientInfo, fileName, imageUrl, activeAnnotationIndex, onAnnotationSelect, hoveredAnnotationIndex, onAnnotationHover }) => {
  const { diagnosis, summary, recommendation, ecgParameters, annotations, differentialDiagnosis, finalAudit } = result;
  
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const annotationRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // Scroll the active annotation into view.
    if (activeAnnotationIndex !== null && annotationRefs.current[activeAnnotationIndex]) {
        annotationRefs.current[activeAnnotationIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
        });
    }
  }, [activeAnnotationIndex]);

  
  const isContradiction = diagnosis.toUpperCase().includes('CONTRADICTION') || finalAudit.status === 'Fail';
  const isCritical = result.isCritical && !isContradiction;
  const isUninterpretable = diagnosis.toLowerCase() === 'uninterpretable';
  
  const clinicalAnnotations = (annotations || []).filter(a => a.category === 'clinical');
  const artifactAnnotations = (annotations || []).filter(a => a.category === 'artifact');

  const isNormalDiagnosis = (diagnosis.toLowerCase().includes('normal') || diagnosis.toLowerCase().includes('within normal limits') || diagnosis.toLowerCase().includes('sinus rhythm')) && !isContradiction;
  const isNormalAndClear = isNormalDiagnosis && clinicalAnnotations.length === 0 && !result.isCritical;
  
  return (
    <div className={`rounded-lg border border-slate-700 text-slate-200 animate-fade-in`}>
      {/* Tab Navigation */}
      <div className="flex bg-slate-800/80 backdrop-blur-sm rounded-t-lg border-b border-slate-700">
        <TabButton label="Summary" icon={<ClipboardListIcon className="w-5 h-5" />} isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
        <TabButton label="Findings" icon={<TargetIcon className="w-5 h-5" />} isActive={activeTab === 'findings'} onClick={() => setActiveTab('findings')} />
        <TabButton label="Details" icon={<ListIcon className="w-5 h-5" />} isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
      </div>

      <div className="p-5">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4 animate-fade-in">
             {result.analysisNote && <AnalysisNote note={result.analysisNote} />}
             {isCritical && <CriticalBanner />}
             {isNormalAndClear && (
                <div className="bg-green-900/40 border border-green-500/50 rounded-lg p-4 mb-2 flex items-center gap-4">
                  <ShieldCheckIcon className="w-10 h-10 text-green-300 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-green-200">Within Normal Limits</h3>
                    <p className="text-sm text-green-300">The AI analysis did not detect any significant clinical abnormalities.</p>
                  </div>
                </div>
              )}
            <SummaryHeader result={result} />
            <div className="space-y-1.5 text-slate-300">
                <div className="flex items-center gap-3"><UserIcon className="w-5 h-5 text-cyan-400" /><p><span className="font-semibold">Patient:</span> {patientInfo.name} ({patientInfo.age}, {patientInfo.gender})</p></div>
                <div className="flex items-center gap-3"><IdIcon className="w-5 h-5 text-cyan-400" /><p><span className="font-semibold">ID:</span> {patientInfo.id}</p></div>
            </div>
             {patientInfo.symptoms && (
              <div><h3 className="font-bold text-slate-100 mb-1 flex items-center gap-2"><FileTextIcon className="w-4 h-4 text-cyan-400" />Clinical Notes:</h3><p className="text-sm text-slate-300 pl-6">{patientInfo.symptoms}</p></div>
            )}
             <div><h3 className="font-bold text-slate-100 mb-1">Summary:</h3><p className="text-sm text-slate-300">{summary}</p></div>
             <div><h3 className="font-bold text-slate-100 mb-1">Recommendation:</h3><p className={`text-sm font-bold ${isCritical || isContradiction ? 'text-red-200' : 'text-green-300'}`}>{recommendation}</p></div>
             <SummaryMetrics result={result} />
          </div>
        )}
        
        {/* Findings Tab */}
        {activeTab === 'findings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
                {/* Left side: Findings List */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {clinicalAnnotations.length > 0 && (
                      <div>
                          <h3 className="font-bold text-slate-100 mb-2 flex items-center gap-2"><TargetIcon className="w-4 h-4 text-cyan-400" />Key Clinical Findings</h3>
                          <ul className="space-y-2" onMouseLeave={() => onAnnotationHover(null)}>
                              {clinicalAnnotations.map((annotation, index) => {
                                  const originalIndex = annotations.findIndex(a => a === annotation);
                                  return (
                                    <li ref={el => { if (el) annotationRefs.current[originalIndex] = el; }} key={originalIndex} onClick={() => onAnnotationSelect(originalIndex === activeAnnotationIndex ? null : originalIndex)} onMouseEnter={() => onAnnotationHover(originalIndex)} className={`p-2 rounded-md cursor-pointer transition-colors duration-200 ${originalIndex === activeAnnotationIndex ? 'bg-cyan-600/50' : 'bg-slate-700/50 hover:bg-slate-600/50'}`}>
                                        <p className="font-semibold text-cyan-300 text-sm flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_1px_rgba(34,211,238,0.7)] flex-shrink-0"></span>
                                            {annotation.label}
                                            <CertaintyBadge certainty={annotation.certainty || 'High'} />
                                        </p>
                                        <p className="text-xs text-slate-400 pl-4">{annotation.description}</p>
                                    </li>
                                  )
                              })}
                          </ul>
                      </div>
                    )}
                     {artifactAnnotations.length > 0 && (
                        <div className="bg-orange-900/30 border border-orange-500/40 rounded-lg p-3">
                            <h3 className="font-bold text-orange-200 mb-2 flex items-center gap-2"><AlertTriangleIcon className="w-5 h-5" />Detected Image Artifacts</h3>
                            <ul className="space-y-2" onMouseLeave={() => onAnnotationHover(null)}>
                                {artifactAnnotations.map((annotation, index) => {
                                    const originalIndex = annotations.findIndex(a => a === annotation);
                                    return (
                                        <li ref={el => { if(el) annotationRefs.current[originalIndex] = el; }} key={originalIndex} onClick={() => onAnnotationSelect(originalIndex === activeAnnotationIndex ? null : originalIndex)} onMouseEnter={() => onAnnotationHover(originalIndex)} className={`p-2 rounded-md cursor-pointer transition-colors duration-200 ${originalIndex === activeAnnotationIndex ? 'bg-orange-600/50' : 'bg-slate-700/50 hover:bg-slate-600/50'}`}>
                                            <p className="font-semibold text-orange-300 text-sm flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_6px_1px_rgba(251,146,60,0.7)] flex-shrink-0"></span>
                                                {annotation.label}
                                                <CertaintyBadge certainty={annotation.certainty || 'High'} />
                                            </p>
                                            <p className="text-xs text-slate-400 pl-4">{annotation.description}</p>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                     )}
                     {(clinicalAnnotations.length === 0 && artifactAnnotations.length === 0) && (
                         <div className="text-center p-8 bg-slate-900/50 rounded-lg border border-dashed border-slate-700"><p className="text-slate-400">No specific findings or artifacts were annotated for this ECG.</p></div>
                     )}
                </div>
                {/* Right side: ECG Viewer */}
                <div>
                    <InteractiveEcgViewer imageUrl={imageUrl} annotations={annotations || []} activeAnnotationIndex={activeAnnotationIndex} hoveredAnnotationIndex={hoveredAnnotationIndex} onAnnotationSelect={onAnnotationSelect} />
                </div>
            </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
           <div className="space-y-6 animate-fade-in">
                {/* ECG Parameters */}
                <div>
                  <h3 className="font-bold text-slate-100 mb-2">ECG Parameters:</h3>
                  <dl className="grid grid-cols-[max-content,1fr] gap-x-4 gap-y-1.5 text-sm bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                      <ParameterRow label="Heart Rate" value={ecgParameters.hr} />
                      <ParameterRow label="Rhythm" value={ecgParameters.rhythm} />
                      <ParameterRow label="Axis" value={ecgParameters.axis} />
                      <ParameterRow label="PR Interval" value={ecgParameters.prInterval} />
                      <ParameterRow label="QRS Complex" value={ecgParameters.qrsComplex} />
                      <ParameterRow label="QT/QTc Interval" value={ecgParameters.qtInterval} />
                      <ParameterRow label="ST Deviations" value={ecgParameters.stDeviations} />
                      <ParameterRow label="T-Wave Abnormalities" value={ecgParameters.tWaveAbnormalities} />
                      <ParameterRow label="Other Findings" value={ecgParameters.otherFindings} />
                  </dl>
                </div>
                {/* AI Reasoning */}
                 {differentialDiagnosis && differentialDiagnosis.length > 0 && (
                   <div>
                      <h3 className="font-bold text-slate-100 mb-2 flex items-center gap-2"><BrainCircuitIcon className="w-5 h-5 text-cyan-400" />AI Clinical Reasoning</h3>
                      <ul className="space-y-2">
                          {differentialDiagnosis.map((item, index) => (
                              <li key={index} className="bg-slate-900/40 p-2 rounded-md border border-slate-700/50"><p className="font-semibold text-slate-300 text-sm">{item.diagnosis}</p><p className="text-xs text-slate-400 mt-1"><span className="font-semibold">Rationale:</span> {item.rationale}</p></li>
                          ))}
                      </ul>
                  </div>
                 )}
                 {/* Final Audit */}
                 {finalAudit && (
                    <div>
                         <h3 className="font-bold text-slate-100 mb-2 flex items-center gap-2">
                            {finalAudit.status === 'Pass' ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <AlertTriangleIcon className="w-5 h-5 text-orange-400" />}
                            AI Final Audit
                        </h3>
                        <div className={`p-3 rounded-md border ${finalAudit.status === 'Pass' ? 'bg-green-900/30 border-green-500/40' : 'bg-orange-900/30 border-orange-500/40'}`}>
                            <p className={`font-bold text-sm ${finalAudit.status === 'Pass' ? 'text-green-300' : 'text-orange-300'}`}>
                                Status: {finalAudit.status}
                            </p>
                            <p className="text-sm text-slate-300">{finalAudit.rationale}</p>
                        </div>
                    </div>
                 )}
                 {/* Scanned File */}
                 <div className="flex items-center gap-2 text-xs text-slate-500 justify-center pt-2 border-t border-slate-700/50">
                   <FileIcon className="w-4 h-4" /><span>Scanned File: {fileName}</span>
                </div>
           </div>
        )}
      </div>
    </div>
  );
};

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
    let text = "Low Confidence";
    if (confidence >= 0.9) {
        text = "High Confidence";
    } else if (confidence >= 0.7) {
        text = "Moderate Confidence";
    }
    return <span className="text-xs font-semibold">({text})</span>;
};

// Sub-components for better organization
const SummaryHeader: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const { diagnosis, isCritical, finalAudit } = result;
    const isContradiction = diagnosis.toUpperCase().includes('CONTRADICTION') || finalAudit?.status === 'Fail';
    const isUninterpretable = diagnosis.toLowerCase() === 'uninterpretable';
    let finalDiagnosis = diagnosis;

    let titleColor = 'text-green-400';
    let diagnosisIcon = <ShieldCheckIcon className="w-9 h-9 text-green-400 flex-shrink-0"/>;

    if (isContradiction) {
      titleColor = 'text-orange-300';
      diagnosisIcon = <AlertTriangleIcon className="w-9 h-9 text-orange-400 flex-shrink-0" />;
      finalDiagnosis = 'CRITICAL CONTRADICTION';
    } else if (isUninterpretable) {
      titleColor = 'text-yellow-400';
      diagnosisIcon = <QuestionMarkCircleIcon className="w-9 h-9 text-yellow-400 flex-shrink-0" />;
    } else if (isCritical) {
      titleColor = 'text-red-300';
      diagnosisIcon = <AlertTriangleIcon className="w-9 h-9 text-red-400 flex-shrink-0"/>;
    }
    
    return (
        <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3">
                {diagnosisIcon}
                <h2 className={`text-2xl font-bold ${titleColor}`}>{finalDiagnosis}</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0 pt-1">
              <ClockIcon className="w-4 h-4" />
              <span>{new Date().toLocaleString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
        </div>
    );
};

const SummaryMetrics: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    const { confidence, emergencyLevel, heartRateBPM, isCritical, diagnosis, finalAudit } = result;
    const isContradiction = diagnosis.toUpperCase().includes('CONTRADICTION') || finalAudit?.status === 'Fail';
    
    let confidenceColor = 'text-orange-400';
    if (confidence >= 0.9) confidenceColor = 'text-green-400';
    else if (confidence >= 0.7) confidenceColor = 'text-yellow-400';

    return (
        <div className="bg-black/20 rounded-lg p-2 flex justify-around items-center text-center mt-3">
            <div className="text-sm">
                <div className="flex items-center gap-1.5 justify-center text-slate-400"><ShieldCheckIcon className="w-4 h-4"/><span>Conf:</span></div>
                <p className={`font-bold text-base flex items-center justify-center gap-1 ${confidenceColor}`}>
                    <span>{(confidence * 100).toFixed(1)}%</span>
                    <ConfidenceBadge confidence={confidence} />
                </p>
            </div>
            <div className="text-sm"><div className="flex items-center gap-1.5 justify-center text-slate-400"><ZapIcon className="w-4 h-4"/><span>Emergency:</span></div><p className={`font-bold text-base ${isCritical || isContradiction ? 'text-red-400' : 'text-green-400'}`}>{emergencyLevel}%</p></div>
            <div className="text-sm"><div className="flex items-center gap-1.5 justify-center text-slate-400"><HeartbeatIcon className="w-4 h-4"/><span>Rate:</span></div><p className="font-bold text-base text-white">{heartRateBPM} BPM</p></div>
        </div>
    );
};

export default AnalysisResultDisplay;
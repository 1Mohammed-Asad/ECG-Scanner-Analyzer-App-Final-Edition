import React, { useState } from 'react';
import { ScanHistoryItem, PatientInfo, AnalysisResult, DifferentialDiagnosis } from '../types';
import PatientForm from './PatientForm';

interface EditScanModalProps {
    scanItem: ScanHistoryItem;
    onSave: (updatedItem: ScanHistoryItem) => void;
    onClose: () => void;
}

const inputStyles = "w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50";
const labelStyles = "block text-sm font-medium text-slate-300 mb-1";
const textareaStyles = `${inputStyles} h-24`;

const EditScanModal: React.FC<EditScanModalProps> = ({ scanItem, onSave, onClose }) => {
    const [patientInfo, setPatientInfo] = useState<PatientInfo>(scanItem.patientInfo);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(scanItem.analysisResult);

    const handleSave = () => {
        const updatedScanItem = {
            ...scanItem,
            patientInfo: patientInfo,
            analysisResult: analysisResult,
        };
        onSave(updatedScanItem);
    };

    const handleAnalysisChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number | boolean | null = value;

        if (type === 'number') {
            const parsedValue = parseFloat(value);
            finalValue = isNaN(parsedValue) ? 0 : parsedValue;
        } else if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        }
        
        setAnalysisResult(prev => ({
            ...prev,
            [name]: finalValue,
        }));
    };
    
    const handleFinalAuditChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
        setAnalysisResult(prev => ({
            ...prev,
            finalAudit: {
                ...prev.finalAudit,
                [e.target.name]: e.target.value,
            }
        }))
    };

    const handleEcgParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setAnalysisResult(prev => ({
            ...prev,
            ecgParameters: {
                ...prev.ecgParameters,
                [e.target.name]: e.target.value,
            }
        }));
    };
    
    const handleDifferentialChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const lines = e.target.value.split('\n');
        const newDifferential: DifferentialDiagnosis[] = lines.map(line => {
            const parts = line.split('::');
            const diagnosis = parts[0]?.trim() || '';
            const rationale = parts[1]?.trim() || 'No rationale provided.';
            if (!diagnosis) return null;
            return { diagnosis, rationale };
        }).filter((item): item is DifferentialDiagnosis => item !== null);
        
        setAnalysisResult(prev => ({ ...prev, differentialDiagnosis: newDifferential }));
    };
    
    const differentialDiagnosisString = (analysisResult.differentialDiagnosis || [])
        .map(d => `${d.diagnosis} :: ${d.rationale}`)
        .join('\n');


    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-lg max-w-2xl w-full shadow-lg border border-slate-700 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cyan-300">Edit Scan Record</h2>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    {/* Patient Info Section */}
                    <PatientForm 
                        patientInfo={patientInfo} 
                        onFormChange={setPatientInfo}
                        disabled={false} 
                    />

                    {/* Analysis Result Section */}
                    <div className="pt-6 border-t border-slate-700">
                        <h3 className="text-lg font-semibold text-cyan-300 mb-4">Analysis Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="diagnosis" className={labelStyles}>Diagnosis</label>
                                <input type="text" name="diagnosis" id="diagnosis" value={analysisResult.diagnosis} onChange={handleAnalysisChange} className={inputStyles} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="heartRateBPM" className={labelStyles}>Heart Rate (BPM)</label>
                                    <input type="number" name="heartRateBPM" id="heartRateBPM" value={analysisResult.heartRateBPM} onChange={handleAnalysisChange} className={inputStyles} />
                                </div>
                                <div className="flex items-center pt-6">
                                    <input type="checkbox" name="isCritical" id="isCritical" checked={analysisResult.isCritical} onChange={handleAnalysisChange} className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                                    <label htmlFor="isCritical" className="ml-2 block text-sm text-slate-300">Is Critical?</label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="confidence" className={labelStyles}>Confidence (0.0 - 1.0)</label>
                                    <input type="number" name="confidence" id="confidence" value={analysisResult.confidence} onChange={handleAnalysisChange} className={inputStyles} step="0.01" min="0" max="1" />
                                </div>
                                <div>
                                    <label htmlFor="emergencyLevel" className={labelStyles}>Emergency Level (0 - 100)</label>
                                    <input type="number" name="emergencyLevel" id="emergencyLevel" value={analysisResult.emergencyLevel} onChange={handleAnalysisChange} className={inputStyles} min="0" max="100" />
                                </div>
                            </div>
                           
                            <div>
                                <label htmlFor="summary" className={labelStyles}>Summary</label>
                                <textarea name="summary" id="summary" value={analysisResult.summary} onChange={handleAnalysisChange} className={textareaStyles} />
                            </div>
                            <div>
                                <label htmlFor="recommendation" className={labelStyles}>Recommendation</label>
                                <textarea name="recommendation" id="recommendation" value={analysisResult.recommendation} onChange={handleAnalysisChange} className={textareaStyles} />
                            </div>
                             <div>
                                <label htmlFor="analysisNote" className={labelStyles}>Analysis Note (Optional)</label>
                                <textarea name="analysisNote" id="analysisNote" value={analysisResult.analysisNote || ''} onChange={(e) => setAnalysisResult(prev => ({...prev, analysisNote: e.target.value}))} className={textareaStyles} placeholder="Note on any limitations of the analysis..."/>
                            </div>
                            <div>
                                <label htmlFor="differentialDiagnosis" className={labelStyles}>Differential Diagnosis & Rationale</label>
                                <textarea 
                                    name="differentialDiagnosis" 
                                    id="differentialDiagnosis" 
                                    value={differentialDiagnosisString} 
                                    onChange={handleDifferentialChange}
                                    className={textareaStyles}
                                    placeholder="Diagnosis Name :: Rationale for consideration (one per line)"
                                />
                                <p className="text-xs text-slate-500 mt-1">Format: `Diagnosis :: Rationale` on each line.</p>
                            </div>
                            
                            {/* Final Audit Section */}
                            <div className="pt-4 border-t border-dashed border-slate-600">
                                <h4 className="text-md font-semibold text-cyan-400 mb-2">Final Audit</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="status" className={labelStyles}>Audit Status</label>
                                        <select name="status" id="status" value={analysisResult.finalAudit?.status || 'Pass'} onChange={handleFinalAuditChange} className={inputStyles}>
                                            <option value="Pass">Pass</option>
                                            <option value="Fail">Fail</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label htmlFor="rationale" className={labelStyles}>Audit Rationale</label>
                                    <textarea name="rationale" id="rationale" value={analysisResult.finalAudit?.rationale || ''} onChange={handleFinalAuditChange} className={`${inputStyles} h-20`} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* ECG Parameters Section */}
                    <div className="pt-6 border-t border-slate-700">
                         <h3 className="text-lg font-semibold text-cyan-300 mb-4">ECG Parameters</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label htmlFor="hr" className={labelStyles}>HR</label>
                               <input type="text" name="hr" id="hr" value={analysisResult.ecgParameters.hr} onChange={handleEcgParamChange} className={inputStyles} />
                            </div>
                             <div>
                               <label htmlFor="rhythm" className={labelStyles}>Rhythm</label>
                               <input type="text" name="rhythm" id="rhythm" value={analysisResult.ecgParameters.rhythm} onChange={handleEcgParamChange} className={inputStyles} />
                            </div>
                             <div>
                               <label htmlFor="axis" className={labelStyles}>Axis</label>
                               <input type="text" name="axis" id="axis" value={analysisResult.ecgParameters.axis} onChange={handleEcgParamChange} className={inputStyles} />
                            </div>
                            <div>
                               <label htmlFor="prInterval" className={labelStyles}>PR Interval</label>
                               <input type="text" name="prInterval" id="prInterval" value={analysisResult.ecgParameters.prInterval} onChange={handleEcgParamChange} className={inputStyles} />
                            </div>
                            <div>
                               <label htmlFor="qrsComplex" className={labelStyles}>QRS Complex</label>
                               <input type="text" name="qrsComplex" id="qrsComplex" value={analysisResult.ecgParameters.qrsComplex} onChange={handleEcgParamChange} className={inputStyles} />
                            </div>
                            <div>
                               <label htmlFor="qtInterval" className={labelStyles}>QT/QTc Interval</label>
                               <input type="text" name="qtInterval" id="qtInterval" value={analysisResult.ecgParameters.qtInterval} onChange={handleEcgParamChange} className={inputStyles} />
                            </div>
                         </div>
                         <div className="space-y-4 mt-4">
                            <div>
                               <label htmlFor="stDeviations" className={labelStyles}>ST Deviations</label>
                               <textarea name="stDeviations" id="stDeviations" value={analysisResult.ecgParameters.stDeviations} onChange={handleEcgParamChange} className={`${inputStyles} h-20`} />
                            </div>
                             <div>
                               <label htmlFor="tWaveAbnormalities" className={labelStyles}>T-Wave Abnormalities</label>
                               <textarea name="tWaveAbnormalities" id="tWaveAbnormalities" value={analysisResult.ecgParameters.tWaveAbnormalities} onChange={handleEcgParamChange} className={`${inputStyles} h-20`} />
                            </div>
                            <div>
                               <label htmlFor="otherFindings" className={labelStyles}>Other Findings</label>
                               <textarea name="otherFindings" id="otherFindings" value={analysisResult.ecgParameters.otherFindings} onChange={handleEcgParamChange} className={`${inputStyles} h-20`} />
                            </div>
                         </div>
                    </div>
                </div>

                <div className="p-6 flex justify-end space-x-3 border-t border-slate-700 bg-slate-800/50 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-white font-semibold transition">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditScanModal;
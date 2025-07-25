
import React, { useRef } from 'react';
import { PatientInfo, ScanHistoryItem, AnalysisResult } from '../types';
import PatientForm from './PatientForm';
import AnalysisResultDisplay from './AnalysisResultDisplay';
import { UploadIcon } from './icons/UploadIcon';
import { HeartbeatIcon } from './icons/HeartbeatIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { createSingleReportHtml, generateHtmlAndDownload } from '../services/htmlExportService';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { XIcon } from './icons/XIcon';
import * as pdfjsLib from 'pdfjs-dist';
import AnalysisProgress from './AnalysisProgress';
import { useScannerState } from '../hooks/useScannerState';
import * as storage from '../services/storageService';


interface ScannerViewProps {
    onAnalysisComplete: (patientInfo: PatientInfo, analysisResult: AnalysisResult, imageDataUrl: string) => void;
    analyzeEcgImage: (imageDataUrl: string, patientInfo: PatientInfo, correctionExamples: ScanHistoryItem[]) => Promise<AnalysisResult>;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onAnalysisComplete, analyzeEcgImage }) => {
    const [state, dispatch] = useScannerState();
    const { status, patientInfo, selectedFile, selectedImagePreview, analysisResult, error, activeAnnotationIndex, hoveredAnnotationIndex } = state;
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isFormComplete = patientInfo.name && patientInfo.id && patientInfo.age && patientInfo.gender && selectedFile;
    const isLoading = status === 'analyzing' || status === 'processingPdf';

    const handleReset = () => {
        dispatch({ type: 'RESET' });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClearFile = () => {
        dispatch({ type: 'CLEAR_FILE' });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileSelect = async (file: File) => {
        if (isLoading || !file) return;
        
        dispatch({ type: 'FILE_SELECT_START', payload: file });

        if (file.type === 'application/pdf') {
            try {
                const fileBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument(fileBuffer).promise;
                const page = await pdf.getPage(1); // Get the first page
                const viewport = page.getViewport({ scale: 2.5 }); // Increase scale for higher quality
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) {
                    throw new Error('Could not get canvas context');
                }

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                dispatch({ type: 'PDF_PROCESSING_COMPLETE', payload: dataUrl });
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : 'Could not process PDF file.';
                 dispatch({ type: 'ANALYSIS_ERROR', payload: `PDF Error: ${errorMessage}`});
            }
        } else { // It's an image
            const reader = new FileReader();
            reader.onloadend = () => {
                dispatch({ type: 'IMAGE_PROCESSING_COMPLETE', payload: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyzeClick = () => {
        if (!isFormComplete || !selectedImagePreview) return;
        
        dispatch({ type: 'START_ANALYSIS' });
        
        // Get correction examples from storage to help the AI learn.
        const correctionExamples = storage.getCorrectionExamples();
        
        analyzeEcgImage(selectedImagePreview, patientInfo, correctionExamples)
            .then(result => {
                dispatch({ type: 'ANALYSIS_SUCCESS', payload: result });
                onAnalysisComplete(patientInfo, result, selectedImagePreview);
            })
            .catch(err => {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                dispatch({ type: 'ANALYSIS_ERROR', payload: errorMessage });
            });
    };
    
    const handleDownloadReport = () => {
        if (!analysisResult || !selectedImagePreview) return;
        
        const scanForReport: ScanHistoryItem = {
            scanId: 'current_scan',
            patientInfo,
            analysisResult,
            ecgImageBase64: selectedImagePreview,
            timestamp: new Date().toISOString(),
        };

        const htmlContent = createSingleReportHtml(scanForReport);
        const fileName = `ECG_Report_${scanForReport.patientInfo.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
        generateHtmlAndDownload(htmlContent, fileName);
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading) setIsDragging(isEntering);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false);
        if (!isLoading && e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    const dropzoneClasses = `border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer bg-slate-800/50 transition-all duration-300
        ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:border-cyan-500 hover:bg-slate-700/50'}
        ${isDragging ? 'border-cyan-400 bg-slate-700/50 scale-105 shadow-lg' : ''}
    `;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fade-in">
            {/* Left Column: Form and Upload */}
            <div className="w-full bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 space-y-6">
                <h2 className="text-2xl font-bold text-cyan-400">New Scan</h2>
                <PatientForm patientInfo={patientInfo} onFormChange={(info) => dispatch({ type: 'SET_PATIENT_INFO', payload: info })} disabled={isLoading} />
                
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 mb-2">Upload ECG File</h3>
                  <div 
                    className={dropzoneClasses}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => handleDragEvents(e, true)}
                    onDragLeave={(e) => handleDragEvents(e, false)}
                    onDragOver={(e) => handleDragEvents(e, true)}
                    onDrop={handleDrop}
                  >
                    <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) { handleFileSelect(e.target.files[0]); } }} className="hidden" accept="image/png,image/jpeg,image/webp,image/heic,application/pdf" disabled={isLoading} />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <UploadIcon className="w-10 h-10 text-slate-500 mb-3"/>
                        <p className="text-slate-400">
                            <span className="font-semibold text-cyan-400">Upload a file</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP, HEIC & PDF files</p>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="text-sm text-slate-400 mt-2 text-center flex justify-center items-center gap-2 bg-slate-700/50 py-1.5 px-3 rounded-md">
                        <span className="truncate">Selected: <span className="font-medium text-cyan-300">{selectedFile.name}</span></span>
                        <button onClick={handleClearFile} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0" title="Remove file" disabled={isLoading}>
                            <XIcon className="w-4 h-4"/>
                        </button>
                    </div>
                  )}
                </div>

                <button 
                    onClick={handleAnalyzeClick} 
                    disabled={!isFormComplete || isLoading}
                    className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 flex items-center justify-center text-lg"
                >
                    {status === 'processingPdf' ? 'Processing PDF...' : status === 'analyzing' ? 'Analyzing...' : 'Analyze ECG Now'}
                </button>
            </div>

            {/* Right Column: Results */}
            <div className="w-full space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-cyan-400 text-center lg:text-left">AI Analysis Report</h2>
                     {analysisResult && !isLoading && (
                        <div className="flex items-center space-x-2">
                             <button 
                                onClick={handleDownloadReport} 
                                className="flex items-center space-x-2 bg-slate-700 hover:bg-cyan-700 text-slate-200 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
                            >
                                <FileTextIcon className="w-4 h-4" />
                                <span>Download</span>
                            </button>
                            <button 
                                onClick={handleReset} 
                                className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
                            >
                                <RefreshCwIcon className="w-4 h-4" />
                                <span>New Scan</span>
                            </button>
                        </div>
                     )}
                </div>
                {(status === 'analyzing' || status === 'processingPdf') && (
                    <AnalysisProgress isProcessingPdf={status === 'processingPdf'} />
                )}
                 
                <div className="space-y-6">
                  {status === 'error' && error && (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-red-900/20 border border-red-500/50 rounded-lg p-4 animate-fade-in text-center">
                        <AlertTriangleIcon className="w-12 h-12 text-red-400 mb-4" />
                        <p className="text-red-300 font-semibold text-lg">Analysis Error</p>
                        <p className="text-red-400 max-w-md">{error}</p>
                      </div>
                  )}

                  {status === 'success' && analysisResult && selectedFile && selectedImagePreview && (
                      <AnalysisResultDisplay 
                        result={analysisResult} 
                        patientInfo={patientInfo} 
                        fileName={selectedFile.name}
                        imageUrl={selectedImagePreview}
                        activeAnnotationIndex={activeAnnotationIndex}
                        onAnnotationSelect={(index) => dispatch({ type: 'SET_ACTIVE_ANNOTATION', payload: index })}
                        hoveredAnnotationIndex={hoveredAnnotationIndex}
                        onAnnotationHover={(index) => dispatch({ type: 'SET_HOVERED_ANNOTATION', payload: index })}
                       />
                  )}
                  
                   {selectedImagePreview && !analysisResult && !error && !isLoading && (
                       <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Scanned File Preview</h3>
                            <img src={selectedImagePreview} alt="Selected ECG" className="rounded-lg w-full object-contain max-h-96 bg-black" />
                       </div>
                  )}

                </div>
                
                {status === 'idle' && !selectedImagePreview && (
                  <>
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 animate-pulse-border">
                        <HeartbeatIcon className="w-20 h-20 text-slate-700" />
                        <p className="mt-4 text-lg font-medium">Awaiting analysis</p>
                        <p className="text-slate-600">Complete the form and upload an ECG to begin.</p>
                    </div>
                  </>
                )}
            </div>
        </div>
    );
};

export default ScannerView;

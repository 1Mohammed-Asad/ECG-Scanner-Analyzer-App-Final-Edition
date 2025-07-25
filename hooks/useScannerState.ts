import { useReducer } from 'react';
import { PatientInfo, AnalysisResult, Annotation } from '../types';

type ScannerStatus = 'idle' | 'processingPdf' | 'analyzing' | 'success' | 'error';

interface ScannerState {
  status: ScannerStatus;
  patientInfo: PatientInfo;
  selectedFile: File | null;
  selectedImagePreview: string | null;
  analysisResult: AnalysisResult | null;
  error: string | null;
  activeAnnotationIndex: number | null;
  hoveredAnnotationIndex: number | null;
}

type ScannerAction =
  | { type: 'SET_PATIENT_INFO'; payload: PatientInfo }
  | { type: 'FILE_SELECT_START'; payload: File }
  | { type: 'PDF_PROCESSING_COMPLETE'; payload: string }
  | { type: 'IMAGE_PROCESSING_COMPLETE'; payload: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'ANALYSIS_SUCCESS'; payload: AnalysisResult }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'SET_ACTIVE_ANNOTATION'; payload: number | null }
  | { type: 'SET_HOVERED_ANNOTATION'; payload: number | null }
  | { type: 'CLEAR_FILE' }
  | { type: 'RESET' };

const initialState: ScannerState = {
  status: 'idle',
  patientInfo: { name: '', id: '', age: '', gender: '', symptoms: '' },
  selectedFile: null,
  selectedImagePreview: null,
  analysisResult: null,
  error: null,
  activeAnnotationIndex: null,
  hoveredAnnotationIndex: null,
};

function scannerReducer(state: ScannerState, action: ScannerAction): ScannerState {
  switch (action.type) {
    case 'SET_PATIENT_INFO':
      return { ...state, patientInfo: action.payload };
    case 'FILE_SELECT_START':
      return {
        ...initialState,
        patientInfo: state.patientInfo,
        selectedFile: action.payload,
        status: action.payload.type === 'application/pdf' ? 'processingPdf' : 'idle',
      };
    case 'PDF_PROCESSING_COMPLETE':
      return { ...state, status: 'idle', selectedImagePreview: action.payload };
    case 'IMAGE_PROCESSING_COMPLETE':
      return { ...state, selectedImagePreview: action.payload };
    case 'START_ANALYSIS':
      return {
        ...state,
        status: 'analyzing',
        error: null,
        analysisResult: null,
        activeAnnotationIndex: null,
        hoveredAnnotationIndex: null,
      };
    case 'ANALYSIS_SUCCESS':
      return { ...state, status: 'success', analysisResult: action.payload };
    case 'ANALYSIS_ERROR':
      return { ...state, status: 'error', error: action.payload, analysisResult: null };
    case 'SET_ACTIVE_ANNOTATION':
      return { ...state, activeAnnotationIndex: action.payload };
    case 'SET_HOVERED_ANNOTATION':
        return { ...state, hoveredAnnotationIndex: action.payload };
    case 'CLEAR_FILE':
        return {
            ...state,
            selectedFile: null,
            selectedImagePreview: null,
            analysisResult: null,
            error: null,
            activeAnnotationIndex: null,
            hoveredAnnotationIndex: null,
            status: 'idle',
        };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export const useScannerState = () => {
    return useReducer(scannerReducer, initialState);
};

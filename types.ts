export type AppView = 'scanner' | 'history';

export interface User {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface PatientInfo {
  name:string;
  id: string;
  age: string;
  gender: 'Male' | 'Female' | '';
  symptoms?: string;
}

export interface EcgParameters {
  hr: string; // e.g., "75 bpm"
  rhythm: string; // e.g., "Normal Sinus Rhythm"
  axis: string; // e.g., "Normal axis"
  prInterval: string; // e.g., "160 ms"
  qrsComplex: string; // e.g., "80 ms, Narrow"
  qtInterval: string; // e.g., "400 ms (QTc: 420 ms)"
  stDeviations: string; // e.g., "ST elevation >2mm in V2, V3. ST depression in II, aVF." or "None"
  tWaveAbnormalities: string; // e.g., "Peaked T-waves in V2-V4. Inverted T-waves in III." or "None"
  otherFindings: string; // e.g., "Pathological Q-waves in V1-V2. Left Ventricular Hypertrophy." or "None"
}

export interface BoundingBox {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
}

export interface Annotation {
    label: string;
    description: string;
    boundingBox: BoundingBox;
    category: 'clinical' | 'artifact';
    certainty: 'High' | 'Moderate' | 'Low';
    annotationType: 'point' | 'segment' | 'area';
}

export interface DifferentialDiagnosis {
    diagnosis: string;
    rationale: string;
}

export interface FinalAudit {
    status: 'Pass' | 'Fail';
    rationale: string;
}

export interface AnalysisResult {
  diagnosis: string;
  summary: string;
  recommendation: string;
  analysisNote?: string; // e.g., "Comprehensive assessment of ST segments is limited by baseline wander."
  confidence: number;
  emergencyLevel: number; // A score from 1-100
  heartRateBPM: number;
  isCritical: boolean;
  ecgParameters: EcgParameters;
  annotations: Annotation[];
  differentialDiagnosis: DifferentialDiagnosis[];
  finalAudit: FinalAudit;
}

export interface ScanHistoryItem {
  scanId: string; // e.g., timestamp or uuid
  patientInfo: PatientInfo;
  analysisResult: AnalysisResult;
  ecgImageBase64: string;
  timestamp: string; // ISO string
}

export type UserWithHistory = User & { history: ScanHistoryItem[] };

export interface SampleImage {
  name: string;
  url: string;
}

// The FullBackupData type now reflects the secure User type
export interface FullBackupData {
  users: (User & { passwordHash: string })[]; // For import/export only, passwordHash is included
  histories: { [email: string]: ScanHistoryItem[] };
}
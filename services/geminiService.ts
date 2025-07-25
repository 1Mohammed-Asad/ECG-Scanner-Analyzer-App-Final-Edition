
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, PatientInfo, FinalAudit, ScanHistoryItem } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ecgParametersSchema = {
    type: Type.OBJECT,
    description: "A detailed, quantitative breakdown of all relevant ECG parameters. All fields must be filled. Use 'N/A' or 'None' where appropriate, but do not leave fields empty.",
    properties: {
        hr: { type: Type.STRING, description: "Heart rate value with units (e.g., '75 bpm')." },
        rhythm: { type: Type.STRING, description: "The determined cardiac rhythm (e.g., 'Normal Sinus Rhythm', 'Atrial Fibrillation')." },
        axis: { type: Type.STRING, description: "Calculated cardiac axis (e.g., 'Normal axis', 'Left Axis Deviation')." },
        prInterval: { type: Type.STRING, description: "PR interval value with units (e.g., '160 ms')." },
        qrsComplex: { type: Type.STRING, description: "QRS duration and morphology (e.g., '88 ms, Narrow morphology')." },
        qtInterval: { type: Type.STRING, description: "QT and QTc interval with units (e.g., '400 ms (QTc: 420 ms)')." },
        stDeviations: { type: Type.STRING, description: "Description of all ST segment elevations or depressions, including location and magnitude if possible (e.g., 'ST elevation >2mm in V2, V3. Reciprocal ST depression in II, aVF.'). Must state 'None' if absent." },
        tWaveAbnormalities: { type: Type.STRING, description: "Description of any T-wave abnormalities, including location (e.g., 'Peaked T-waves in V2-V4. Inverted T-waves in lead III.'). Must state 'None' if absent." },
        otherFindings: { type: Type.STRING, description: "Description of any other abnormalities like pathological Q waves, hypertrophy criteria, or bundle branch blocks. Must state 'None' if absent." },
    },
    required: ["hr", "rhythm", "axis", "prInterval", "qrsComplex", "qtInterval", "stDeviations", "tWaveAbnormalities", "otherFindings"]
};

const boundingBoxSchema = {
    type: Type.OBJECT,
    description: "A tight, normalized bounding box (0.0 to 1.0) pinpointing the specific location of the finding on the ECG image. Coordinates originate from the top-left corner.",
    properties: {
        x_min: { type: Type.NUMBER, description: "Normalized minimum x-coordinate from left." },
        y_min: { type: Type.NUMBER, description: "Normalized minimum y-coordinate from top." },
        x_max: { type: Type.NUMBER, description: "Normalized maximum x-coordinate from left." },
        y_max: { type: Type.NUMBER, description: "Normalized maximum y-coordinate from top." },
    },
    required: ["x_min", "y_min", "x_max", "y_max"]
};

const annotationSchema = {
    type: Type.OBJECT,
    properties: {
        label: { type: Type.STRING, description: "A short, specific, and clinically precise label for the finding, including the lead if applicable (e.g., 'ST-Segment Elevation in V2', 'Motion Artifact')." },
        description: { type: Type.STRING, description: "A brief one-sentence description of the specific visual finding or artifact." },
        boundingBox: boundingBoxSchema,
        annotationType: { type: Type.STRING, enum: ['point', 'segment', 'area'], description: "The visual type of the annotation. 'point' for single features, 'segment' for durational features, 'area' for diffuse findings." },
        category: { type: Type.STRING, enum: ['clinical', 'artifact'], description: "Category of the annotation. 'clinical' for a medical finding, 'artifact' for an image quality issue." },
        certainty: { type: Type.STRING, enum: ['High', 'Moderate', 'Low'], description: "The AI's certainty level for this specific finding, based on visual clarity and evidence quality. 'High' for unambiguous findings, 'Low' for subtle or questionable ones." }
    },
    required: ["label", "description", "boundingBox", "annotationType", "category", "certainty"]
};

const differentialDiagnosisSchema = {
    type: Type.OBJECT,
    description: "An alternative diagnosis that was considered.",
    properties: {
        diagnosis: { type: Type.STRING, description: "The name of the alternative diagnosis (e.g., 'Pericarditis')." },
        rationale: { type: Type.STRING, description: "A brief, one-sentence rationale explaining why this diagnosis was considered but ultimately deemed less likely than the primary diagnosis." }
    },
    required: ["diagnosis", "rationale"]
};

const finalAuditSchema = {
    type: Type.OBJECT,
    description: "A mandatory final self-verification of the entire analysis to ensure internal consistency and clinical plausibility.",
    properties: {
        status: { type: Type.STRING, enum: ['Pass', 'Fail'], description: "The result of the internal audit. 'Fail' if any contradictions are found." },
        rationale: { type: Type.STRING, description: "A one-sentence explanation for the audit status. If 'Fail', must state the specific contradiction found. If 'Pass', must state that the analysis is internally consistent." }
    },
    required: ["status", "rationale"]
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        diagnosis: { 
            type: Type.STRING, 
            description: "The single most accurate and clinically relevant primary diagnosis. This field MUST NOT be 'Uninterpretable' unless the image provided contains no discernible ECG waveforms at all." 
        },
        summary: {
            type: Type.STRING,
            description: "A structured **Clinical Narrative**. It MUST follow this format precisely: 1. **Rate & Rhythm:** (e.g., 'Sinus tachycardia at 110 bpm.'). 2. **Intervals & Axis:** (e.g., 'PR 140ms, QRS 88ms, QTc 430ms. Normal axis.'). 3. **Morphology:** (e.g., 'ST-segment elevations of 3mm are noted in leads V2-V4...'). 4. **Impression:** (e.g., 'Impression is consistent with an acute anterior STEMI.'). Any image quality concerns MUST be integrated directly into this narrative (e.g., 'Image quality is poor due to baseline wander, limiting assessment of ST segments...')."
        },
        recommendation: {
            type: Type.STRING,
            description: "A tiered, actionable recommendation. The response MUST begin with one of the following urgency prefixes: 'Immediate:', 'Urgent:', or 'Routine:'. The recommendation should be clinically appropriate for the diagnosis. (e.g., 'Immediate: Activate cath lab for suspected STEMI.')."
        },
        analysisNote: {
            type: Type.STRING,
            description: "If the analysis was limited due to poor image quality, this field MUST contain a brief explanation of what was limited (e.g., 'Assessment of ST segments is limited by baseline wander.'). If a full analysis was performed, this MUST be null."
        },
        confidence: { 
            type: Type.NUMBER, 
            description: "A confidence score from 0.0 to 1.0 for the primary diagnosis. MUST be >= 0.90 unless there is a clear, justifiable reason for lower confidence that is explained in the summary." 
        },
        emergencyLevel: {
            type: Type.INTEGER,
            description: "An integer score from 0 to 100 indicating the urgency, where 100 is a life-threatening emergency. MUST BE low (0-5) for a normal ECG."
        },
        heartRateBPM: { 
            type: Type.INTEGER, 
            description: "The estimated heart rate in beats per minute (BPM). Must be 0 if not determinable." 
        },
        isCritical: { 
            type: Type.BOOLEAN, 
            description: "True if the finding is immediately life-threatening (e.g., STEMI, Ventricular Tachycardia, 3rd Degree AV Block). MUST BE false for a normal ECG." 
        },
        ecgParameters: ecgParametersSchema,
        annotations: {
            type: Type.ARRAY,
            description: "A list of specific annotated findings on the ECG. Must be empty if a completely normal ECG. If any artifacts are present, they MUST be annotated here.",
            items: annotationSchema
        },
        differentialDiagnosis: {
            type: Type.ARRAY,
            description: "A list of 2-3 alternative diagnoses that were considered, with rationale. Must be empty if diagnosis is certain.",
            items: differentialDiagnosisSchema
        },
        finalAudit: finalAuditSchema,
    },
    required: ["diagnosis", "summary", "recommendation", "confidence", "emergencyLevel", "heartRateBPM", "isCritical", "ecgParameters", "annotations", "differentialDiagnosis", "finalAudit"]
};

export const analyzeEcgImage = async (imageDataUrl: string, patientInfo: PatientInfo, correctionExamples: ScanHistoryItem[] = []): Promise<AnalysisResult> => {
    // Dynamically parse MIME type and base64 data from the data URL
    const match = imageDataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid image data URL format. Expected 'data:image/...'");
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Data,
        },
    };

    let correctionPrompt = '';
    if (correctionExamples && correctionExamples.length > 0) {
        const examplesString = correctionExamples.map((example, index) => {
            return `
---
**Example ${index + 1}: Human-Corrected Gold Standard Analysis**
---
This is a previous analysis that was MANUALLY CORRECTED by a cardiologist. You MUST learn from this example to avoid repeating mistakes.

**Patient Data for this example:**
- Age: ${example.patientInfo.age}
- Gender: ${example.patientInfo.gender}
- Clinical Notes/Symptoms: ${example.patientInfo.symptoms?.trim() || 'N/A'}

**CORRECTED ANALYSIS (This is the ground truth):**
- **Diagnosis:** ${example.analysisResult.diagnosis}
- **Summary:** ${example.analysisResult.summary}
- **Recommendation:** ${example.analysisResult.recommendation}
- **Is Critical:** ${example.analysisResult.isCritical}
- **Key ECG Parameters:**
  - HR: ${example.analysisResult.ecgParameters.hr}
  - Rhythm: ${example.analysisResult.ecgParameters.rhythm}
  - ST Deviations: ${example.analysisResult.ecgParameters.stDeviations}
  - T-Wave Abnormalities: ${example.analysisResult.ecgParameters.tWaveAbnormalities}

**Your Task:** Internalize the reasoning from this corrected example. Apply similar logic to the NEW image you are about to analyze. For instance, if the correction identified a subtle finding, be more vigilant for similar subtleties in the new image.
---
`;
        }).join('\n');

        correctionPrompt = `
---
**CRITICAL GUIDANCE FROM PREVIOUS CORRECTIONS (Cardio-AI v30.0 - Learning Module)**
---
You have made mistakes in the past that were corrected by a human cardiologist. You MUST learn from these gold-standard examples to improve your accuracy. The following are corrected analyses. Use them as a primary guide for your reasoning process.

${examplesString}

---
**END OF GUIDANCE. NOW ANALYZE THE NEW IMAGE BELOW.**
---
`;
    }
    
    const promptText = `${correctionPrompt}
Perform a full diagnostic analysis of the provided clinical image. You will operate with the rigor of a cardiologist, following the protocol below precisely.

**Patient Data:**
- Age: ${patientInfo.age}
- Gender: ${patientInfo.gender}
- Clinical Notes/Symptoms: ${patientInfo.symptoms?.trim() || 'N/A'}

---
**MANDATORY PROTOCOL (Cardio-AI v30.0 - Adaptive & Learning Analysis)**
---
You will follow these instructions without deviation. Errors and omissions are critical failures.

**1. ADAPTIVE ANALYSIS STRATEGY (MANDATORY):**
   - **First, assess image quality.**
   - **If quality is good:** Perform a "Full Analysis". The \`analysisNote\` field MUST be \`null\`.
   - **If quality is poor** (e.g., high noise, significant artifact, missing leads): Perform a "Limited Analysis". You are still required to analyze all visible features. The \`analysisNote\` field MUST contain a specific explanation of what was limited (e.g., "ST-segment assessment is unreliable due to severe baseline wander."). The \`summary\` must also mention the limitation.
   - You are **FORBIDDEN** from using "Uninterpretable" as a diagnosis if any discernible ECG waveforms are present.

**2. DECISIVE CONFIDENCE MANDATE:**
   - You MUST justify the highest possible confidence score, aiming for **>= 0.90**.
   - If confidence is < 0.90, you MUST state the specific reason within the \`summary\` narrative (e.g., "Impression is... however, confidence is moderate due to subtle T-wave morphology which could be a normal variant.").

**3. ANNOTATE ALL FINDINGS (STRICT v13.0 - ZERO TOLERANCE):**
   - You MUST create an annotation for every clinically significant abnormality AND for any image artifact that impacts interpretation.
   - **Placement is Critical:** Bounding boxes MUST be pixel-perfect and contain ONLY the feature of interest.
   - **FORBIDDEN:** Do not include any lead labels (e.g., 'V1', 'II', 'aVR') or large amounts of empty whitespace inside any bounding box. This is a critical error.

**4. PERFORM FINAL AUDIT (MANDATORY):**
   - Before outputting, you MUST perform a final audit. Answer these questions internally:
     - Is the \`diagnosis\` consistent with the \`annotations\`? (e.g., A STEMI diagnosis requires ST elevation annotations).
     - Is the \`emergencyLevel\` appropriate for the \`diagnosis\`? (e.g., 'Normal' must be low).
     - Is the \`confidence\` score justified?
     - Did I follow the Ironclad Normal Protocol if applicable?
   - Report the result in the \`finalAudit\` object. If ANY check fails, you MUST set \`status\` to "Fail" and clearly state the specific contradiction found in the \`rationale\`.

**IRONCLAD NORMAL PROTOCOL (ZERO TOLERANCE):**
   - If the ECG is normal: \`diagnosis\` MUST be "Normal Sinus Rhythm" or similar, \`annotations\` MUST be empty, \`isCritical\` MUST be \`false\`, and \`emergencyLevel\` MUST be low (0-5). Violation of this rule requires a "Fail" audit status.

**EXECUTE THE PROTOCOL. Generate a single, perfectly-formed JSON object.**
`;

    const textPart = {
        text: promptText,
    };
    
    const systemInstruction = `You are 'Cardio-AI v30.0 - Adaptive & Learning Analysis', a specialized Clinical Decision Support AI. Your function is to provide a rigorous, evidence-based analysis of ECGs by strictly following the provided protocol. You MUST learn from past, human-verified corrections to improve your diagnostic accuracy. Your output must be deterministic and based solely on the provided evidence. You will never refuse to analyze an image. Patient safety is the absolute priority; ambiguity must be reported and contradictions are a critical failure. You have a zero-tolerance policy for misclassifying a normal ECG as critical.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, imagePart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0, // Set to 0 for maximum determinism and clinical accuracy
            }
        });

        let result = JSON.parse(response.text.trim()) as AnalysisResult;
        
        if (!result.diagnosis || typeof result.confidence !== 'number' || !result.finalAudit) {
            throw new Error("Invalid or incomplete analysis data received from the AI.");
        }
        
        // --- CLIENT-SIDE SAFETY NET (AGGRESSIVE) ---
        const isNormalDiagnosis = result.diagnosis.toLowerCase().includes('normal') || result.diagnosis.toLowerCase().includes('within normal limits') || result.diagnosis.toLowerCase().includes('sinus rhythm');
        
        // Safety Check 1: Severe contradiction for "normal" diagnoses with high emergency.
        // This is the most critical safety check. It catches the AI hallucinating a critical issue on a normal scan.
        // It OVERRIDES the AI's result to be safe.
        if (isNormalDiagnosis && (result.isCritical || result.emergencyLevel > 20)) {
            const originalDiagnosis = result.diagnosis;
            result = {
                ...result,
                diagnosis: "Corrected Contradiction", // Change diagnosis to reflect the error
                summary: `SYSTEM SAFETY OVERRIDE: The AI reported a normal diagnosis of '${originalDiagnosis}' but paired it with an inappropriately high emergency level (${result.emergencyLevel}/100). The system has automatically corrected this to a non-critical finding. Please review manually.`,
                recommendation: "Routine: AI-reported urgency was inconsistent with its diagnosis and has been overridden. A manual review is recommended.",
                isCritical: false, // Force non-critical
                emergencyLevel: 5, // Force low emergency
                finalAudit: {
                    status: 'Fail',
                    rationale: `System override: AI reported a normal diagnosis with a critical emergency level (${result.emergencyLevel}).`
                }
            };
        }

        return result;

    } catch (error) {
        console.error("Gemini API call failed:", error);
         if (error instanceof Error) {
            if (error.message.includes('[GoogGenAI Error]:')) {
                if (error.message.includes('SAFETY')) {
                    throw new Error(`The analysis was blocked for safety reasons. This can happen with unclear, ambiguous, or low-quality images. Please try a different image.`);
                }
                if (error.message.includes('400')) {
                     throw new Error(`The request was invalid. The provided image may be corrupted, in an unsupported format, or not a valid ECG. Please check the file and try again.`);
                }
                 if (error.message.includes('500') || error.message.includes('503')) {
                     throw new Error(`The ECG analysis service is currently unavailable or overloaded. Please try again in a few moments.`);
                }
            }
            if (error.message.includes('deadline')) {
                 throw new Error(`Analysis timed out. The server may be busy or the request is too complex. Please try again in a moment.`);
            }
            if (error.message.includes('JSON')) {
                 throw new Error(`The AI returned an invalid response format. This is often a temporary issue with the service. Please try again.`);
            }
            throw new Error(`An unexpected error occurred during analysis: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the analysis service.");
    }
};

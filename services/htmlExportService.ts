

import { ScanHistoryItem, User, FullBackupData } from '../types';

const escapeHtml = (unsafe: string | number | undefined | null): string => {
    if (unsafe === null || unsafe === undefined) return '';
    const str = String(unsafe);
    return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const getReportStyles = () => `
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #212529; background-color: #f8f9fa; margin: 0; padding: 0; }
        .container { max-width: 800px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 40px; }
        .page-break { page-break-after: always; }
        .report-header { text-align: center; border-bottom: 1px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px; }
        .report-header h1 { font-size: 28px; font-weight: bold; margin: 0; }
        .section { margin-bottom: 30px; }
        .section h2 { font-size: 20px; font-weight: bold; border-bottom: 1px solid #e9ecef; padding-bottom: 8px; margin-bottom: 15px; }
        .grid { display: grid; grid-template-columns: 180px 1fr; gap: 10px 20px; }
        .grid .label { font-weight: bold; }
        .recommendation { font-weight: bold; }
        .recommendation.critical { color: #dc3545; }
        .recommendation.normal { color: #198754; }
        .ecg-image { width: 100%; max-width: 100%; display: block; border: 1px solid #e9ecef; border-radius: 4px; margin-top: 10px; }
        .archive-title { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
        .user-title-page { text-align: center; padding: 4rem 0; page-break-before: always; border-top: 4px double #000; border-bottom: 4px double #000; background-color: #e9ecef; }
        .user-title-page h2 { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
        .user-title-page p { font-size: 18px; color: #6c757d; margin-top: 0; }
        .notes { background-color: #e9ecef; padding: 15px; border-radius: 4px; border-left: 4px solid #0d6efd; }
        .findings-list { list-style: none; padding-left: 0; }
        .finding-item { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 10px; margin-bottom: 10px; }
        .finding-item .label { font-weight: bold; color: #0d6efd; }
        .no-history { text-align: center; padding: 40px; color: #6c757d; border: 2px dashed #dee2e6; border-radius: 8px; margin-top: 20px; }
    </style>
`;

const createSingleReportHtmlInternal = (scan: ScanHistoryItem): string => {
    const { patientInfo, analysisResult, timestamp, ecgImageBase64 } = scan;
    
    const symptomsHtml = patientInfo.symptoms ? `
        <section class="section">
            <h2>Clinical Notes / Symptoms</h2>
            <p class="notes">${escapeHtml(patientInfo.symptoms)}</p>
        </section>
    ` : '';

    const annotationsHtml = (analysisResult.annotations && analysisResult.annotations.length > 0) ? `
        <section class="section">
            <h2>Key Findings</h2>
            <ul class="findings-list">
                ${analysisResult.annotations.map(ann => `
                    <li class="finding-item">
                        <span class="label">${escapeHtml(ann.label)}</span>
                        <p>${escapeHtml(ann.description)}</p>
                    </li>
                `).join('')}
            </ul>
        </section>
    ` : '';

    return `
        <div class="report-header">
            <h1>ECG Analysis Report</h1>
        </div>
        
        <section class="section">
            <h2>Patient Details</h2>
            <div class="grid">
                <span class="label">Patient Name:</span><span>${escapeHtml(patientInfo.name)}</span>
                <span class="label">Patient ID:</span><span>${escapeHtml(patientInfo.id)}</span>
                <span class="label">Age:</span><span>${escapeHtml(patientInfo.age)}</span>
                <span class="label">Gender:</span><span>${escapeHtml(patientInfo.gender)}</span>
                <span class="label">Report Date:</span><span>${escapeHtml(new Date(timestamp).toLocaleString())}</span>
            </div>
        </section>

        ${symptomsHtml}

        <section class="section">
            <h2>Analysis Summary</h2>
            <p><strong>Diagnosis:</strong> ${escapeHtml(analysisResult.diagnosis)}</p>
            <p>${escapeHtml(analysisResult.summary)}</p>
            <p class="recommendation ${analysisResult.isCritical ? 'critical' : 'normal'}">
                <strong>Recommendation:</strong> ${escapeHtml(analysisResult.recommendation)}
            </p>
        </section>

        ${annotationsHtml}

        <section class="section">
            <h2>ECG Parameters</h2>
            <div class="grid">
                <span class="label">Heart Rate:</span><span>${escapeHtml(analysisResult.ecgParameters.hr)}</span>
                <span class="label">Rhythm:</span><span>${escapeHtml(analysisResult.ecgParameters.rhythm)}</span>
                <span class="label">Axis:</span><span>${escapeHtml(analysisResult.ecgParameters.axis)}</span>
                <span class="label">PR Interval:</span><span>${escapeHtml(analysisResult.ecgParameters.prInterval)}</span>
                <span class="label">QRS Complex:</span><span>${escapeHtml(analysisResult.ecgParameters.qrsComplex)}</span>
                <span class="label">QT/QTc Interval:</span><span>${escapeHtml(analysisResult.ecgParameters.qtInterval)}</span>
                <span class="label">ST Deviations:</span><span>${escapeHtml(analysisResult.ecgParameters.stDeviations)}</span>
                <span class="label">T-Wave Abnormalities:</span><span>${escapeHtml(analysisResult.ecgParameters.tWaveAbnormalities)}</span>
                <span class="label">Other Findings:</span><span>${escapeHtml(analysisResult.ecgParameters.otherFindings)}</span>
            </div>
        </section>

        <section class="section">
            <h2>Scanned Image</h2>
            <img src="${ecgImageBase64}" alt="ECG for ${escapeHtml(patientInfo.name)}" class="ecg-image" />
        </section>
    `;
};

export const generateHtmlAndDownload = (htmlContent: string, fileName: string) => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
};

export const createSingleReportHtml = (scan: ScanHistoryItem): string => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>ECG Report: ${escapeHtml(scan.patientInfo.name)}</title>
            ${getReportStyles()}
        </head>
        <body>
            <div class="container">
                ${createSingleReportHtmlInternal(scan)}
            </div>
        </body>
        </html>
    `;
};

export const createHistoryReportHtml = (history: ScanHistoryItem[], username: string): string => {
    const reportsHtml = history.map(item => `<div class="container page-break">${createSingleReportHtmlInternal(item)}</div>`).join('');
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>ECG History Report for ${escapeHtml(username)}</title>
            ${getReportStyles()}
        </head>
        <body>
            <div class="container">
                <div class="archive-title">
                     <h1>ECG Scan History Report</h1>
                     <p style="font-size: 1.5rem; margin-top: 8px;">User: ${escapeHtml(username)}</p>
                </div>
            </div>
            ${reportsHtml}
        </body>
        </html>
    `;
};

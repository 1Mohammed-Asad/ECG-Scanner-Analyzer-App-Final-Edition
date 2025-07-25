





import React, { useState, useMemo, useCallback } from 'react';
import { ScanHistoryItem } from '../types';
import { HistoryIcon } from './icons/HistoryIcon';
import { UserIcon } from './icons/UserIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import { EditIcon } from './icons/EditIcon';
import AnalysisResultDisplay from './AnalysisResultDisplay';
import { createHistoryReportHtml, generateHtmlAndDownload } from '../services/htmlExportService';
import EditScanModal from './EditScanModal';
import { SearchIcon } from './icons/SearchIcon';

interface HistoryViewProps {
    history: ScanHistoryItem[];
    onDeleteItem: (scanId: string) => void;
    onUpdateItem: (item: ScanHistoryItem) => void;
    username: string;
    isEmbedded?: boolean; 
}

interface HistoryItemProps {
    item: ScanHistoryItem; 
    onDelete: (scanId: string) => void;
    onUpdate: (item: ScanHistoryItem) => void;
    showDelete: boolean;
}

const HistoryItem: React.FC<HistoryItemProps> = React.memo(({ item, onDelete, onUpdate, showDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number | null>(null);
    const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState<number | null>(null);
    const { patientInfo, analysisResult, timestamp, scanId } = item;
    const diagnosisColor = analysisResult.isCritical ? 'border-l-red-500' : 'border-l-green-500';

    const handleSaveEdit = useCallback((updatedItem: ScanHistoryItem) => {
        onUpdate(updatedItem);
        setIsEditing(false);
    }, [onUpdate]);
    
    const handleToggleExpand = useCallback(() => {
        if (isExpanded) {
            setActiveAnnotationIndex(null);
            setHoveredAnnotationIndex(null);
        }
        setIsExpanded(prev => !prev);
    }, [isExpanded]);
    
    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(scanId);
    }, [onDelete, scanId]);
    
    const handleEditClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    }, []);

    return (
        <div className={`bg-slate-800 rounded-lg overflow-hidden border border-slate-700 border-l-4 ${diagnosisColor} transition-all duration-300`}>
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={handleToggleExpand}>
                <div className="flex items-center space-x-4">
                    <UserIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-white">{patientInfo.name}</p>
                        <p className="text-sm text-slate-400">ID: {patientInfo.id} - {analysisResult.diagnosis}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                     <p className="text-sm text-slate-500 hidden md:block">{new Date(timestamp).toLocaleString()}</p>
                     <button onClick={handleEditClick} className="p-2 rounded-full hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 transition" title="Edit Scan">
                         <EditIcon className="w-5 h-5" />
                     </button>
                     {showDelete && (
                        <button onClick={handleDeleteClick} className="p-2 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition" title="Delete Scan">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                     )}
                     <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isExpanded && (
                <div id={`scan-report-${scanId}`} className="border-t border-slate-700/50 animate-fade-in">
                    <AnalysisResultDisplay 
                        result={item.analysisResult} 
                        patientInfo={item.patientInfo} 
                        fileName="from history"
                        imageUrl={item.ecgImageBase64}
                        activeAnnotationIndex={activeAnnotationIndex}
                        onAnnotationSelect={setActiveAnnotationIndex}
                        hoveredAnnotationIndex={hoveredAnnotationIndex}
                        onAnnotationHover={setHoveredAnnotationIndex}
                    />
                </div>
            )}
            {isEditing && (
                <EditScanModal 
                    scanItem={item}
                    onSave={handleSaveEdit}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </div>
    )
});

const HistoryView: React.FC<HistoryViewProps> = ({ history, onDeleteItem, onUpdateItem, username, isEmbedded = false }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDownloadReport = useCallback(() => {
        if (history.length > 0) {
            const htmlContent = createHistoryReportHtml(history, username);
            const fileName = `ECG_History_${username.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
            generateHtmlAndDownload(htmlContent, fileName);
        }
    }, [history, username]);

    const filteredHistory = useMemo(() => {
        if (!searchTerm) {
            return history;
        }
        return history.filter(item => 
            item.patientInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.patientInfo.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [history, searchTerm]);
    
    const memoizedOnDeleteItem = useCallback(onDeleteItem, [onDeleteItem]);
    const memoizedOnUpdateItem = useCallback(onUpdateItem, [onUpdateItem]);

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-cyan-300 flex items-center gap-3">
                        <HistoryIcon className="w-8 h-8"/>
                        Scan History
                    </h2>
                    {!isEmbedded && (
                        <p className="text-slate-400 mt-1">Viewing records for user: <span className="font-bold text-white">{username}</span></p>
                    )}
                </div>

                {history.length > 0 && (
                    <div className="flex items-center space-x-2 self-start sm:self-center">
                        {!isEmbedded && (
                            <button 
                                onClick={handleDownloadReport} 
                                className="flex items-center space-x-2 text-sm bg-cyan-700 hover:bg-cyan-600 text-cyan-100 px-3 py-2 rounded-lg transition-colors duration-200 border border-cyan-600"
                            >
                                <FileTextIcon className="w-4 h-4" />
                                <span>Download Full Report (HTML)</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
            
             {history.length > 0 && (
                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Search by patient name or ID..."
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-3 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search history"
                    />
                    <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
            )}

            {history.length > 0 ? (
                filteredHistory.length > 0 ? (
                    <div className="space-y-4">
                        {filteredHistory.map(item => (
                            <HistoryItem 
                                key={item.scanId} 
                                item={item} 
                                onDelete={memoizedOnDeleteItem} 
                                onUpdate={memoizedOnUpdateItem}
                                showDelete={isEmbedded}
                            />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-20 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700">
                        <SearchIcon className="w-16 h-16 mx-auto text-slate-600" />
                        <h3 className="mt-4 text-xl font-semibold text-slate-400">No Matching Records Found</h3>
                        <p className="text-slate-500">Your search for "{searchTerm}" did not return any results.</p>
                    </div>
                )
            ) : (
                <div className="text-center py-20 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700">
                    <HistoryIcon className="w-16 h-16 mx-auto text-slate-600" />
                    <h3 className="mt-4 text-xl font-semibold text-slate-400">No Scans Found</h3>
                    <p className="text-slate-500">{isEmbedded ? "This user has no scan history." : "Completed scans will appear here."}</p>
                </div>
            )}
        </div>
    );
};

export default HistoryView;
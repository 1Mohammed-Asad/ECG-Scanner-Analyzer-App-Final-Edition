





import React, { useState, useRef, useCallback } from 'react';
import { User, ScanHistoryItem, UserWithHistory } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { TrashIcon } from './icons/TrashIcon';
import HistoryView from './HistoryView';
import { FileTextIcon } from './icons/FileTextIcon';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface UserRowProps {
    userData: UserWithHistory;
    onDeleteHistoryItem: (userEmail: string, scanId: string) => void;
    onUpdateHistoryItem: (userEmail: string, item: ScanHistoryItem) => void;
    isExpanded: boolean;
    onToggleExpand: (email: string) => void;
}

const UserRow: React.FC<UserRowProps> = React.memo(({ userData, onDeleteHistoryItem, onUpdateHistoryItem, isExpanded, onToggleExpand }) => {
    
    const handleDeleteItem = useCallback((scanId: string) => {
        onDeleteHistoryItem(userData.email, scanId);
    }, [onDeleteHistoryItem, userData.email]);
    
    const handleUpdateItem = useCallback((item: ScanHistoryItem) => {
        onUpdateHistoryItem(userData.email, item);
    }, [onUpdateHistoryItem, userData.email]);

    return (
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 transition-all duration-300">
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer" onClick={() => onToggleExpand(userData.email)}>
                <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <p className="font-bold text-white">{userData.name}</p>
                        <p className="text-sm text-slate-400">{userData.email}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span className="text-sm font-medium bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full">
                        {userData.history.length} Scan{userData.history.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-slate-700/50 animate-fade-in bg-slate-900/30 p-4">
                     <HistoryView 
                        history={userData.history}
                        onDeleteItem={handleDeleteItem}
                        onUpdateItem={handleUpdateItem}
                        username={userData.name} 
                        isEmbedded={true}
                     />
                </div>
            )}
        </div>
    );
});

interface AdminDashboardProps {
    allUsersData: UserWithHistory[];
    onDeleteUserHistoryItem: (userEmail: string, scanId: string) => void;
    onUpdateUserHistoryItem: (userEmail: string, item: ScanHistoryItem) => void;
    onDownloadBackup: () => void;
    onImportBackup: (file: File) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    allUsersData, 
    onDeleteUserHistoryItem,
    onUpdateUserHistoryItem,
    onDownloadBackup,
    onImportBackup,
}) => {
    const [expandedUserEmail, setExpandedUserEmail] = useState<string | null>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleToggleExpand = useCallback((email: string) => {
        setExpandedUserEmail(prev => prev === email ? null : email);
    }, []);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImportBackup(e.target.files[0]);
            e.target.value = ''; 
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-cyan-300 flex items-center gap-3">
                        <UsersIcon className="w-8 h-8"/>
                        User Management
                    </h2>
                    <p className="text-slate-400 mt-1">View, manage, and export user accounts and their associated data.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     <input
                        type="file"
                        ref={importInputRef}
                        onChange={handleFileSelected}
                        className="hidden"
                        accept="application/json"
                    />
                    <button
                        onClick={handleImportClick}
                        className="flex items-center justify-center gap-2 bg-slate-600 text-slate-100 hover:bg-slate-500 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 border border-slate-500"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span>Import Data (JSON)</span>
                    </button>
                    <button
                        onClick={onDownloadBackup}
                        className="flex items-center justify-center gap-2 bg-cyan-700 text-cyan-100 hover:bg-cyan-600 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 border border-cyan-600"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Export All Data (JSON)</span>
                    </button>
                </div>
            </div>
            
            {allUsersData.length > 0 ? (
                <div className="space-y-4">
                    {allUsersData.map(user => (
                        <UserRow 
                            key={user.email}
                            userData={user}
                            onDeleteHistoryItem={onDeleteUserHistoryItem}
                            onUpdateHistoryItem={onUpdateUserHistoryItem}
                            isExpanded={expandedUserEmail === user.email}
                            onToggleExpand={handleToggleExpand}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700">
                    <UsersIcon className="w-16 h-16 mx-auto text-slate-600" />
                    <h3 className="mt-4 text-xl font-semibold text-slate-400">No Users Found</h3>
                    <p className="text-slate-500">When new users sign up, they will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
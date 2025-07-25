

import React, { useState, useEffect, useCallback } from 'react';
import { AppView, PatientInfo, ScanHistoryItem, AnalysisResult, User, UserWithHistory } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import ScannerView from './components/ScannerView';
import HistoryView from './components/HistoryView';
import LoginView from './components/LoginView';
import { analyzeEcgImage } from './services/geminiService';
import * as storage from './services/storageService';
import * as api from './services/apiService';
import AdminDashboard from './components/AdminDashboard';
import { generateHtmlAndDownload } from './services/htmlExportService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('scanner');
  const [allUsersData, setAllUsersData] = useState<UserWithHistory[]>([]);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Centralized function to load all data from storage into state.
  const reloadData = useCallback(() => {
    const userEmail = storage.getCurrentUser();
    if (userEmail) {
      const user = storage.getUserProfile(userEmail);
      setCurrentUser(user || null);
      if (user?.role === 'admin') {
        const manageableUsers = storage.getAllUsersWithHistory(userEmail);
        setAllUsersData(manageableUsers);
        setHistory([]); // Ensure user history is cleared for admin
      } else if (user) {
        setHistory(storage.getHistoryForUser(user.email));
        setAllUsersData([]); // Ensure admin data is cleared for user
      }
    } else {
      // Clear all state if no user is logged in
      setCurrentUser(null);
      setAllUsersData([]);
      setHistory([]);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    storage.initializeStorage();
    reloadData();
  }, [reloadData]);
  
  const handleAnalysisComplete = useCallback((patientInfo: PatientInfo, analysisResult: AnalysisResult, imageDataUrl: string) => {
    setHistory(prev => {
        const newScan: ScanHistoryItem = {
          scanId: `scan_${Date.now()}`,
          patientInfo,
          analysisResult,
          ecgImageBase64: imageDataUrl,
          timestamp: new Date().toISOString(),
        };
        const updatedHistory = [newScan, ...prev];
        // Persist to storage immediately after state update
        if(currentUser?.email) {
            storage.saveHistoryForUser(currentUser.email, updatedHistory);
        }
        return updatedHistory;
    });
  }, [currentUser]);
  
  const handleDeleteHistoryItem = useCallback((scanId: string) => {
    if (window.confirm("Are you sure you want to delete this scan? This action cannot be undone.") && currentUser) {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.filter(item => item.scanId !== scanId);
            storage.saveHistoryForUser(currentUser.email, updatedHistory); // Side effect
            return updatedHistory;
        });
    }
  }, [currentUser]);

  const handleUpdateHistoryItem = useCallback((updatedItem: ScanHistoryItem) => {
    if (currentUser) {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.map(item => item.scanId === updatedItem.scanId ? updatedItem : item);
            storage.saveHistoryForUser(currentUser.email, updatedHistory); // Side effect
            return updatedHistory;
        });
    }
  }, [currentUser]);
  
  const handleClearHistory = useCallback(() => {
    if(window.confirm("Are you sure you want to delete all your scan history? This action cannot be undone.") && currentUser) {
        storage.saveHistoryForUser(currentUser.email, []); // Side effect
        setHistory([]); // State update
    }
  }, [currentUser]);

  const handleLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string; }> => {
    const result = await api.loginAPI(email, password);
    if (result.success) {
        storage.setCurrentUser(result.user.email);
        // Directly set the user from the API response
        setCurrentUser(result.user);
        // Reload data from storage for consistency with other app features
        reloadData();
        return { success: true, message: 'Login successful' };
    } else {
        return { success: false, message: result.message };
    }
  }, [reloadData]);
  
  const handleCreateUser = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; message: string; }> => {
      const result = await api.signupAPI(name, email, password);
      if (result.success) {
          // Add user to local storage for compatibility with history/admin features
          storage.addUser({ name, email, password, role: 'user' });
          // Automatically log in after successful signup
          return handleLogin(email, password);
      } else {
        return { success: false, message: result.message };
      }
  }, [handleLogin]);

  const handleLogout = useCallback(() => {
      storage.logoutUser();
      setCurrentUser(null);
      // reloadData(); // Not needed as we clear state manually
  }, []);
  
  const handleResetPassword = useCallback(async (email: string, newPassword: string): Promise<{ success: boolean, message:string }> => {
      return await api.finalizePasswordResetAPI(email, newPassword);
  }, []);

  // --- Admin Handlers (Using functional updates for stability) ---
  
  const handleDeleteUserHistoryItem = useCallback((userEmail: string, scanId: string) => {
     if (window.confirm("Are you sure you want to delete this scan? This action cannot be undone.")) {
        setAllUsersData(prevAllUsersData => prevAllUsersData.map(user => {
            if (user.email === userEmail) {
                const updatedHistory = user.history.filter(item => item.scanId !== scanId);
                storage.saveHistoryForUser(userEmail, updatedHistory); // Side-effect
                return { ...user, history: updatedHistory };
            }
            return user;
        }));
     }
  }, []);

  const handleUpdateUserHistoryItem = useCallback((userEmail: string, updatedItem: ScanHistoryItem) => {
    setAllUsersData(prevAllUsersData => prevAllUsersData.map(user => {
        if (user.email === userEmail) {
            const updatedHistory = user.history.map(item =>
                item.scanId === updatedItem.scanId ? updatedItem : item
            );
            // Perform side effects
            storage.saveHistoryForUser(userEmail, updatedHistory);
            storage.addCorrectionExample(updatedItem);
            return { ...user, history: updatedHistory };
        }
        return user;
    }));
    alert('Changes saved. The AI has been updated with this correction to improve future analyses.');
  }, []);
  
  const handleDownloadBackup = useCallback(() => {
    try {
      const backupData = storage.getFullBackupData();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", `ecg_analyzer_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
    } catch(e) {
      console.error("Backup failed", e);
      alert(`Could not generate backup file: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, []);

  const handleImportBackup = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        try {
            if (!fileContent) {
              throw new Error("File is empty or could not be read.");
            }
            
            const backupData = JSON.parse(fileContent);

            if (window.confirm('Are you sure you want to import this file? This will overwrite ALL existing user and history data.')) {
                storage.importFullBackup(backupData);
                alert(`Import successful! The application will now reload with the new data.`);
                reloadData(); // Refresh the state from the new storage data
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert(`Import failed: ${error instanceof Error ? error.message : 'The file is not a valid JSON backup file.'}`);
        }
    };
    reader.readAsText(file);
  }, [reloadData]);

  if (!currentUser) {
      return <LoginView onLogin={handleLogin} onCreateUser={handleCreateUser} onResetPassword={handleResetPassword} />;
  }
  
  if (currentUser.role === 'admin') {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
          <Header 
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={() => {}} 
            currentView={'scanner'}
          />
          <main className="flex-grow container mx-auto px-4 py-8 w-full">
            <AdminDashboard 
                allUsersData={allUsersData}
                onDeleteUserHistoryItem={handleDeleteUserHistoryItem}
                onUpdateUserHistoryItem={handleUpdateUserHistoryItem}
                onDownloadBackup={handleDownloadBackup}
                onImportBackup={handleImportBackup}
            />
          </main>
          <Footer />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      <Header 
        user={currentUser}
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout} 
      />
      <main className="flex-grow container mx-auto px-4 py-8 w-full">
        {currentView === 'scanner' && (
          <ScannerView 
            onAnalysisComplete={handleAnalysisComplete}
            analyzeEcgImage={analyzeEcgImage}
          />
        )}
        {currentView === 'history' && (
          <HistoryView 
            history={history}
            onDeleteItem={handleDeleteHistoryItem}
            onUpdateItem={handleUpdateHistoryItem}
            username={currentUser.name}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;

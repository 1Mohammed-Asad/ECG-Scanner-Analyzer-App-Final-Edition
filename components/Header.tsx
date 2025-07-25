
import React from 'react';
import { HeartbeatIcon } from './icons/HeartbeatIcon';
import { ScannerIcon } from './icons/ScannerIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { AppView, User } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { UsersIcon } from './icons/UsersIcon';

interface HeaderProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    user: User;
    onLogout: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, icon, label }) => {
    const activeClasses = 'bg-cyan-500 text-white';
    const inactiveClasses = 'bg-slate-700 text-slate-300 hover:bg-slate-600';
    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, user, onLogout }) => {
  const isAdmin = user.role === 'admin';

  return (
    <header className="bg-slate-800/70 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <HeartbeatIcon className="h-8 w-8 text-cyan-400" />
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            ECG Scanner <span className="text-cyan-400">Analyzer</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
            {isAdmin ? (
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                    <UsersIcon className="w-6 h-6"/>
                    <span className="hidden sm:inline">Admin Dashboard</span>
                </div>
            ) : (
                <div className="hidden sm:flex items-center space-x-2">
                    <NavButton 
                        isActive={currentView === 'scanner'}
                        onClick={() => onNavigate('scanner')}
                        icon={<ScannerIcon className="w-5 h-5" />}
                        label="Scanner"
                    />
                    <NavButton 
                        isActive={currentView === 'history'}
                        onClick={() => onNavigate('history')}
                        icon={<HistoryIcon className="w-5 h-5" />}
                        label="History"
                    />
                </div>
            )}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-300 hidden md:inline">
                Welcome, <span className="font-bold text-white">{user.name}</span>
              </span>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-red-500/80 hover:text-white transition-colors duration-200"
              >
                  <LogoutIcon className="w-5 h-5" />
              </button>
            </div>
        </div>
      </div>
      
      {!isAdmin && (
        <div className="sm:hidden flex justify-around items-center p-2 bg-slate-800/50 border-t border-slate-700">
            <NavButton 
                isActive={currentView === 'scanner'}
                onClick={() => onNavigate('scanner')}
                icon={<ScannerIcon className="w-5 h-5" />}
                label="Scanner"
            />
            <NavButton 
                isActive={currentView === 'history'}
                onClick={() => onNavigate('history')}
                icon={<HistoryIcon className="w-5 h-5" />}
                label="History"
            />
        </div>
      )}
    </header>
  );
};

export default Header;
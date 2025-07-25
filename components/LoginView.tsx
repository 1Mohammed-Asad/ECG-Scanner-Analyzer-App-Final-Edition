
import React, { useState } from 'react';
import { HeartbeatIcon } from './icons/HeartbeatIcon';
import Footer from './Footer';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import * as api from '../services/apiService';
import { UserIcon } from './icons/UserIcon';
import { MailIcon } from './icons/MailIcon';

type ViewMode = 'login' | 'signup' | 'findAccount' | 'confirmAccount' | 'mockEmail' | 'enterCode' | 'resetPassword' | 'resetSuccess';

interface LoginViewProps {
    onLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    onCreateUser: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
    onResetPassword: (email: string, newPassword: string) => Promise<{ success: boolean, message: string }>;
}

const inputStyles = "w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50";

interface FoundUserData {
    email: string;
    maskedEmail: string;
    userName: string;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onCreateUser, onResetPassword }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [foundUser, setFoundUser] = useState<FoundUserData | null>(null);

    const resetFormState = (keepEmail = false) => {
        setError('');
        setName('');
        if (!keepEmail) setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSecurityCode('');
        setFoundUser(null);
        setIsLoading(false);
    };

    const handleFindAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setIsLoading(true);
        const result = await api.requestPasswordResetAPI(email);
        setIsLoading(false);

        if (result.success && result.data) {
            setFoundUser({ email, ...result.data });
            setViewMode('confirmAccount');
        } else {
            setError(result.message);
        }
    };
    
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!foundUser) return;

        setIsLoading(true);
        const result = await api.verifyResetCodeAPI(foundUser.email, securityCode);
        setIsLoading(false);
        
        if (result.success) {
             setPassword('');
             setConfirmPassword('');
             setViewMode('resetPassword');
        } else {
            setError(result.message);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!password || !confirmPassword) {
            setError('Please enter and confirm your new password.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (foundUser) {
            setIsLoading(true);
            const result = await onResetPassword(foundUser.email, password);
            setIsLoading(false);

            if (result.success) {
                setViewMode('resetSuccess');
            } else {
                setError(result.message);
            }
        }
    };

    const handleMainSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (viewMode === 'login') {
            if (!email || !password) {
                setError('Email and password are required.');
                setIsLoading(false);
                return;
            }
            const result = await onLogin(email, password);
            if (!result.success) {
                setError(result.message);
            }
        } else { // signup
            if (!name || !email || !password) {
                setError('Full name, email, and password are required.');
                setIsLoading(false);
                return;
            }
            const result = await onCreateUser(name, email, password);
            if (!result.success) {
                setError(result.message);
            }
        }
        // Loading is handled by the app state change, but in case of error:
        setIsLoading(false);
    };
    
    const renderContent = () => {
        const isLogin = viewMode === 'login';
        const buttonText = isLogin ? 'Log In' : 'Create Account';

        switch (viewMode) {
            case 'findAccount':
                return (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Find Your Account</h2>
                            <p className="text-slate-400 mt-1">Enter your email to find your account.</p>
                        </div>
                        <form onSubmit={handleFindAccount} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputStyles} autoComplete="email" disabled={isLoading}/>
                            </div>
                            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-md">{error}</p>}
                            <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:opacity-50" disabled={isLoading}>
                                {isLoading ? 'Searching...' : 'Search'}
                            </button>
                        </form>
                         <p className="text-center text-sm text-slate-400 mt-6">
                            Remembered your password?
                            <button onClick={() => { resetFormState(); setViewMode('login'); }} className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2 focus:outline-none">
                                Back to Login
                            </button>
                        </p>
                    </>
                );
            case 'confirmAccount':
                 if (!foundUser) return null;
                 return (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Reset Your Password</h2>
                            <p className="text-slate-400 mt-1">We'll send a recovery code to the following account.</p>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600 mb-6">
                           <UserIcon className="w-10 h-10 text-slate-400 flex-shrink-0" />
                           <div>
                              <p className="font-bold text-white">{foundUser.userName}</p>
                              <p className="text-sm text-slate-400">{foundUser.maskedEmail}</p>
                           </div>
                        </div>
                        <div className="flex flex-col gap-3">
                             <button onClick={() => setViewMode('mockEmail')} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300">
                                Continue
                            </button>
                             <button onClick={() => { resetFormState(); setViewMode('findAccount'); }} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-all duration-300">
                                Not you? Search again
                            </button>
                        </div>
                    </>
                 );
            case 'mockEmail':
                if (!foundUser) return null;
                return (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Check Your "Email"</h2>
                            <p className="text-slate-400 mt-1">A real app would send an email. We'll show it here.</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-4 space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <MailIcon className="w-5 h-5 text-slate-400"/>
                                <h3 className="font-bold text-lg text-white">Password Reset Request</h3>
                            </div>
                            <div className="pl-7 space-y-2 text-slate-300">
                                <p><strong>From:</strong> ECG Scanner Analyzer &lt;no-reply@ecg-analyzer.app&gt;</p>
                                <p><strong>To:</strong> {foundUser.email}</p>
                            </div>
                            <hr className="border-slate-600"/>
                            <div className="pt-2 pl-2 text-slate-200">
                                <p className="mb-4">Hello {foundUser.userName},</p>
                                <p className="mb-4">We received a request to reset your password. Enter the following security code to continue.</p>
                                <div className="text-center my-6">
                                    <p className="text-slate-400 text-xs">Your security code is:</p>
                                    <p className="text-3xl font-bold tracking-[0.2em] bg-slate-900/50 py-3 px-2 rounded-md border border-slate-600 text-cyan-300">123456</p>
                                </div>
                                <p className="text-xs text-slate-500">If you did not request a password reset, please ignore this email.</p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col gap-3">
                            <button onClick={() => setViewMode('enterCode')} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300">
                                Continue to Enter Code
                            </button>
                             <button onClick={() => { resetFormState(); setViewMode('login'); }} className="font-semibold text-cyan-400 hover:text-cyan-300 text-sm focus:outline-none">
                                Cancel and return to login
                            </button>
                        </div>
                    </>
                );
            case 'enterCode':
                if (!foundUser) return null;
                return (
                     <>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Enter Security Code</h2>
                            <p className="text-slate-400 mt-1">
                                A 6-digit code has been "sent" to your email.
                            </p>
                        </div>
                        <form onSubmit={handleVerifyCode} className="space-y-4">
                            <div>
                                <label htmlFor="securityCode" className="block text-sm font-medium text-slate-300 mb-1">Security Code</label>
                                <input id="securityCode" type="text" value={securityCode} onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').substring(0, 6))} placeholder="Enter 6-digit code" className={`${inputStyles} text-center tracking-[0.5em]`} maxLength={6} disabled={isLoading}/>
                            </div>
                            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-md">{error}</p>}
                            <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:opacity-50" disabled={isLoading}>
                                {isLoading ? 'Verifying...' : 'Verify'}
                            </button>
                        </form>
                         <p className="text-center text-sm text-slate-400 mt-6">
                            <button onClick={() => setViewMode('confirmAccount')} className="font-semibold text-cyan-400 hover:text-cyan-300 focus:outline-none">
                                Didn't get a code? Back
                            </button>
                        </p>
                     </>
                );
            case 'resetPassword':
                 return (
                     <>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Create a New Password</h2>
                            <p className="text-slate-400 mt-1">Your new password must be different from previous passwords.</p>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                             <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputStyles} disabled={isLoading}/>
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputStyles} disabled={isLoading}/>
                            </div>
                            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-md">{error}</p>}
                            <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:opacity-50" disabled={isLoading}>
                                {isLoading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                     </>
                 );
            case 'resetSuccess':
                return (
                    <div className="text-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                        <p className="text-slate-400 mb-6">You can now use your new password to log in to your account.</p>
                        <button 
                            onClick={() => { resetFormState(); setViewMode('login'); }} 
                            className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300"
                        >
                            Return to Login
                        </button>
                    </div>
                );
            case 'login':
            case 'signup':
            default:
                return (
                    <>
                        <div className="flex flex-col items-center mb-8">
                            <HeartbeatIcon className="h-12 w-12 text-cyan-400" />
                            <h1 className="text-3xl font-bold text-white mt-3 tracking-tight">ECG Analyzer</h1>
                            <p className="text-slate-400">{isLogin ? 'Welcome back' : 'Create your account'}</p>
                        </div>
                        <form onSubmit={handleMainSubmit} className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className={inputStyles} autoComplete="name" disabled={isLoading} />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputStyles} autoComplete="email" disabled={isLoading} />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
                                    {isLogin && (
                                        <button type="button" onClick={() => { resetFormState(); setViewMode('findAccount'); }} className="text-xs font-medium text-cyan-400 hover:text-cyan-300" disabled={isLoading}>
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputStyles} autoComplete={isLogin ? "current-password" : "new-password"} disabled={isLoading} />
                            </div>

                            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-md">{error}</p>}

                            <button type="submit" className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center text-lg" disabled={isLoading}>
                                {isLoading ? 'Please wait...' : buttonText}
                            </button>
                        </form>
                        <p className="text-center text-sm text-slate-400 mt-6">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button onClick={() => { resetFormState(); setViewMode(isLogin ? 'signup' : 'login'); }} className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2 focus:outline-none" disabled={isLoading}>
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-slate-200">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-sm mx-auto p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 animate-fade-in">
                    {renderContent()}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default LoginView;

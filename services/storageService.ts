
import { User, ScanHistoryItem, FullBackupData, UserWithHistory } from '../types';

/**
 * ===================================================================================
 * IMPORTANT: MOCK STORAGE SERVICE FOR DEVELOPMENT
 * ===================================================================================
 * This file uses the browser's `localStorage` to simulate a database.
 * 
 * As the application migrates to a real backend, new user creation and authentication
 * will be handled by `apiService.ts`. However, these functions are kept to support
 * legacy features like the Admin Dashboard and data backup/import until those
 * features are also migrated to a full backend solution.
 * ===================================================================================
 */

const USERS_KEY = 'ecgAppUsers_v2'; // Changed key to avoid conflicts with old structure
const CURRENT_USER_KEY = 'ecgAppCurrentUser_v2';
const HISTORY_KEY_PREFIX = 'ecgScanHistory_v2_';
const CORRECTION_EXAMPLES_KEY = 'ecgCorrectionExamples_v2';
const MAX_CORRECTION_EXAMPLES = 10;

// In a real backend, password hashing is a critical server-side operation.
// This client-side hashing is insecure and used only for the mock backup/import feature.
const pseudoHash = (password: string): string => btoa(password);


// Should be called once on app startup to ensure default admin exists.
export const initializeStorage = () => {
    try {
        const usersJson = localStorage.getItem(USERS_KEY);
        if (!usersJson) {
            const adminUser = {
                email: 'admin@ecg.app',
                name: 'Administrator',
                passwordHash: pseudoHash('admin123'),
                role: 'admin'
            };
            localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
            console.log("Default admin user created: admin@ecg.app / admin123");
        }
    } catch (e) {
        console.error("Failed to initialize storage", e);
    }
};

// --- USER MANAGEMENT ---
// NOTE: This function is still used by the Admin panel.
const getUsersWithPasswords = (): (User & { passwordHash: string })[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

// NOTE: This is now called *after* a successful API signup to keep the local data in sync.
export const addUser = (newUser: {name:string, email:string, password: string, role: 'user' | 'admin'}): { success: boolean, message: string } => {
    if (!newUser.password) return { success: false, message: 'Password is required for local storage.' };
    
    const users = getUsersWithPasswords();
    if (users.some(user => user.email.toLowerCase() === newUser.email.toLowerCase())) {
        // This check is now redundant if API is primary, but good for safety.
        return { success: false, message: 'A user with this email already exists in local storage.' };
    }
    
    const userToStore = {
        email: newUser.email,
        name: newUser.name,
        passwordHash: pseudoHash(newUser.password), // Mock hashing for backup feature
        role: newUser.role,
    };

    localStorage.setItem(USERS_KEY, JSON.stringify([...users, userToStore]));
    return { success: true, message: 'User added to local storage successfully.' };
};

// PRODUCTION: Replace with a Firestore query `db.collection('users').doc(userId).get()`
export const getUserProfile = (email: string): User | undefined => {
    const users = getUsersWithPasswords();
    const foundUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
        const { passwordHash, ...userProfile } = foundUser;
        return userProfile;
    }
    return undefined;
};

// --- SESSION & AUTHENTICATION ---
// PRODUCTION: Replace with Firebase `onAuthStateChanged` listener.
export const getCurrentUser = (): string | null => localStorage.getItem(CURRENT_USER_KEY);
export const setCurrentUser = (email: string): void => localStorage.setItem(CURRENT_USER_KEY, email);
export const logoutUser = (): void => localStorage.removeItem(CURRENT_USER_KEY);

// NOTE: THIS FUNCTION IS NO LONGER USED FOR THE PRIMARY LOGIN FLOW.
// It is being replaced by apiService.loginAPI. Kept for reference or potential fallback.
export const authenticateUser = (email: string, password: string): boolean => {
    const user = getUsersWithPasswords().find(u => u.email.toLowerCase() === email.toLowerCase());
    return !!user && user.passwordHash === pseudoHash(password);
};

// NOTE: THIS FUNCTION IS NO LONGER USED FOR THE PRIMARY PASSWORD RESET FLOW.
// It is being replaced by apiService. Kept for backup/import functionality.
export const resetPassword = (email: string, newPassword: string): { success: boolean; message: string } => {
    const users = getUsersWithPasswords();
    const userIndex = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) return { success: false, message: 'User not found.' };

    users[userIndex].passwordHash = pseudoHash(newPassword);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'Password reset successfully.' };
};

// --- HISTORY MANAGEMENT ---
// PRODUCTION: Replace with Firestore query `db.collection('users').doc(userId).collection('history').get()`
export const getHistoryForUser = (email: string): ScanHistoryItem[] => {
    const historyJson = localStorage.getItem(`${HISTORY_KEY_PREFIX}${email}`);
    return historyJson ? JSON.parse(historyJson) : [];
};

// PRODUCTION: Replace with Firestore write `db.collection('users').doc(userId).collection('history').doc(scanId).set(...)`
export const saveHistoryForUser = (email: string, history: ScanHistoryItem[]): void => {
    localStorage.setItem(`${HISTORY_KEY_PREFIX}${email}`, JSON.stringify(history));
};

// PRODUCTION: Replace with a Firebase Cloud Function for deleting a subcollection.
export const clearHistoryForUser = (email: string): void => {
    localStorage.removeItem(`${HISTORY_KEY_PREFIX}${email}`);
};


// --- AI LEARNING ---
// PRODUCTION: Replace with Firestore query `db.collection('correctionExamples').limit(count).get()`
export const getCorrectionExamples = (count: number = 2): ScanHistoryItem[] => {
    const examplesJson = localStorage.getItem(CORRECTION_EXAMPLES_KEY);
    const examples: ScanHistoryItem[] = examplesJson ? JSON.parse(examplesJson) : [];
    return examples.slice(0, count);
};

// PRODUCTION: Replace with Firestore write `db.collection('correctionExamples').add(...)`
export const addCorrectionExample = (item: ScanHistoryItem): void => {
    const existingExamples = getCorrectionExamples(MAX_CORRECTION_EXAMPLES);
    const updatedExamples = [item, ...existingExamples].slice(0, MAX_CORRECTION_EXAMPLES);
    localStorage.setItem(CORRECTION_EXAMPLES_KEY, JSON.stringify(updatedExamples));
};


// --- ADMIN & DATA MIGRATION ---
// PRODUCTION: Replace with a Firebase Cloud Function that can query all users.
export const getAllUsersWithHistory = (adminEmail: string): UserWithHistory[] => {
    const allUsers = getUsersWithPasswords();
    return allUsers
        .filter(user => user.email !== adminEmail) // Don't show the admin themselves
        .map(user => {
            const { passwordHash, ...userProfile } = user;
            return {
                ...userProfile,
                history: getHistoryForUser(user.email)
            };
        });
};

export const getFullBackupData = (): FullBackupData => {
    const users = getUsersWithPasswords();
    const histories: { [email: string]: ScanHistoryItem[] } = {};
    users.forEach(user => {
        histories[user.email] = getHistoryForUser(user.email);
    });
    return { users, histories };
};

export const importFullBackup = (data: any): void => {
    // Basic validation
    if (!data || !Array.isArray(data.users) || typeof data.histories !== 'object') {
        throw new Error("Invalid backup data format.");
    }

    // Clear all existing app data
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('ecgApp') || key.startsWith(HISTORY_KEY_PREFIX)) {
            localStorage.removeItem(key);
        }
    });

    // Import new data
    localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
    for (const email in data.histories) {
        if (Object.prototype.hasOwnProperty.call(data.histories, email)) {
            saveHistoryForUser(email, data.histories[email]);
        }
    }
};

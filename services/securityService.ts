// Security service for frontend
export class SecurityService {
    static initialize() {
        // Disable console logging in production
        if (process.env.NODE_ENV === 'production') {
            console.log = () => {};
            console.info = () => {};
            console.warn = () => {};
            console.debug = () => {};
            console.error = () => {};
            console.table = () => {};
            console.trace = () => {};
        }
    }
    
    static maskSensitiveData(data: any) {
        if (!data) return data;
        
        const masked = { ...data };
        
        // Mask email
        if (masked.email && typeof masked.email === 'string') {
            const [username, domain] = masked.email.split('@');
            if (username && domain) {
                masked.email = `${username.slice(0, 2)}***@${domain}`;
            }
        }
        
        // Mask ID
        if (masked.id) {
            masked.id = masked.id.toString().slice(-4).padStart(masked.id.toString().length, '*');
        }
        
        // Remove sensitive fields
        delete masked.password;
        delete masked.password_hash;
        delete masked.token;
        
        return masked;
    }
    
    static filterAdminUsers(users: any[]) {
        return users.filter(user => user.role !== 'admin');
    }
}

// Initialize security on import
SecurityService.initialize();

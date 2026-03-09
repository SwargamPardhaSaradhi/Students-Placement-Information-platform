/**
 * Security Cleanup - Automatically remove sensitive tokens from localStorage
 * This runs on app initialization to clean up any tokens that shouldn't be there
 */

export function cleanSensitiveData() {
    console.log('🔒 Running security cleanup...');

    const sensitivePatterns = [
        /token/i,           // Any key containing "token"
        /auth/i,            // Any key containing "auth"
        /^sb-/,             // Supabase tokens
        /jwt/i,             // JWT tokens
        /refresh/i,         // Refresh tokens
        /access/i           // Access tokens
    ];

    const safeKeys = [
        'theme',            // Theme preference
        'darkMode',         // Dark mode setting
        'cache_companies',  // Company cache
        'cache_dashboard',  // Dashboard cache
        'cache_students',   // Student cache
        'cache_all_students', // All students cache
        'cache_all_companies', // All companies cache
        'cache_years',      // Years cache
        'cache_rounds'      // Rounds cache
    ];

    let removedCount = 0;
    const keysToRemove: string[] = [];

    // Scan all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Skip safe keys
        if (safeKeys.includes(key) || key.startsWith('cache_')) {
            continue;
        }

        // Check if key matches sensitive patterns
        const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));

        if (isSensitive) {
            keysToRemove.push(key);
        }
    }

    // Remove sensitive keys
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`🗑️ Removed sensitive key: ${key}`);
    });

    if (removedCount > 0) {
        console.log(`✅ Security cleanup complete! Removed ${removedCount} sensitive items`);
    } else {
        console.log('✅ No sensitive data found');
    }
}

/**
 * Override localStorage.setItem to prevent storing sensitive data
 */
export function protectLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);

    localStorage.setItem = function (key: string, value: string) {
        // Block sensitive keys
        const blockedPatterns = [
            /token/i,
            /^sb-/,
            /jwt/i
        ];

        const isBlocked = blockedPatterns.some(pattern => pattern.test(key));

        if (isBlocked) {
            console.warn(`🚫 BLOCKED: Attempted to store sensitive key "${key}" in localStorage`);
            return;
        }

        // Allow safe keys
        originalSetItem(key, value);
    };

    console.log('🛡️ localStorage protection enabled');
}

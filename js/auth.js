// Auth utilities for use across the application

/**
 * Check if user is authenticated
 * @returns {boolean} - Whether user is logged in
 */
function isAuthenticated() {
    return sessionStorage.getItem('currentUser') !== null;
}

/**
 * Get current user data
 * @returns {Object|null} - User data or null if not logged in
 */
function getCurrentUser() {
    const userData = sessionStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Logout the current user
 */
function logout() {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('rememberedUser'); // Optional: also clear remembered user
    window.location.href = 'index.html';
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only apply to pages other than index.html
    if (!window.location.pathname.includes('index.html') && !isAuthenticated()) {
        window.location.href = 'index.html';
    }
});

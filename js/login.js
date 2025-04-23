document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginFormContainer = document.getElementById('login-form-container');
    const registerFormContainer = document.getElementById('register-form-container');

    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginFormContainer.classList.remove('hidden');
        registerFormContainer.classList.add('hidden');
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerFormContainer.classList.remove('hidden');
        loginFormContainer.classList.add('hidden');
    });

    // Toggle password visibility
    const togglePasswordElements = document.querySelectorAll('.toggle-password');
    togglePasswordElements.forEach(element => {
        element.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Initialize user storage if it doesn't exist
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }

    // Registration form submission
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');
    const registerErrorMessage = document.getElementById('register-error-message');
    const registerSuccess = document.getElementById('register-success');

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Hide previous error/success messages
        registerError.classList.add('hidden');
        registerSuccess.classList.add('hidden');
        
        // Get form data
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const termsAgreement = document.getElementById('terms-agreement').checked;
        
        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            registerError.classList.remove('hidden');
            registerErrorMessage.textContent = 'All fields are required';
            return;
        }
        
        if (password !== confirmPassword) {
            registerError.classList.remove('hidden');
            registerErrorMessage.textContent = 'Passwords do not match';
            return;
        }
        
        if (!termsAgreement) {
            registerError.classList.remove('hidden');
            registerErrorMessage.textContent = 'You must agree to the Terms of Service and Privacy Policy';
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            registerError.classList.remove('hidden');
            registerErrorMessage.textContent = 'Please enter a valid email address';
            return;
        }
        
        // Password strength validation
        if (password.length < 6) {
            registerError.classList.remove('hidden');
            registerErrorMessage.textContent = 'Password must be at least 6 characters long';
            return;
        }
        
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('users'));
        if (users.some(user => user.email === email)) {
            registerError.classList.remove('hidden');
            registerErrorMessage.textContent = 'Email is already registered';
            return;
        }
        
        // Register new user
        const newUser = {
            name,
            email,
            password, // In a real application, this should be hashed
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message
        registerSuccess.classList.remove('hidden');
        registerForm.reset();
        
        // Switch to login tab after successful registration
        setTimeout(() => {
            loginTab.click();
        }, 2000);
    });

    // Login form submission
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginErrorMessage = document.getElementById('login-error-message');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Hide previous error messages
        loginError.classList.add('hidden');
        
        // Get form data
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        // Basic validation
        if (!email || !password) {
            loginError.classList.remove('hidden');
            loginErrorMessage.textContent = 'Email and password are required';
            return;
        }
        
        // Authenticate user
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(user => user.email === email && user.password === password);
        
        if (!user) {
            loginError.classList.remove('hidden');
            loginErrorMessage.textContent = 'Invalid email or password';
            return;
        }
        
        // Set session
        const sessionData = {
            userId: user.email,
            name: user.name,
            email: user.email,
            loggedInAt: new Date().toISOString()
        };
        
        // Store in session storage (cleared when browser is closed)
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
        
        // If remember me is checked, also store in local storage
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify(sessionData));
        }
        
        // Redirect to main page
        window.location.href = 'main.html';
    });

    // Check if user is already logged in
    const checkLoggedInUser = () => {
        const currentUser = sessionStorage.getItem('currentUser');
        if (currentUser) {
            // User is already logged in, redirect to main page
            window.location.href = 'main.html';
        } else {
            // Check if there's a remembered user
            const rememberedUser = localStorage.getItem('rememberedUser');
            if (rememberedUser) {
                // Restore session
                sessionStorage.setItem('currentUser', rememberedUser);
                window.location.href = 'main.html';
            }
        }
    };
    
    // Check login status when page loads
    checkLoggedInUser();
});

// login.js - Handle user authentication from JSON
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    
    errorDiv.textContent = '';
    
    try {
        // Fetch users from JSON file
        const response = await fetch('data/users.json');
        const { users } = await response.json();
        
        // Find user by email and password
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            errorDiv.textContent = 'Invalid email or password';
            return;
        }
        
        // Store user info in localStorage
        localStorage.setItem('token', 'mock-jwt-' + user.id);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('role', user.role);
        
        // Redirect to project dashboard
        window.location.href = 'project-dashboard.html';
    } catch (error) {
        errorDiv.textContent = 'Error loading users: ' + error.message;
    }
});

// Redirect if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'project-dashboard.html';
}
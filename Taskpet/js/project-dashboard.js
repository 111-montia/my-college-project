// project-dashboard.js - Display and manage projects from JSON
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const userId = localStorage.getItem('userId');

if (!token) {
    window.location.href = 'login.html';
}

document.getElementById('user-role').textContent = role;

// Show leader section if user is leader
if (role === 'leader') {
    document.getElementById('leader-section').style.display = 'block';
    document.getElementById('project-form').addEventListener('submit', createProject);
}

// Logout handler
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// Load projects on page load
loadProjects();

async function loadProjects() {
    try {
        // Fetch projects from JSON file
        const response = await fetch('data/projects.json');
        const { projects } = await response.json();
        
        // Filter projects: leaders see all, members see only their projects
        let userProjects = projects;
        if (role === 'member') {
            userProjects = projects.filter(p => p.members.includes(userId));
        }

        if (userProjects.length === 0) {
            document.getElementById('projects-list').innerHTML = '<p>No projects available.</p>';
            return;
        }

        const projectsHtml = userProjects.map(project => `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                <h3>${project.name}</h3>
                <p>${project.description || 'No description'}</p>
                <p>ID: ${project.id}</p>
                <p>Members: ${project.members.length}</p>
                <button onclick="goToProject('${project.id}', '${role}')">
                    ${role === 'leader' ? 'Manage Quests' : 'View Quests'}
                </button>
                ${role === 'leader' ? `<button onclick="deleteProject('${project.id}')">Delete</button>` : ''}
            </div>
        `).join('');

        document.getElementById('projects-list').innerHTML = projectsHtml;
    } catch (error) {
        document.getElementById('projects-list').innerHTML = 
            '<p style="color: red;">Error loading projects: ' + error.message + '</p>';
    }
}

async function createProject(e) {
    e.preventDefault();
    
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-desc').value;
    const errorDiv = document.getElementById('form-error');
    
    errorDiv.textContent = '';
    
    try {
        const newProject = {
            id: 'proj-' + Date.now(),
            name: name,
            description: description,
            leader_id: userId,
            members: [userId],
            created_at: new Date().toISOString()
        };
        
        // Save to localStorage
        let projects = JSON.parse(localStorage.getItem('projects') || '[]');
        projects.push(newProject);
        localStorage.setItem('projects', JSON.stringify(projects));
        
        document.getElementById('project-form').reset();
        loadProjects();
    } catch (error) {
        errorDiv.textContent = 'Error creating project: ' + error.message;
    }
}

function goToProject(projectId, userRole) {
    if (userRole === 'leader') {
        window.location.href = `leader-dashboard.html?projectId=${projectId}`;
    } else {
        window.location.href = `member-dashboard.html?projectId=${projectId}`;
    }
}

async function deleteProject(projectId) {
    if (!confirm('Delete this project?')) return;
    
    try {
        let projects = JSON.parse(localStorage.getItem('projects') || '[]');
        projects = projects.filter(p => p.id !== projectId);
        localStorage.setItem('projects', JSON.stringify(projects));
        
        loadProjects();
    } catch (error) {
        alert('Error deleting project: ' + error.message);
    }
}
// member-dashboard.js - Members view and update quest progress from JSON
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');

if (!token) {
    window.location.href = 'login.html';
}

// Extract projectId from URL
const params = new URLSearchParams(window.location.search);
const projectId = params.get('projectId');

if (!projectId) {
    alert('No project ID provided');
    window.location.href = 'project-dashboard.html';
}

document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = 'project-dashboard.html';
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// Load project and quests on page load
loadProjectInfo();
loadQuests();

async function loadProjectInfo() {
    try {
        const response = await fetch('data/projects.json');
        const { projects } = await response.json();
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
            document.getElementById('project-name').textContent = `Project: ${project.name}`;
        }
    } catch (error) {
        console.error('Error loading project:', error);
    }
}

async function loadQuests() {
    try {
        // Fetch quests from JSON file
        const response = await fetch('data/quests.json');
        const { quests } = await response.json();
        
        // Filter quests for this project
        const projectQuests = quests.filter(q => q.project_id === projectId);

        if (projectQuests.length === 0) {
            document.getElementById('available-quests').innerHTML = '<p>No quests available.</p>';
            document.getElementById('my-progress').innerHTML = '<p>No completed quests.</p>';
            return;
        }

        // Fetch user progress
        await loadUserProgress(projectQuests);

        // Display available quests
        const availableHtml = projectQuests
            .filter(q => q.status === 'open')
            .map(quest => `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
                <h4>${quest.title}</h4>
                <p>${quest.description || 'No description'}</p>
                <p>Reward: ${quest.xp_reward} XP</p>
                <button onclick="startQuest('${quest.id}')">Accept Quest</button>
            </div>
        `).join('');

        document.getElementById('available-quests').innerHTML = availableHtml || '<p>No open quests.</p>';
    } catch (error) {
        document.getElementById('available-quests').innerHTML = 
            '<p style="color: red;">Error loading quests: ' + error.message + '</p>';
    }
}

async function loadUserProgress(projectQuests) {
    try {
        let progress = JSON.parse(localStorage.getItem('userProgress') || '[]');
        
        // Filter progress for this user and project
        const userProgress = progress.filter(p => 
            p.user_id === userId && 
            projectQuests.some(q => q.id === p.quest_id)
        );

        if (userProgress.length === 0) {
            document.getElementById('my-progress').innerHTML = '<p>You haven\'t accepted any quests yet.</p>';
            return;
        }

        const progressHtml = userProgress.map(p => `
            <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
                <h4>${p.quest_title}</h4>
                <p>Status: ${p.status}</p>
                <p>Progress: ${p.progress || 0}%</p>
                ${p.status !== 'completed' ? `
                    <input type="range" min="0" max="100" value="${p.progress || 0}" 
                           onchange="updateProgress('${p.quest_id}', this.value)">
                    <button onclick="completeQuest('${p.quest_id}')">Mark as Complete</button>
                ` : '<p style="color: green;">✓ Completed</p>'}
            </div>
        `).join('');

        document.getElementById('my-progress').innerHTML = progressHtml;
    } catch (error) {
        document.getElementById('my-progress').innerHTML = 
            '<p style="color: red;">Error loading progress: ' + error.message + '</p>';
    }
}

function startQuest(questId) {
    try {
        // Get quest title from available quests
        const quests = JSON.parse(localStorage.getItem('quests') || '[]');
        const quest = quests.find(q => q.id === questId);
        
        const newProgress = {
            user_id: userId,
            quest_id: questId,
            quest_title: quest?.title || 'Unknown Quest',
            status: 'in_progress',
            progress: 0,
            started_at: new Date().toISOString()
        };
        
        let progress = JSON.parse(localStorage.getItem('userProgress') || '[]');
        
        // Check if already accepted
        if (progress.some(p => p.user_id === userId && p.quest_id === questId)) {
            alert('You already accepted this quest');
            return;
        }
        
        progress.push(newProgress);
        localStorage.setItem('userProgress', JSON.stringify(progress));
        
        loadQuests();
    } catch (error) {
        alert('Error accepting quest: ' + error.message);
    }
}

function updateProgress(questId, progressValue) {
    try {
        let progress = JSON.parse(localStorage.getItem('userProgress') || '[]');
        const progressIndex = progress.findIndex(p => 
            p.user_id === userId && p.quest_id === questId
        );
        
        if (progressIndex !== -1) {
            progress[progressIndex].progress = parseInt(progressValue);
            localStorage.setItem('userProgress', JSON.stringify(progress));
        }
    } catch (error) {
        alert('Error updating progress: ' + error.message);
    }
}

function completeQuest(questId) {
    try {
        let progress = JSON.parse(localStorage.getItem('userProgress') || '[]');
        const progressIndex = progress.findIndex(p => 
            p.user_id === userId && p.quest_id === questId
        );
        
        if (progressIndex !== -1) {
            progress[progressIndex].status = 'completed';
            progress[progressIndex].progress = 100;
            progress[progressIndex].completed_at = new Date().toISOString();
            localStorage.setItem('userProgress', JSON.stringify(progress));
            loadUserProgress([]);
        }
    } catch (error) {
        alert('Error completing quest: ' + error.message);
    }
}
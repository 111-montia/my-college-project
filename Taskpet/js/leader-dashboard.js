// leader-dashboard.js - Leaders create and manage quests from JSON with drag & drop
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const userId = localStorage.getItem('userId');

if (!token || role !== 'leader') {
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

document.getElementById('quest-form').addEventListener('submit', createQuest);

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
        
        // Fetch quests from localStorage
        const localQuests = JSON.parse(localStorage.getItem('quests') || '[]');
        
        // Combine and filter quests for this project
        const allQuests = [...quests, ...localQuests];
        const projectQuests = allQuests.filter(q => q.project_id === projectId);

        if (projectQuests.length === 0) {
            document.getElementById('quests-list').innerHTML = '<p>No quests yet.</p>';
            return;
        }

        const questsHtml = projectQuests.map(quest => `
            <div 
                style="border: 2px solid #ccc; padding: 15px; margin: 10px 0; background: #f9f9f9; cursor: move; border-radius: 5px;"
                draggable="true" 
                ondragstart="dragStart(event)" 
                ondragend="dragEnd(event)"
                data-quest-id="${quest.id}"
                class="quest-item"
            >
                <h4>${quest.title}</h4>
                <p>${quest.description || 'No description'}</p>
                <p>XP: ${quest.xp_reward}</p>
                <p>Status: <strong>${quest.status}</strong></p>
                <p>ID: ${quest.id}</p>
                <div style="margin-top: 10px;">
                    <button onclick="updateQuestStatus('${quest.id}', '${quest.status === 'open' ? 'closed' : 'open'}')">
                        Toggle Status
                    </button>
                    <button onclick="deleteQuest('${quest.id}')" style="background: #ff6b6b; color: white; padding: 5px 10px; border: none; cursor: pointer;">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        document.getElementById('quests-list').innerHTML = questsHtml;
    } catch (error) {
        document.getElementById('quests-list').innerHTML = 
            '<p style="color: red;">Error loading quests: ' + error.message + '</p>';
    }
}

// Drag and Drop Functions
let draggedElement = null;

function dragStart(event) {
    draggedElement = event.target.closest('.quest-item');
    draggedElement.style.opacity = '0.5';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', draggedElement.innerHTML);
}

function dragEnd(event) {
    if (draggedElement) {
        draggedElement.style.opacity = '1';
    }
}

// Add drop zone styling
document.getElementById('quests-list').addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.getElementById('quests-list').style.background = '#e8f5e9';
    document.getElementById('quests-list').style.borderRadius = '5px';
});

document.getElementById('quests-list').addEventListener('dragleave', () => {
    document.getElementById('quests-list').style.background = 'transparent';
});

document.getElementById('quests-list').addEventListener('drop', (e) => {
    e.preventDefault();
    document.getElementById('quests-list').style.background = 'transparent';
    
    if (draggedElement && draggedElement.parentNode === document.getElementById('quests-list')) {
        const allQuests = document.getElementById('quests-list').querySelectorAll('.quest-item');
        const draggedIndex = Array.from(allQuests).indexOf(draggedElement);
        const dropTarget = e.target.closest('.quest-item') || allQuests[allQuests.length - 1];
        
        if (dropTarget && dropTarget !== draggedElement) {
            const dropIndex = Array.from(allQuests).indexOf(dropTarget);
            if (draggedIndex < dropIndex) {
                dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
            } else {
                dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
            }
            
            // Save reordered quests
            saveQuestOrder();
        }
    }
});

function saveQuestOrder() {
    try {
        const questItems = Array.from(document.querySelectorAll('.quest-item'));
        const orderedIds = questItems.map(item => item.getAttribute('data-quest-id'));
        localStorage.setItem('questOrder-' + projectId, JSON.stringify(orderedIds));
    } catch (error) {
        console.error('Error saving quest order:', error);
    }
}

async function createQuest(e) {
    e.preventDefault();

    const title = document.getElementById('quest-title').value;
    const description = document.getElementById('quest-desc').value;
    const xp_reward = parseInt(document.getElementById('quest-xp').value);
    const status = document.getElementById('quest-status').value;
    const errorDiv = document.getElementById('form-error');

    errorDiv.textContent = '';

    try {
        const newQuest = {
            id: 'quest-' + Date.now(),
            project_id: projectId,
            title: title,
            description: description,
            xp_reward: xp_reward,
            status: status,
            created_by: userId,
            created_at: new Date().toISOString()
        };
        
        // Save to localStorage
        let quests = JSON.parse(localStorage.getItem('quests') || '[]');
        quests.push(newQuest);
        localStorage.setItem('quests', JSON.stringify(quests));
        
        document.getElementById('quest-form').reset();
        loadQuests();
    } catch (error) {
        errorDiv.textContent = 'Error creating quest: ' + error.message;
    }
}

function updateQuestStatus(questId, newStatus) {
    try {
        let quests = JSON.parse(localStorage.getItem('quests') || '[]');
        const questIndex = quests.findIndex(q => q.id === questId);
        
        if (questIndex !== -1) {
            quests[questIndex].status = newStatus;
            localStorage.setItem('quests', JSON.stringify(quests));
            loadQuests();
        }
    } catch (error) {
        alert('Error updating quest: ' + error.message);
    }
}

function deleteQuest(questId) {
    if (!confirm('Delete this quest?')) return;

    try {
        let quests = JSON.parse(localStorage.getItem('quests') || '[]');
        quests = quests.filter(q => q.id !== questId);
        localStorage.setItem('quests', JSON.stringify(quests));
        
        loadQuests();
    } catch (error) {
        alert('Error deleting quest: ' + error.message);
    }
}
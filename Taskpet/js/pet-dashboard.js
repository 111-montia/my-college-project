// pet-dashboard.js - Display user pet and XP progress from JSON
const token = localStorage.getItem('token');
const userId = localStorage.getItem('userId');
const userName = localStorage.getItem('userName');

if (!token) {
    window.location.href = 'login.html';
}

document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = 'project-dashboard.html';
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// Load pet stats on page load
loadPetStats();

async function loadPetStats() {
    try {
        let userProgress = JSON.parse(localStorage.getItem('userProgress') || '[]');
        
        // Get completed quests for this user
        const completedQuests = userProgress.filter(p => 
            p.user_id === userId && p.status === 'completed'
        );
        
        // Calculate XP
        const totalXp = completedQuests.reduce((sum, q) => {
            const quests = JSON.parse(localStorage.getItem('quests') || '[]');
            const quest = quests.find(x => x.id === q.quest_id);
            return sum + (quest?.xp_reward || 0);
        }, 0);
        
        // Calculate level (every 100 XP = 1 level)
        const level = Math.floor(totalXp / 100) + 1;
        const currentLevelXp = totalXp % 100;
        const nextLevelXp = 100;
        
        // Update pet info
        document.getElementById('pet-name').textContent = `Pet: ${userName}'s Pet`;
        document.getElementById('pet-level').textContent = level;
        document.getElementById('pet-xp').textContent = currentLevelXp;
        document.getElementById('pet-xp-next').textContent = nextLevelXp;

        // Update XP progress bar
        const progressPercent = (currentLevelXp / nextLevelXp) * 100;
        document.getElementById('xp-progress').style.width = progressPercent + '%';

        // Update stats
        document.getElementById('total-quests').textContent = completedQuests.length;
        document.getElementById('total-xp').textContent = totalXp;

        // Load recent quests
        loadRecentQuests(completedQuests);
    } catch (error) {
        document.getElementById('stats-container').innerHTML = 
            '<p style="color: red;">Error loading pet stats: ' + error.message + '</p>';
    }
}

async function loadRecentQuests(completedQuests) {
    try {
        const quests = JSON.parse(localStorage.getItem('quests') || '[]');
        
        // Get last 5 completed quests with details
        const recentQuests = completedQuests
            .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
            .slice(0, 5)
            .map(p => {
                const quest = quests.find(q => q.id === p.quest_id);
                return {
                    quest_title: p.quest_title,
                    xp_reward: quest?.xp_reward || 0,
                    completed_at: p.completed_at
                };
            });

        if (recentQuests.length === 0) {
            document.getElementById('recent-quests').innerHTML = '<p>No completed quests yet.</p>';
            return;
        }

        const questsHtml = recentQuests.map(q => `
            <div style="border: 1px solid #ddd; padding: 8px; margin: 5px 0;">
                <p><strong>${q.quest_title}</strong> - ${q.xp_reward} XP</p>
                <small>Completed: ${new Date(q.completed_at).toLocaleDateString()}</small>
            </div>
        `).join('');

        document.getElementById('recent-quests').innerHTML = questsHtml;
    } catch (error) {
        document.getElementById('recent-quests').innerHTML = 
            '<p style="color: red;">Error loading quests: ' + error.message + '</p>';
    }
}
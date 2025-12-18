// Team Selection Module
App.teamSelection = (function() {
    console.log('Team Selection Module loading...');
    
    const TEAMS = [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' },
        { id: 'team3', name: 'Team 3' }
    ];
    
    let currentTeamId = null;
    let editingTeamId = null;
    
    function init() {
        console.log('Initializing Team Selection');
        
        // Load teams from localStorage or create defaults
        initializeTeams();
        
        // Render team selection UI
        renderTeamSelection();
        
        // Setup modal listeners
        setupModalListeners();
        
        // Load saved current team
        const savedTeamId = localStorage.getItem('currentTeamId');
        if (savedTeamId && getTeam(savedTeamId)) {
            currentTeamId = savedTeamId;
        }
    }
    
    function initializeTeams() {
        // Initialize teams if they don't exist
        TEAMS.forEach(team => {
            const teamData = localStorage.getItem(team.id);
            if (!teamData) {
                // Create empty team with no players
                saveTeam(team.id, {
                    name: team.name,
                    players: []
                });
            }
        });
    }
    
    function renderTeamSelection() {
        const container = document.getElementById('teamSelectionContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        TEAMS.forEach(teamDef => {
            const teamData = getTeam(teamDef.id);
            if (!teamData) return;
            
            const teamSlot = document.createElement('div');
            teamSlot.className = 'team-slot';
            
            const teamDisplay = document.createElement('div');
            teamDisplay.className = 'team-display';
            
            const teamTitle = document.createElement('h3');
            teamTitle.textContent = teamData.name;
            
            // For Team 1, show count of available players from App.data.players
            // For Team 2 & 3, show count of players from playerSelectionData
            let playersWithNames = 0;
            if (teamDef.id === 'team1') {
                // Count players with names from App.data.players
                playersWithNames = App.data.players ? App.data.players.filter(p => p.name && p.name.trim() !== '').length : 0;
            } else {
                // Count players with names from playerSelectionData for Team 2 & 3
                const savedPlayersKey = `playerSelectionData_${teamDef.id}`;
                try {
                    const savedPlayers = JSON.parse(localStorage.getItem(savedPlayersKey) || '[]');
                    playersWithNames = savedPlayers.filter(p => p.name && p.name.trim() !== '').length;
                } catch (e) {
                    playersWithNames = 0;
                }
            }
            const teamInfo = document.createElement('p');
            teamInfo.className = 'team-name';
            teamInfo.textContent = `${playersWithNames} Players`;
            
            teamDisplay.appendChild(teamTitle);
            teamDisplay.appendChild(teamInfo);
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'team-button-group';
            
            const selectBtn = document.createElement('button');
            selectBtn.className = 'team-btn';
            selectBtn.textContent = 'Select';
            selectBtn.onclick = () => selectTeam(teamDef.id);
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-team-btn';
            editBtn.innerHTML = '✏️';
            editBtn.onclick = () => openEditModal(teamDef.id);
            
            buttonGroup.appendChild(selectBtn);
            buttonGroup.appendChild(editBtn);
            
            teamSlot.appendChild(teamDisplay);
            teamSlot.appendChild(buttonGroup);
            
            container.appendChild(teamSlot);
        });
        
        updateButtonStates();
    }
    
    function updateButtonStates() {
        const container = document.getElementById('teamSelectionContainer');
        if (!container) return;
        
        const buttons = container.querySelectorAll('.team-btn');
        buttons.forEach((btn, index) => {
            const teamId = TEAMS[index].id;
            if (currentTeamId === teamId) {
                btn.classList.add('active-team');
                btn.textContent = 'Selected';
            } else {
                btn.classList.remove('active-team');
                btn.textContent = 'Select';
            }
        });
    }
    
    function selectTeam(teamId) {
        console.log('Selecting team:', teamId);
        currentTeamId = teamId;
        localStorage.setItem('currentTeamId', teamId);
        updateButtonStates();
        
        // Navigate to player selection
        if (App.showPage) {
            App.showPage('selection');
        }
    }
    
    function openEditModal(teamId) {
        editingTeamId = teamId;
        const teamData = getTeam(teamId);
        if (!teamData) return;
        
        const modal = document.getElementById('teamEditModal');
        const input = document.getElementById('teamNameInput');
        
        if (modal && input) {
            input.value = teamData.name;
            modal.style.display = 'flex';
            input.focus();
        }
    }
    
    function closeEditModal() {
        const modal = document.getElementById('teamEditModal');
        if (modal) {
            modal.style.display = 'none';
        }
        editingTeamId = null;
    }
    
    function saveTeamName() {
        if (!editingTeamId) return;
        
        const input = document.getElementById('teamNameInput');
        const newName = input ? input.value.trim() : '';
        
        if (newName) {
            const teamData = getTeam(editingTeamId);
            if (teamData) {
                teamData.name = newName;
                saveTeam(editingTeamId, teamData);
                renderTeamSelection();
            }
        }
        
        closeEditModal();
    }
    
    function setupModalListeners() {
        const saveBtn = document.getElementById('saveTeamNameBtn');
        const cancelBtn = document.getElementById('cancelTeamEditBtn');
        const modal = document.getElementById('teamEditModal');
        const input = document.getElementById('teamNameInput');
        
        if (saveBtn) {
            saveBtn.onclick = saveTeamName;
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = closeEditModal;
        }
        
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    closeEditModal();
                }
            };
        }
        
        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    saveTeamName();
                }
            };
        }
    }
    
    function getTeam(teamId) {
        const data = localStorage.getItem(teamId);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Error parsing team data:', e);
                return null;
            }
        }
        return null;
    }
    
    function saveTeam(teamId, data) {
        localStorage.setItem(teamId, JSON.stringify(data));
    }
    
    function saveTeams() {
        // Already saved via individual saveTeam calls
    }
    
    function getCurrentTeamInfo() {
        if (!currentTeamId) return null;
        const teamData = getTeam(currentTeamId);
        return teamData ? { id: currentTeamId, ...teamData } : null;
    }
    
    function resetCurrentTeam() {
        if (!currentTeamId) return false;
        
        const teamData = getTeam(currentTeamId);
        if (teamData) {
            teamData.players = [];
            saveTeam(currentTeamId, teamData);
            renderTeamSelection();
            return true;
        }
        return false;
    }
    
    function showInfo() {
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        modal.innerHTML = `
            <div class="info-content">
                <h2>Bedienungsanleitung</h2>
                <h3>Team Selection</h3>
                <ul>
                    <li>Spieler aus der Liste auswählen</li>
                    <li>Goalies mit dem Goalie-Button markieren</li>
                </ul>
                <h3>Game Data</h3>
                <ul>
                    <li>Long-Press auf Spielernamen: Reihenfolge ändern (Drag & Drop)</li>
                    <li>Statistiken werden automatisch gespeichert</li>
                </ul>
                <h3>Goal Map</h3>
                <ul>
                    <li>Goal Workflow: Filter wird ignoriert, Spieler/Goalie kommt aus Workflow</li>
                    <li>Tore auf der Karte markieren</li>
                </ul>
                <h3>Shot Map</h3>
                <ul>
                    <li>Shot Workflow: Filter ist aktiv</li>
                    <li>Schüsse tracken</li>
                </ul>
                <h3>Season Map</h3>
                <ul>
                    <li>Saisonübersicht aller Spiele</li>
                    <li>Export: Daten bleiben erhalten bis Reset gedrückt wird</li>
                </ul>
                <h3>Momentum-Grafik</h3>
                <ul>
                    <li>Filter-sensitiv: Player-Filter für grüne Linie (oben)</li>
                    <li>Goalie-Filter für rote Linie (unten)</li>
                </ul>
                <button id="infoCloseBtn" class="primary-btn">Schließen</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close button event listener
        document.getElementById('infoCloseBtn')?.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Public API
    return {
        init,
        getCurrentTeamInfo,
        saveTeams,
        updateButtonStates,
        resetCurrentTeam,
        showInfo
    };
})();

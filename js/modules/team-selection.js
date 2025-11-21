// Team Selection Module
(function() {
    console.log('Team Selection Module loading...');
    
    let currentTeam = 1;
    const maxPlayers = 16;
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('Initializing Team Selection');
        
        // Load saved team - ensure it's always a valid number
        const savedTeam = localStorage.getItem('currentTeam');
        if (savedTeam && !isNaN(parseInt(savedTeam))) {
            currentTeam = parseInt(savedTeam);
        } else {
            currentTeam = 1; // Default to team 1
            localStorage.setItem('currentTeam', '1');
        }
        
        // Setup team tabs (only if they exist)
        setupTeamTabs();
        
        // Load current team data
        loadTeamData(currentTeam);
        
        // Setup event listeners
        setupEventListeners();
        
        // Initial render
        renderPlayerList();
    }
    
    function setupTeamTabs() {
        const tabsContainer = document.querySelector('.team-tabs');
        if (!tabsContainer) {
            console.log('Team tabs container not found - using single team mode');
            // In single team mode, just ensure we have a valid currentTeam
            if (!currentTeam || isNaN(currentTeam)) {
                currentTeam = 1;
                localStorage.setItem('currentTeam', '1');
            }
            return;
        }
        
        // Update existing tabs instead of recreating
        document.querySelectorAll('.team-tab').forEach(tab => {
            const teamNum = parseInt(tab.dataset.team);
            tab.classList.toggle('active', teamNum === currentTeam);
            
            // Add click handler if not already added
            if (!tab.hasAttribute('data-initialized')) {
                tab.addEventListener('click', function() {
                    const newTeam = parseInt(this.dataset.team);
                    if (newTeam !== currentTeam) {
                        switchTeam(newTeam);
                    }
                });
                tab.setAttribute('data-initialized', 'true');
            }
        });
    }
    
    function setupEventListeners() {
        // Add player button
        const addBtn = document.querySelector('.add-player-btn');
        if (addBtn && !addBtn.hasAttribute('data-initialized')) {
            addBtn.addEventListener('click', addNewPlayer);
            addBtn.setAttribute('data-initialized', 'true');
        }
        
        // Continue button
        const continueBtn = document.querySelector('.continue-btn');
        if (continueBtn && !continueBtn.hasAttribute('data-initialized')) {
            continueBtn.addEventListener('click', function() {
                const teamData = getTeamData();
                if (teamData.players && teamData.players.length > 0) {
                    window.location.href = 'game-setup.html';
                } else {
                    alert('Bitte fügen Sie mindestens einen Spieler hinzu');
                }
            });
            continueBtn.setAttribute('data-initialized', 'true');
        }
    }
    
    function switchTeam(newTeam) {
        console.log(`Switching from team ${currentTeam} to team ${newTeam}`);
        
        // Save current team data
        saveTeamData(currentTeam);
        
        // Update current team
        const oldTeam = currentTeam;
        currentTeam = newTeam;
        localStorage.setItem('currentTeam', currentTeam);
        
        // Update UI
        document.querySelectorAll('.team-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.team) === currentTeam);
        });
        
        // Load new team data
        loadTeamData(newTeam);
        
        // Render player list
        renderPlayerList();
        
        console.log(`Successfully switched from team ${oldTeam} to team ${newTeam}`);
    }
    
    function saveTeamData(teamNumber) {
        // Ensure teamNumber is valid
        if (!teamNumber || isNaN(teamNumber)) {
            console.error('Invalid team number for save:', teamNumber);
            teamNumber = currentTeam || 1;
        }
        const data = getTeamData();
        localStorage.setItem(`team${teamNumber}Data`, JSON.stringify(data));
        console.log(`Saved data for team${teamNumber}`);
    }
    
    function loadTeamData(teamNumber) {
        // Ensure teamNumber is valid
        if (!teamNumber || isNaN(teamNumber)) {
            console.error('Invalid team number for load:', teamNumber);
            teamNumber = 1;
            currentTeam = 1;
            localStorage.setItem('currentTeam', '1');
        }
        
        const savedData = localStorage.getItem(`team${teamNumber}Data`);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Ensure players is an array
                if (!data.players) {
                    data.players = [];
                }
                if (!Array.isArray(data.players)) {
                    data.players = [];
                }
                setTeamData(data);
                console.log(`Loaded data for team${teamNumber}`, {
                    players: data.players.length,
                    hasStats: data.hasStats !== false,
                    hasTimers: data.hasTimers === true
                });
            } catch (e) {
                console.error('Error loading team data:', e);
                setTeamData({ players: [], hasStats: true, hasTimers: false });
            }
        } else {
            setTeamData({ players: [], hasStats: true, hasTimers: false });
        }
    }
    
    function getTeamData() {
        const key = `team${currentTeam}Data`;
        if (!window[key]) {
            window[key] = { players: [], hasStats: true, hasTimers: false };
        }
        if (!window[key].players) {
            window[key].players = [];
        }
        if (!Array.isArray(window[key].players)) {
            window[key].players = [];
        }
        return window[key];
    }
    
    function setTeamData(data) {
        const key = `team${currentTeam}Data`;
        window[key] = data;
    }
    
    function renderPlayerList() {
        const playerList = document.querySelector('.player-list');
        if (!playerList) return;
        
        const teamData = getTeamData();
        const players = teamData.players || [];
        
        playerList.innerHTML = '';
        
        players.forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.dataset.index = index;
            
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            playerInfo.innerHTML = `
                <span class="player-number">#${player.number}</span>
                <span class="player-name">${player.name}</span>
            `;
            
            const playerActions = document.createElement('div');
            playerActions.className = 'player-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = '✏️';
            editBtn.onclick = () => editPlayer(index);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.onclick = () => deletePlayer(index);
            
            playerActions.appendChild(editBtn);
            playerActions.appendChild(deleteBtn);
            
            playerCard.appendChild(playerInfo);
            playerCard.appendChild(playerActions);
            
            playerList.appendChild(playerCard);
        });
        
        // Update counter
        updatePlayerCounter();
    }
    
    function updatePlayerCounter() {
        const counter = document.querySelector('.player-counter');
        if (counter) {
            const count = getTeamData().players.length;
            counter.textContent = `${count}/${maxPlayers} Spieler`;
        }
    }
    
    function addNewPlayer() {
        const teamData = getTeamData();
        if (teamData.players.length >= maxPlayers) {
            alert(`Maximum ${maxPlayers} Spieler pro Team`);
            return;
        }
        
        const name = prompt('Spielername:');
        if (!name || !name.trim()) return;
        
        const number = prompt('Rückennummer:');
        if (!number || isNaN(number)) return;
        
        teamData.players.push({
            name: name.trim(),
            number: parseInt(number),
            position: ''
        });
        
        saveTeamData(currentTeam);
        renderPlayerList();
    }
    
    function editPlayer(index) {
        const teamData = getTeamData();
        const player = teamData.players[index];
        if (!player) return;
        
        const newName = prompt('Spielername:', player.name);
        if (newName === null) return;
        
        const newNumber = prompt('Rückennummer:', player.number);
        if (newNumber === null) return;
        
        if (newName.trim() && !isNaN(newNumber)) {
            player.name = newName.trim();
            player.number = parseInt(newNumber);
            
            saveTeamData(currentTeam);
            renderPlayerList();
        }
    }
    
    function deletePlayer(index) {
        if (confirm('Spieler wirklich löschen?')) {
            const teamData = getTeamData();
            teamData.players.splice(index, 1);
            saveTeamData(currentTeam);
            renderPlayerList();
        }
    }
    
    // Public API
    const api = {
        init() {
            // Already initialized in IIFE, but provide no-op for compatibility
            console.log('Team Selection already initialized');
        },
        getCurrentTeam: () => currentTeam,
        getCurrentTeamInfo() {
            return {
                id: `team${currentTeam}`,
                number: currentTeam,
                name: `Team ${currentTeam}` 
            };
        },
        getTeamData: getTeamData,
        refresh: renderPlayerList,
        saveTeams: () => saveTeamData(currentTeam),
        resetCurrentTeam() {
            const confirmed = confirm("Spieldaten zurücksetzen?");
            if (confirmed) {
                setTeamData({ players: [], hasStats: true, hasTimers: false });
                saveTeamData(currentTeam);
                renderPlayerList();
            }
            return confirmed;
        },
        updateButtonStates() {
            // Render team selection interface if we're on that page
            const container = document.getElementById('teamSelectionContainer');
            if (container && document.getElementById('teamSelectionPage').style.display !== 'none') {
                renderTeamSelectionButtons();
            }
        }
    };
    
    function renderTeamSelectionButtons() {
        const container = document.getElementById('teamSelectionContainer');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create team buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 20px; max-width: 500px; margin: 40px auto; padding: 20px;';
        
        // Create buttons for Team 1, Team 2, and Team 3
        for (let i = 1; i <= 3; i++) {
            const teamBtn = document.createElement('button');
            teamBtn.textContent = `Team ${i}`;
            teamBtn.style.cssText = 'padding: 20px 40px; font-size: 1.2rem; background: #44bb91; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;';
            
            // Highlight current team
            if (i === currentTeam) {
                teamBtn.style.background = '#3aa57d';
                teamBtn.style.boxShadow = '0 0 0 3px rgba(68, 187, 145, 0.3)';
            }
            
            teamBtn.addEventListener('click', () => {
                if (i !== currentTeam) {
                    switchTeam(i);
                }
                App.showPage('selection');
            });
            
            teamBtn.addEventListener('mouseenter', () => {
                if (i === currentTeam) {
                    teamBtn.style.background = '#338869';
                } else {
                    teamBtn.style.background = '#3aa57d';
                }
            });
            
            teamBtn.addEventListener('mouseleave', () => {
                if (i === currentTeam) {
                    teamBtn.style.background = '#3aa57d';
                    teamBtn.style.boxShadow = '0 0 0 3px rgba(68, 187, 145, 0.3)';
                } else {
                    teamBtn.style.background = '#44bb91';
                }
            });
            
            buttonsDiv.appendChild(teamBtn);
        }
        
        container.appendChild(buttonsDiv);
    }
    
    window.TeamSelection = api;
    App.teamSelection = api;
    
})();

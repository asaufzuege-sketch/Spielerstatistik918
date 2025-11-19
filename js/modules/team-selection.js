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
        
        // Load saved team
        const savedTeam = localStorage.getItem('currentTeam');
        if (savedTeam) {
            currentTeam = parseInt(savedTeam);
        }
        
        // Setup team tabs
        setupTeamTabs();
        
        // Load current team data
        loadTeamData(currentTeam);
        
        // Setup event listeners mit Event Delegation
        setupEventListeners();
        
        // Initial render
        renderPlayerList();
    }
    
    function setupTeamTabs() {
        const tabsContainer = document.querySelector('.team-tabs');
        if (!tabsContainer) {
            console.error('Team tabs container not found');
            return;
        }
        
        // Clear and create tabs
        tabsContainer.innerHTML = '';
        for (let i = 1; i <= 3; i++) {
            const tab = document.createElement('button');
            tab.className = `team-tab ${i === currentTeam ? 'active' : ''}`;
            tab.dataset.team = i;
            tab.textContent = `Team ${i}`;
            tabsContainer.appendChild(tab);
        }
    }
    
    function setupEventListeners() {
        // Team tabs - Event Delegation
        const tabsContainer = document.querySelector('.team-tabs');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', function(e) {
                if (e.target.classList.contains('team-tab')) {
                    const newTeam = parseInt(e.target.dataset.team);
                    if (newTeam !== currentTeam) {
                        switchTeam(newTeam);
                    }
                }
            });
        }
        
        // Player list - Event Delegation für dynamische Inhalte
        const playerList = document.querySelector('.player-list');
        if (playerList) {
            playerList.addEventListener('click', function(e) {
                // Edit button
                if (e.target.classList.contains('edit-btn')) {
                    const playerCard = e.target.closest('.player-card');
                    if (playerCard) {
                        const index = parseInt(playerCard.dataset.index);
                        editPlayer(index);
                    }
                }
                
                // Delete button
                if (e.target.classList.contains('delete-btn')) {
                    const playerCard = e.target.closest('.player-card');
                    if (playerCard) {
                        const index = parseInt(playerCard.dataset.index);
                        deletePlayer(index);
                    }
                }
            });
        }
        
        // Add player button
        const addBtn = document.querySelector('.add-player-btn');
        if (addBtn) {
            addBtn.addEventListener('click', addNewPlayer);
        }
        
        // Continue button
        const continueBtn = document.querySelector('.continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', function() {
                if (getTeamData().players.length > 0) {
                    window.location.href = 'game-setup.html';
                } else {
                    alert('Bitte fügen Sie mindestens einen Spieler hinzu');
                }
            });
        }
    }
    
    function switchTeam(newTeam) {
        console.log(`Switching from team ${currentTeam} to team ${newTeam}`);
        
        // Save current team data
        saveTeamData(currentTeam);
        
        // Update current team
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
        
        console.log(`Successfully switched from team ${currentTeam} to team ${newTeam}`);
    }
    
    function saveTeamData(teamNumber) {
        const data = {
            players: getTeamData().players,
            hasStats: true,
            hasTimers: false
        };
        localStorage.setItem(`team${teamNumber}Data`, JSON.stringify(data));
        console.log(`Saved data for team${teamNumber}`);
    }
    
    function loadTeamData(teamNumber) {
        const savedData = localStorage.getItem(`team${teamNumber}Data`);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                // Ensure players is an array
                if (!Array.isArray(data.players)) {
                    data.players = [];
                }
                setTeamData(data);
                console.log(`Loaded data for team${teamNumber}`, {
                    players: data.players.length,
                    hasStats: data.hasStats || true,
                    hasTimers: data.hasTimers || false
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
        const data = window[key] || { players: [], hasStats: true, hasTimers: false };
        if (!Array.isArray(data.players)) {
            data.players = [];
        }
        return data;
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
            
            playerCard.innerHTML = `
                <div class="player-info">
                    <span class="player-number">#${player.number}</span>
                    <span class="player-name">${player.name}</span>
                </div>
                <div class="player-actions">
                    <button class="edit-btn">✏️</button>
                    <button class="delete-btn">🗑️</button>
                </div>
            `;
            
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
        if (!name) return;
        
        const number = prompt('Rückennummer:');
        if (!number) return;
        
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
        
        player.name = newName.trim();
        player.number = parseInt(newNumber);
        
        saveTeamData(currentTeam);
        renderPlayerList();
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
    window.TeamSelection = {
        getCurrentTeam: () => currentTeam,
        getTeamData: getTeamData,
        refresh: renderPlayerList
    };
    
})();

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
        
        // Create team tabs
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'team-tabs';
        tabsDiv.style.cssText = 'display: flex; gap: 10px; justify-content: center; margin-bottom: 30px;';
        
        for (let i = 1; i <= 3; i++) {
            const tab = document.createElement('button');
            tab.className = 'team-tab';
            tab.textContent = `Team ${i}`;
            tab.dataset.team = i;
            tab.style.cssText = `padding: 15px 40px; font-size: 1.1rem; border: 2px solid #44bb91; background: ${i === currentTeam ? '#44bb91' : 'transparent'}; color: ${i === currentTeam ? 'white' : '#44bb91'}; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;`;
            
            tab.addEventListener('click', () => {
                if (i !== currentTeam) {
                    switchTeam(i);
                    renderTeamSelectionButtons(); // Re-render to show new team
                }
            });
            
            tab.addEventListener('mouseenter', () => {
                if (i !== currentTeam) {
                    tab.style.background = 'rgba(68, 187, 145, 0.1)';
                }
            });
            
            tab.addEventListener('mouseleave', () => {
                if (i !== currentTeam) {
                    tab.style.background = 'transparent';
                }
            });
            
            tabsDiv.appendChild(tab);
        }
        
        container.appendChild(tabsDiv);
        
        // Create roster container
        const rosterDiv = document.createElement('div');
        rosterDiv.style.cssText = 'max-width: 800px; margin: 0 auto; padding: 20px;';
        
        const teamData = getTeamData();
        
        // Team 1: Show predefined players
        if (currentTeam === 1) {
            const predefinedPlayers = App.data.players || [];
            
            predefinedPlayers.forEach((player, index) => {
                const playerRow = document.createElement('div');
                playerRow.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 12px; background: rgba(255, 255, 255, 0.05); margin-bottom: 8px; border-radius: 6px;';
                
                const numberInput = document.createElement('input');
                numberInput.type = 'text';
                numberInput.value = player.num || '';
                numberInput.placeholder = 'Nr.';
                numberInput.style.cssText = 'width: 60px; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; color: white; text-align: center;';
                numberInput.addEventListener('input', (e) => {
                    player.num = e.target.value;
                    saveTeamData(currentTeam);
                });
                
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = player.name || '';
                nameInput.placeholder = 'Spielername';
                nameInput.style.cssText = 'flex: 1; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; color: white;';
                nameInput.addEventListener('input', (e) => {
                    player.name = e.target.value;
                    saveTeamData(currentTeam);
                });
                
                playerRow.appendChild(numberInput);
                playerRow.appendChild(nameInput);
                rosterDiv.appendChild(playerRow);
            });
        } else {
            // Teams 2 & 3: Show 30 empty slots
            for (let i = 0; i < 30; i++) {
                const playerRow = document.createElement('div');
                playerRow.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 12px; background: rgba(255, 255, 255, 0.05); margin-bottom: 8px; border-radius: 6px;';
                
                // Get or create player data
                if (!teamData.players) teamData.players = [];
                if (!teamData.players[i]) {
                    teamData.players[i] = { num: '', name: '' };
                }
                
                const numberInput = document.createElement('input');
                numberInput.type = 'text';
                numberInput.value = teamData.players[i].num || '';
                numberInput.placeholder = 'Nr.';
                numberInput.style.cssText = 'width: 60px; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; color: white; text-align: center;';
                numberInput.addEventListener('input', (e) => {
                    teamData.players[i].num = e.target.value;
                    saveTeamData(currentTeam);
                });
                
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = teamData.players[i].name || '';
                nameInput.placeholder = 'Spielername';
                nameInput.style.cssText = 'flex: 1; padding: 8px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; color: white;';
                nameInput.addEventListener('input', (e) => {
                    teamData.players[i].name = e.target.value;
                    saveTeamData(currentTeam);
                });
                
                playerRow.appendChild(numberInput);
                playerRow.appendChild(nameInput);
                rosterDiv.appendChild(playerRow);
            }
        }
        
        container.appendChild(rosterDiv);
        
        // Add continue button
        const continueBtn = document.createElement('button');
        continueBtn.textContent = 'Weiter zur Spielerauswahl';
        continueBtn.style.cssText = 'display: block; margin: 30px auto; padding: 15px 40px; font-size: 1.1rem; background: #44bb91; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;';
        continueBtn.addEventListener('click', () => {
            App.showPage('selection');
        });
        continueBtn.addEventListener('mouseenter', () => {
            continueBtn.style.background = '#3aa57d';
        });
        continueBtn.addEventListener('mouseleave', () => {
            continueBtn.style.background = '#44bb91';
        });
        
        container.appendChild(continueBtn);
    }
    
    window.TeamSelection = api;
    App.teamSelection = api;
    
})();

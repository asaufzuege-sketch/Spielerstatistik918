// Team Selection Module mit vollständig separater Datenspeicherung
App.teamSelection = {
  container: null,
  currentTeam: 1,
  
  init() {
    this.container = document.getElementById("teamSelectionContainer");
    
    // Attach event listeners to existing team buttons
    for (let i = 1; i <= 3; i++) {
      const teamBtn = document.getElementById(`teamBtn${i}`);
      if (teamBtn) {
        teamBtn.addEventListener("click", () => {
          this.switchTeam(i);
        });
      }
    }
    
    this.initTeamFromStorage();
    this.initTeamNameModal();
  },
  
  // Initialize team name edit modal
  initTeamNameModal() {
    const modal = document.getElementById("teamEditModal");
    const teamNameInput = document.getElementById("teamNameInput");
    const saveBtn = document.getElementById("saveTeamNameBtn");
    const cancelBtn = document.getElementById("cancelTeamEditBtn");
    
    // Edit buttons for each team
    for (let i = 1; i <= 3; i++) {
      const editBtn = document.getElementById(`editBtn${i}`);
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          this.openTeamNameModal(i);
        });
      }
    }
    
    // Save button
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        this.saveTeamName();
      });
    }
    
    // Cancel button
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.closeTeamNameModal();
      });
    }
    
    // Close on outside click
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeTeamNameModal();
        }
      });
    }
    
    // Enter key to save
    if (teamNameInput) {
      teamNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.saveTeamName();
        }
      });
    }
  },
  
  openTeamNameModal(teamNumber) {
    const modal = document.getElementById("teamEditModal");
    const input = document.getElementById("teamNameInput");
    
    if (!modal || !input) return;
    
    // Load current team name
    const savedName = localStorage.getItem(`teamName_${teamNumber}`);
    input.value = savedName || `Team ${teamNumber}`;
    input.dataset.teamNumber = teamNumber;
    
    modal.style.display = "flex";
    input.focus();
    input.select();
  },
  
  closeTeamNameModal() {
    const modal = document.getElementById("teamEditModal");
    if (modal) {
      modal.style.display = "none";
    }
  },
  
  saveTeamName() {
    const input = document.getElementById("teamNameInput");
    if (!input) return;
    
    const teamNumber = parseInt(input.dataset.teamNumber);
    const newName = input.value.trim();
    
    if (!newName) {
      alert("Bitte einen Teamnamen eingeben.");
      return;
    }
    
    // Save team name
    localStorage.setItem(`teamName_${teamNumber}`, newName);
    
    // Update display
    const teamNameSpan = document.getElementById(`teamName${teamNumber}`);
    if (teamNameSpan) {
      teamNameSpan.textContent = newName;
    }
    
    // Update current displays if this is the active team
    if (teamNumber === this.currentTeam) {
      this.updateTeamDisplays();
    }
    
    this.closeTeamNameModal();
  },
  
  // Get team name from storage or default
  getTeamName(teamNumber) {
    const savedName = localStorage.getItem(`teamName_${teamNumber}`);
    return savedName || `Team ${teamNumber}`;
  },
  
  createTeamButtons() {
    if (!this.container) return;
    
    // Clear container
    this.container.innerHTML = "";
    
    // Create team buttons wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "team-buttons-wrapper";
    wrapper.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: center;
      margin: 10px 0;
      flex-wrap: wrap;
    `;
    
    // Create 3 team buttons
    for (let i = 1; i <= 3; i++) {
      const button = document.createElement("button");
      button.className = "team-btn";
      button.textContent = `Team ${i}`;
      button.dataset.team = i;
      button.style.cssText = `
        padding: 8px 16px;
        border: 2px solid #44bb91;
        background-color: transparent;
        color: #44bb91;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
        min-width: 80px;
      `;
      
      // Event listener for team switch
      button.addEventListener("click", () => {
        this.switchTeam(i);
      });
      
      // Hover effects
      button.addEventListener("mouseenter", () => {
        if (!button.classList.contains('active')) {
          button.style.backgroundColor = "rgba(68, 187, 145, 0.2)";
        }
      });
      
      button.addEventListener("mouseleave", () => {
        if (!button.classList.contains('active')) {
          button.style.backgroundColor = "transparent";
        }
      });
      
      wrapper.appendChild(button);
    }
    
    this.container.appendChild(wrapper);
    
    // Set initial active state
    this.updateButtonStates();
  },
  
  switchTeam(teamNumber) {
    if (teamNumber === this.currentTeam) return; // Already on this team
    
    console.log(`Switching from team ${this.currentTeam} to team ${teamNumber}`);
    
    // Save current team data before switching
    this.saveCurrentTeamData();
    
    // Stop all active timers for current team
    this.stopAllTimers();
    
    // Switch team
    const previousTeam = this.currentTeam;
    this.currentTeam = teamNumber;
    App.data.currentTeam = `team${teamNumber}`;
    
    // Save team selection
    localStorage.setItem("currentTeam", App.data.currentTeam);
    
    // Load new team data
    this.loadTeamData(teamNumber);
    
    // Update UI
    this.updateButtonStates();
    this.refreshAllTables();
    
    console.log(`Successfully switched from team ${previousTeam} to team ${teamNumber}`);
  },
  
  saveCurrentTeamData() {
    if (!this.currentTeam) return;
    
    const teamId = `team${this.currentTeam}`;
    
    // Save all current data with team prefix
    localStorage.setItem(`selectedPlayers_${teamId}`, JSON.stringify(App.data.selectedPlayers || []));
    localStorage.setItem(`statsData_${teamId}`, JSON.stringify(App.data.statsData || {}));
    localStorage.setItem(`playerTimes_${teamId}`, JSON.stringify(App.data.playerTimes || {}));
    localStorage.setItem(`seasonData_${teamId}`, JSON.stringify(App.data.seasonData || {}));
    
    // Save opponent shots
    const shotCell = document.querySelector('.total-cell[data-cat="Shot"]');
    if (shotCell && shotCell.dataset.opp) {
      localStorage.setItem(`opponentShots_${teamId}`, shotCell.dataset.opp);
    }
    
    // Save active timer players
    const activeTimerPlayers = Object.keys(App.data.activeTimers || {});
    localStorage.setItem(`activeTimerPlayers_${teamId}`, JSON.stringify(activeTimerPlayers));
    
    console.log(`Saved data for ${teamId}`);
  },
  
  loadTeamData(teamNumber) {
    const teamId = `team${teamNumber}`;
    
    // Load team-specific data or use defaults
    const savedPlayers = localStorage.getItem(`selectedPlayers_${teamId}`);
    const savedStats = localStorage.getItem(`statsData_${teamId}`);
    const savedTimes = localStorage.getItem(`playerTimes_${teamId}`);
    const savedSeason = localStorage.getItem(`seasonData_${teamId}`);
    const savedOppShots = localStorage.getItem(`opponentShots_${teamId}`);
    const savedActiveTimers = localStorage.getItem(`activeTimerPlayers_${teamId}`);
    
    // Reset App data
    App.data.selectedPlayers = savedPlayers ? JSON.parse(savedPlayers) : [];
    App.data.statsData = savedStats ? JSON.parse(savedStats) : {};
    App.data.playerTimes = savedTimes ? JSON.parse(savedTimes) : {};
    App.data.seasonData = savedSeason ? JSON.parse(savedSeason) : {};
    App.data.activeTimers = {};
    
    // For Team 2 and 3: Create 30 empty player slots if no data exists
    if (teamNumber === 2 || teamNumber === 3) {
      if (App.data.selectedPlayers.length === 0) {
        // Initialize with empty players - these will be shown in player selection
        App.data.players = [];
        for (let i = 1; i <= 30; i++) {
          App.data.players.push({ num: "", name: "" });
        }
      } else {
        // If there are saved players, keep them but ensure we have App.data.players available
        if (!App.data.players || App.data.players.length === 0) {
          App.data.players = [];
        }
      }
    } else {
      // Team 1: Use the original predefined players
      if (!App.data.players || App.data.players.length === 0) {
        App.data.players = [
          { num: 4, name: "Ondrej Kastner" }, { num: 5, name: "Raphael Oehninger" },
          { num: 6, name: "Nuno Meier" }, { num: 7, name: "Silas Teuber" },
          { num: 8, name: "Diego Warth" }, { num: 9, name: "Mattia Crameri" },
          { num: 10, name: "Mael Bernath" }, { num: 11, name: "Sean Nef" },
          { num: 12, name: "Rafael Burri" }, { num: 13, name: "Lenny Schwarz" },
          { num: 14, name: "David Lienert" }, { num: 15, name: "Neven Severini" },
          { num: 16, name: "Nils Koubek" }, { num: 17, name: "Lio Kundert" },
          { num: 18, name: "Livio Berner" }, { num: 19, name: "Robin Strasser" },
          { num: 21, name: "Marlon Kreyenbühl" }, { num: 22, name: "Martin Lana" },
          { num: 23, name: "Manuel Isler" }, { num: 24, name: "Moris Hürlimann" },
          { num: "", name: "Levi Baumann" }, { num: "", name: "Corsin Blapp" },
          { num: "", name: "Lenny Zimmermann" }, { num: "", name: "Luke Böhmichen" },
          { num: "", name: "Livio Weissen" }, { num: "", name: "Raul Wütrich" },
          { num: "", name: "Marco Senn" }
        ];
      }
    }
    
    // Restore active timers if any
    if (savedActiveTimers) {
      const timerPlayers = JSON.parse(savedActiveTimers);
      timerPlayers.forEach(playerName => {
        if (App.data.selectedPlayers.some(p => p.name === playerName)) {
          App.startPlayerTimer(playerName);
        }
      });
    }
    
    // Restore opponent shots (will be applied when table renders)
    if (savedOppShots) {
      setTimeout(() => {
        const shotCell = document.querySelector('.total-cell[data-cat="Shot"]');
        if (shotCell) {
          shotCell.dataset.opp = savedOppShots;
          App.statsTable.updateTotals();
        }
      }, 100);
    }
    
    console.log(`Loaded data for ${teamId}`, {
      players: App.data.selectedPlayers.length,
      hasStats: Object.keys(App.data.statsData).length > 0,
      hasTimers: Object.keys(App.data.activeTimers).length > 0
    });
  },
  
  stopAllTimers() {
    Object.values(App.data.activeTimers || {}).forEach(timer => {
      if (timer) clearInterval(timer);
    });
    App.data.activeTimers = {};
  },
  
  updateButtonStates() {
    document.querySelectorAll('.team-btn').forEach((btn, index) => {
      const teamNum = index + 1;
      if (teamNum === this.currentTeam) {
        btn.classList.add('active');
        btn.style.backgroundColor = '#44bb91';
        btn.style.color = 'white';
      } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#44bb91';
      }
    });
  },
  
  refreshAllTables() {
    // Refresh stats table
    if (App.statsTable && App.statsTable.render) {
      App.statsTable.render();
    }
    
    // Refresh season table
    if (App.seasonTable && App.seasonTable.render) {
      App.seasonTable.render();
    }
    
    // Update timer visuals
    if (App.updateTimerVisuals) {
      App.updateTimerVisuals();
    }
    
    // Update team display elements
    this.updateTeamDisplays();
    
    // Event-Listener für Navigation-Buttons neu setzen (Fix für das Button-Problem)
    setTimeout(() => {
      // "Spieler wählen" Button Event-Listener neu setzen
      const selectPlayersBtn = document.getElementById("selectPlayersBtn");
      if (selectPlayersBtn) {
        selectPlayersBtn.onclick = () => App.showPage("selection");
      }
      
      // Alle anderen Navigation-Buttons neu setzen
      const torbildBtn = document.getElementById("torbildBtn");
      if (torbildBtn) {
        torbildBtn.onclick = () => App.showPage("torbild");
      }
      
      const goalValueBtn = document.getElementById("goalValueBtn");
      if (goalValueBtn) {
        goalValueBtn.onclick = () => App.showPage("goalValue");
      }
      
      const seasonBtn = document.getElementById("seasonBtn");
      if (seasonBtn) {
        seasonBtn.onclick = () => App.showPage("season");
      }
      
      const seasonMapBtn = document.getElementById("seasonMapBtn");
      if (seasonMapBtn) {
        seasonMapBtn.onclick = () => App.showPage("seasonMap");
      }
      
      // Auch Back-Buttons neu setzen
      const backToTeamSelectionBtn = document.getElementById("backToTeamSelectionBtn");
      if (backToTeamSelectionBtn) {
        backToTeamSelectionBtn.onclick = () => App.showPage("teamSelection");
      }
      
      const backToStatsBtn = document.getElementById("backToStatsBtn");
      if (backToStatsBtn) {
        backToStatsBtn.onclick = () => App.showPage("stats");
      }
      
      const backToStatsFromSeasonBtn = document.getElementById("backToStatsFromSeasonBtn");
      if (backToStatsFromSeasonBtn) {
        backToStatsFromSeasonBtn.onclick = () => App.showPage("stats");
      }
      
      const backToStatsFromSeasonMapBtn = document.getElementById("backToStatsFromSeasonMapBtn");
      if (backToStatsFromSeasonMapBtn) {
        backToStatsFromSeasonMapBtn.onclick = () => App.showPage("stats");
      }
      
      const backFromGoalValueBtn = document.getElementById("backFromGoalValueBtn");
      if (backFromGoalValueBtn) {
        backFromGoalValueBtn.onclick = () => App.showPage("stats");
      }
    }, 100);
  },
  
  // Update team name displays
  updateTeamDisplays() {
    const teamInfo = this.getCurrentTeamInfo();
    const teamName = teamInfo.name;
    
    const currentTeamDisplay = document.getElementById("currentTeamDisplay");
    if (currentTeamDisplay) {
      currentTeamDisplay.textContent = teamName;
    }
    
    const statsTeamDisplay = document.getElementById("statsTeamDisplay");
    if (statsTeamDisplay) {
      statsTeamDisplay.textContent = teamName;
    }
  },
  
  initTeamFromStorage() {
    const savedTeam = localStorage.getItem("currentTeam");
    if (savedTeam) {
      const teamNumber = parseInt(savedTeam.replace('team', ''));
      if (teamNumber >= 1 && teamNumber <= 3) {
        this.currentTeam = teamNumber;
        App.data.currentTeam = savedTeam;
        this.loadTeamData(teamNumber);
      } else {
        // Invalid team number, default to team 1
        this.switchTeam(1);
      }
    } else {
      // No saved team, default to team 1
      this.switchTeam(1);
    }
    
    this.updateButtonStates();
    this.updateTeamDisplays();
    
    // Load and display custom team names
    for (let i = 1; i <= 3; i++) {
      const teamNameSpan = document.getElementById(`teamName${i}`);
      if (teamNameSpan) {
        teamNameSpan.textContent = this.getTeamName(i);
      }
    }
  },
  
  resetCurrentTeam() {
    const teamId = `team${this.currentTeam}`;
    const teamName = `Team ${this.currentTeam}`;
    
    if (!confirm(`${teamName} Daten vollständig zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return false;
    }
    
    // Stop all timers
    this.stopAllTimers();
    
    // Remove team-specific data from localStorage
    const keysToRemove = [
      `selectedPlayers_${teamId}`,
      `statsData_${teamId}`,
      `playerTimes_${teamId}`,
      `seasonData_${teamId}`,
      `opponentShots_${teamId}`,
      `activeTimerPlayers_${teamId}`
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reset app data
    App.data.selectedPlayers = [];
    App.data.statsData = {};
    App.data.playerTimes = {};
    App.data.seasonData = {};
    App.data.activeTimers = {};
    
    // Refresh UI
    this.refreshAllTables();
    
    console.log(`Reset completed for ${teamName}`);
    alert(`${teamName} wurde zurückgesetzt. Andere Teams sind unberührt.`);
    
    return true;
  },
  
  // Get current team info
  getCurrentTeamInfo() {
    return {
      number: this.currentTeam,
      id: `team${this.currentTeam}`,
      name: this.getTeamName(this.currentTeam),
      playerCount: App.data.selectedPlayers.length,
      hasData: Object.keys(App.data.statsData).length > 0
    };
  },
  
  // Export current team data
  exportCurrentTeam() {
    if (App.csvHandler && App.csvHandler.exportStats) {
      App.csvHandler.exportStats();
    }
  },
  
  // Import data for current team
  importToCurrentTeam() {
    if (App.csvHandler && App.csvHandler.fileInput) {
      App.csvHandler.fileInput.dataset.target = "stats";
      App.csvHandler.fileInput.click();
    }
  }
};

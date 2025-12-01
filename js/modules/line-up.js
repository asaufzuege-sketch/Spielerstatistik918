// Line Up Module
App.lineUp = {
  container: null,
  modalOpen: false,
  currentPosition: null,
  lineUpData: {},
  playersOut: [],
  currentMode: 'normal', // 'normal', 'power', 'manuell'
  modes: ['normal', 'power', 'manuell'],
  
  init() {
    this.container = document.getElementById("lineUpContainer");
    this.loadData();
    this.attachEventListeners();
    this.updateModeDisplay();
    this.render();
    this.updatePlayerOutButton();
  },
  
  loadData() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedData = localStorage.getItem(`lineUpData_${currentTeamId}`);
    const savedPlayersOut = localStorage.getItem(`playersOut_${currentTeamId}`);
    
    try {
      this.lineUpData = savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      this.lineUpData = {};
    }
    
    try {
      this.playersOut = savedPlayersOut ? JSON.parse(savedPlayersOut) : [];
    } catch (e) {
      this.playersOut = [];
    }
  },
  
  saveData() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    localStorage.setItem(`lineUpData_${currentTeamId}`, JSON.stringify(this.lineUpData));
  },
  
  savePlayersOut() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    localStorage.setItem(`playersOut_${currentTeamId}`, JSON.stringify(this.playersOut));
  },
  
  getAvailablePlayers() {
    // Get players from player selection that are active
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedPlayersKey = `playerSelectionData_${currentTeamId}`;
    
    let players = [];
    try {
      const savedPlayers = JSON.parse(localStorage.getItem(savedPlayersKey) || "[]");
      players = savedPlayers.filter(p => p.active && p.name && p.name.trim() !== "");
    } catch (e) {
      players = [];
    }
    
    // Fallback to App.data.selectedPlayers if available
    if (players.length === 0 && App.data.selectedPlayers && App.data.selectedPlayers.length > 0) {
      players = App.data.selectedPlayers.map(p => ({
        number: p.num || "",
        name: p.name,
        position: "",
        active: true
      }));
    }
    
    return players;
  },
  
  attachEventListeners() {
    // Navigation buttons
    document.getElementById("lineUpPlayerSelectionBtn")?.addEventListener("click", () => {
      App.showPage("selection");
    });
    
    document.getElementById("lineUpGameDataBtn")?.addEventListener("click", () => {
      App.showPage("stats");
    });
    
    // Change Line button (merged Power Line + Team Line)
    document.getElementById("lineUpChangeLineBtn")?.addEventListener("click", () => {
      this.changeLineMode();
    });
    
    // Export PDF button
    document.getElementById("lineUpExportPdfBtn")?.addEventListener("click", () => {
      console.log("Export PDF clicked");
    });
    
    // Player Out button - toggle dropdown
    document.getElementById("lineUpPlayerOutBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePlayerOutDropdown();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      const dropdown = document.getElementById("playerOutDropdown");
      const playerOutBtn = document.getElementById("lineUpPlayerOutBtn");
      const container = document.querySelector(".player-out-container");
      
      if (dropdown && dropdown.classList.contains("open")) {
        if (!container.contains(e.target)) {
          dropdown.classList.remove("open");
        }
      }
    });
    
    // Position buttons - delegate click events
    if (this.container) {
      this.container.addEventListener("click", (e) => {
        const posBtn = e.target.closest(".lineup-position");
        if (posBtn) {
          this.openPlayerModal(posBtn);
        }
      });
    }
    
    // Modal buttons
    document.getElementById("lineUpCancelModalBtn")?.addEventListener("click", () => {
      this.closePlayerModal();
    });
    
    document.getElementById("lineUpClearPositionBtn")?.addEventListener("click", () => {
      this.clearCurrentPosition();
    });
    
    // Modal overlay click to close
    const modal = document.getElementById("lineUpPlayerModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closePlayerModal();
        }
      });
    }
  },
  
  togglePlayerOutDropdown() {
    const dropdown = document.getElementById("playerOutDropdown");
    if (!dropdown) return;
    
    dropdown.classList.toggle("open");
    
    if (dropdown.classList.contains("open")) {
      this.renderPlayerOutList();
    }
  },
  
  renderPlayerOutList() {
    const list = document.getElementById("playerOutList");
    if (!list) return;
    
    const players = this.getAvailablePlayers();
    
    if (players.length === 0) {
      list.innerHTML = '<div class="player-out-item" style="cursor: default; opacity: 0.7;">Keine aktiven Spieler</div>';
      return;
    }
    
    list.innerHTML = players.map(p => {
      const isOut = this.playersOut.includes(p.name);
      const number = p.number || '';
      const displayText = number ? `${number} ${p.name}` : p.name;
      
      return `
        <div class="player-out-item ${isOut ? 'is-out' : ''}" 
             data-player="${App.helpers.escapeHtml(p.name)}">
          ${App.helpers.escapeHtml(displayText)}
        </div>
      `;
    }).join('');
    
    // Add click handlers
    list.querySelectorAll(".player-out-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const playerName = item.dataset.player;
        if (playerName) {
          this.togglePlayerOut(playerName);
        }
      });
    });
  },
  
  togglePlayerOut(playerName) {
    const index = this.playersOut.indexOf(playerName);
    if (index > -1) {
      // Reactivate player
      this.playersOut.splice(index, 1);
    } else {
      // Mark as OUT
      this.playersOut.push(playerName);
    }
    
    this.savePlayersOut();
    this.renderPlayerOutList();
    this.updatePlayerOutButton();
    this.render(); // Re-render LINE UP to update blocked players
  },
  
  generatePositionKey(posBtn) {
    const pos = posBtn.dataset.pos;
    const line = posBtn.dataset.line;
    const pair = posBtn.dataset.pair;
    const formation = posBtn.dataset.formation;
    
    if (line) return `${pos}_line${line}`;
    if (pair) return `${pos}_pair${pair}`;
    if (formation) return `${pos}_form${formation}`;
    return pos;
  },
  
  openPlayerModal(posBtn) {
    this.currentPosition = {
      element: posBtn,
      key: this.generatePositionKey(posBtn),
      pos: posBtn.dataset.pos,
      line: posBtn.dataset.line,
      pair: posBtn.dataset.pair,
      formation: posBtn.dataset.formation
    };
    
    const modal = document.getElementById("lineUpPlayerModal");
    const title = document.getElementById("lineUpModalTitle");
    const playerList = document.getElementById("lineUpPlayerList");
    
    if (!modal || !playerList) return;
    
    // Set modal title
    const posLabel = this.getPositionLabel(this.currentPosition);
    if (title) {
      title.textContent = `Spieler für ${posLabel} auswählen`;
    }
    
    // Get available players (excluding OUT players)
    const allPlayers = this.getAvailablePlayers();
    const players = allPlayers.filter(p => !this.playersOut.includes(p.name));
    
    // Get already assigned players
    const assignedPlayers = Object.values(this.lineUpData);
    
    // Render player list
    playerList.innerHTML = players.map(player => {
      const isAssigned = assignedPlayers.includes(player.name);
      const isCurrentPosition = this.lineUpData[this.currentPosition.key] === player.name;
      
      return `
        <div class="lineup-player-option ${isCurrentPosition ? 'selected' : ''} ${isAssigned && !isCurrentPosition ? 'assigned' : ''}"
             data-player="${App.helpers.escapeHtml(player.name)}">
          <span class="lineup-player-number">${App.helpers.escapeHtml(player.number || "")}</span>
          <span class="lineup-player-name">${App.helpers.escapeHtml(player.name)}</span>
          ${isAssigned && !isCurrentPosition ? '<span class="lineup-player-assigned">✓</span>' : ''}
        </div>
      `;
    }).join('');
    
    // Add click handlers to player options
    playerList.querySelectorAll(".lineup-player-option").forEach(option => {
      option.addEventListener("click", () => {
        const playerName = option.dataset.player;
        this.assignPlayer(playerName);
      });
    });
    
    modal.style.display = "flex";
    this.modalOpen = true;
  },
  
  getPositionLabel(pos) {
    const labels = {
      "LW": "Left Wing",
      "C": "Center",
      "RW": "Right Wing",
      "DL": "Defense Left",
      "DR": "Defense Right",
      "BP-W": "Box Play Wing",
      "BP-C": "Box Play Center",
      "BP-DL": "Box Play Defense Left",
      "BP-DR": "Box Play Defense Right",
      "PP-LW": "Power Play Left Wing",
      "PP-C": "Power Play Center",
      "PP-RW": "Power Play Right Wing",
      "PP-DL": "Power Play Defense Left",
      "PP-DR": "Power Play Defense Right"
    };
    
    let label = labels[pos.pos] || pos.pos;
    
    if (pos.line) label += ` (Linie ${pos.line})`;
    if (pos.pair) label += ` (Paar ${pos.pair})`;
    if (pos.formation) label += ` (Formation ${pos.formation})`;
    
    return label;
  },
  
  assignPlayer(playerName) {
    if (!this.currentPosition) return;
    
    // Check if player is OUT
    if (this.playersOut.includes(playerName)) {
      alert('Dieser Spieler ist OUT und kann nicht aufgestellt werden.');
      return;
    }
    
    // Remove player from any previous position
    Object.keys(this.lineUpData).forEach(key => {
      if (this.lineUpData[key] === playerName) {
        delete this.lineUpData[key];
      }
    });
    
    // Assign player to current position
    this.lineUpData[this.currentPosition.key] = playerName;
    
    this.saveData();
    this.render();
    this.closePlayerModal();
  },
  
  clearCurrentPosition() {
    if (!this.currentPosition) return;
    
    delete this.lineUpData[this.currentPosition.key];
    
    this.saveData();
    this.render();
    this.closePlayerModal();
  },
  
  closePlayerModal() {
    const modal = document.getElementById("lineUpPlayerModal");
    if (modal) {
      modal.style.display = "none";
    }
    this.modalOpen = false;
    this.currentPosition = null;
  },
  
  getPlayerDisplayName(key, defaultLabel) {
    const playerName = this.lineUpData[key];
    if (!playerName) return defaultLabel;
    
    // Try to get player number
    const players = this.getAvailablePlayers();
    const player = players.find(p => p.name === playerName);
    
    // Display format: "Nr. Name" (e.g., "8 Diego Warth")
    if (player) {
      const number = player.number || '';
      return number ? `${number} ${player.name}` : player.name;
    }
    
    return playerName;
  },
  
  render() {
    if (!this.container) return;
    
    // Update all position buttons with assigned players
    const posButtons = this.container.querySelectorAll(".lineup-position");
    posButtons.forEach(btn => {
      const key = this.generatePositionKey(btn);
      const defaultLabel = btn.textContent;
      const pos = btn.dataset.pos;
      const line = btn.dataset.line;
      const pair = btn.dataset.pair;
      const formation = btn.dataset.formation;
      
      // Generate default label based on position data
      let label = pos;
      if (line) label += ` ${line}`;
      if (pair) label += ` ${pair}`;
      if (formation) label += ` ${formation}`;
      
      const displayName = this.getPlayerDisplayName(key, label);
      btn.textContent = displayName;
      
      // Add/remove assigned class
      if (this.lineUpData[key]) {
        btn.classList.add("assigned");
      } else {
        btn.classList.remove("assigned");
      }
    });
    
    // Update stats (placeholder for now)
    this.updateStats();
  },
  
  updateStats() {
    // Update line stats
    for (let line = 1; line <= 4; line++) {
      const lineEl = this.container?.querySelector(`.lineup-line[data-line="${line}"] .lineup-line-stats`);
      if (lineEl) {
        const stats = this.calculateForwardLineStats(line);
        lineEl.textContent = this.formatForwardStats(stats);
      }
    }
    
    // Update defense pair stats
    for (let pair = 1; pair <= 3; pair++) {
      const pairEl = this.container?.querySelector(`.lineup-defense-pair[data-pair="${pair}"] .lineup-pair-stats`);
      if (pairEl) {
        const stats = this.calculateDefenseStats(pair);
        pairEl.textContent = this.formatDefenseStats(stats);
      }
    }
  },
  
  // Get player season stats from App.data.seasonData
  getPlayerSeasonStats(playerName) {
    const seasonData = App.data.seasonData?.[playerName];
    if (!seasonData) {
      return { goalsPerGame: 0, assistsPerGame: 0, plusMinusPerGame: 0, shotsPerGame: 0 };
    }
    
    const games = seasonData.games || 0;
    
    // If player has no games, return zeros
    if (games === 0) {
      return { goalsPerGame: 0, assistsPerGame: 0, plusMinusPerGame: 0, shotsPerGame: 0 };
    }
    
    return {
      goalsPerGame: (seasonData.goals || 0) / games,
      assistsPerGame: (seasonData.assists || 0) / games,
      plusMinusPerGame: (seasonData.plusMinus || 0) / games,
      shotsPerGame: (seasonData.shots || 0) / games
    };
  },
  
  // Calculate stats for forward line (LW, C, RW)
  calculateForwardLineStats(lineNum) {
    const positions = ['LW', 'C', 'RW'];
    let totalGoalsPerGame = 0;
    let totalPlusMinus = 0;
    let totalShotsPerGame = 0;
    let playerCount = 0;
    
    positions.forEach(pos => {
      const key = `${pos}_line${lineNum}`;
      const playerName = this.lineUpData[key];
      if (playerName) {
        const stats = this.getPlayerSeasonStats(playerName);
        totalGoalsPerGame += stats.goalsPerGame || 0;
        totalPlusMinus += stats.plusMinusPerGame || 0;
        totalShotsPerGame += stats.shotsPerGame || 0;
        playerCount++;
      }
    });
    
    return {
      // SUM of goals per game
      goalsPerGame: totalGoalsPerGame,
      // AVERAGE +/-
      plusMinusPerGame: playerCount > 0 ? totalPlusMinus / playerCount : 0,
      // AVERAGE shots
      shotsPerGame: playerCount > 0 ? totalShotsPerGame / playerCount : 0
    };
  },
  
  // Calculate stats for defense pair (DL, DR)
  calculateDefenseStats(pairNum) {
    const positions = ['DL', 'DR'];
    let totalPointsPerGame = 0; // POINTS instead of goals!
    let totalPlusMinus = 0;
    let totalShotsPerGame = 0;
    let playerCount = 0;
    
    positions.forEach(pos => {
      const key = `${pos}_pair${pairNum}`;
      const playerName = this.lineUpData[key];
      if (playerName) {
        const stats = this.getPlayerSeasonStats(playerName);
        // Points = Goals + Assists
        totalPointsPerGame += (stats.goalsPerGame || 0) + (stats.assistsPerGame || 0);
        totalPlusMinus += stats.plusMinusPerGame || 0;
        totalShotsPerGame += stats.shotsPerGame || 0;
        playerCount++;
      }
    });
    
    return {
      // SUM of points per game
      pointsPerGame: totalPointsPerGame,
      // AVERAGE +/-
      plusMinusPerGame: playerCount > 0 ? totalPlusMinus / playerCount : 0,
      // AVERAGE shots
      shotsPerGame: playerCount > 0 ? totalShotsPerGame / playerCount : 0
    };
  },
  
  // Format for forward line: "1.6G / +0.1 / 2.4 Sh" or "1.6G / -0.1 / 2.4 Sh"
  formatForwardStats(stats) {
    const g = stats.goalsPerGame.toFixed(1);
    const pm = stats.plusMinusPerGame >= 0 
      ? `+${stats.plusMinusPerGame.toFixed(1)}` 
      : stats.plusMinusPerGame.toFixed(1);
    const sh = stats.shotsPerGame.toFixed(1);
    return `${g}G / ${pm} / ${sh} Sh`;
  },
  
  // Format for defense pair: "0.7P / +0.4 / 1.4 Sh" or "0.7P / -0.4 / 1.4 Sh"
  formatDefenseStats(stats) {
    const p = stats.pointsPerGame.toFixed(1);
    const pm = stats.plusMinusPerGame >= 0 
      ? `+${stats.plusMinusPerGame.toFixed(1)}` 
      : stats.plusMinusPerGame.toFixed(1);
    const sh = stats.shotsPerGame.toFixed(1);
    return `${p}P / ${pm} / ${sh} Sh`;
  },
  
  changeLineMode() {
    const currentIndex = this.modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % this.modes.length;
    this.currentMode = this.modes[nextIndex];
    
    // Modus-Anzeige unter Titel aktualisieren
    this.updateModeDisplay();
    
    // Optional: Aufstellung basierend auf Modus anpassen
    this.render();
  },
  
  updateModeDisplay() {
    const modeLabel = document.getElementById('lineupModeLabel');
    if (modeLabel) {
      const modeNames = {
        'normal': 'NORMAL',
        'power': 'POWER',
        'manuell': 'MANUELL'
      };
      modeLabel.textContent = modeNames[this.currentMode];
    }
  },
  
  updatePlayerOutButton() {
    const btn = document.querySelector('#lineUpPage .lineup-player-out-btn');
    if (!btn) return;
    
    const outCount = this.playersOut.length;
    
    if (outCount > 0) {
      btn.textContent = `Player out (${outCount})`;
      btn.classList.add('has-players-out');
    } else {
      btn.innerHTML = 'Player out <span class="player-out-dot"></span>';
      btn.classList.remove('has-players-out');
    }
  }
};

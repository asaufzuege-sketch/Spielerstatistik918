// Line Up Module
App.lineUp = {
  container: null,
  modalOpen: false,
  currentPosition: null,
  lineUpData: {},
  
  init() {
    this.container = document.getElementById("lineUpContainer");
    this.loadData();
    this.attachEventListeners();
    this.render();
  },
  
  loadData() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedData = localStorage.getItem(`lineUpData_${currentTeamId}`);
    
    try {
      this.lineUpData = savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      this.lineUpData = {};
    }
  },
  
  saveData() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    localStorage.setItem(`lineUpData_${currentTeamId}`, JSON.stringify(this.lineUpData));
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
    
    // Power Line button (placeholder functionality)
    document.getElementById("lineUpPowerLineBtn")?.addEventListener("click", () => {
      console.log("Power Line clicked");
    });
    
    // Team Line button (placeholder functionality)
    document.getElementById("lineUpTeamLineBtn")?.addEventListener("click", () => {
      console.log("Team Line clicked");
    });
    
    // Player Out button - show active players list
    document.getElementById("lineUpPlayerOutBtn")?.addEventListener("click", () => {
      this.showPlayerOutModal();
    });
    
    // Close Player Out Modal button
    document.getElementById("closePlayerOutModalBtn")?.addEventListener("click", () => {
      this.closePlayerOutModal();
    });
    
    // Player Out Modal overlay click to close
    const playerOutModal = document.getElementById("playerOutModal");
    if (playerOutModal) {
      playerOutModal.addEventListener("click", (e) => {
        if (e.target === playerOutModal) {
          this.closePlayerOutModal();
        }
      });
    }
    
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
    
    // Get available players
    const players = this.getAvailablePlayers();
    
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
  
  showPlayerOutModal() {
    const modal = document.getElementById("playerOutModal");
    const list = document.getElementById("playerOutList");
    
    if (!modal || !list) return;
    
    // Get active players from Player Selection
    const players = this.getAvailablePlayers();
    
    if (players.length === 0) {
      list.innerHTML = '<div class="lineup-player-option" style="cursor: default; opacity: 0.7;">Keine aktiven Spieler</div>';
    } else {
      // Render player list with "Nr. Name" format
      list.innerHTML = players.map(player => {
        const number = player.number || '';
        const displayText = number ? `${number} ${player.name}` : player.name;
        
        return `
          <div class="lineup-player-option player-out-item" data-player="${App.helpers.escapeHtml(player.name)}">
            <span class="lineup-player-name">${App.helpers.escapeHtml(displayText)}</span>
          </div>
        `;
      }).join('');
      
      // Add click handlers to player out items
      list.querySelectorAll(".player-out-item").forEach(option => {
        option.addEventListener("click", () => {
          option.classList.toggle("selected");
        });
      });
    }
    
    modal.style.display = "flex";
  },
  
  closePlayerOutModal() {
    const modal = document.getElementById("playerOutModal");
    if (modal) {
      modal.style.display = "none";
    }
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
        const stats = this.calculateLineStats(line);
        lineEl.textContent = `${stats.goals}G / +- ${stats.plusMinus} / ${stats.shots} Sh`;
      }
    }
    
    // Update defense pair stats
    for (let pair = 1; pair <= 3; pair++) {
      const pairEl = this.container?.querySelector(`.lineup-defense-pair[data-pair="${pair}"] .lineup-pair-stats`);
      if (pairEl) {
        const stats = this.calculatePairStats(pair);
        pairEl.textContent = `${stats.goals}G / +- ${stats.plusMinus} / ${stats.shots} Sh`;
      }
    }
  },
  
  calculateTotalStats() {
    let goals = 0;
    let plusMinus = 0;
    let shots = 0;
    
    Object.values(this.lineUpData).forEach(playerName => {
      const playerStats = App.data.statsData?.[playerName];
      if (playerStats) {
        goals += playerStats["Goals"] || 0;
        plusMinus += playerStats["+/-"] || 0;
        shots += playerStats["Shot"] || 0;
      }
    });
    
    return { goals, plusMinus, shots };
  },
  
  calculateLineStats(lineNum) {
    let goals = 0;
    let plusMinus = 0;
    let shots = 0;
    
    ["LW", "C", "RW"].forEach(pos => {
      const key = `${pos}_line${lineNum}`;
      const playerName = this.lineUpData[key];
      if (playerName) {
        const playerStats = App.data.statsData?.[playerName];
        if (playerStats) {
          goals += playerStats["Goals"] || 0;
          plusMinus += playerStats["+/-"] || 0;
          shots += playerStats["Shot"] || 0;
        }
      }
    });
    
    return { goals, plusMinus, shots };
  },
  
  calculatePairStats(pairNum) {
    let goals = 0;
    let plusMinus = 0;
    let shots = 0;
    
    ["DL", "DR"].forEach(pos => {
      const key = `${pos}_pair${pairNum}`;
      const playerName = this.lineUpData[key];
      if (playerName) {
        const playerStats = App.data.statsData?.[playerName];
        if (playerStats) {
          goals += playerStats["Goals"] || 0;
          plusMinus += playerStats["+/-"] || 0;
          shots += playerStats["Shot"] || 0;
        }
      }
    });
    
    return { goals, plusMinus, shots };
  }
};

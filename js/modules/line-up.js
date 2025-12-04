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
    
    // NEU: Im POWER Modus sofort Aufstellung neu generieren
    if (this.currentMode === 'power') {
      this.autoFillPowerMode();
    }
    
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
  },
  
  autoFillPowerMode() {
    // Get players with their positions and MVP points
    const playersWithStats = this.getPlayersWithMVPPoints();
    
    // Filter out OUT players
    const activePlayers = playersWithStats.filter(p => !this.playersOut.includes(p.name));
    
    // Group players by position
    const centers = activePlayers.filter(p => p.position === 'C');
    const wings = activePlayers.filter(p => p.position === 'W');
    const defense = activePlayers.filter(p => p.position === 'D');
    
    // Sort by MVP points (highest first)
    centers.sort((a, b) => b.mvpPoints - a.mvpPoints);
    wings.sort((a, b) => b.mvpPoints - a.mvpPoints);
    defense.sort((a, b) => b.mvpPoints - a.mvpPoints);
    
    // Clear existing lineup data
    this.lineUpData = {};
    
    // Assign Centers
    // Rang 1: C 1, BP-C 1, PP-C 1
    if (centers[0]) {
      this.lineUpData['C_line1'] = centers[0].name;
      this.lineUpData['BP-C_form1'] = centers[0].name;
      this.lineUpData['PP-C_form1'] = centers[0].name;
    }
    // Rang 2: C 2, BP-C 2, PP-C 2
    if (centers[1]) {
      this.lineUpData['C_line2'] = centers[1].name;
      this.lineUpData['BP-C_form2'] = centers[1].name;
      this.lineUpData['PP-C_form2'] = centers[1].name;
    }
    // Rang 3: C 3
    if (centers[2]) {
      this.lineUpData['C_line3'] = centers[2].name;
    }
    // Rang 4: C 4
    if (centers[3]) {
      this.lineUpData['C_line4'] = centers[3].name;
    }
    
    // Assign Wings
    // Rang 1: LW 1, BP-W 1, PP-LW 1
    if (wings[0]) {
      this.lineUpData['LW_line1'] = wings[0].name;
      this.lineUpData['BP-W_form1'] = wings[0].name;
      this.lineUpData['PP-LW_form1'] = wings[0].name;
    }
    // Rang 2: RW 1, BP-W 2
    if (wings[1]) {
      this.lineUpData['RW_line1'] = wings[1].name;
      this.lineUpData['BP-W_form2'] = wings[1].name;
    }
    // Rang 3: LW 2, PP-LW 2
    if (wings[2]) {
      this.lineUpData['LW_line2'] = wings[2].name;
      this.lineUpData['PP-LW_form2'] = wings[2].name;
    }
    // Rang 4: RW 2
    if (wings[3]) {
      this.lineUpData['RW_line2'] = wings[3].name;
    }
    // Rang 5: LW 3
    if (wings[4]) {
      this.lineUpData['LW_line3'] = wings[4].name;
    }
    // Rang 6: RW 3
    if (wings[5]) {
      this.lineUpData['RW_line3'] = wings[5].name;
    }
    // Rang 7: LW 4
    if (wings[6]) {
      this.lineUpData['LW_line4'] = wings[6].name;
    }
    // Rang 8: RW 4
    if (wings[7]) {
      this.lineUpData['RW_line4'] = wings[7].name;
    }
    
    // Assign Defense
    // Rang 1: DL 1, BP-DL 1, PP-DL 1
    if (defense[0]) {
      this.lineUpData['DL_pair1'] = defense[0].name;
      this.lineUpData['BP-DL_form1'] = defense[0].name;
      this.lineUpData['PP-DL_form1'] = defense[0].name;
    }
    // Rang 2: DR 1, BP-DR 1, PP-DR 1
    if (defense[1]) {
      this.lineUpData['DR_pair1'] = defense[1].name;
      this.lineUpData['BP-DR_form1'] = defense[1].name;
      this.lineUpData['PP-DR_form1'] = defense[1].name;
    }
    // Rang 3: DL 2, BP-DL 2, PP-DL 2
    if (defense[2]) {
      this.lineUpData['DL_pair2'] = defense[2].name;
      this.lineUpData['BP-DL_form2'] = defense[2].name;
      this.lineUpData['PP-DL_form2'] = defense[2].name;
    }
    // Rang 4: DR 2, BP-DR 2, PP-DR 2
    if (defense[3]) {
      this.lineUpData['DR_pair2'] = defense[3].name;
      this.lineUpData['BP-DR_form2'] = defense[3].name;
      this.lineUpData['PP-DR_form2'] = defense[3].name;
    }
    // Rang 5: DL 3
    if (defense[4]) {
      this.lineUpData['DL_pair3'] = defense[4].name;
    }
    // Rang 6: DR 3
    if (defense[5]) {
      this.lineUpData['DR_pair3'] = defense[5].name;
    }
    
    // NEU: PP-RW Positionen mit besten verfügbaren Stürmern (C oder W) besetzen
    // Kombinierte Liste aller Stürmer erstellen
    const allForwards = [...centers, ...wings];
    // Nach MVP Points sortieren (höchste zuerst)
    allForwards.sort((a, b) => b.mvpPoints - a.mvpPoints);
    
    // Bereits auf PP-Positionen zugewiesene Spieler sammeln
    const ppAssigned = new Set([
      this.lineUpData['PP-C_form1'],
      this.lineUpData['PP-C_form2'],
      this.lineUpData['PP-LW_form1'],
      this.lineUpData['PP-LW_form2'],
      this.lineUpData['PP-DL_form1'],
      this.lineUpData['PP-DL_form2'],
      this.lineUpData['PP-DR_form1'],
      this.lineUpData['PP-DR_form2']
    ].filter(name => name)); // Filter out undefined/null
    
    // Beste verfügbare Stürmer für PP-RW finden
    const availableForPPRW = allForwards.filter(player => !ppAssigned.has(player.name));
    
    // PP-RW 1 besetzen
    if (availableForPPRW[0]) {
      this.lineUpData['PP-RW_form1'] = availableForPPRW[0].name;
    }
    // PP-RW 2 besetzen
    if (availableForPPRW[1]) {
      this.lineUpData['PP-RW_form2'] = availableForPPRW[1].name;
    }
    
    // Save the updated lineup
    this.saveData();
  },
  
  getPlayersWithMVPPoints() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedPlayersKey = `playerSelectionData_${currentTeamId}`;
    
    let players = [];
    try {
      const savedPlayers = JSON.parse(localStorage.getItem(savedPlayersKey) || "[]");
      players = savedPlayers.filter(p => p.active && p.name && p.name.trim() !== "" && p.position);
    } catch (e) {
      players = [];
    }
    
    // Calculate MVP points for each player
    const playersWithMVP = players.map(player => {
      const seasonData = App.data.seasonData?.[player.name];
      let mvpPoints = 0;
      
      if (seasonData) {
        const games = Number(seasonData.games || 0);
        const goals = Number(seasonData.goals || 0);
        const assists = Number(seasonData.assists || 0);
        const plusMinus = Number(seasonData.plusMinus || 0);
        const shots = Number(seasonData.shots || 0);
        const penalty = Number(seasonData.penaltys || 0);
        
        const avgPlusMinus = games ? (plusMinus / games) : 0;
        const shotsPerGame = games ? (shots / games) : 0;
        const goalsPerGame = games ? (goals / games) : 0;
        const assistsPerGame = games ? (assists / games) : 0;
        const penaltyPerGame = games ? (penalty / games) : 0;
        
        // Get goal value
        let goalValue = 0;
        try {
          if (App.goalValue && typeof App.goalValue.computeValueForPlayer === "function") {
            goalValue = App.goalValue.computeValueForPlayer(player.name) || Number(seasonData.goalValue || 0);
          } else {
            goalValue = Number(seasonData.goalValue || 0);
          }
        } catch (e) {
          goalValue = Number(seasonData.goalValue || 0);
        }
        const gvNum = Number(goalValue || 0);
        
        // Calculate MVP points using the same formula as season-table.js
        mvpPoints = (
          (assistsPerGame * 8) +
          (avgPlusMinus * 0.5) +
          (shotsPerGame * 0.5) +
          (goalsPerGame + (games ? (gvNum / games) * 10 : 0)) -
          (penaltyPerGame * 1.2)
        );
      }
      
      return {
        name: player.name,
        number: player.number,
        position: player.position,
        mvpPoints: mvpPoints
      };
    });
    
    return playersWithMVP;
  },
  
  changeLineMode() {
    const currentIndex = this.modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % this.modes.length;
    this.currentMode = this.modes[nextIndex];
    
    // Modus-Anzeige unter Titel aktualisieren
    this.updateModeDisplay();
    
    // Auto-fill wenn in POWER Modus gewechselt wird
    if (this.currentMode === 'power') {
      this.autoFillPowerMode();
    }
    
    // Alle Positionen leeren wenn in MANUELL Modus gewechselt wird
    if (this.currentMode === 'manuell') {
      this.lineUpData = {};
      this.saveData();
    }
    
    // Optional: Aufstellung basierend auf Modus anpassen
    this.render();
  },
  
  updateModeDisplay() {
    const modeLabel = document.getElementById('lineupModeLabel');
    const changeLineBtn = document.getElementById('lineUpChangeLineBtn');
    
    const modeConfig = {
      'normal': { name: 'NORMAL', color: '#FFD400', textColor: '#000' },
      'power': { name: 'POWER', color: '#FF6A00', textColor: '#fff' },
      'manuell': { name: 'MANUELL', color: '#FFEEA5', textColor: '#000' }
    };
    
    const config = modeConfig[this.currentMode];
    
    if (modeLabel) {
      modeLabel.textContent = config.name;
      modeLabel.style.color = config.color;
    }
    
    if (changeLineBtn) {
      changeLineBtn.style.background = config.color;
      changeLineBtn.style.color = config.textColor;
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

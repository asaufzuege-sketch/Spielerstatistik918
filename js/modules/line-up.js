// Line Up Module
App.lineUp = {
  container: null,
  modalOpen: false,
  currentPosition: null,
  lineUpData: {},
  playersOut: [],
  currentMode: 'normal', // 'normal', 'power', 'manuell'
  modes: ['normal', 'power', 'manuell'],
  goaliePositions: ['G', 'GK', 'GOALIE'], // Positions that identify goalies
  
  init() {
    this.container = document.getElementById("lineUpContainer");
    this.loadData();
    this.attachEventListeners();
    this.updateModeDisplay(); // This calls updateModeColors()
    this.render();
    this.updatePlayerOutButton();
  },
  
  loadData() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedPlayersOut = localStorage.getItem(`playersOut_${currentTeamId}`);
    
    // Load mode-specific lineup data
    this.loadDataForMode(this.currentMode);
    
    try {
      this.playersOut = savedPlayersOut ? JSON.parse(savedPlayersOut) : [];
    } catch (e) {
      this.playersOut = [];
    }
  },
  
  saveData() {
    // Save to mode-specific storage
    this.saveDataForMode(this.currentMode);
  },
  
  saveDataForMode(mode) {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    localStorage.setItem(`lineUpData_${mode}_${currentTeamId}`, JSON.stringify(this.lineUpData));
  },
  
  loadDataForMode(mode) {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedData = localStorage.getItem(`lineUpData_${mode}_${currentTeamId}`);
    
    try {
      this.lineUpData = savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      this.lineUpData = {};
    }
    
    // Remove any players that are marked as OUT
    let changed = false;
    Object.keys(this.lineUpData).forEach(posKey => {
      if (this.playersOut.includes(this.lineUpData[posKey])) {
        delete this.lineUpData[posKey];
        changed = true;
      }
    });
    
    // Save if we removed any players
    if (changed) {
      this.saveDataForMode(mode);
    }
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
    
    // Get all available players and filter out goalies
    const allPlayers = this.getAvailablePlayers();
    const players = allPlayers.filter(p => {
      const pos = (p.position || p.pos || '').toUpperCase();
      return !this.goaliePositions.includes(pos);
    });
    
    if (players.length === 0) {
      list.innerHTML = '<div class="player-out-item" style="cursor: default; opacity: 0.7;">No active players</div>';
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
    
    // Gesperrten Spieler aus ALLEN Modi entfernen
    this.removePlayerFromAllModes(playerName);
    
    // Im POWER Modus: Aufstellung neu generieren
    if (this.currentMode === 'power') {
      this.autoFillPowerMode();
    }
    
    // Im NORMAL Modus: PP und BP neu berechnen
    if (this.currentMode === 'normal') {
      this.calculateSpecialTeams();
    }
    
    this.render(); // Re-render LINE UP to update blocked players
  },
  
  removePlayerFromAllModes(playerName) {
    const modes = ['normal', 'power', 'manuell'];
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    
    modes.forEach(mode => {
      const key = `lineUpData_${mode}_${currentTeamId}`;
      const savedData = localStorage.getItem(key);
      
      if (savedData) {
        try {
          const lineUpData = JSON.parse(savedData);
          let changed = false;
          
          // Spieler aus allen Positionen entfernen
          Object.keys(lineUpData).forEach(posKey => {
            if (lineUpData[posKey] === playerName) {
              delete lineUpData[posKey];
              changed = true;
            }
          });
          
          if (changed) {
            localStorage.setItem(key, JSON.stringify(lineUpData));
          }
        } catch (e) {
          console.error('Error removing player from mode:', mode, e);
        }
      }
    });
    
    // Aktuelle lineUpData auch aktualisieren
    Object.keys(this.lineUpData).forEach(posKey => {
      if (this.lineUpData[posKey] === playerName) {
        delete this.lineUpData[posKey];
      }
    });
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
    // NUR im Manuell-Modus erlauben!
    if (this.currentMode !== 'manuell') {
      return; // Nichts tun in Power/Normal Modus
    }
    
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
      title.textContent = `Select player for ${posLabel}`;
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
      alert('This player is OUT and cannot be assigned.');
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
  
  /**
   * Get active players sorted by MVP points for lineup assignment.
   * Filters out players marked as "OUT" and sorts by position and MVP score.
   * 
   * @returns {Object} Object containing sorted arrays:
   *   - centers: Centers sorted by MVP points (descending)
   *   - wings: Wings sorted by MVP points (descending)
   *   - defense: Defense players sorted by MVP points (descending)
   *   - allForwards: All forwards (C+W) sorted by MVP points (descending)
   */
  getActiveSortedPlayers() {
    const playersWithStats = this.getPlayersWithMVPPoints();
    const activePlayers = playersWithStats.filter(p => !this.playersOut.includes(p.name));
    
    // Alle nach MVP sortieren
    const centers = activePlayers.filter(p => p.position === 'C').sort((a, b) => b.mvpPoints - a.mvpPoints);
    const wings = activePlayers.filter(p => p.position === 'W').sort((a, b) => b.mvpPoints - a.mvpPoints);
    const defense = activePlayers.filter(p => p.position === 'D').sort((a, b) => b.mvpPoints - a.mvpPoints);
    const allForwards = [...centers, ...wings].sort((a, b) => b.mvpPoints - a.mvpPoints);
    
    return { centers, wings, defense, allForwards };
  },
  
  /**
   * Calculate and assign PowerPlay (PP) and Box Play (BP) positions.
   * Uses MVP-based logic to select the best players for special teams:
   * 
   * PowerPlay Logic:
   * - PP1: Best Center, Best Wing, Next best Forward
   * - PP2: Next best Center, Wing, Forward (not already in PP1)
   * - PP Defense: Best 4 defense players
   * 
   * Box Play Logic:
   * - BP Centers: Best 2 centers
   * - BP Wings: Best 2 wings  
   * - BP Defense: Best 4 defense players
   * 
   * This function modifies this.lineUpData and calls saveData().
   */
  calculateSpecialTeams() {
    const { centers, wings, defense, allForwards } = this.getActiveSortedPlayers();
    
    // === POWERPLAY BESETZEN ===
    const ppAssigned = new Set();
    
    // PP 1
    // PP-C 1 = Bester Center
    const ppC1 = centers[0];
    if (ppC1) {
      this.lineUpData['PP-C_form1'] = ppC1.name;
      ppAssigned.add(ppC1.name);
    }
    
    // PP-LW 1 = Bester Wing
    const ppLW1 = wings[0];
    if (ppLW1) {
      this.lineUpData['PP-LW_form1'] = ppLW1.name;
      ppAssigned.add(ppLW1.name);
    }
    
    // PP-RW 1 = Nächstbester Stürmer der noch nicht in PP ist
    const ppRW1 = allForwards.find(p => !ppAssigned.has(p.name));
    if (ppRW1) {
      this.lineUpData['PP-RW_form1'] = ppRW1.name;
      ppAssigned.add(ppRW1.name);
    }
    
    // PP 2
    // PP-C 2 = Nächstbester Center der noch nicht in PP ist
    const ppC2 = centers.find(p => !ppAssigned.has(p.name));
    if (ppC2) {
      this.lineUpData['PP-C_form2'] = ppC2.name;
      ppAssigned.add(ppC2.name);
    }
    
    // PP-LW 2 = Nächstbester Wing der noch nicht in PP ist
    const ppLW2 = wings.find(p => !ppAssigned.has(p.name));
    if (ppLW2) {
      this.lineUpData['PP-LW_form2'] = ppLW2.name;
      ppAssigned.add(ppLW2.name);
    }
    
    // PP-RW 2 = Nächstbester Stürmer der noch nicht in PP ist
    const ppRW2 = allForwards.find(p => !ppAssigned.has(p.name));
    if (ppRW2) {
      this.lineUpData['PP-RW_form2'] = ppRW2.name;
      ppAssigned.add(ppRW2.name);
    }
    
    // === PP DEFENSE ===
    if (defense[0]) {
      this.lineUpData['PP-DL_form1'] = defense[0].name;
    }
    if (defense[1]) {
      this.lineUpData['PP-DR_form1'] = defense[1].name;
    }
    if (defense[2]) {
      this.lineUpData['PP-DL_form2'] = defense[2].name;
    }
    if (defense[3]) {
      this.lineUpData['PP-DR_form2'] = defense[3].name;
    }
    
    // === BOX PLAY ===
    if (centers[0]) this.lineUpData['BP-C_form1'] = centers[0].name;
    if (centers[1]) this.lineUpData['BP-C_form2'] = centers[1].name;
    if (wings[0]) this.lineUpData['BP-W_form1'] = wings[0].name;
    if (wings[1]) this.lineUpData['BP-W_form2'] = wings[1].name;
    if (defense[0]) this.lineUpData['BP-DL_form1'] = defense[0].name;
    if (defense[1]) this.lineUpData['BP-DR_form1'] = defense[1].name;
    if (defense[2]) this.lineUpData['BP-DL_form2'] = defense[2].name;
    if (defense[3]) this.lineUpData['BP-DR_form2'] = defense[3].name;
    
    this.saveData();
  },
  
  autoFillPowerMode() {
    const { centers, wings, defense } = this.getActiveSortedPlayers();
    
    this.lineUpData = {};
    
    // Calculate PP and BP using the new function
    this.calculateSpecialTeams();
    
    // === NORMALE LINIEN ===
    // C 1-4
    if (centers[0]) this.lineUpData['C_line1'] = centers[0].name;
    if (centers[1]) this.lineUpData['C_line2'] = centers[1].name;
    if (centers[2]) this.lineUpData['C_line3'] = centers[2].name;
    if (centers[3]) this.lineUpData['C_line4'] = centers[3].name;
    
    // LW/RW 1-4
    if (wings[0]) this.lineUpData['LW_line1'] = wings[0].name;
    if (wings[1]) this.lineUpData['RW_line1'] = wings[1].name;
    if (wings[2]) this.lineUpData['LW_line2'] = wings[2].name;
    if (wings[3]) this.lineUpData['RW_line2'] = wings[3].name;
    if (wings[4]) this.lineUpData['LW_line3'] = wings[4].name;
    if (wings[5]) this.lineUpData['RW_line3'] = wings[5].name;
    if (wings[6]) this.lineUpData['LW_line4'] = wings[6].name;
    if (wings[7]) this.lineUpData['RW_line4'] = wings[7].name;
    
    // Defense Pairs 1-3
    if (defense[0]) this.lineUpData['DL_pair1'] = defense[0].name;
    if (defense[1]) this.lineUpData['DR_pair1'] = defense[1].name;
    if (defense[2]) this.lineUpData['DL_pair2'] = defense[2].name;
    if (defense[3]) this.lineUpData['DR_pair2'] = defense[3].name;
    if (defense[4]) this.lineUpData['DL_pair3'] = defense[4].name;
    if (defense[5]) this.lineUpData['DR_pair3'] = defense[5].name;
    
    this.saveData();
  },
  
  autoFillNormalMode() {
    const { centers, wings, defense } = this.getActiveSortedPlayers();
    
    this.lineUpData = {};
    
    // === STÜRMER VERTEILUNG (ausgeglichen) ===
    // Center: 1-4 nach MVP
    if (centers[0]) this.lineUpData['C_line1'] = centers[0].name;
    if (centers[1]) this.lineUpData['C_line2'] = centers[1].name;
    if (centers[2]) this.lineUpData['C_line3'] = centers[2].name;
    if (centers[3]) this.lineUpData['C_line4'] = centers[3].name;
    
    // Wings: Ausgeglichene Verteilung
    // LW: #1, #2, #3, #5 Wings
    // RW: #4, #6, #7, #8 Wings (schwächere auf stärkeren Linien für Balance)
    if (wings[0]) this.lineUpData['LW_line1'] = wings[0].name;
    if (wings[1]) this.lineUpData['LW_line2'] = wings[1].name;
    if (wings[2]) this.lineUpData['LW_line3'] = wings[2].name;
    if (wings[4]) this.lineUpData['LW_line4'] = wings[4].name;
    
    if (wings[3]) this.lineUpData['RW_line1'] = wings[3].name;  // #4 Wing auf Linie 1 (Balance)
    if (wings[5]) this.lineUpData['RW_line2'] = wings[5].name;  // #6 Wing auf Linie 2
    if (wings[6]) this.lineUpData['RW_line3'] = wings[6].name;  // #7 Wing auf Linie 3
    if (wings[7]) this.lineUpData['RW_line4'] = wings[7].name;  // #8 Wing auf Linie 4
    
    // === VERTEIDIGER VERTEILUNG (ausgeglichen) ===
    // Top 3 Verteidiger auf DL 1, 2, 3 verteilen
    // Verteidiger 4-6 als Partner auf DR (für Balance)
    if (defense[0]) this.lineUpData['DL_pair1'] = defense[0].name;
    if (defense[1]) this.lineUpData['DL_pair2'] = defense[1].name;
    if (defense[2]) this.lineUpData['DL_pair3'] = defense[2].name;
    
    if (defense[3]) this.lineUpData['DR_pair1'] = defense[3].name;  // #4 mit #1
    if (defense[4]) this.lineUpData['DR_pair2'] = defense[4].name;  // #5 mit #2
    if (defense[5]) this.lineUpData['DR_pair3'] = defense[5].name;  // #6 mit #3
    
    // === SPECIAL TEAMS (PP + BP) ===
    this.calculateSpecialTeams();
    
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
    // Aktuelle Aufstellung für den aktuellen Modus speichern
    this.saveDataForMode(this.currentMode);
    
    // Zum nächsten Modus wechseln
    const currentIndex = this.modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % this.modes.length;
    this.currentMode = this.modes[nextIndex];
    
    // Modus-Anzeige aktualisieren (ruft auch updateModeColors() auf)
    this.updateModeDisplay();
    
    // Aufstellung für den neuen Modus laden/generieren
    if (this.currentMode === 'power') {
      this.autoFillPowerMode(); // Immer neu generieren
    } else if (this.currentMode === 'normal') {
      this.autoFillNormalMode(); // NEU: Immer neu generieren wie Power-Modus
    } else {
      this.loadDataForMode(this.currentMode); // Gespeicherte laden
    }
    
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
    this.updateModeColors(); // Farben aktualisieren!
  },
  
  updateModeColors() {
    const colors = {
      'normal': { bg: '#FFD400', text: '#000000' },
      'power': { bg: '#FF6A00', text: '#ffffff' },
      'manuell': { bg: '#FFEEA5', text: '#000000' }
    };
    
    const config = colors[this.currentMode];
    
    // Change Line Button Farbe ändern
    const changeLineBtn = document.getElementById('lineUpChangeLineBtn');
    if (changeLineBtn) {
      changeLineBtn.style.backgroundColor = config.bg;
      changeLineBtn.style.color = config.text;
    }
    
    // Modus-Label Farbe ändern
    const modeLabel = document.getElementById('lineupModeLabel');
    if (modeLabel) {
      modeLabel.style.color = config.bg;
      modeLabel.style.webkitTextFillColor = config.bg;
      modeLabel.style.background = 'none';
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
      btn.textContent = 'Player out'; // Kein roter Punkt mehr!
      btn.classList.remove('has-players-out');
    }
  }
};

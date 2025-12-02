// LINE UP Module
App.lineUp = {
  currentMode: 'normal', // 'normal', 'power', 'manuell'
  modes: ['normal', 'power', 'manuell'],
  assignments: {}, // { 'L1-LW': 'Player Name', ... }
  playerOutList: [], // List of players marked as "out"
  
  init() {
    console.log("[LINE UP] Initializing...");
    
    // Load saved assignments from localStorage
    this.loadAssignments();
    
    // Event listeners
    document.getElementById("lineModeBtn")?.addEventListener("click", () => {
      this.changeLineMode();
    });
    
    document.getElementById("playerOutBtn")?.addEventListener("click", () => {
      this.showPlayerOutDialog();
    });
    
    document.getElementById("backToStatsFromLineUpBtn")?.addEventListener("click", () => {
      App.showPage("stats");
    });
  },
  
  render() {
    const container = document.getElementById("lineUpContainer");
    if (!container) return;
    
    console.log("[LINE UP] Rendering in mode:", this.currentMode);
    
    // Update mode button text
    const modeBtn = document.getElementById("lineModeBtn");
    if (modeBtn) {
      modeBtn.textContent = this.currentMode.toUpperCase();
    }
    
    // If in POWER mode, auto-generate assignments
    if (this.currentMode === 'power') {
      this.generatePowerLineup();
    }
    
    container.innerHTML = "";
    
    // Forward Lines Section
    const forwardSection = this.createForwardSection();
    container.appendChild(forwardSection);
    
    // Defense Pairs Section
    const defenseSection = this.createDefenseSection();
    container.appendChild(defenseSection);
    
    // Box Play Section
    const boxPlaySection = this.createBoxPlaySection();
    container.appendChild(boxPlaySection);
    
    // Power Play Section
    const powerPlaySection = this.createPowerPlaySection();
    container.appendChild(powerPlaySection);
  },
  
  createForwardSection() {
    const section = document.createElement("div");
    section.className = "lineup-section";
    
    const title = document.createElement("h2");
    title.textContent = "FORWARD LINES";
    title.className = "lineup-section-title";
    section.appendChild(title);
    
    for (let line = 1; line <= 4; line++) {
      const lineDiv = document.createElement("div");
      lineDiv.className = "forward-line";
      
      const lineTitle = document.createElement("div");
      lineTitle.className = "line-title";
      lineTitle.textContent = `Line ${line}`;
      lineDiv.appendChild(lineTitle);
      
      const positions = ['LW', 'C', 'RW'];
      const positionsGrid = document.createElement("div");
      positionsGrid.className = "positions-grid";
      
      positions.forEach(pos => {
        const slot = this.createPositionSlot(`L${line}-${pos}`, pos);
        positionsGrid.appendChild(slot);
      });
      
      lineDiv.appendChild(positionsGrid);
      
      // Add line stats
      const stats = this.calculateLineStats(line, 'forward');
      const statsDiv = document.createElement("div");
      statsDiv.className = "line-stats";
      statsDiv.textContent = stats;
      lineDiv.appendChild(statsDiv);
      
      section.appendChild(lineDiv);
    }
    
    return section;
  },
  
  createDefenseSection() {
    const section = document.createElement("div");
    section.className = "lineup-section";
    
    const title = document.createElement("h2");
    title.textContent = "DEFENSE PAIRS";
    title.className = "lineup-section-title";
    section.appendChild(title);
    
    for (let pair = 1; pair <= 3; pair++) {
      const pairDiv = document.createElement("div");
      pairDiv.className = "defense-pair";
      
      const pairTitle = document.createElement("div");
      pairTitle.className = "line-title";
      pairTitle.textContent = `Pair ${pair}`;
      pairDiv.appendChild(pairTitle);
      
      const positions = ['DL', 'DR'];
      const positionsGrid = document.createElement("div");
      positionsGrid.className = "positions-grid";
      
      positions.forEach(pos => {
        const slot = this.createPositionSlot(`D${pair}-${pos}`, pos);
        positionsGrid.appendChild(slot);
      });
      
      pairDiv.appendChild(positionsGrid);
      
      // Add pair stats
      const stats = this.calculateLineStats(pair, 'defense');
      const statsDiv = document.createElement("div");
      statsDiv.className = "line-stats";
      statsDiv.textContent = stats;
      pairDiv.appendChild(statsDiv);
      
      section.appendChild(pairDiv);
    }
    
    return section;
  },
  
  createBoxPlaySection() {
    const section = document.createElement("div");
    section.className = "lineup-section";
    
    const title = document.createElement("h2");
    title.textContent = "BOX PLAY";
    title.className = "lineup-section-title";
    section.appendChild(title);
    
    const unitsGrid = document.createElement("div");
    unitsGrid.className = "special-teams-grid";
    
    for (let unit = 1; unit <= 2; unit++) {
      const unitDiv = document.createElement("div");
      unitDiv.className = "special-team-unit";
      
      const unitTitle = document.createElement("div");
      unitTitle.className = "unit-title";
      unitTitle.textContent = `Unit ${unit}`;
      unitDiv.appendChild(unitTitle);
      
      const positionsGrid = document.createElement("div");
      positionsGrid.className = "positions-grid-bp";
      
      ['BP-C', 'BP-W', 'BP-DL', 'BP-DR'].forEach(pos => {
        const slot = this.createPositionSlot(`${pos}${unit}`, pos.replace('BP-', ''));
        positionsGrid.appendChild(slot);
      });
      
      unitDiv.appendChild(positionsGrid);
      unitsGrid.appendChild(unitDiv);
    }
    
    section.appendChild(unitsGrid);
    return section;
  },
  
  createPowerPlaySection() {
    const section = document.createElement("div");
    section.className = "lineup-section";
    
    const title = document.createElement("h2");
    title.textContent = "POWER PLAY";
    title.className = "lineup-section-title";
    section.appendChild(title);
    
    const unitsGrid = document.createElement("div");
    unitsGrid.className = "special-teams-grid";
    
    for (let unit = 1; unit <= 2; unit++) {
      const unitDiv = document.createElement("div");
      unitDiv.className = "special-team-unit";
      
      const unitTitle = document.createElement("div");
      unitTitle.className = "unit-title";
      unitTitle.textContent = `Unit ${unit}`;
      unitDiv.appendChild(unitTitle);
      
      const positionsGrid = document.createElement("div");
      positionsGrid.className = "positions-grid-pp";
      
      ['PP-C', 'PP-LW', 'PP-RW', 'PP-DL', 'PP-DR'].forEach(pos => {
        const slot = this.createPositionSlot(`${pos}${unit}`, pos.replace('PP-', ''));
        positionsGrid.appendChild(slot);
      });
      
      unitDiv.appendChild(positionsGrid);
      unitsGrid.appendChild(unitDiv);
    }
    
    section.appendChild(unitsGrid);
    return section;
  },
  
  createPositionSlot(slotId, positionLabel) {
    const slot = document.createElement("div");
    slot.className = "position-slot";
    slot.dataset.slotId = slotId;
    
    const label = document.createElement("div");
    label.className = "position-label";
    label.textContent = positionLabel;
    slot.appendChild(label);
    
    const playerName = this.assignments[slotId] || "";
    const isPlayerOut = this.playerOutList.includes(playerName);
    
    if (this.currentMode === 'manuell') {
      // Editable mode
      const input = document.createElement("input");
      input.type = "text";
      input.className = "position-input";
      input.value = playerName;
      input.placeholder = "Player";
      input.addEventListener("change", (e) => {
        this.assignments[slotId] = e.target.value.trim();
        this.saveAssignments();
      });
      slot.appendChild(input);
    } else {
      // Display mode
      const nameDiv = document.createElement("div");
      nameDiv.className = "position-name";
      nameDiv.textContent = playerName || "-";
      
      if (isPlayerOut) {
        nameDiv.classList.add("player-out");
      }
      
      slot.appendChild(nameDiv);
    }
    
    return slot;
  },
  
  calculateLineStats(lineNumber, type) {
    // Get players in this line/pair
    const players = [];
    
    if (type === 'forward') {
      ['LW', 'C', 'RW'].forEach(pos => {
        const playerName = this.assignments[`L${lineNumber}-${pos}`];
        if (playerName) players.push(playerName);
      });
    } else if (type === 'defense') {
      ['DL', 'DR'].forEach(pos => {
        const playerName = this.assignments[`D${lineNumber}-${pos}`];
        if (playerName) players.push(playerName);
      });
    }
    
    if (players.length === 0) {
      return "-";
    }
    
    // Get stats from season data
    let totalGoals = 0;
    let totalPoints = 0;
    let totalPlusMinus = 0;
    let totalShots = 0;
    let totalGames = 0;
    let playerCount = 0;
    
    players.forEach(playerName => {
      const seasonData = App.data.seasonData[playerName];
      if (seasonData) {
        const games = Number(seasonData.games || 0);
        if (games > 0) {
          totalGoals += Number(seasonData.goals || 0);
          totalPoints += (Number(seasonData.goals || 0) + Number(seasonData.assists || 0));
          totalPlusMinus += Number(seasonData.plusMinus || 0);
          totalShots += Number(seasonData.shots || 0);
          totalGames += games;
          playerCount++;
        }
      }
    });
    
    if (playerCount === 0) {
      return "-";
    }
    
    const avgGames = totalGames / playerCount;
    const goalsPerGame = avgGames > 0 ? (totalGoals / avgGames) : 0;
    const pointsPerGame = avgGames > 0 ? (totalPoints / avgGames) : 0;
    const avgPlusMinus = totalPlusMinus / playerCount;
    const shotsPerGame = avgGames > 0 ? (totalShots / avgGames) : 0;
    
    if (type === 'forward') {
      return `${goalsPerGame.toFixed(1)}G / ${avgPlusMinus >= 0 ? '+' : ''}${avgPlusMinus.toFixed(1)} / ${shotsPerGame.toFixed(1)} Sh`;
    } else {
      return `${pointsPerGame.toFixed(1)}P / ${avgPlusMinus >= 0 ? '+' : ''}${avgPlusMinus.toFixed(1)} / ${shotsPerGame.toFixed(1)} Sh`;
    }
  },
  
  changeLineMode() {
    const currentIndex = this.modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % this.modes.length;
    this.currentMode = this.modes[nextIndex];
    
    console.log("[LINE UP] Mode changed to:", this.currentMode);
    this.saveAssignments();
    this.render();
  },
  
  generatePowerLineup() {
    console.log("[LINE UP] Generating POWER lineup...");
    
    // Constants for player classification
    const ASSIST_TO_GOAL_RATIO_THRESHOLD = 1.5;
    const CENTER_POSITION_FREQUENCY = 3; // Every 3rd forward is a center
    
    // Get active players with season data
    const players = App.data.selectedPlayers.map(p => {
      const seasonData = App.data.seasonData[p.name];
      return {
        name: p.name,
        num: p.num,
        seasonData: seasonData,
        position: p.position || null // Will be inferred if not set
      };
    }).filter(p => p.seasonData && Number(p.seasonData.games || 0) > 0);
    
    // Separate by position type
    const centers = [];
    const wings = [];
    const defense = [];
    
    players.forEach(p => {
      const games = Number(p.seasonData.games || 0);
      const goals = Number(p.seasonData.goals || 0);
      const assists = Number(p.seasonData.assists || 0);
      const plusMinus = Number(p.seasonData.plusMinus || 0);
      const shots = Number(p.seasonData.shots || 0);
      
      // Calculate MVP scores based on position
      // For now, we don't have position data, so we'll sort all as generic forwards/defense
      // This is a simplified version
      
      // Assume players are either forwards or defense based on stats pattern
      // Defense typically have lower goals, higher +/-
      const avgGoals = games > 0 ? goals / games : 0;
      const avgAssists = games > 0 ? assists / games : 0;
      const avgPlusMinus = games > 0 ? plusMinus / games : 0;
      
      // Simple heuristic: if assists > goals * ASSIST_TO_GOAL_RATIO_THRESHOLD and good +/-, likely defense
      const isLikelyDefense = (avgAssists > avgGoals * ASSIST_TO_GOAL_RATIO_THRESHOLD && avgPlusMinus > 0);
      
      if (isLikelyDefense) {
        // Defense MVP: Tore×1 + Assists×1.5 + +/-×2 + Schüsse×0.3
        p.mvpScore = (goals * 1) + (assists * 1.5) + (plusMinus * 2) + (shots * 0.3);
        defense.push(p);
      } else {
        // Forward MVP - we'll split into centers and wings later
        // For now, use a generic forward score
        p.mvpScore = (goals * 2.2) + (assists * 1.2) + (plusMinus * 0.9) + (shots * 0.6);
        wings.push(p); // We'll distribute them later
      }
    });
    
    // Sort by MVP score
    wings.sort((a, b) => b.mvpScore - a.mvpScore);
    defense.sort((a, b) => b.mvpScore - a.mvpScore);
    
    // Distribute forwards to centers and wings (every CENTER_POSITION_FREQUENCY player to center, others to wings)
    const forwardPool = wings.slice();
    wings.length = 0;
    centers.length = 0;
    
    forwardPool.forEach((p, idx) => {
      // Every 3rd forward (index 1, 4, 7, ...) becomes a center
      if ((idx + 1) % CENTER_POSITION_FREQUENCY === 2) {
        centers.push(p);
      } else {
        wings.push(p);
      }
    });
    
    // Assign to lines
    this.assignments = {};
    
    // Forward Lines
    for (let line = 1; line <= 4; line++) {
      const centerIdx = line - 1;
      const wingStartIdx = (line - 1) * 2;
      
      if (centers[centerIdx]) {
        this.assignments[`L${line}-C`] = centers[centerIdx].name;
      }
      
      if (wings[wingStartIdx]) {
        this.assignments[`L${line}-LW`] = wings[wingStartIdx].name;
      }
      
      if (wings[wingStartIdx + 1]) {
        this.assignments[`L${line}-RW`] = wings[wingStartIdx + 1].name;
      }
    }
    
    // Defense Pairs
    for (let pair = 1; pair <= 3; pair++) {
      const dlIdx = (pair - 1) * 2;
      const drIdx = dlIdx + 1;
      
      if (defense[dlIdx]) {
        this.assignments[`D${pair}-DL`] = defense[dlIdx].name;
      }
      
      if (defense[drIdx]) {
        this.assignments[`D${pair}-DR`] = defense[drIdx].name;
      }
    }
    
    // Power Play - use top forwards and defense
    for (let unit = 1; unit <= 2; unit++) {
      const offset = (unit - 1) * 5;
      
      if (centers[unit - 1]) {
        this.assignments[`PP-C${unit}`] = centers[unit - 1].name;
      }
      
      const wingIdx1 = (unit - 1) * 2;
      const wingIdx2 = wingIdx1 + 1;
      
      if (wings[wingIdx1]) {
        this.assignments[`PP-LW${unit}`] = wings[wingIdx1].name;
      }
      if (wings[wingIdx2]) {
        this.assignments[`PP-RW${unit}`] = wings[wingIdx2].name;
      }
      
      const defIdx1 = (unit - 1) * 2;
      const defIdx2 = defIdx1 + 1;
      
      if (defense[defIdx1]) {
        this.assignments[`PP-DL${unit}`] = defense[defIdx1].name;
      }
      if (defense[defIdx2]) {
        this.assignments[`PP-DR${unit}`] = defense[defIdx2].name;
      }
    }
    
    // Box Play - use different players (prioritize defensive play)
    for (let unit = 1; unit <= 2; unit++) {
      const offset = (unit - 1) * 4;
      
      if (centers[unit + 1]) {
        this.assignments[`BP-C${unit}`] = centers[unit + 1].name;
      }
      if (wings[unit + 3]) {
        this.assignments[`BP-W${unit}`] = wings[unit + 3].name;
      }
      if (defense[unit + 1]) {
        this.assignments[`BP-DL${unit}`] = defense[unit + 1].name;
      }
      if (defense[unit + 2]) {
        this.assignments[`BP-DR${unit}`] = defense[unit + 2].name;
      }
    }
    
    this.saveAssignments();
  },
  
  showPlayerOutDialog() {
    // Get all assigned players
    const allPlayers = new Set();
    Object.values(this.assignments).forEach(name => {
      if (name && name.trim()) {
        allPlayers.add(name);
      }
    });
    
    const playersArray = Array.from(allPlayers).sort();
    
    if (playersArray.length === 0) {
      alert("No players assigned yet.");
      return;
    }
    
    // Create a simple dialog
    const selected = prompt(
      "Player Out - Enter player names separated by commas:\n\n" +
      "Available players:\n" + playersArray.join(", ") +
      "\n\nCurrently out: " + (this.playerOutList.join(", ") || "none"),
      this.playerOutList.join(", ")
    );
    
    if (selected !== null) {
      this.playerOutList = selected
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);
      this.saveAssignments();
      this.render();
    }
  },
  
  saveAssignments() {
    const teamId = App.teamSelection ? App.teamSelection.getCurrentTeamInfo()?.id : 'team1';
    const data = {
      mode: this.currentMode,
      assignments: this.assignments,
      playerOutList: this.playerOutList
    };
    localStorage.setItem(`lineUpData_${teamId}`, JSON.stringify(data));
    console.log("[LINE UP] Assignments saved");
  },
  
  loadAssignments() {
    const teamId = App.teamSelection ? App.teamSelection.getCurrentTeamInfo()?.id : 'team1';
    const saved = localStorage.getItem(`lineUpData_${teamId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.currentMode = data.mode || 'normal';
        this.assignments = data.assignments || {};
        this.playerOutList = data.playerOutList || [];
        console.log("[LINE UP] Assignments loaded");
      } catch (e) {
        console.error("[LINE UP] Failed to load assignments:", e);
      }
    }
  }
};

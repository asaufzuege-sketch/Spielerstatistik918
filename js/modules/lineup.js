// LINE UP Module
App.lineup = {
  container: null,
  currentMode: 'NORMAL', // NORMAL, MANUELL, POWER
  
  // Position slots definition
  positions: {
    evenStrength: {
      centers: ['C1', 'C2', 'C3', 'C4'],
      leftWings: ['LW1', 'LW2', 'LW3', 'LW4'],
      rightWings: ['RW1', 'RW2', 'RW3', 'RW4'],
      leftDefense: ['DL1', 'DL2', 'DL3'],
      rightDefense: ['DR1', 'DR2', 'DR3']
    },
    boxPlay: {
      centers: ['BP-C1', 'BP-C2'],
      wings: ['BP-W1', 'BP-W2'],
      leftDefense: ['BP-DL'],
      rightDefense: ['BP-DR']
    },
    powerPlay: {
      centers: ['PP-C1', 'PP-C2'],
      leftWings: ['PP-LW1', 'PP-LW2'],
      rightWings: ['PP-RW1', 'PP-RW2'],
      leftDefense: ['PP-DL'],
      rightDefense: ['PP-DR']
    }
  },
  
  init() {
    this.container = document.getElementById("lineupContainer");
    
    // Load saved lineup data and mode
    const savedData = localStorage.getItem("lineupData");
    if (savedData) {
      App.data.lineupData = JSON.parse(savedData);
    }
    
    const savedMode = localStorage.getItem("lineupMode");
    if (savedMode) {
      this.currentMode = savedMode;
    }
  },
  
  attachEventListeners() {
    // Event listeners for mode buttons
    document.getElementById("lineupModeNormal")?.addEventListener("click", () => {
      this.setMode('NORMAL');
    });
    
    document.getElementById("lineupModeManuell")?.addEventListener("click", () => {
      this.setMode('MANUELL');
    });
    
    document.getElementById("lineupModePower")?.addEventListener("click", () => {
      this.setMode('POWER');
    });
    
    document.getElementById("lineupResetBtn")?.addEventListener("click", () => {
      this.reset();
    });
  },
  
  setMode(mode) {
    this.currentMode = mode;
    localStorage.setItem("lineupMode", mode);
    
    if (mode === 'POWER') {
      this.autoFillPower();
    }
    
    this.render();
  },
  
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = "";
    
    // Mode selector
    const modeDiv = document.createElement("div");
    modeDiv.className = "lineup-mode-selector";
    modeDiv.innerHTML = `
      <h2>LINE UP MODE</h2>
      <div class="mode-buttons">
        <button id="lineupModeNormal" class="mode-btn ${this.currentMode === 'NORMAL' ? 'active' : ''}">NORMAL</button>
        <button id="lineupModeManuell" class="mode-btn ${this.currentMode === 'MANUELL' ? 'active' : ''}">MANUELL</button>
        <button id="lineupModePower" class="mode-btn ${this.currentMode === 'POWER' ? 'active' : ''}">POWER</button>
      </div>
      <button id="lineupResetBtn" class="top-btn danger-btn reset-btn">Reset Lineup</button>
    `;
    this.container.appendChild(modeDiv);
    
    // Attach event listeners after rendering
    this.attachEventListeners();
    
    // Info text for POWER mode
    if (this.currentMode === 'POWER') {
      const infoDiv = document.createElement("div");
      infoDiv.className = "lineup-info";
      infoDiv.innerHTML = `<p style="color: #44bb91; margin: 10px 0;">✓ POWER Mode: Aufstellung wird automatisch basierend auf MVP-Berechnung befüllt</p>`;
      this.container.appendChild(infoDiv);
    }
    
    // Create lineup display sections
    this.renderSection("Even Strength", this.positions.evenStrength);
    this.renderSection("Box Play (PK)", this.positions.boxPlay);
    this.renderSection("Power Play (PP)", this.positions.powerPlay);
  },
  
  renderSection(title, positions) {
    const section = document.createElement("div");
    section.className = "lineup-section";
    
    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    section.appendChild(titleEl);
    
    const grid = document.createElement("div");
    grid.className = "lineup-grid";
    
    // Render all position groups
    Object.entries(positions).forEach(([groupName, slots]) => {
      slots.forEach(slot => {
        const slotDiv = document.createElement("div");
        slotDiv.className = "lineup-slot";
        
        const label = document.createElement("label");
        label.textContent = slot;
        label.className = "lineup-label";
        
        const playerName = App.data.lineupData[slot] || "";
        
        // In POWER mode, make read-only
        if (this.currentMode === 'POWER') {
          const display = document.createElement("div");
          display.className = "lineup-display";
          display.textContent = playerName || "-";
          slotDiv.appendChild(label);
          slotDiv.appendChild(display);
        } else {
          // In NORMAL and MANUELL, allow selection
          const select = document.createElement("select");
          select.className = "lineup-select";
          select.dataset.slot = slot;
          
          const emptyOption = document.createElement("option");
          emptyOption.value = "";
          emptyOption.textContent = "-";
          select.appendChild(emptyOption);
          
          // Get position type from slot name
          const positionType = this.getPositionTypeFromSlot(slot);
          
          // Filter players by position
          const availablePlayers = App.data.selectedPlayers.filter(p => {
            const playerData = App.data.players.find(pd => pd.name === p.name);
            return playerData && playerData.position === positionType;
          });
          
          availablePlayers.forEach(p => {
            const option = document.createElement("option");
            option.value = p.name;
            option.textContent = `${p.num ? '#' + p.num + ' ' : ''}${p.name}`;
            if (p.name === playerName) {
              option.selected = true;
            }
            select.appendChild(option);
          });
          
          select.addEventListener("change", (e) => {
            App.data.lineupData[slot] = e.target.value;
            this.saveLineupData();
          });
          
          slotDiv.appendChild(label);
          slotDiv.appendChild(select);
        }
        
        grid.appendChild(slotDiv);
      });
    });
    
    section.appendChild(grid);
    this.container.appendChild(section);
  },
  
  getPositionTypeFromSlot(slot) {
    // Determine position type based on slot name
    if (slot.includes('C')) return 'C';
    if (slot.includes('W')) return 'W';
    if (slot.includes('D')) return 'D';
    return null;
  },
  
  calculateMVP(playerName, position) {
    // Get season data for MVP calculation
    const seasonData = App.data.seasonData[playerName];
    if (!seasonData) return 0;
    
    const games = Number(seasonData.games || 0);
    if (games === 0) return 0;
    
    const goals = Number(seasonData.goals || 0);
    const assists = Number(seasonData.assists || 0);
    const plusMinus = Number(seasonData.plusMinus || 0);
    const shots = Number(seasonData.shots || 0);
    
    // Different MVP formulas per position
    let mvp = 0;
    if (position === 'C') {
      // Center: Goals×2 + Assists×1.5 + +/-×1 + Shots×0.5
      mvp = (goals * 2) + (assists * 1.5) + (plusMinus * 1) + (shots * 0.5);
    } else if (position === 'W') {
      // Wing: Goals×2.5 + Assists×1 + +/-×0.8 + Shots×0.7
      mvp = (goals * 2.5) + (assists * 1) + (plusMinus * 0.8) + (shots * 0.7);
    } else if (position === 'D') {
      // Defense: Goals×1 + Assists×1.5 + +/-×2 + Shots×0.3
      mvp = (goals * 1) + (assists * 1.5) + (plusMinus * 2) + (shots * 0.3);
    }
    
    return mvp;
  },
  
  autoFillPower() {
    // Clear existing lineup to ensure fresh auto-fill based on current MVP rankings
    // This is intentional: POWER mode always recalculates optimal lineup
    App.data.lineupData = {};
    
    // Get all selected players with their positions and calculate MVP
    const playersByPosition = {
      C: [],
      W: [],
      D: []
    };
    
    App.data.selectedPlayers.forEach(p => {
      const playerData = App.data.players.find(pd => pd.name === p.name);
      if (!playerData || !playerData.position) return;
      
      const mvp = this.calculateMVP(p.name, playerData.position);
      playersByPosition[playerData.position].push({
        name: p.name,
        num: p.num,
        mvp: mvp
      });
    });
    
    // Sort each position by MVP (descending)
    Object.keys(playersByPosition).forEach(pos => {
      playersByPosition[pos].sort((a, b) => b.mvp - a.mvp);
    });
    
    // Fill Centers
    const centers = playersByPosition.C;
    const centerSlots = [
      ...this.positions.evenStrength.centers,
      ...this.positions.boxPlay.centers,
      ...this.positions.powerPlay.centers
    ];
    centers.forEach((player, idx) => {
      if (idx < centerSlots.length) {
        App.data.lineupData[centerSlots[idx]] = player.name;
      }
    });
    
    // Fill Wings (alternating LW/RW)
    const wings = playersByPosition.W;
    const leftWingSlots = [
      ...this.positions.evenStrength.leftWings,
      ...this.positions.powerPlay.leftWings
    ];
    const rightWingSlots = [
      ...this.positions.evenStrength.rightWings,
      ...this.positions.powerPlay.rightWings
    ];
    const boxPlayWingSlots = this.positions.boxPlay.wings;
    
    let lwIdx = 0;
    let rwIdx = 0;
    let bpIdx = 0;
    
    wings.forEach((player, idx) => {
      if (idx % 2 === 0) {
        // Even index -> Left Wing
        if (lwIdx < leftWingSlots.length) {
          App.data.lineupData[leftWingSlots[lwIdx]] = player.name;
          lwIdx++;
        } else if (bpIdx < boxPlayWingSlots.length) {
          App.data.lineupData[boxPlayWingSlots[bpIdx]] = player.name;
          bpIdx++;
        }
      } else {
        // Odd index -> Right Wing
        if (rwIdx < rightWingSlots.length) {
          App.data.lineupData[rightWingSlots[rwIdx]] = player.name;
          rwIdx++;
        } else if (bpIdx < boxPlayWingSlots.length) {
          App.data.lineupData[boxPlayWingSlots[bpIdx]] = player.name;
          bpIdx++;
        }
      }
    });
    
    // Fill Defense (alternating DL/DR)
    const defense = playersByPosition.D;
    const leftDefenseSlots = [
      ...this.positions.evenStrength.leftDefense,
      ...this.positions.boxPlay.leftDefense,
      ...this.positions.powerPlay.leftDefense
    ];
    const rightDefenseSlots = [
      ...this.positions.evenStrength.rightDefense,
      ...this.positions.boxPlay.rightDefense,
      ...this.positions.powerPlay.rightDefense
    ];
    
    let dlIdx = 0;
    let drIdx = 0;
    
    defense.forEach((player, idx) => {
      if (idx % 2 === 0) {
        // Even index -> Left Defense
        if (dlIdx < leftDefenseSlots.length) {
          App.data.lineupData[leftDefenseSlots[dlIdx]] = player.name;
          dlIdx++;
        }
      } else {
        // Odd index -> Right Defense
        if (drIdx < rightDefenseSlots.length) {
          App.data.lineupData[rightDefenseSlots[drIdx]] = player.name;
          drIdx++;
        }
      }
    });
    
    this.saveLineupData();
  },
  
  saveLineupData() {
    localStorage.setItem("lineupData", JSON.stringify(App.data.lineupData));
  },
  
  reset() {
    if (!confirm("Lineup-Daten löschen?")) return;
    
    App.data.lineupData = {};
    localStorage.removeItem("lineupData");
    this.render();
    alert("Lineup-Daten gelöscht.");
  }
};

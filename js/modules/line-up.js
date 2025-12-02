// LINE UP Module
App.lineUp = {
  container: null,
  mode: "NORMAL", // NORMAL, POWER, MANUELL
  playerOut: null,
  
  // Line Up Structure
  lineup: {
    forward1: { LW: null, C: null, RW: null },
    forward2: { LW: null, C: null, RW: null },
    forward3: { LW: null, C: null, RW: null },
    forward4: { LW: null, C: null, RW: null },
    defense1: { DL: null, DR: null },
    defense2: { DL: null, DR: null },
    defense3: { DL: null, DR: null },
    boxPlay: { LW: null, C: null, RW: null, DL: null, DR: null },
    powerPlay: { LW: null, C: null, RW: null, DL: null, DR: null }
  },
  
  init() {
    this.container = document.getElementById("lineUpContainer");
    
    // Load lineup from localStorage for current team
    this.load();
    
    // Event Listeners
    document.getElementById("backToStatsFromLineUpBtn")?.addEventListener("click", () => {
      App.showPage("stats");
    });
    
    document.getElementById("lineUpBtn")?.addEventListener("click", () => {
      App.showPage("lineUp");
    });
    
    document.getElementById("resetLineUpBtn")?.addEventListener("click", () => {
      this.reset();
    });
  },
  
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = "";
    
    // Mode Buttons
    const modeBox = document.createElement("div");
    modeBox.className = "lineup-mode-box";
    
    const modes = ["NORMAL", "POWER", "MANUELL"];
    modes.forEach(m => {
      const btn = document.createElement("button");
      btn.className = "mode-btn" + (this.mode === m ? " active" : "");
      btn.textContent = m;
      btn.addEventListener("click", () => {
        this.mode = m;
        if (m === "POWER") {
          this.autoFillPowerMode();
        }
        this.save();
        this.render();
      });
      modeBox.appendChild(btn);
    });
    
    this.container.appendChild(modeBox);
    
    // Player Out Dropdown
    const playerOutBox = document.createElement("div");
    playerOutBox.className = "lineup-player-out-box";
    playerOutBox.innerHTML = `
      <label for="playerOutSelect">Player Out:</label>
      <select id="playerOutSelect" class="lineup-select">
        <option value="">Keiner</option>
      </select>
    `;
    this.container.appendChild(playerOutBox);
    
    const playerOutSelect = document.getElementById("playerOutSelect");
    const availablePlayers = this.getAvailablePlayers();
    availablePlayers.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name;
      if (this.playerOut === p.name) {
        opt.selected = true;
      }
      playerOutSelect.appendChild(opt);
    });
    
    playerOutSelect.addEventListener("change", (e) => {
      this.playerOut = e.target.value || null;
      this.save();
      this.render();
    });
    
    // Forward Lines
    const forwardBox = document.createElement("div");
    forwardBox.className = "lineup-section";
    forwardBox.innerHTML = "<h2>FORWARD LINES</h2>";
    
    for (let i = 1; i <= 4; i++) {
      const lineDiv = document.createElement("div");
      lineDiv.className = "lineup-line";
      lineDiv.innerHTML = `<div class="line-label">Line ${i}</div>`;
      
      const lineKey = `forward${i}`;
      ["LW", "C", "RW"].forEach(pos => {
        const cell = this.createPositionCell(lineKey, pos);
        lineDiv.appendChild(cell);
      });
      
      forwardBox.appendChild(lineDiv);
    }
    
    this.container.appendChild(forwardBox);
    
    // Defense Pairs
    const defenseBox = document.createElement("div");
    defenseBox.className = "lineup-section";
    defenseBox.innerHTML = "<h2>DEFENSE PAIRS</h2>";
    
    for (let i = 1; i <= 3; i++) {
      const pairDiv = document.createElement("div");
      pairDiv.className = "lineup-line";
      pairDiv.innerHTML = `<div class="line-label">Pair ${i}</div>`;
      
      const lineKey = `defense${i}`;
      ["DL", "DR"].forEach(pos => {
        const cell = this.createPositionCell(lineKey, pos);
        pairDiv.appendChild(cell);
      });
      
      defenseBox.appendChild(pairDiv);
    }
    
    this.container.appendChild(defenseBox);
    
    // Box Play
    const boxPlayBox = document.createElement("div");
    boxPlayBox.className = "lineup-section";
    boxPlayBox.innerHTML = "<h2>BOX PLAY</h2>";
    
    const boxPlayDiv = document.createElement("div");
    boxPlayDiv.className = "lineup-line";
    
    ["LW", "C", "RW", "DL", "DR"].forEach(pos => {
      const cell = this.createPositionCell("boxPlay", pos);
      boxPlayDiv.appendChild(cell);
    });
    
    boxPlayBox.appendChild(boxPlayDiv);
    this.container.appendChild(boxPlayBox);
    
    // Power Play
    const powerPlayBox = document.createElement("div");
    powerPlayBox.className = "lineup-section";
    powerPlayBox.innerHTML = "<h2>POWER PLAY</h2>";
    
    const powerPlayDiv = document.createElement("div");
    powerPlayDiv.className = "lineup-line";
    
    ["LW", "C", "RW", "DL", "DR"].forEach(pos => {
      const cell = this.createPositionCell("powerPlay", pos);
      powerPlayDiv.appendChild(cell);
    });
    
    powerPlayBox.appendChild(powerPlayDiv);
    this.container.appendChild(powerPlayBox);
  },
  
  createPositionCell(lineKey, position) {
    const cell = document.createElement("div");
    cell.className = "lineup-position-cell";
    
    const posLabel = document.createElement("div");
    posLabel.className = "position-label";
    posLabel.textContent = position;
    cell.appendChild(posLabel);
    
    const currentPlayer = this.lineup[lineKey][position];
    
    if (this.mode === "MANUELL") {
      // Dropdown für manuelle Auswahl
      const select = document.createElement("select");
      select.className = "lineup-select";
      
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = "---";
      select.appendChild(emptyOpt);
      
      const availablePlayers = this.getAvailablePlayers();
      availablePlayers.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.name;
        opt.textContent = p.name;
        if (currentPlayer === p.name) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
      
      select.addEventListener("change", (e) => {
        this.lineup[lineKey][position] = e.target.value || null;
        this.save();
        this.render();
      });
      
      cell.appendChild(select);
    } else {
      // Anzeige im NORMAL oder POWER Modus
      const playerDiv = document.createElement("div");
      playerDiv.className = "lineup-player-display";
      
      if (currentPlayer) {
        const stats = this.getPlayerStats(currentPlayer);
        playerDiv.innerHTML = `
          <div class="player-name">${App.helpers.escapeHtml(currentPlayer)}</div>
          <div class="player-stats">
            G: ${stats.goals} | Ø+/-: ${stats.avgPlusMinus} | S: ${stats.shots}
          </div>
        `;
      } else {
        playerDiv.textContent = "---";
      }
      
      cell.appendChild(playerDiv);
    }
    
    return cell;
  },
  
  getAvailablePlayers() {
    // Get players from selectedPlayers, excluding playerOut
    const players = App.data.selectedPlayers.filter(p => {
      return !this.playerOut || p.name !== this.playerOut;
    });
    return players;
  },
  
  getPlayerStats(playerName) {
    const seasonData = App.data.seasonData[playerName] || {};
    const games = Number(seasonData.games || 0);
    const goals = Number(seasonData.goals || 0);
    const plusMinus = Number(seasonData.plusMinus || 0);
    const shots = Number(seasonData.shots || 0);
    
    const avgPlusMinus = games ? (plusMinus / games).toFixed(2) : "0.00";
    
    return {
      goals,
      avgPlusMinus,
      shots
    };
  },
  
  autoFillPowerMode() {
    // Automatic MVP lineup by position
    // This is a simplified version - in reality, you'd need position data
    const players = this.getAvailablePlayers();
    
    // Sort players by MVP points (calculated from season data)
    const playersWithMVP = players.map(p => {
      const stats = this.getPlayerStats(p.name);
      const seasonData = App.data.seasonData[p.name] || {};
      const assists = Number(seasonData.assists || 0);
      const games = Number(seasonData.games || 0);
      const mvpPoints = stats.goals + assists + (games ? (Number(seasonData.plusMinus || 0) / games) : 0);
      
      return {
        name: p.name,
        mvpPoints
      };
    }).sort((a, b) => b.mvpPoints - a.mvpPoints);
    
    // Fill lineups with top players
    let playerIndex = 0;
    
    // Forward lines - 3 players each
    for (let i = 1; i <= 4; i++) {
      const lineKey = `forward${i}`;
      ["LW", "C", "RW"].forEach(pos => {
        if (playerIndex < playersWithMVP.length) {
          this.lineup[lineKey][pos] = playersWithMVP[playerIndex].name;
          playerIndex++;
        } else {
          this.lineup[lineKey][pos] = null;
        }
      });
    }
    
    // Defense pairs - 2 players each
    for (let i = 1; i <= 3; i++) {
      const lineKey = `defense${i}`;
      ["DL", "DR"].forEach(pos => {
        if (playerIndex < playersWithMVP.length) {
          this.lineup[lineKey][pos] = playersWithMVP[playerIndex].name;
          playerIndex++;
        } else {
          this.lineup[lineKey][pos] = null;
        }
      });
    }
    
    // Box Play - top 5 players
    const boxPlayPlayers = playersWithMVP.slice(0, Math.min(5, playersWithMVP.length));
    ["LW", "C", "RW", "DL", "DR"].forEach((pos, idx) => {
      this.lineup.boxPlay[pos] = boxPlayPlayers[idx]?.name || null;
    });
    
    // Power Play - top 5 players
    const powerPlayPlayers = playersWithMVP.slice(0, Math.min(5, playersWithMVP.length));
    ["LW", "C", "RW", "DL", "DR"].forEach((pos, idx) => {
      this.lineup.powerPlay[pos] = powerPlayPlayers[idx]?.name || null;
    });
  },
  
  save() {
    const teamInfo = App.teamSelection?.getCurrentTeamInfo();
    const teamId = teamInfo?.id || "default";
    const key = `lineUp_${teamId}`;
    
    const data = {
      mode: this.mode,
      playerOut: this.playerOut,
      lineup: this.lineup
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  },
  
  load() {
    const teamInfo = App.teamSelection?.getCurrentTeamInfo();
    const teamId = teamInfo?.id || "default";
    const key = `lineUp_${teamId}`;
    
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.mode = data.mode || "NORMAL";
        this.playerOut = data.playerOut || null;
        this.lineup = data.lineup || this.lineup;
      } catch (e) {
        console.warn("Failed to load lineup:", e);
      }
    }
  },
  
  reset() {
    if (!confirm("Möchtest du wirklich das LINE UP zurücksetzen?")) return;
    
    this.mode = "NORMAL";
    this.playerOut = null;
    this.lineup = {
      forward1: { LW: null, C: null, RW: null },
      forward2: { LW: null, C: null, RW: null },
      forward3: { LW: null, C: null, RW: null },
      forward4: { LW: null, C: null, RW: null },
      defense1: { DL: null, DR: null },
      defense2: { DL: null, DR: null },
      defense3: { DL: null, DR: null },
      boxPlay: { LW: null, C: null, RW: null, DL: null, DR: null },
      powerPlay: { LW: null, C: null, RW: null, DL: null, DR: null }
    };
    
    this.save();
    this.render();
  }
};

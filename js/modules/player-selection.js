// Player Selection Modul
App.playerSelection = {
  container: null,
  saveTimeout: null,
  
  init() {
    this.container = document.getElementById("playerList");
    
    if (this.container) {
      this.render();
    }
    
    // Event Listener für Game Data Button - speichert und navigiert zur Stats-Seite
    document.getElementById("gameDataBtn")?.addEventListener("click", () => {
      this.handleConfirmAndNavigate();
    });
    
    // Event Listener für Line Up Button - navigiert zur Line Up Seite
    document.getElementById("lineupBtn")?.addEventListener("click", () => {
      this.handleConfirmAndNavigateToLineUp();
    });
  },
  
  handleConfirmAndNavigate() {
    // Spielerdaten speichern (wie bisher der Bestätigen-Button)
    this.handleConfirm();
  },
  
  handleConfirmAndNavigateToLineUp() {
    // Spielerdaten speichern und zur Line Up Seite navigieren
    this.saveCurrentState();
    
    // Update selectedPlayers
    App.data.selectedPlayers = [];
    const items = this.container.querySelectorAll("li");
    
    items.forEach((li) => {
      const checkbox = li.querySelector(".player-checkbox");
      const numInput = li.querySelector(".num-input");
      const nameInput = li.querySelector(".name-input");
      const posSelect = li.querySelector(".pos-select");
      const posFixed = li.querySelector(".pos-fixed");
      
      if (checkbox && checkbox.checked && nameInput && nameInput.value.trim() !== "") {
        App.data.selectedPlayers.push({
          num: numInput ? numInput.value.trim() : "",
          name: nameInput.value.trim(),
          position: posFixed ? "G" : (posSelect ? posSelect.value : "")
        });
      }
    });
    
    App.storage.saveSelectedPlayers();
    
    // Navigate to Line Up page
    if (typeof App.showPage === 'function') {
      App.showPage("lineUp");
    } else {
      document.getElementById("playerSelectionPage").style.display = "none";
      document.getElementById("lineUpPage").style.display = "block";
    }
    
    // Render Line Up if available
    if (App.lineUp && typeof App.lineUp.render === 'function') {
      App.lineUp.loadData();
      App.lineUp.render();
    }
  },
  
  getPlayers() {
    // Get current team info
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id;
    
    // Load saved player data for the team
    const savedPlayersKey = `playerSelectionData_${currentTeamId}`;
    let savedPlayers = [];
    try {
      savedPlayers = JSON.parse(localStorage.getItem(savedPlayersKey) || "[]");
    } catch (e) {
      savedPlayers = [];
    }
    
    const players = [];
    
    // Add 5 goalie slots at the top
    for (let i = 0; i < 5; i++) {
      const saved = savedPlayers[i];
      players.push({
        number: saved?.number || "",
        name: saved?.name || "",
        position: "G",  // Fixed position for goalies
        active: saved?.active || false,
        isGoalie: true
      });
    }
    
    // Team 1 gets predefined players, other teams get empty slots
    if (currentTeamId === 'team1') {
      // Convert existing player data to new format
      const regularPlayers = App.data.players.map((p, idx) => {
        const saved = savedPlayers.find(sp => sp.name === p.name);
        const isSelected = App.data.selectedPlayers.some(sp => sp.name === p.name);
        return {
          number: saved?.number || (p.num !== "" && p.num !== null && p.num !== undefined ? String(p.num) : ""),
          name: p.name,
          position: saved?.position || "",
          active: saved?.active !== undefined ? saved.active : isSelected,
          isGoalie: false
        };
      });
      
      players.push(...regularPlayers);
      
      // Add 13 additional slots (40 players total)
      for (let i = 0; i < 13; i++) {
        const saved = savedPlayers[5 + App.data.players.length + i];
        players.push({
          number: saved?.number || "",
          name: saved?.name || "",
          position: saved?.position || "",
          active: saved?.active || false,
          isGoalie: false
        });
      }
      
      return players;
    } else {
      // Team 2 and 3: 40 regular player slots after 5 goalie slots
      for (let i = 0; i < 40; i++) {
        const saved = savedPlayers[5 + i];
        players.push({
          number: saved?.number || "",
          name: saved?.name || "",
          position: saved?.position || "",
          active: saved?.active || false,
          isGoalie: false
        });
      }
      return players;
    }
  },
  
  render() {
    if (!this.container) return;
    
    const players = this.getPlayers();
    
    this.container.innerHTML = players.map((player, i) => {
      if (player.isGoalie) {
        // Goalie slot with fixed "G" position and green border
        return `
          <li class="goalie-slot">
            <input type="checkbox" 
                   ${player.active ? 'checked' : ''} 
                   data-index="${i}" 
                   class="player-checkbox">
            <input type="text" 
                   class="num-input" 
                   placeholder="Nr." 
                   value="${App.helpers.escapeHtml(player.number || '')}" 
                   data-index="${i}" 
                   data-field="number">
            <input type="text" 
                   class="name-input" 
                   placeholder="Enter goalie name" 
                   value="${App.helpers.escapeHtml(player.name || '')}" 
                   data-index="${i}" 
                   data-field="name">
            <div class="pos-fixed">G</div>
          </li>
        `;
      } else {
        // Regular player slot with position dropdown
        return `
          <li>
            <input type="checkbox" 
                   ${player.active ? 'checked' : ''} 
                   data-index="${i}" 
                   class="player-checkbox">
            <input type="text" 
                   class="num-input" 
                   placeholder="Nr." 
                   value="${App.helpers.escapeHtml(player.number || '')}" 
                   data-index="${i}" 
                   data-field="number">
            <input type="text" 
                   class="name-input" 
                   placeholder="Enter player name" 
                   value="${App.helpers.escapeHtml(player.name || '')}" 
                   data-index="${i}" 
                   data-field="name">
            <select class="pos-select" data-index="${i}" data-field="position">
              <option value="" disabled ${!player.position ? 'selected' : ''}>Pos.</option>
              <option value="C" ${player.position === 'C' ? 'selected' : ''}>Center</option>
              <option value="W" ${player.position === 'W' ? 'selected' : ''}>Wing</option>
              <option value="D" ${player.position === 'D' ? 'selected' : ''}>Defense</option>
            </select>
          </li>
        `;
      }
    }).join('');
    
    // Event Listeners hinzufügen
    this.attachEventListeners();
  },
  
  attachEventListeners() {
    if (!this.container) return;
    
    // Combined change/input event with debouncing for efficient localStorage writes
    this.container.addEventListener("change", (e) => {
      this.debouncedSave();
    });
    
    this.container.addEventListener("input", (e) => {
      if (e.target.matches(".num-input, .name-input")) {
        this.debouncedSave();
      }
    });
  },
  
  debouncedSave() {
    // Cancel pending save
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    // Debounce: save after 300ms of no input
    this.saveTimeout = setTimeout(() => {
      this.saveCurrentState();
    }, 300);
  },
  
  saveCurrentState() {
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id;
    const savedPlayersKey = `playerSelectionData_${currentTeamId}`;
    
    const players = [];
    const items = this.container.querySelectorAll("li");
    
    items.forEach((li, idx) => {
      const checkbox = li.querySelector(".player-checkbox");
      const numInput = li.querySelector(".num-input");
      const nameInput = li.querySelector(".name-input");
      const posSelect = li.querySelector(".pos-select");
      const posFixed = li.querySelector(".pos-fixed");
      
      players.push({
        number: numInput ? numInput.value.trim() : "",
        name: nameInput ? nameInput.value.trim() : "",
        position: posFixed ? "G" : (posSelect ? posSelect.value : ""),
        active: checkbox ? checkbox.checked : false
      });
    });
    
    localStorage.setItem(savedPlayersKey, JSON.stringify(players));
  },
  
  handleConfirm() {
    try {
      App.data.selectedPlayers = [];
      
      const items = this.container.querySelectorAll("li");
      
      items.forEach((li) => {
        const checkbox = li.querySelector(".player-checkbox");
        const numInput = li.querySelector(".num-input");
        const nameInput = li.querySelector(".name-input");
        const posSelect = li.querySelector(".pos-select");
        const posFixed = li.querySelector(".pos-fixed");
        
        if (checkbox && checkbox.checked && nameInput && nameInput.value.trim() !== "") {
          App.data.selectedPlayers.push({
            num: numInput ? numInput.value.trim() : "",
            name: nameInput.value.trim(),
            position: posFixed ? "G" : (posSelect ? posSelect.value : "")
          });
        }
      });
      
      // Speichere den aktuellen Status
      this.saveCurrentState();
      
      App.storage.saveSelectedPlayers();
      
      App.data.selectedPlayers.forEach(p => {
        if (!App.data.statsData[p.name]) {
          App.data.statsData[p.name] = {};
        }
        App.data.categories.forEach(c => {
          if (App.data.statsData[p.name][c] === undefined) {
            App.data.statsData[p.name][c] = 0;
          }
        });
      });
      
      App.storage.saveStatsData();
      
      // KORRIGIERT: Prüfe ob App.showPage existiert
      if (typeof App.showPage === 'function') {
        App.showPage("stats");
      } else {
        console.warn("App.showPage ist noch nicht definiert");
        // Fallback: Direkt die Seiten umschalten
        document.getElementById("playerSelectionPage").style.display = "none";
        document.getElementById("statsPage").style.display = "block";
      }
      
      if (App.statsTable && typeof App.statsTable.render === 'function') {
        App.statsTable.render();
      }
      
    } catch (err) {
      console.error("Error in confirmSelection:", err);
      alert("Confirmation error (see console): " + (err?.message || err));
    }
  }
};

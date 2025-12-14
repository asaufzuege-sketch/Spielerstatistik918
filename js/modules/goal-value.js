// Goal Value Modul - MIT SCROLLING und STICKY COLUMN
App.goalValue = {
  container: null,
  clickTimers: {},
  isUpdatingData: false,
  
  init() {
    this.container = document.getElementById("goalValueContainer");
    
    document.getElementById("resetGoalValueBtn")?.addEventListener("click", () => {
      this.reset();
    });
  },
  
  getOpponents() {
    try {
      const raw = localStorage.getItem("goalValueOpponents");
      if (raw) {
        let opponents = JSON.parse(raw);
        // Convert old German "Gegner" to English "Opponent"
        let needsSave = false;
        opponents = opponents.map((op, i) => {
          if (op && op.startsWith("Gegner")) {
            needsSave = true;
            // Try to preserve original number from "Gegner X" format
            const match = op.match(/Gegner\s+(\d+)/);
            return match ? `Opponent ${match[1]}` : `Opponent ${i + 1}`;
          }
          return op;
        });
        if (needsSave) {
          this.setOpponents(opponents);
        }
        return opponents;
      }
    } catch (e) {}
    return Array.from({ length: 19 }, (_, i) => `Opponent ${i + 1}`);
  },
  
  setOpponents(arr) {
    localStorage.setItem("goalValueOpponents", JSON.stringify(arr));
  },
  
  getData() {
    try {
      const raw = localStorage.getItem("goalValueData");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  },
  
  setData(obj, forceWrite = false) {
    if (this.isUpdatingData && !forceWrite) {
      console.warn("[Goal Value] setData blocked during update to prevent recursion");
      return;
    }
    localStorage.setItem("goalValueData", JSON.stringify(obj));
  },
  
  getBottom() {
    try {
      const raw = localStorage.getItem("goalValueBottom");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.getOpponents().map(() => 0);
  },
  
  setBottom(arr) {
    localStorage.setItem("goalValueBottom", JSON.stringify(arr));
  },
  
  computeValueForPlayer(name) {
    const data = this.getData();
    const bottom = this.getBottom();
    const vals = Array.isArray(data[name]) ? data[name] : [];
    return bottom.reduce((sum, w, i) => sum + (Number(vals[i] || 0) * Number(w || 0)), 0);
  },
  
  formatValueNumber(v) {
    return Math.abs(v - Math.round(v)) < 1e-4 ? String(Math.round(v)) : String(Number(v. toFixed(1))); 
  },
  
  ensureDataForSeason() {
    if (this.isUpdatingData) {
      console.warn("[Goal Value] ensureDataForSeason blocked to prevent recursion");
      return;
    }
    
    this.isUpdatingData = true;
    
    try {
      const opponents = this.getOpponents();
      const all = this.getData();
      
      Object.keys(App.data. seasonData).forEach(name => {
        if (!all[name] || !Array.isArray(all[name])) {
          all[name] = opponents.map(() => 0);
        } else {
          while (all[name].length < opponents.length) all[name].push(0);
          if (all[name].length > opponents.length) all[name] = all[name].slice(0, opponents.length);
        }
      });
      
      localStorage.setItem("goalValueData", JSON.stringify(all));
      console.log("[Goal Value] ensureDataForSeason completed");
    } finally {
      this.isUpdatingData = false;
    }
  },
  
  render() {
    if (!this.container) return;
    
    // Container leer, Scroll liegt auf #goalValueContainer (wie bei Season)
    this.container.innerHTML = "";
    
    const opponents = this.getOpponents();
    const gData = this.getData();
    const bottom = this.getBottom();
    
    // Get player list and filter out goalies
    let playersList = Object.keys(App.data.seasonData).length 
      ? Object.keys(App.data.seasonData).sort() 
      : App.data.selectedPlayers.map(p => p.name);
    
    // Filter out goalies - check both playerSelectionData and selectedPlayers
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedPlayersKey = `playerSelectionData_${currentTeamId}`;
    
    try {
      const savedPlayers = JSON.parse(localStorage.getItem(savedPlayersKey) || "[]");
      const goalieNames = savedPlayers
        .filter(p => p.position === "G" || p.isGoalie)
        .map(p => p.name);
      
      playersList = playersList.filter(name => !goalieNames.includes(name));
    } catch (e) {
      // Fallback: filter from selectedPlayers
      const goalieNames = (App.data.selectedPlayers || [])
        .filter(p => p.position === "G" || p.isGoalie)
        .map(p => p.name);
      playersList = playersList.filter(name => !goalieNames.includes(name));
    }
    
    // WICHTIG: Wrapper OHNE position:relative - das blockiert sticky! 
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    wrapper.style.width = '100%';
    wrapper.style.boxSizing = 'border-box';
    // ENTFERNT: wrapper.style.position = 'relative'; - blockiert sticky columns! 
    
    const table = document.createElement("table");
    table.className = "goalvalue-table gv-no-patch";
    table.style.width = "auto";
    table.style.margin = "0";
    table.style.borderCollapse = "separate";
    table.style.borderSpacing = "0";
    table.style.borderRadius = "8px";
    // ENTFERNT: table.style.overflow = "hidden"; - kann sticky beeinflussen
    table.style.tableLayout = "auto";
    
    // Header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    const thPlayer = document.createElement("th");
    thPlayer.textContent = "Player";
    thPlayer.className = "gv-name-header sticky-col";
    thPlayer.style.minWidth = "120px";
    headerRow.appendChild(thPlayer);
    
    opponents.forEach((op, idx) => {
      const th = document.createElement("th");
      const input = document.createElement("input");
      input.type = "text";
      input.value = op || "";
      input.placeholder = `Opponent ${idx+1}`;
      input.className = "goalvalue-title-input";
      input.addEventListener("change", () => {
        const arr = this.getOpponents();
        arr[idx] = input.value || "";
        this.setOpponents(arr);
        this.render();
      });
      th. appendChild(input);
      headerRow.appendChild(th);
    });
    
    const thValue = document.createElement("th");
    thValue.textContent = "Value";
    headerRow.appendChild(thValue);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement("tbody");
    const valueCellMap = {};
    const colors = App.helpers.getColorStyles();
    
    playersList.forEach((name, rowIdx) => {
      const row = document.createElement("tr");
      row.className = (rowIdx % 2 === 0 ? "even-row" : "odd-row");
      row.style.borderBottom = "1px solid #333";
      
      const tdName = document.createElement("td");
      tdName.textContent = name;
      tdName.className = "gv-name-cell sticky-col";
      tdName.style.minWidth = "120px";
      row. appendChild(tdName);
      
      const vals = (gData[name] && Array.isArray(gData[name])) ? gData[name]. slice() : opponents.map(() => 0);
      while (vals.length < opponents.length) vals.push(0);
      
      opponents.forEach((_, i) => {
        const td = document.createElement("td");
        td.dataset.player = name;
        td.dataset.oppIdx = String(i);
        td.className = "gv-data-cell";
        
        const v = Number(vals[i] || 0);
        td.textContent = String(v);
        td.style.color = v > 0 ? colors.pos : v < 0 ? colors.neg : colors.zero;
        td.style.fontWeight = v !== 0 ? "700" : "400";
        
        td.addEventListener("click", (e) => {
          e.preventDefault();
          
          const cellId = `${name}-${i}`;
          const playerName = td.dataset.player;
          const oppIdx = Number(td.dataset.oppIdx);
          
          if (this.clickTimers[cellId]) {
            clearTimeout(this. clickTimers[cellId]);
            delete this.clickTimers[cellId];
            
            // DOPPELKLICK: -1
            const d = this.getData();
            if (! d[playerName]) d[playerName] = opponents.map(() => 0);
            d[playerName][oppIdx] = Math.max(0, Number(d[playerName][oppIdx] || 0) - 1);
            this.setData(d, true);
            
            const nv = d[playerName][oppIdx];
            td.textContent = String(nv);
            td.style.color = nv > 0 ?  colors.pos : nv < 0 ? colors.neg : colors.zero;
            td.style.fontWeight = nv !== 0 ? "700" : "400";
            
            this. updateValueCell(playerName, valueCellMap);
            
          } else {
            this.clickTimers[cellId] = setTimeout(() => {
              delete this.clickTimers[cellId];
              
              // EINZELKLICK: +1
              const d = this. getData();
              if (!d[playerName]) d[playerName] = opponents.map(() => 0);
              d[playerName][oppIdx] = Number(d[playerName][oppIdx] || 0) + 1;
              this.setData(d, true);
              
              const nv = d[playerName][oppIdx];
              td.textContent = String(nv);
              td.style.color = nv > 0 ? colors.pos : nv < 0 ? colors.neg : colors.zero;
              td.style.fontWeight = nv !== 0 ? "700" : "400";
              
              this.updateValueCell(playerName, valueCellMap);
            }, 300);
          }
        });
        
        row.appendChild(td);
      });
      
      const valueTd = document.createElement("td");
      const val = this.computeValueForPlayer(name);
      valueTd.textContent = this.formatValueNumber(val);
      valueTd.className = "gv-value-cell";
      valueTd.style. color = val > 0 ? colors.pos : val < 0 ? colors.neg : colors.zero;
      valueTd.style.fontWeight = val !== 0 ?  "700" : "400";
      row.appendChild(valueTd);
      
      valueCellMap[name] = valueTd;
      tbody.appendChild(row);
    });
    
    // Bottom Scale Row
    const bottomRow = document. createElement("tr");
    bottomRow.className = (playersList.length % 2 === 0 ?  "even-row" : "odd-row");
    bottomRow.style.background = "rgba(0,0,0,0.03)";
    
    const labelTd = document.createElement("td");
    labelTd.textContent = "";
    labelTd.className = "sticky-col";
    labelTd.style.minWidth = "120px";
    bottomRow.appendChild(labelTd);
    
    const scaleOptions = [];
    for (let v = 0; v <= 10; v++) scaleOptions.push((v * 0.5).toFixed(1));
    
    const storedBottom = this.getBottom();
    while (storedBottom.length < opponents.length) storedBottom.push(0);
    if (storedBottom.length > opponents.length) storedBottom. length = opponents.length;
    this.setBottom(storedBottom);
    
    opponents.forEach((_, i) => {
      const td = document.createElement("td");
      const select = document.createElement("select");
      select.className = "gv-scale-dropdown";
      
      scaleOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
      
      // WICHTIG: Wert SOFORT setzen, nicht mit setTimeout
      const currentValue = storedBottom[i] !== undefined ? storedBottom[i] : 0;
      select.value = String(Number(currentValue).toFixed(1));
      
      select.addEventListener("change", () => {
        const arr = this.getBottom();
        arr[i] = Number(select.value);
        this.setBottom(arr);
        
        Object.keys(valueCellMap). forEach(pn => {
          this.updateValueCell(pn, valueCellMap);
        });
      });
      
      td.appendChild(select);
      bottomRow.appendChild(td);
    });
    
    const emptyTd = document.createElement("td");
    emptyTd.textContent = "";
    bottomRow.appendChild(emptyTd);
    
    tbody.appendChild(bottomRow);
    table.appendChild(tbody);
    
    wrapper.appendChild(table);
    this.container.appendChild(wrapper);
    
    console.log('Goal Value Table rendered with scroll wrapper and WORKING sticky columns');
  },
  
  updateValueCell(playerName, valueCellMap) {
    const vc = valueCellMap[playerName];
    if (!vc) return;
    
    const colors = App.helpers.getColorStyles();
    const val = this.computeValueForPlayer(playerName);
    vc.textContent = this.formatValueNumber(val);
    vc.style.color = val > 0 ? colors.pos : val < 0 ? colors.neg : colors.zero;
    vc. style.fontWeight = val !== 0 ? "700" : "400";
  },
  
  reset() {
    if (! confirm("Reset Goal Value?")) return;
    
    const opponents = this.getOpponents();
    let playersList = Object.keys(App. data.seasonData).length 
      ? Object.keys(App. data.seasonData) 
      : App.data. selectedPlayers.map(p => p.name);
    
    // Filter out goalies - same logic as render()
    const currentTeamInfo = App.teamSelection?.getCurrentTeamInfo();
    const currentTeamId = currentTeamInfo?.id || 'team1';
    const savedPlayersKey = `playerSelectionData_${currentTeamId}`;
    
    try {
      const savedPlayers = JSON.parse(localStorage.getItem(savedPlayersKey) || "[]");
      const goalieNames = savedPlayers
        .filter(p => p.position === "G" || p.isGoalie)
        .map(p => p.name);
      
      playersList = playersList.filter(name => !goalieNames.includes(name));
    } catch (e) {
      // Fallback: filter from selectedPlayers
      const goalieNames = (App.data. selectedPlayers || [])
        .filter(p => p.position === "G" || p.isGoalie)
        .map(p => p.name);
      playersList = playersList.filter(name => !goalieNames.includes(name));
    }
    
    const newData = {};
    playersList.forEach(n => newData[n] = opponents.map(() => 0));
    this.setData(newData);
    
    this.setBottom(opponents.map(() => 0));
    this.setOpponents(Array.from({ length: opponents.length }, (_, i) => `Opponent ${i + 1}`));
    
    this.render();
    alert("Goal Value reset.");
  }
};

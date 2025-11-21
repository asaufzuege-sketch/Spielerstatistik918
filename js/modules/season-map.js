// Season Map Modul
App.seasonMap = {
  timeTrackingBox: null,
  
  init() {
    this.timeTrackingBox = document.getElementById("seasonMapTimeTrackingBox");
    this.playerFilter = null;
    
    // Event Listeners
    document.getElementById("exportSeasonMapBtn")?.addEventListener("click", () => {
      this.exportFromGoalMap();
    });
    
    document.getElementById("resetSeasonMapBtn")?.addEventListener("click", () => {
      this.reset();
    });
    
    // Time Tracking (Read-Only)
    this.initTimeTracking();
    
    // Player Filter
    this.initPlayerFilter();
  },
  
  initPlayerFilter() {
    const filterSelect = document.getElementById("seasonMapPlayerFilter");
    if (!filterSelect) return;
    
    // Populate dropdown with players
    filterSelect.innerHTML = '<option value="">Alle Spieler</option>';
    App.data.selectedPlayers.forEach(player => {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = player.name;
      filterSelect.appendChild(option);
    });
    
    // Add change event listener
    filterSelect.addEventListener("change", () => {
      this.playerFilter = filterSelect.value || null;
      this.applyPlayerFilter();
    });
    
    // Restore filter from localStorage
    const savedFilter = localStorage.getItem("seasonMapPlayerFilter");
    if (savedFilter) {
      filterSelect.value = savedFilter;
      this.playerFilter = savedFilter;
      this.applyPlayerFilter();
    }
  },
  
  applyPlayerFilter() {
    // Save filter to localStorage
    if (this.playerFilter) {
      localStorage.setItem("seasonMapPlayerFilter", this.playerFilter);
    } else {
      localStorage.removeItem("seasonMapPlayerFilter");
    }
    
    // Filter markers in field and goal boxes
    const boxes = document.querySelectorAll(App.selectors.seasonMapBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        if (this.playerFilter) {
          // Show only markers for selected player
          if (marker.dataset.player === this.playerFilter) {
            marker.style.display = '';
          } else {
            marker.style.display = 'none';
          }
        } else {
          // Show all markers
          marker.style.display = '';
        }
      });
    });
    
    // Update timebox display with player filter
    const timeDataWithPlayers = JSON.parse(localStorage.getItem("seasonMapTimeDataWithPlayers")) || {};
    this.writeTimeTrackingToBox(timeDataWithPlayers);
    
    // Re-render goal area stats with filter
    this.renderGoalAreaStats();
    
    console.log(`Season Map player filter applied: ${this.playerFilter || 'All players'}`);
  },
  
  render() {
    const boxes = Array.from(document.querySelectorAll(App.selectors.seasonMapBoxes));
    boxes.forEach(box => box.querySelectorAll(".marker-dot").forEach(d => d.remove()));
    
    // Bild-Eigenschaften von Goal Map übernehmen
    try {
      const torBoxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
      boxes.forEach((seasonBox, idx) => {
        const seasonImg = seasonBox.querySelector('img');
        const torBox = torBoxes[idx];
        
        if (seasonImg && torBox) {
          const torImg = torBox.querySelector('img');
          if (torImg) {
            try {
              const torCS = getComputedStyle(torImg);
              const torObjectFit = torCS.getPropertyValue('object-fit') || 'contain';
              seasonImg.style.objectFit = torObjectFit;
              
              const torRect = torImg.getBoundingClientRect();
              if (torRect && torRect.width && torRect.height) {
                seasonImg.style.width = `${Math.round(torRect.width)}px`;
                seasonImg.style.height = `${Math.round(torRect.height)}px`;
                seasonBox.style.width = `${Math.round(torRect.width)}px`;
                seasonBox.style.height = `${Math.round(torRect.height)}px`;
                seasonBox.style.overflow = 'hidden';
              }
            } catch (e) {
              seasonImg.style.objectFit = 'contain';
            }
          }
        }
      });
    } catch (e) {
      console.warn("Layout copy failed:", e);
    }
    
    // Marker laden
    const raw = localStorage.getItem("seasonMapMarkers");
    if (raw) {
      try {
        const allMarkers = JSON.parse(raw);
        allMarkers.forEach((markersForBox, idx) => {
          const box = boxes[idx];
          if (!box || !Array.isArray(markersForBox)) return;
          
          markersForBox.forEach(m => {
            App.markerHandler.createMarkerPercent(m.xPct, m.yPct, m.color || "#444", box, false, m.player);
          });
        });
      } catch (e) {
        console.warn("Invalid seasonMapMarkers", e);
      }
    }
    
    // Time Data with player associations laden
    const rawTimeWithPlayers = localStorage.getItem("seasonMapTimeDataWithPlayers");
    if (rawTimeWithPlayers) {
      try {
        const timeDataWithPlayers = JSON.parse(rawTimeWithPlayers);
        this.writeTimeTrackingToBox(timeDataWithPlayers);
      } catch (e) {
        console.warn("Invalid seasonMapTimeDataWithPlayers", e);
      }
    }
    
    // Apply player filter if set
    if (this.playerFilter) {
      this.applyPlayerFilter();
    }
    
    // Goal Area Stats rendern
    this.renderGoalAreaStats();
  },
  
  exportFromGoalMap() {
    if (!confirm("In Season Map exportieren?")) return;
    
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    const allMarkers = boxes.map(box => {
      const markers = [];
      box.querySelectorAll(".marker-dot").forEach(dot => {
        const left = dot.style.left || "";
        const top = dot.style.top || "";
        const bg = dot.style.backgroundColor || "";
        const xPct = parseFloat(left.replace("%", "")) || 0;
        const yPct = parseFloat(top.replace("%", "")) || 0;
        const playerName = dot.dataset.player || null;
        markers.push({ xPct, yPct, color: bg, player: playerName });
      });
      return markers;
    });
    
    localStorage.setItem("seasonMapMarkers", JSON.stringify(allMarkers));
    
    // Export time tracking data with player associations
    const timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
    localStorage.setItem("seasonMapTimeDataWithPlayers", JSON.stringify(timeDataWithPlayers));
    
    const keep = confirm("Spiel wurde in Season Map exportiert. Daten in Goal Map beibehalten? (OK = Ja)");
    if (!keep) {
      document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
      document.querySelectorAll("#torbildPage .time-btn").forEach(btn => btn.textContent = "0");
      localStorage.removeItem("timeData");
      localStorage.removeItem("timeDataWithPlayers");
    }
    
    App.showPage("seasonMap");
    this.render();
  },
  
  readTimeTrackingFromBox() {
    const result = {};
    const box = document.getElementById("timeTrackingBox");
    if (!box) return result;
    
    box.querySelectorAll(".period").forEach((period, pIdx) => {
      const key = period.dataset.period || (`p${pIdx}`);
      result[key] = [];
      period.querySelectorAll(".time-btn").forEach(btn => {
        result[key].push(Number(btn.textContent) || 0);
      });
    });
    return result;
  },
  
  writeTimeTrackingToBox(timeDataWithPlayers) {
    if (!this.timeTrackingBox || !timeDataWithPlayers) return;
    
    const periods = Array.from(this.timeTrackingBox.querySelectorAll(".period"));
    periods.forEach((period, pIdx) => {
      const periodKey = period.dataset.period || `period${pIdx}`;
      period.querySelectorAll(".time-btn").forEach((btn, btnIdx) => {
        const buttonId = `${periodKey}_${btnIdx}`;
        const playerData = timeDataWithPlayers[buttonId] || {};
        
        // Calculate total or filtered count
        let count = 0;
        if (this.playerFilter) {
          // Show only selected player's count
          count = playerData[this.playerFilter] || 0;
        } else {
          // Show total across all players
          count = Object.values(playerData).reduce((sum, val) => sum + val, 0);
        }
        
        btn.textContent = count;
      });
    });
  },
  
  initTimeTracking() {
    if (!this.timeTrackingBox) return;
    
    this.timeTrackingBox.querySelectorAll(".time-btn").forEach(btn => {
      btn.disabled = true;
      btn.classList.add("disabled-readonly");
    });
  },
  
  renderGoalAreaStats() {
    const seasonMapRoot = document.getElementById("seasonMapPage");
    if (!seasonMapRoot) return;
    
    const goalBoxIds = ["goalGreenBox", "goalRedBox"];
    goalBoxIds.forEach(id => {
      const box = seasonMapRoot.querySelector(`#${id}`);
      if (!box) return;
      
      box.querySelectorAll(".goal-area-label").forEach(el => el.remove());
      
      // Filter markers based on player filter and visibility
      const markers = Array.from(box.querySelectorAll(".marker-dot")).filter(m => {
        if (this.playerFilter) {
          return m.dataset.player === this.playerFilter && m.style.display !== 'none';
        }
        return m.style.display !== 'none';
      });
      const total = markers.length;
      
      const counts = { tl: 0, tr: 0, bl: 0, bm: 0, br: 0 };
      markers.forEach(m => {
        const left = parseFloat(m.style.left) || 0;
        const top = parseFloat(m.style.top) || 0;
        if (top < 50) {
          if (left < 50) counts.tl++;
          else counts.tr++;
        } else {
          if (left < 33.3333) counts.bl++;
          else if (left < 66.6667) counts.bm++;
          else counts.br++;
        }
      });
      
      const areas = [
        { key: "tl", x: 25, y: 22 },
        { key: "tr", x: 75, y: 22 },
        { key: "bl", x: 16, y: 75 },
        { key: "bm", x: 50, y: 75 },
        { key: "br", x: 84, y: 75 }
      ];
      
      areas.forEach(a => {
        const cnt = counts[a.key] || 0;
        const pct = total ? Math.round((cnt / total) * 100) : 0;
        const div = document.createElement("div");
        div.className = "goal-area-label";
        div.style.cssText = `
          position: absolute;
          left: ${a.x}%;
          top: ${a.y}%;
          transform: translate(-50%,-50%);
          pointer-events: none;
          font-weight: 800;
          opacity: 0.45;
          font-size: 36px;
          color: #000000;
          text-shadow: 0 1px 2px rgba(255,255,255,0.06);
          line-height: 1;
          user-select: none;
          white-space: nowrap;
        `;
        div.textContent = `${cnt} (${pct}%)`;
        box.appendChild(div);
      });
    });
    
    // Unnamed Goal Boxes
    const unnamedGoalBoxes = Array.from(seasonMapRoot.querySelectorAll(".goal-img-box"))
      .filter(b => !["goalGreenBox", "goalRedBox"].includes(b.id));
    
    unnamedGoalBoxes.forEach(box => {
      box.querySelectorAll(".goal-area-label").forEach(el => el.remove());
      
      const markers = Array.from(box.querySelectorAll(".marker-dot"));
      const total = markers.length;
      const counts = { tl: 0, tr: 0, bl: 0, bm: 0, br: 0 };
      
      markers.forEach(m => {
        const left = parseFloat(m.style.left) || 0;
        const top = parseFloat(m.style.top) || 0;
        if (top < 50) {
          if (left < 50) counts.tl++;
          else counts.tr++;
        } else {
          if (left < 33.3333) counts.bl++;
          else if (left < 66.6667) counts.bm++;
          else counts.br++;
        }
      });
      
      const areas = [
        { key: "tl", x: 25, y: 22 },
        { key: "tr", x: 75, y: 22 },
        { key: "bl", x: 16, y: 75 },
        { key: "bm", x: 50, y: 75 },
        { key: "br", x: 84, y: 75 }
      ];
      
      areas.forEach(a => {
        const cnt = counts[a.key] || 0;
        const pct = total ? Math.round((cnt / total) * 100) : 0;
        const div = document.createElement("div");
        div.className = "goal-area-label";
        div.style.cssText = `
          position: absolute;
          left: ${a.x}%;
          top: ${a.y}%;
          transform: translate(-50%,-50%);
          pointer-events: none;
          font-weight: 800;
          opacity: 0.45;
          font-size: 36px;
          color: #000000;
          line-height: 1;
          user-select: none;
          white-space: nowrap;
        `;
        div.textContent = `${cnt} (${pct}%)`;
        box.appendChild(div);
      });
    });
  },
  
  reset() {
    if (!confirm("⚠️ Season Map zurücksetzen (Marker + Timeboxen)?")) return;
    
    document.querySelectorAll("#seasonMapPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#seasonMapPage .time-btn").forEach(btn => btn.textContent = "0");
    localStorage.removeItem("seasonMapMarkers");
    localStorage.removeItem("seasonMapTimeData");
    
    alert("Season Map zurückgesetzt.");
  }
};

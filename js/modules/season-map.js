// Season Map Modul – READ ONLY
// Shows only data exported from the Goal Map.
// NO new markers from clicks in Season Map.

App.seasonMap = {
  timeTrackingBox: null,
  playerFilter: null,
  
  init() {
    this.timeTrackingBox = document.getElementById("seasonMapTimeTrackingBox");
    this.playerFilter = null;
    
    // Buttons
    document.getElementById("exportSeasonMapBtn")?.addEventListener("click", () => {
      this.exportFromGoalMap();
    });
    
    document.getElementById("resetSeasonMapBtn")?.addEventListener("click", () => {
      this.reset();
    });
    
    // Time Tracking read-only
    this.initTimeTracking();
    
    // Player Filter
    this.initPlayerFilter();
  },
  
  // -----------------------------
  // Player Filter
  // -----------------------------
  initPlayerFilter() {
    const filterSelect = document.getElementById("seasonMapPlayerFilter");
    if (!filterSelect) return;
    
    filterSelect.innerHTML = '<option value="">All Players</option>';
    (App.data.selectedPlayers || []).forEach(player => {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = player.name;
      filterSelect.appendChild(option);
    });
    
    filterSelect.addEventListener("change", () => {
      this.playerFilter = filterSelect.value || null;
      this.applyPlayerFilter();
    });
    
    const savedFilter = localStorage.getItem("seasonMapPlayerFilter");
    if (savedFilter) {
      filterSelect.value = savedFilter;
      this.playerFilter = savedFilter;
    }
    
    // All Goalies button event listener
    document.getElementById("seasonMapGoalieFilter")?.addEventListener("click", () => {
      const goalies = App.data.selectedPlayers.filter(p => p.position === "G");
      const goalieNames = goalies.map(g => g.name);
      this.filterByGoalies(goalieNames);
    });
  },
  
  filterByGoalies(goalieNames) {
    // Clear the player filter dropdown
    const filterSelect = document.getElementById("seasonMapPlayerFilter");
    if (filterSelect) {
      filterSelect.value = "";
    }
    
    // Set filter to show only goalies
    this.playerFilter = null;
    localStorage.removeItem("seasonMapPlayerFilter");
    
    // Marker nach Spieler filtern
    const boxes = document.querySelectorAll(App.selectors.seasonMapBoxes);
    boxes.forEach(box => {
      box.querySelectorAll(".marker-dot").forEach(marker => {
        const playerName = marker.dataset.player;
        marker.style.display = goalieNames.includes(playerName) ? '' : 'none';
      });
    });
    
    // Update time tracking to show only goalie times
    this.applyGoalieTimeTrackingFilter(goalieNames);
    
    // Goal-Area-Stats neu zeichnen with goalie filter
    this.renderGoalAreaStats(goalieNames);
    
    console.log(`Season Map goalie filter applied: ${goalieNames.join(', ')}`);
  },
  
  applyGoalieTimeTrackingFilter(goalieNames) {
    let timeDataWithPlayers = {};
    try {
      timeDataWithPlayers =
        JSON.parse(localStorage.getItem("seasonMapTimeDataWithPlayers")) || {};
    } catch {
      timeDataWithPlayers = {};
    }
    
    // Create filtered time data for goalies only
    const filteredTimeData = {};
    Object.keys(timeDataWithPlayers).forEach(key => {
      const playerData = timeDataWithPlayers[key] || {};
      filteredTimeData[key] = {};
      goalieNames.forEach(goalieName => {
        if (playerData[goalieName]) {
          filteredTimeData[key][goalieName] = playerData[goalieName];
        }
      });
    });
    
    this.writeTimeTrackingToBox(filteredTimeData);
  },
  
  applyPlayerFilter() {
    if (this.playerFilter) {
      localStorage.setItem("seasonMapPlayerFilter", this.playerFilter);
    } else {
      localStorage.removeItem("seasonMapPlayerFilter");
    }
    
    // Marker nach Spieler filtern
    const boxes = document.querySelectorAll(App.selectors.seasonMapBoxes);
    boxes.forEach(box => {
      box.querySelectorAll(".marker-dot").forEach(marker => {
        if (this.playerFilter) {
          marker.style.display =
            marker.dataset.player === this.playerFilter ? '' : 'none';
        } else {
          marker.style.display = '';
        }
      });
    });
    
    // Zeitdaten aktualisieren
    let timeDataWithPlayers = {};
    try {
      timeDataWithPlayers =
        JSON.parse(localStorage.getItem("seasonMapTimeDataWithPlayers")) || {};
    } catch {
      timeDataWithPlayers = {};
    }
    this.writeTimeTrackingToBox(timeDataWithPlayers);
    
    // Goal-Area-Stats neu zeichnen
    this.renderGoalAreaStats();
    
    console.log(`Season Map player filter applied: ${this.playerFilter || 'All players'}`);
  },
  
  // -----------------------------
  // Render: Marker aus Storage laden (READ ONLY)
  // -----------------------------
  render() {
    const boxes = Array.from(document.querySelectorAll(App.selectors.seasonMapBoxes));
    boxes.forEach(box => box.querySelectorAll(".marker-dot").forEach(d => d.remove()));
    
    // CSS steuert die Bildgröße - kein JavaScript-Override mehr nötig
    // Stelle sicher dass die Boxen relativ positioniert sind für Marker
    boxes.forEach(box => {
      box.style.position = 'relative';
    });
    
    // Marker laden (werden NICHT neu gesetzt, nur angezeigt)
    const raw = localStorage.getItem("seasonMapMarkers");
    if (raw) {
      try {
        const allMarkers = JSON.parse(raw);
        allMarkers.forEach((markersForBox, idx) => {
          const box = boxes[idx];
          if (!box || !Array.isArray(markersForBox)) return;
          
          markersForBox.forEach(m => {
            App.markerHandler.createMarkerPercent(
              m.xPct,
              m.yPct,
              m.color || "#444444",
              box,
              false, // NICHT interaktiv (kein Entfernen per Klick)
              m.player || null
            );
          });
        });
      } catch (e) {
        console.warn("Season Map: Invalid seasonMapMarkers", e);
      }
    }
    
    // Zeitdaten laden
    let rawTimeWithPlayers = localStorage.getItem("seasonMapTimeDataWithPlayers");
    if (rawTimeWithPlayers) {
      try {
        const timeDataWithPlayers = JSON.parse(rawTimeWithPlayers);
        this.writeTimeTrackingToBox(timeDataWithPlayers);
      } catch (e) {
        console.warn("Season Map: Invalid seasonMapTimeDataWithPlayers", e);
      }
    }
    
    // Falls Filter aktiv: anwenden
    if (this.playerFilter) {
      this.applyPlayerFilter();
    } else {
      this.renderGoalAreaStats();
    }
  },
  
  // -----------------------------
  // Export aus Goal Map → Season Map
  // -----------------------------
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
    
    // Player-bezogene Zeitdaten übernehmen
    const timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
    console.log('[Season Map Export] timeDataWithPlayers:', timeDataWithPlayers);
    localStorage.setItem("seasonMapTimeDataWithPlayers", JSON.stringify(timeDataWithPlayers));
    
    // Flache Zeitdaten für Momentum-Graph aus timeDataWithPlayers berechnen
    // Format: { "p1": [button0, button1, ..., button7], "p2": [...], "p3": [...] }
    const momentumData = {};
    const periods = ['p1', 'p2', 'p3'];
    
    periods.forEach(periodNum => {
      const periodValues = [];
      // 8 Buttons pro Period (0-3 top-row/scored, 4-7 bottom-row/conceded)
      for (let btnIdx = 0; btnIdx < 8; btnIdx++) {
        const key = `${periodNum}_${btnIdx}`;
        const playerData = timeDataWithPlayers[key] || {};
        const total = Object.values(playerData).reduce((sum, val) => sum + Number(val || 0), 0);
        periodValues.push(total);
      }
      momentumData[periodNum] = periodValues;
    });
    
    console.log('[Season Map Export] momentumData:', momentumData);
    
    // Speichere für Momentum-Graph
    localStorage.setItem("seasonMapTimeData", JSON.stringify(momentumData));
    
    const keep = confirm("Game exported to Season Map. Keep data in Goal Map? (OK = Yes)");
    if (!keep) {
      document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
      document.querySelectorAll("#torbildPage .time-btn").forEach(btn => btn.textContent = "0");
      localStorage.removeItem("timeData");
      localStorage.removeItem("timeDataWithPlayers");
    }
    
    App.showPage("seasonMap");
    this.render();
    
    // Momentum-Grafik aktualisieren
    // Timeout benötigt, damit Page-Wechsel, Rendering und localStorage-Änderungen abgeschlossen sind
    if (typeof window.renderSeasonMomentumGraphic === 'function') {
      setTimeout(() => {
        window.renderSeasonMomentumGraphic();
      }, 100);
    }
  },
  
  // liest die Zeitdaten aus der Goal Map Box
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
  
  // schreibt Zeitdaten in die SeasonMap-Zeitbox
  writeTimeTrackingToBox(timeDataWithPlayers) {
    if (!this.timeTrackingBox || !timeDataWithPlayers) return;
    
    const periods = Array.from(this.timeTrackingBox.querySelectorAll(".period"));
    periods.forEach((period, pIdx) => {
      const periodKey = period.dataset.period || `sp${pIdx}`;
      period.querySelectorAll(".time-btn").forEach((btn, btnIdx) => {
        const buttonId = `${periodKey}_${btnIdx}`;
        const playerData = timeDataWithPlayers[buttonId] || {};
        
        let count = 0;
        if (this.playerFilter) {
          count = playerData[this.playerFilter] || 0;
        } else {
          count = Object.values(playerData).reduce((sum, val) => sum + (Number(val) || 0), 0);
        }
        
        btn.textContent = count;
      });
    });
  },
  
  // Zeitbuttons deaktivieren (read-only)
  initTimeTracking() {
    if (!this.timeTrackingBox) return;
    
    this.timeTrackingBox.querySelectorAll(".time-btn").forEach(btn => {
      btn.disabled = true;
      btn.classList.add("disabled-readonly");
    });
  },
  
  // Goal-Area-Statistik (Zonen im Tor)
  renderGoalAreaStats() {
    const seasonMapRoot = document.getElementById("seasonMapPage");
    if (!seasonMapRoot) return;
    
    const goalBoxIds = ["seasonGoalGreenBox", "seasonGoalRedBox"];
    goalBoxIds.forEach(id => {
      const box = document.getElementById(id);
      if (!box) return;
      
      box.querySelectorAll(".goal-area-label").forEach(el => el.remove());
      
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
  },
  
  // Reset NUR für Season Map Anzeige
  reset() {
    if (!confirm("⚠️ Season Map zurücksetzen (Marker + Timeboxen)?")) return;
    
    // Marker entfernen
    document.querySelectorAll("#seasonMapPage .marker-dot").forEach(d => d.remove());
    
    // Time Buttons zurücksetzen
    document.querySelectorAll("#seasonMapPage .time-btn").forEach(btn => btn.textContent = "0");
    
    // LocalStorage Daten löschen
    localStorage.removeItem("seasonMapMarkers");
    localStorage.removeItem("seasonMapTimeData");
    localStorage.removeItem("seasonMapTimeDataWithPlayers");
    
    // Momentum Container leeren (korrekter ID: seasonMapMomentum)
    const momentumContainer = document.getElementById("seasonMapMomentum");
    if (momentumContainer) {
      momentumContainer.innerHTML = "";
    }
    
    // Momentum-Grafik neu rendern mit leeren Daten
    // Timeout benötigt, damit localStorage-Änderungen vor dem Rendering propagiert werden
    if (typeof window.renderSeasonMomentumGraphic === 'function') {
      setTimeout(() => {
        window.renderSeasonMomentumGraphic();
      }, 50);
    }
    
    // Goal Area Labels zurücksetzen (falls vorhanden)
    document.querySelectorAll("#seasonMapPage .goal-area-label").forEach(label => {
      label.textContent = "0";
    });
    
    console.log('[Season Map] Reset completed - Momentum container cleared and re-rendered');
    
    alert("Season Map reset.");
  }
};

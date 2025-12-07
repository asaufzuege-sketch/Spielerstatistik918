// Season Map Modul – READ ONLY
// Zeigt nur die aus der Goal Map exportierten Daten an.
// KEINE neuen Marker durch Klicks in Season Map.

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
    
    filterSelect.innerHTML = '<option value="">Alle Spieler</option>';
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
    
    // Layout der Bilder an Goal Map anlehnen (optional)
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
      console.warn("Season Map: Layout copy failed:", e);
    }
    
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
    localStorage.setItem("seasonMapTimeDataWithPlayers", JSON.stringify(timeDataWithPlayers));
    
    // Flache Zeitdaten für Momentum-Graph
    const timeData = this.readTimeTrackingFromBox();
    localStorage.setItem("seasonMapTimeData", JSON.stringify(timeData));
    
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
    
    document.querySelectorAll("#seasonMapPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#seasonMapPage .time-btn").forEach(btn => btn.textContent = "0");
    
    localStorage.removeItem("seasonMapMarkers");
    localStorage.removeItem("seasonMapTimeData");
    localStorage.removeItem("seasonMapTimeDataWithPlayers");
    
    alert("Season Map zurückgesetzt.");
  }
};

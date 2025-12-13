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
    
    document.getElementById("exportSeasonMapPageBtn")?.addEventListener("click", () => {
      this.exportAsImage();
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
    // Only show field players (non-goalies) in the player filter dropdown
    (App.data.selectedPlayers || [])
      .filter(player => player.position !== 'G')
      .forEach(player => {
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
    
    // Goalie Filter Dropdown - populate with ALL goalies ever entered for this team's season
    const goalieFilterSelect = document.getElementById("seasonMapGoalieFilter");
    if (goalieFilterSelect) {
      // Collect all unique goalies from season data (markers and time data)
      const allGoalies = new Set();
      
      // Get goalies from markers
      const markersRaw = localStorage.getItem("seasonMapMarkers");
      if (markersRaw) {
        try {
          const allMarkers = JSON.parse(markersRaw);
          allMarkers.forEach(markersForBox => {
            if (Array.isArray(markersForBox)) {
              markersForBox.forEach(m => {
                if (m.player) {
                  allGoalies.add(m.player);
                }
              });
            }
          });
        } catch (e) {
          console.warn("Failed to parse seasonMapMarkers for goalie filter", e);
        }
      }
      
      // Get goalies from time data
      const timeDataRaw = localStorage.getItem("seasonMapTimeDataWithPlayers");
      if (timeDataRaw) {
        try {
          const timeData = JSON.parse(timeDataRaw);
          Object.values(timeData).forEach(playerData => {
            if (typeof playerData === 'object' && playerData !== null) {
              Object.keys(playerData).forEach(playerName => {
                allGoalies.add(playerName);
              });
            }
          });
        } catch (e) {
          console.warn("Failed to parse seasonMapTimeDataWithPlayers for goalie filter", e);
        }
      }
      
      // Filter to only include players that are goalies in current selection
      const currentGoalies = (App.data.selectedPlayers || [])
        .filter(p => p.position === "G")
        .map(g => g.name);
      
      // Use intersection: players that are in allGoalies AND are currently marked as goalies
      const seasonGoalies = Array.from(allGoalies).filter(name => currentGoalies.includes(name));
      
      // If no goalies found in season data, use currently selected goalies as fallback
      const goaliesToShow = seasonGoalies.length > 0 ? seasonGoalies : currentGoalies;
      
      goalieFilterSelect.innerHTML = '<option value="">All Goalies</option>';
      goaliesToShow.forEach(goalieName => {
        const option = document.createElement("option");
        option.value = goalieName;
        option.textContent = goalieName;
        goalieFilterSelect.appendChild(option);
      });
      
      goalieFilterSelect.addEventListener("change", () => {
        const selectedGoalie = goalieFilterSelect.value;
        if (selectedGoalie) {
          // Filter by single goalie
          this.filterByGoalies([selectedGoalie]);
        } else {
          // Show all goalies
          this.filterByGoalies(goaliesToShow);
        }
      });
    }
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
    // This function is called from Season Map page but needs to export Goal Map data
    // Call the Goal Map's export function which properly exports to Season Map
    if (App.goalMap && typeof App.goalMap.exportGoalMap === 'function') {
      App.goalMap.exportGoalMap();
      // Refresh the Season Map display to show newly exported data
      this.render();
      // Update momentum graphic if available
      if (typeof window.renderSeasonMomentumGraphic === 'function') {
        setTimeout(() => {
          window.renderSeasonMomentumGraphic();
        }, 100);
      }
    } else {
      alert("Goal Map module not available. Please ensure Goal Map is initialized.");
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
    
    // Make bottom-row buttons (conceded goals) interactive for goalie assignment
    this.timeTrackingBox.querySelectorAll(".time-btn").forEach((btn, index) => {
      const period = btn.closest(".period");
      const isBottomRow = btn.closest(".period-buttons")?.classList.contains("bottom-row");
      
      if (isBottomRow) {
        // Bottom-row buttons (conceded goals) are interactive
        btn.disabled = false;
        btn.classList.remove("disabled-readonly");
        
        // Add click handler for goalie selection
        btn.addEventListener("click", () => {
          this.handleConcededGoalClick(btn, period);
        });
      } else {
        // Top-row buttons (scored goals) remain read-only
        btn.disabled = true;
        btn.classList.add("disabled-readonly");
      }
    });
  },
  
  // Handle click on conceded goal time button (red zone)
  handleConcededGoalClick(btn, period) {
    // Get current goalies from selectedPlayers
    const goalies = (App.data.selectedPlayers || [])
      .filter(p => p && p.position === "G")
      .map(g => g.name);
    
    if (goalies.length === 0) {
      alert("No goalies available. Please select goalies in Player Selection first.");
      return;
    }
    
    // Show goalie selection modal
    this.showGoalieSelectionModal(goalies, (selectedGoalie) => {
      if (selectedGoalie) {
        // Get the key for this button
        const periodNum = period.dataset.period;
        const buttons = Array.from(period.querySelectorAll(".time-btn"));
        const btnIndex = buttons.indexOf(btn);
        const key = `${periodNum}_${btnIndex}`;
        
        // Update time data with goalie assignment
        let timeDataWithPlayers = {};
        try {
          timeDataWithPlayers = JSON.parse(localStorage.getItem("seasonMapTimeDataWithPlayers")) || {};
        } catch (e) {
          timeDataWithPlayers = {};
        }
        
        if (!timeDataWithPlayers[key]) {
          timeDataWithPlayers[key] = {};
        }
        
        // Increment the count for this goalie
        if (!timeDataWithPlayers[key][selectedGoalie]) {
          timeDataWithPlayers[key][selectedGoalie] = 0;
        }
        timeDataWithPlayers[key][selectedGoalie] += 1;
        
        // Save to localStorage
        localStorage.setItem("seasonMapTimeDataWithPlayers", JSON.stringify(timeDataWithPlayers));
        
        // Update button display
        const total = Object.values(timeDataWithPlayers[key])
          .reduce((sum, val) => sum + Number(val), 0);
        btn.textContent = total;
        
        console.log(`Conceded goal assigned to ${selectedGoalie} at ${key}`);
      }
    });
  },
  
  // Show goalie selection modal
  showGoalieSelectionModal(goalies, callback) {
    const modal = document.getElementById("goalieSelectionModal");
    const list = document.getElementById("goalieSelectionList");
    const confirmBtn = document.getElementById("goalieSelectionConfirm");
    const cancelBtn = document.getElementById("goalieSelectionCancel");
    
    if (!modal || !list || !confirmBtn || !cancelBtn) {
      console.error("Goalie selection modal elements not found");
      return;
    }
    
    // Clear previous content
    list.innerHTML = "";
    
    // Use event delegation instead of adding listeners to each label
    const handleListClick = (e) => {
      const label = e.target.closest('.goalie-option');
      if (label) {
        const radio = label.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          confirmBtn.disabled = false;
        }
      }
    };
    
    // Populate with goalies
    goalies.forEach(goalieName => {
      const label = document.createElement("label");
      label.className = "goalie-option";
      
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "goalieSelect";
      radio.value = goalieName;
      
      const span = document.createElement("span");
      span.textContent = goalieName;
      
      label.appendChild(radio);
      label.appendChild(span);
      list.appendChild(label);
    });
    
    // Add event listener to list container
    list.addEventListener("click", handleListClick);
    
    // Disable confirm button initially
    confirmBtn.disabled = true;
    
    // Show modal
    modal.style.display = "flex";
    
    // Handle confirm
    const handleConfirm = () => {
      const selected = list.querySelector('input[name="goalieSelect"]:checked');
      if (selected) {
        callback(selected.value);
      }
      cleanup();
    };
    
    // Handle cancel
    const handleCancel = () => {
      callback(null);
      cleanup();
    };
    
    // Handle background click
    const handleModalClick = (e) => {
      if (e.target === modal) {
        handleCancel();
      }
    };
    
    // Cleanup function
    const cleanup = () => {
      modal.style.display = "none";
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
      modal.removeEventListener("click", handleModalClick);
      list.removeEventListener("click", handleListClick);
    };
    
    // Attach event listeners
    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    modal.addEventListener("click", handleModalClick);
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
  },
  
  exportAsImage() {
    const seasonMapPage = document.getElementById("seasonMapPage");
    if (!seasonMapPage) {
      alert("Season Map page not found");
      return;
    }
    
    // Use html2canvas if available, otherwise use simple screenshot approach
    if (typeof html2canvas === 'function') {
      html2canvas(seasonMapPage, {
        backgroundColor: '#111111',
        scale: 2,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `season_map_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error('Export failed:', err);
        alert('Export failed. Please try again.');
      });
    } else {
      alert('Export feature requires html2canvas library. Please add it to your project.');
    }
  }
};

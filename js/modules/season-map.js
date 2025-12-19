// Season Map Modul – READ ONLY
// Shows only data exported from the Goal Map.
// NO new markers from clicks in Season Map.

App.seasonMap = {
  timeTrackingBox: null,
  playerFilter: null,
  // Vertical split threshold (Y-coordinate) that separates green zone (scored/upper) from red zone (conceded/lower)
  VERTICAL_SPLIT_THRESHOLD: 50,
  
  init() {
    this.timeTrackingBox = document.getElementById("seasonMapTimeTrackingBox");
    this.playerFilter = null;
    
    // Buttons
    document.getElementById("exportSeasonMapBtn")?.addEventListener("click", () => {
      this.exportFromGoalMap();
    });
    
    document.getElementById("exportSeasonMapPageBtn")?.addEventListener("click", () => {
      this.exportAsImage();
    });
    
    document.getElementById("resetSeasonMapBtn")?.addEventListener("click", () => {
      this.reset();
    });
    
    // Time Tracking read-only
    this.initTimeTracking();
    
    // Player Filter
    this.initPlayerFilter();
    
    // Add window resize listener to reposition markers (with cleanup)
    if (this.resizeListener) {
      window.removeEventListener("resize", this.resizeListener);
    }
    
    this.resizeListener = () => {
      // Debounce resize events
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        if (App.markerHandler && typeof App.markerHandler.repositionMarkers === 'function') {
          App.markerHandler.repositionMarkers();
        }
      }, 100);
    };
    window.addEventListener("resize", this.resizeListener);
  },
  
  // -----------------------------
  // Player Filter
  // -----------------------------
  initPlayerFilter() {
    const filterSelect = document.getElementById("seasonMapPlayerFilter");
    if (!filterSelect) return;
    
    filterSelect.innerHTML = '<option value="">All Players</option>';
    // Nur Spieler ohne Goalie-Position (G) in die Liste aufnehmen
    (App.data.selectedPlayers || [])
      .filter(player => player.position !== "G")
      .forEach(player => {
        const option = document.createElement("option");
        option.value = player.name;
        option.textContent = player.name;
        filterSelect.appendChild(option);
      });
    
    filterSelect.addEventListener("change", () => {
      this.playerFilter = filterSelect.value || null;
      this.applyPlayerFilter();
      
      if (this.playerFilter) {
        filterSelect.classList.add("active");
      } else {
        filterSelect.classList.remove("active");
      }
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
      const allMarkers = App.helpers.safeJSONParse("seasonMapMarkers", []);
      if (allMarkers) {
        allMarkers.forEach(markersForBox => {
          if (Array.isArray(markersForBox)) {
            markersForBox.forEach(m => {
              if (m.player) {
                allGoalies.add(m.player);
              }
            });
          }
        });
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
        
        if (selectedGoalie && selectedGoalie !== "") {
          localStorage.setItem("seasonMapActiveGoalie", selectedGoalie);
          goalieFilterSelect.classList.add("active");
          this.filterByGoalies([selectedGoalie]);
        } else {
          localStorage.removeItem("seasonMapActiveGoalie");
          goalieFilterSelect.classList.remove("active");
          const allGoalies = this.getAllGoaliesFromData();
          this.filterByGoalies(allGoalies);
        }
      });
    }
  },
  
  // Helper: Refresh momentum graphic if available
  refreshMomentumGraphic() {
    if (typeof window.renderSeasonMomentumGraphic === 'function') {
      window.renderSeasonMomentumGraphic();
    }
  },
  
  // Helper: Check if marker is in GREEN zone
  isGreenZoneMarker(marker, box) {
    if (box.id === 'seasonGoalGreenBox') return true;
    if (box.id === 'seasonGoalRedBox') return false;
    
    if (marker.dataset.zone) {
      return marker.dataset.zone === 'green';
    }
    
    const color = marker.style.backgroundColor || '';
    const isGreenColor = color.includes('0, 255, 102') || color.includes('00ff66');
    if (isGreenColor) return true;
    
    const isGreyColor = color.includes('68, 68, 68') || color.includes('444444');
    if (isGreyColor) {
      const yPctImage = parseFloat(marker.dataset.yPctImage);
      if (!isNaN(yPctImage) && yPctImage > 0) {
        return yPctImage < this.VERTICAL_SPLIT_THRESHOLD;
      }
      const top = parseFloat((marker.style.top || '0').replace('%', '')) || 0;
      return top < this.VERTICAL_SPLIT_THRESHOLD;
    }
    
    return false;
  },
  
  // Helper: Check if marker is in RED zone
  isRedZoneMarker(marker, box) {
    if (box.id === 'seasonGoalRedBox') return true;
    if (box.id === 'seasonGoalGreenBox') return false;
    
    if (marker.dataset.zone) {
      return marker.dataset.zone === 'red';
    }
    
    const color = marker.style.backgroundColor || '';
    const isRedColor = color.includes('255, 0, 0') || color.includes('ff0000');
    if (isRedColor) return true;
    
    const isGreyColor = color.includes('68, 68, 68') || color.includes('444444');
    if (isGreyColor) {
      const yPctImage = parseFloat(marker.dataset.yPctImage);
      if (!isNaN(yPctImage) && yPctImage > 0) {
        return yPctImage >= this.VERTICAL_SPLIT_THRESHOLD;
      }
      const top = parseFloat((marker.style.top || '0').replace('%', '')) || 0;
      return top >= this.VERTICAL_SPLIT_THRESHOLD;
    }
    
    return false;
  },
  
  // Get all unique goalies from season data
  getAllGoaliesFromData() {
    const allGoalies = new Set();
    
    const markersRaw = localStorage.getItem("seasonMapMarkers");
    if (markersRaw) {
      try {
        const allMarkers = JSON.parse(markersRaw);
        allMarkers.forEach(markersForBox => {
          if (Array.isArray(markersForBox)) {
            markersForBox.forEach(m => {
              if (m.player && m.zone === 'red') {
                allGoalies.add(m.player);
              }
            });
          }
        });
      } catch (e) {}
    }
    
    return Array.from(allGoalies);
  },
  
  filterByGoalies(goalieNames) {
    const allGoalies = this.getAllGoaliesFromData();
    const isAllGoaliesFilter = (goalieNames.length === allGoalies.length && 
                                 goalieNames.every(name => allGoalies.includes(name)));
    
    const boxes = document.querySelectorAll(App.selectors.seasonMapBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        const isRedMarker = this.isRedZoneMarker(marker, box);
        
        if (isRedMarker) {
          const playerName = marker.dataset.player;
          
          if (isAllGoaliesFilter) {
            marker.style.display = '';
          } else if (playerName && goalieNames.includes(playerName)) {
            marker.style.display = '';
          } else {
            marker.style.display = 'none';
          }
        }
      });
    });
    
    this.applyGoalieTimeTrackingFilter(goalieNames);
    
    // Update Momentum Graphic when goalie filter changes
    this.refreshMomentumGraphic();
  },
  
  applyGoalieTimeTrackingFilter(goalieNames) {
    if (!this.timeTrackingBox) return;
    
    const timeDataWithPlayers = App.helpers.safeJSONParse("seasonMapTimeDataWithPlayers", {});
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `sp${pIdx + 1}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        // Map season period to goal map period for data lookup
        const goalMapPeriod = periodNum.replace('sp', 'p');
        const key = `${goalMapPeriod}_${idx}`;
        const playerData = timeDataWithPlayers[key] || {};
        
        let displayVal = 0;
        goalieNames.forEach(goalieName => {
          displayVal += Number(playerData[goalieName]) || 0;
        });
        
        btn.textContent = displayVal;
      });
    });
  },
  
  applyPlayerFilter() {
    if (this.playerFilter) {
      localStorage.setItem("seasonMapPlayerFilter", this.playerFilter);
    } else {
      localStorage.removeItem("seasonMapPlayerFilter");
    }
    
    const boxes = document.querySelectorAll(App.selectors.seasonMapBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        const isGreenMarker = this.isGreenZoneMarker(marker, box);
        
        if (isGreenMarker) {
          if (this.playerFilter) {
            marker.style.display = (marker.dataset.player === this.playerFilter) ? '' : 'none';
          } else {
            marker.style.display = '';
          }
        }
      });
    });
    
    this.applyTimeTrackingFilter();
    
    // Update Momentum Graphic when player filter changes
    this.refreshMomentumGraphic();
  },
  
  // Apply player filter to time tracking
  applyTimeTrackingFilter() {
    if (!this.timeTrackingBox) return;
    
    const timeDataWithPlayers = App.helpers.safeJSONParse("seasonMapTimeDataWithPlayers", {});
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `sp${pIdx + 1}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        const goalMapPeriod = periodNum.replace('sp', 'p');
        const key = `${goalMapPeriod}_${idx}`;
        const playerData = timeDataWithPlayers[key] || {};
        
        let displayVal = 0;
        if (this.playerFilter) {
          displayVal = Number(playerData[this.playerFilter]) || 0;
        } else {
          displayVal = Object.values(playerData).reduce((sum, val) => sum + (Number(val) || 0), 0);
        }
        
        btn.textContent = displayVal;
      });
    });
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
    const allMarkers = App.helpers.safeJSONParse("seasonMapMarkers", null);
    if (allMarkers) {
      allMarkers.forEach((markersForBox, idx) => {
        const box = boxes[idx];
        if (!box || !Array.isArray(markersForBox)) return;
          
          markersForBox.forEach(m => {
            // Skip markers with invalid coordinates (0, 0, undefined, null, or very small values)
            if (!m.xPct || !m.yPct || 
                m.xPct < 0.1 || m.yPct < 0.1 ||
                isNaN(m.xPct) || isNaN(m.yPct)) {
              console.warn('[Season Map] Skipping marker with invalid coordinates:', m);
              return;
            }
            
            App.markerHandler.createMarkerPercent(
              m.xPct,
              m.yPct,
              m.color || "#444444",
              box,
              false, // NICHT interaktiv (kein Entfernen per Klick)
              m.player || null
            );
            
            // Restore zone attribute
            const dots = box.querySelectorAll(".marker-dot");
            const lastDot = dots[dots.length - 1];
            if (lastDot && m.zone) {
              lastDot.dataset.zone = m.zone;
            }
          });
        });
    }
    
    // Apply filters after restoring
    this.applyPlayerFilter();
    
    const savedGoalie = localStorage.getItem("seasonMapActiveGoalie");
    if (savedGoalie) {
      this.filterByGoalies([savedGoalie]);
    } else {
      const allGoalies = this.getAllGoaliesFromData();
      this.filterByGoalies(allGoalies);
    }
    
    // Reposition markers after rendering to ensure correct placement
    if (App.markerHandler && typeof App.markerHandler.repositionMarkers === 'function') {
      setTimeout(() => {
        App.markerHandler.repositionMarkers();
      }, 100);
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
    const timeDataWithPlayers = App.helpers.safeJSONParse("timeDataWithPlayers", {});
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
        let timeDataWithPlayers = App.helpers.safeJSONParse("seasonMapTimeDataWithPlayers", {});
        
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
      console.error("Season Map page not found");
      return;
    }
    
    if (typeof html2canvas === 'undefined') {
      console.error("html2canvas is not loaded");
      alert("Export library not loaded. Please refresh the page and try again.");
      return;
    }
    
    console.log("Generating Season Map image...");
    
    // Create export container
    const exportContainer = document.createElement('div');
    exportContainer.style.backgroundColor = '#ffffff';
    exportContainer.style.padding = '16px';
    
    // === NEU: Header mit Filter-Informationen ===
    const playerFilter = this.playerFilter || "All Players";
    const goalieSelect = document.getElementById("seasonMapGoalieFilter");
    const goalieFilter = (goalieSelect && goalieSelect.value) ? goalieSelect.value : "All Goalies";
    
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #000000;
      background: #ffffff;
      margin-bottom: 16px;
      text-align: center;
      border-bottom: 2px solid #333;
    `;
    header.textContent = `Player: ${playerFilter} | Goalie: ${goalieFilter}`;
    exportContainer.appendChild(header);
    
    // Clone the layout
    const layout = seasonMapPage.querySelector('.torbild-layout');
    if (layout) {
      const layoutClone = layout.cloneNode(true);
      exportContainer.appendChild(layoutClone);
    }
    
    // Clone the momentum container
    const momentumContainer = seasonMapPage.querySelector('#seasonMapMomentum');
    if (momentumContainer) {
      const momentumClone = momentumContainer.cloneNode(true);
      exportContainer.appendChild(momentumClone);
    }
    
    // Temporarily add to page
    exportContainer.style.position = 'absolute';
    exportContainer.style.left = '-9999px';
    document.body.appendChild(exportContainer);
    
    // === NEU: Bildboxen weiß hinterlegen für Export ===
    const boxes = exportContainer.querySelectorAll('.img-box, .goal-img-box, .field-box');
    boxes.forEach(box => {
      box.style.backgroundColor = '#ffffff';
      box.style.border = 'none';
      box.style.boxShadow = 'none';
    });
    
    const cleanupTempContainer = () => {
      if (document.body.contains(exportContainer)) {
        document.body.removeChild(exportContainer);
      }
    };
    
    html2canvas(exportContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      cleanupTempContainer();
      
      canvas.toBlob(blob => {
        if (!blob) {
          alert("Error: Failed to create image blob");
          return;
        }
        
        try {
          const date = App.helpers.getCurrentDateString();
          // Filename includes filter info - sanitize player name for filename
          const filterSuffix = playerFilter !== "All Players" 
            ? `_${playerFilter.replace(/[^a-zA-Z0-9]/g, '_')}` 
            : '';
          const filename = `season_map_${date}${filterSuffix}.png`;
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          
          console.log("Season Map export completed:", filename);
        } catch (error) {
          console.error("Error creating download:", error);
          alert("Error creating download: " + error.message);
        }
      }, 'image/png');
    }).catch(error => {
      cleanupTempContainer();
      console.error("Error capturing season map:", error);
      alert("Error capturing season map: " + error.message);
    });
  }
};

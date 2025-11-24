// Goal Map Modul
App.goalMap = {
  timeTrackingBox: null,
  playerFilter: null,
  
  init() {
    this.timeTrackingBox = document.getElementById("timeTrackingBox");
    
    // Event Listeners
    document.getElementById("exportGoalMapBtn")?.addEventListener("click", () => {
      this.exportGoalMap();
    });
    
    document.getElementById("resetGoalMapBtn")?.addEventListener("click", () => {
      this.reset();
    });
    
    // Initialize interactive boxes (Feld + Tore)
    this.initBoxes();
    
    // Initialize time tracking
    this.initTimeTracking();
    
    // Initialize player filter
    this.initPlayerFilter();
  },
  
  initBoxes() {
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    
    boxes.forEach((box) => {
      let pressTimer = null;
      let isLongPress = false;
      let startPos = { x: 0, y: 0 };
      
      // Helper um Koordinaten zu normalisieren (Touch vs Mouse)
      const getCoords = (e) => {
        if (e.type.includes('touch') && e.touches && e.touches[0]) {
          return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
      };

      // 1. Start Interaction (MouseDown / TouchStart)
      const handleStart = (e) => {
        isLongPress = false;
        const coords = getCoords(e);
        startPos = coords;
        
        // Timer für Long Press starten (Grauer Punkt)
        pressTimer = setTimeout(() => {
          isLongPress = true;
          
          // Punkt direkt setzen (Grau)
          this.placeMarker(box, startPos.x, startPos.y, '#808080');
          
          // Haptic Feedback falls verfügbar
          if (navigator.vibrate) navigator.vibrate(50);
        }, 600); // 600ms für Long Press
      };

      // 2. Move Interaction (Abbruch bei Bewegung/Scrollen)
      const handleMove = (e) => {
        if (!pressTimer) return;
        
        const coords = getCoords(e);
        // Wenn man sich mehr als 10px bewegt, ist es wohl Scrollen -> Timer abbrechen
        if (Math.abs(coords.x - startPos.x) > 10 || Math.abs(coords.y - startPos.y) > 10) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };

      // 3. End Interaction (MouseUp / TouchEnd)
      const handleEnd = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };

      // 4. Click Event (für kurzen Klick -> Grüner Punkt)
      const handleClick = (e) => {
        // Wenn es bereits als Long Press erkannt wurde, Klick ignorieren
        if (isLongPress) {
          e.preventDefault();
          e.stopPropagation();
          isLongPress = false;
          return;
        }
        
        // Kurzer Klick -> Grüner Punkt
        this.placeMarker(box, e.clientX, e.clientY, '#00ff00');
      };
      
      // Event Listeners registrieren
      box.addEventListener("mousedown", handleStart);
      box.addEventListener("touchstart", handleStart, { passive: true });
      
      box.addEventListener("mousemove", handleMove);
      box.addEventListener("touchmove", handleMove, { passive: true });
      
      box.addEventListener("mouseup", handleEnd);
      box.addEventListener("touchend", handleEnd, { passive: true });

      box.addEventListener("click", handleClick);
    });
  },

  // Helper Funktion um Marker zu platzieren
  placeMarker(box, clientX, clientY, color) {
    const img = box.querySelector('img');
    if (!img) return;
    
    const rect = App.markerHandler.computeRenderedImageRect(img);
    if (!rect) return;
    
    // Relativ zum gerenderten Bild berechnen
    const x = clientX - rect.x;
    const y = clientY - rect.y;
    const xPct = App.markerHandler.clampPct((x / rect.width) * 100);
    const yPct = App.markerHandler.clampPct((y / rect.height) * 100);
    
    const playerName = App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : null;
    
    // Marker erstellen
    App.markerHandler.createMarkerPercent(xPct, yPct, color, box, true, playerName);
    
    // Workflow Point hinzufügen, falls aktiv
    if (App.goalMapWorkflow.active) {
      App.addGoalMapPoint('field', xPct, yPct, color, box.id);
    }
  },
  
  initTimeTracking() {
    // 0. Grundcheck: Box vorhanden?
    this.timeTrackingBox = this.timeTrackingBox || document.getElementById("timeTrackingBox");
    if (!this.timeTrackingBox) {
      console.warn("[Goal Map] timeTrackingBox not found – no time tracking initialized");
      return;
    }
    
    console.log("[Goal Map] Initializing time tracking...");
    
    // 1. Bestehende Daten defensiv laden
    let timeDataWithPlayers = {};
    try {
      const stored = localStorage.getItem("timeDataWithPlayers");
      if (stored) {
        timeDataWithPlayers = JSON.parse(stored);
        if (typeof timeDataWithPlayers !== "object" || timeDataWithPlayers === null) {
          console.warn("[Goal Map] timeDataWithPlayers is not an object, resetting");
          timeDataWithPlayers = {};
        }
      }
    } catch (e) {
      console.warn("[Goal Map] Failed to load timeDataWithPlayers, resetting:", e);
      timeDataWithPlayers = {};
    }
    
    const periods = this.timeTrackingBox.querySelectorAll(".period");
    if (!periods.length) {
      console.warn("[Goal Map] No .period elements found inside timeTrackingBox");
    }
    
    periods.forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      if (!buttons.length) {
        console.warn(`[Goal Map] No .time-btn found in period ${periodNum}`);
      }
      
      buttons.forEach((btn, idx) => {
        const key = `${periodNum}_${idx}`;
        
        // Falls ein geklonter Button mit altem data-listener-attached da ist: entfernen
        if (!btn._goalMapClickBound && btn.hasAttribute('data-listener-attached') && !btn.onclick) {
          btn.removeAttribute('data-listener-attached');
        }
        
        // 2. INITIALEN WERT SETZEN
        const playerData = timeDataWithPlayers[key] || {};
        let total = 0;
        Object.values(playerData).forEach(count => total += Number(count) || 0);
        btn.textContent = total;
        
        // 3. EVENT LISTENER NUR EINMAL HINZUFÜGEN
        if (btn._goalMapClickBound) {
          return;
        }
        btn._goalMapClickBound = true;
        btn.setAttribute('data-listener-attached', 'true');
        
        // Gemeinsame Logik für +1 / -1
        const handleIncrement = (delta = 1) => {
          try {
            // Daten IMMER frisch laden
            let currentData = {};
            try {
              const stored = localStorage.getItem("timeDataWithPlayers");
              if (stored) {
                currentData = JSON.parse(stored);
                if (typeof currentData !== "object" || currentData === null) {
                  currentData = {};
                }
              }
            } catch (e2) {
              currentData = {};
            }
            
            if (!currentData[key]) currentData[key] = {};
            
            // SPIELER-LOGIK:
            const playerName =
              this.playerFilter || (App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : '_anonymous');
            
            if (!currentData[key][playerName]) currentData[key][playerName] = 0;
            
            const oldValue = Number(currentData[key][playerName]) || 0;
            const newValue = oldValue + delta;
            // Untergrenze 0
            currentData[key][playerName] = newValue < 0 ? 0 : newValue;
            
            // Speichern
            try {
              localStorage.setItem("timeDataWithPlayers", JSON.stringify(currentData));
            } catch (e3) {
              console.error("[Goal Map] Failed to save timeDataWithPlayers:", e3);
            }
            
            // Anzeige Update (Filter beachten)
            const currentPlayerMap = currentData[key] || {};
            let displayVal = 0;
            
            if (this.playerFilter) {
              displayVal = Number(currentPlayerMap[this.playerFilter]) || 0;
            } else {
              displayVal = Object.values(currentPlayerMap).reduce((a, b) => a + (Number(b) || 0), 0);
            }
            
            btn.textContent = displayVal;
            
            // Workflow Point nur bei +1 und aktivem Workflow
            if (delta > 0 && App.goalMapWorkflow && App.goalMapWorkflow.active) {
              try {
                const btnRect = btn.getBoundingClientRect();
                const boxRect = this.timeTrackingBox.getBoundingClientRect();
                const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
                const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
                
                App.addGoalMapPoint('time', xPct, yPct, '#888888', 'timeTrackingBox');
              } catch (e4) {
                console.warn("[Goal Map] Failed to add workflow point:", e4);
              }
            }
          } catch (err) {
            console.error("[Goal Map] handleIncrement failed for key", key, err);
          }
        };
        
        // Click / Double-Click Unterscheidung
        let clickTimeout = null;
        
        // Einzelklick: +1
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (clickTimeout) clearTimeout(clickTimeout);
          clickTimeout = setTimeout(() => {
            handleIncrement(+1);
            clickTimeout = null;
          }, 220);
        });
        
        // Doppelklick: -1
        btn.addEventListener("dblclick", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
          }
          handleIncrement(-1);
        });
      });
    });
    
    // Filter anwenden, falls einer aktiv ist
    if (this.playerFilter) {
      this.applyTimeTrackingFilter();
    }
  },
  
  initPlayerFilter() {
    const filterSelect = document.getElementById("goalMapPlayerFilter");
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
    const savedFilter = localStorage.getItem("goalMapPlayerFilter");
    if (savedFilter) {
      filterSelect.value = savedFilter;
      this.playerFilter = savedFilter;
      this.applyPlayerFilter();
    }
  },
  
  applyPlayerFilter() {
    // Save filter to localStorage
    if (this.playerFilter) {
      localStorage.setItem("goalMapPlayerFilter", this.playerFilter);
    } else {
      localStorage.removeItem("goalMapPlayerFilter");
    }
    
    // Filter markers in field and goal boxes
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        if (this.playerFilter) {
          marker.style.display = (marker.dataset.player === this.playerFilter) ? '' : 'none';
        } else {
          marker.style.display = '';
        }
      });
    });
    
    // Update timebox display with player filter
    this.applyTimeTrackingFilter();
    
    console.log(`Goal Map player filter applied: ${this.playerFilter || 'All players'}`);
  },
  
  applyTimeTrackingFilter() {
    if (!this.timeTrackingBox) return;
    
    let timeDataWithPlayers = {};
    try {
      timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
      if (typeof timeDataWithPlayers !== "object" || timeDataWithPlayers === null) {
        timeDataWithPlayers = {};
      }
    } catch {
      timeDataWithPlayers = {};
    }
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        const key = `${periodNum}_${idx}`;
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
  
  updateWorkflowIndicator() {
    const indicator = document.getElementById("goalMapWorkflowIndicator");
    if (!indicator) return;
    
    if (App.goalMapWorkflow.active) {
      const collected = App.goalMapWorkflow.collectedPoints.length;
      const required = App.goalMapWorkflow.requiredPoints;
      const eventType = App.goalMapWorkflow.eventType;
      const playerName = App.goalMapWorkflow.playerName;
      
      indicator.style.display = 'block';
      indicator.innerHTML = `
        <div class="workflow-info">
          <strong>${eventType.toUpperCase()} - ${playerName}</strong><br>
          Punkte: ${collected}/${required}
          ${eventType === 'goal' ? '<br>1. Feld, 2. Tor, 3. Zeit' : '<br>1. Feld klicken'}
        </div>
      `;
    } else {
      indicator.style.display = 'none';
    }
  },
  
  exportGoalMap() {
    // Export markers
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
    
    localStorage.setItem("goalMapMarkers", JSON.stringify(allMarkers));
    
    // Export time data
    const timeData = this.readTimeTrackingFromBox();
    localStorage.setItem("timeData", JSON.stringify(timeData));
    
    alert("Goal Map Daten exportiert!");
  },
  
  readTimeTrackingFromBox() {
    const result = {};
    if (!this.timeTrackingBox) return result;
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const key = period.dataset.period || (`p${pIdx}`);
      result[key] = [];
      period.querySelectorAll(".time-btn").forEach(btn => {
        result[key].push(Number(btn.textContent) || 0);
      });
    });
    return result;
  },
  
  reset() {
    if (!confirm("⚠️ Goal Map zurücksetzen (Marker + Timeboxen)?")) return;
    
    // Nur Goal-Map-Marker & -Timeboxen zurücksetzen
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#torbildPage .time-btn").forEach(btn => btn.textContent = "0");
    
    // Nur Goal-Map-Keys löschen
    localStorage.removeItem("timeData");
    localStorage.removeItem("timeDataWithPlayers");
    localStorage.removeItem("goalMapMarkers");
    
    alert("Goal Map zurückgesetzt.");
  }
};

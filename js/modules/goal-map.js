// Goal Map Modul – Verhalten wie in Repo 912, erweitert um Goal/Shot-Workflow + Spieler-Filter
// Ziel: Feldpunkte wie bisher (grün/rot), alle Torpunkte (Workflow + manuell) identisch dunkelgrau & scharf
App.goalMap = {
  // Vertical split threshold for workflow detection: Top half (y < 50%) = green, Bottom half (y >= 50%) = red
  VERTICAL_SPLIT_THRESHOLD: 50,
  timeTrackingBox: null,
  playerFilter: null,
  filterType: null, // 'player' or 'goalie' to distinguish filter types
  selectedGoalie: null, // Direct storage for active goalie
  
  init() {
    this.timeTrackingBox = document.getElementById("timeTrackingBox");
    
    // Event Listener für Export (speichert Marker + Timeboxen + Spielerinfos)
    document.getElementById("exportSeasonMapBtn")?.addEventListener("click", () => {
      this.exportGoalMap();
    });
    
    // Reset Button (nur Goal Map)
    document.getElementById("resetTorbildBtn")?.addEventListener("click", () => {
      this.reset();
    });
    
    // Marker Handler für Goal Map Boxen
    this.attachMarkerHandlers();
    
    // Time Tracking initialisieren (916‑Logik mit Spielerzuordnung)
    this.initTimeTracking();
    
    // Player Filter initialisieren
    this.initPlayerFilter();
  },
  
  attachMarkerHandlers() {
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    
    boxes.forEach(box => {
      // KRITISCH: Prüfen ob Event-Listener bereits angehängt wurden
      if (box.dataset.handlersAttached === 'true') {
        console.log('[Goal Map] Handlers already attached to', box.id);
        return; // Überspringe diese Box
      }
      box.dataset.handlersAttached = 'true'; // Markiere als initialisiert
      
      const img = box.querySelector("img");
      if (!img) return;
      
      box.style.position = box.style.position || "relative";
      App.markerHandler.createImageSampler(img);
      
      let mouseHoldTimer = null;
      let isLong = false;
      let lastMouseUp = 0;
      let lastTouchEnd = 0;
      
      const getPosFromEvent = (e) => {
        const boxRect = img.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches?.[0]?.clientX);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches?.[0]?.clientY);
        
        const xPctContainer = Math.max(0, Math.min(1, (clientX - boxRect.left) / (boxRect.width || 1))) * 100;
        const yPctContainer = Math.max(0, Math.min(1, (clientY - boxRect.top) / (boxRect.height || 1))) * 100;
        
        const rendered = App.markerHandler.computeRenderedImageRect(img);
        let insideImage = false;
        let xPctImage = 0;
        let yPctImage = 0;
        
        if (rendered) {
          insideImage = (
            clientX >= rendered.x &&
            clientX <= rendered.x + rendered.width && 
            clientY >= rendered.y &&
            clientY <= rendered.y + rendered.height
          );
          if (insideImage) {
            xPctImage = Math.max(0, Math.min(1, (clientX - rendered.x) / (rendered.width || 1))) * 100;
            yPctImage = Math.max(0, Math.min(1, (clientY - rendered.y) / (rendered.height || 1))) * 100;
          }
        } else {
          insideImage = true;
          xPctImage = xPctContainer;
          yPctImage = yPctContainer;
        }
        
        return { xPctContainer, yPctContainer, xPctImage, yPctImage, insideImage };
      };
      
      const placeMarker = (pos, long, forceGrey = false) => {
        let workflowActive = App.goalMapWorkflow?.active;
        let eventType = App.goalMapWorkflow?.eventType; // 'goal' | 'shot' | null
        let workflowType = App.goalMapWorkflow?.workflowType; // 'scored' | 'conceded' | null
        let isGoalWorkflow = workflowActive && eventType === 'goal';
        let isScoredWorkflow = workflowType === 'scored';
        let isConcededWorkflow = workflowType === 'conceded';
        const neutralGrey = "#444444";
        let currentStep = App.goalMapWorkflow?.collectedPoints?.length || 0;
        
        const pointPlayer =
          this.playerFilter ||
          (workflowActive ? App.goalMapWorkflow.playerName : null);
        
        const isGoalBox =
          box.classList.contains("goal-img-box") ||
          box.id === "goalGreenBox" ||
          box.id === "goalRedBox";
        
        const isFieldBox = box.classList.contains("field-box");
        
        if (!pos.insideImage) return;
        
        // Task 4 & 5: Handle clicks in red area with active goalie
        if (!workflowActive && isFieldBox) {
          const isBottomHalf = pos.yPctImage >= App.goalMap.VERTICAL_SPLIT_THRESHOLD;
          
          if (isBottomHalf) {
            // RED AREA - check for active goalie
            const activeGoalie = App.goalMap.getActiveGoalie();
            
            if (!activeGoalie) {
              // No goalie selected - show toast
              if (typeof App.showToast === 'function') {
                App.showToast('Please select a goalie first');
              } else {
                alert('Please select a goalie first');
              }
              return;
            }
            
            // Task 4: Simple click - auto-assign shot to goalie (no workflow)
            if (!long) {
              console.log(`[Goal Map] Simple click in red area - auto-assigning shot to ${activeGoalie.name}`);
              const color = "#ff0000"; // Red for conceded shot
              const markerType = 'conceded';
              
              App.markerHandler.createMarkerPercent(
                pos.xPctContainer,
                pos.yPctContainer,
                color,
                box,
                true,
                activeGoalie.name, // Auto-assign to active goalie
                null, // No workflow session
                markerType
              );
              return; // Done - no workflow needed
            }
            
            // Task 5: Long press - start RED workflow with goalie already assigned
            if (long) {
              console.log(`[Goal Map] Long press in red area - starting workflow with goalie ${activeGoalie.name}`);
              
              // Start RED workflow for conceded goal
              App.goalMapWorkflow.active = true;
              App.goalMapWorkflow.eventType = 'goal';
              App.goalMapWorkflow.workflowType = 'conceded';
              App.goalMapWorkflow.playerName = activeGoalie.name; // Task 5: Set goalie immediately
              App.goalMapWorkflow.requiredPoints = 3;
              App.goalMapWorkflow.pointTypes = ['field', 'goal', 'time'];
              App.goalMapWorkflow.collectedPoints = [];
              App.goalMapWorkflow.sessionId = 'wf_' + Date.now();
              
              // Update workflow indicator
              if (App.goalMap && typeof App.goalMap.updateWorkflowIndicator === 'function') {
                App.goalMap.updateWorkflowIndicator();
              }
              
              // Re-read variables after starting workflow
              workflowActive = true;
              eventType = 'goal';
              workflowType = 'conceded';
              isGoalWorkflow = true;
              isScoredWorkflow = false;
              isConcededWorkflow = true;
              currentStep = 0;
            }
          } else {
            // Top half (GREEN area) - Keep existing behavior
            if (long) {
              // Long press creates gray dot (manual goal without player assignment)
              console.log('[Goal Map] Long press in green area - creating gray marker (manual goal)');
              // Marker will be created in the field box section below
            } else {
              // Short click - just place colored point, don't start workflow
              // Will be handled below in field box section
            }
          }
        }
        
        // GREEN workflow restriction: Block if trying to access it without coming from Game Data
        if (workflowActive && isScoredWorkflow && isFieldBox && currentStep === 0) {
          // Allow first field click in green workflow (it's already started from Game Data)
        }
        
        // Im Goal-Workflow: Strenge Schritt-Kontrolle
        if (isGoalWorkflow) {
          const isGreenGoal = box.id === "goalGreenBox";
          const isRedGoal = box.id === "goalRedBox";
          
          // Schritt 0: NUR Spielfeld erlaubt
          if (currentStep === 0) {
            if (!isFieldBox) {
              console.log('[Goal Workflow] Step 1: Please click point in field first');
              return; // Blockiere alle anderen Bereiche
            }
            // Detect which half was clicked and set workflow type (if not already set)
            // This handles GREEN workflow started from Game Data page
            if (!workflowType) {
              // Vertical split: Top half (y < threshold) = scored (green), Bottom half (y >= threshold) = conceded (red)
              const isBottomHalf = pos.yPctImage >= App.goalMap.VERTICAL_SPLIT_THRESHOLD;
              App.goalMapWorkflow.workflowType = isBottomHalf ? 'conceded' : 'scored';
              console.log(`[Goal Workflow] Detected ${App.goalMapWorkflow.workflowType} workflow from vertical position`);
              // Update local variables
              workflowType = App.goalMapWorkflow.workflowType;
              isScoredWorkflow = workflowType === 'scored';
              isConcededWorkflow = workflowType === 'conceded';
            }
          }
          // Schritt 1: Nur entsprechendes Tor erlaubt
          else if (currentStep === 1) {
            if (isScoredWorkflow) {
              if (!isGreenGoal) {
                console.log('[Goal Workflow] GREEN workflow: Only green goal allowed');
                return;
              }
            }
            if (isConcededWorkflow) {
              if (!isRedGoal) {
                console.log('[Goal Workflow] RED workflow: Only red goal allowed');
                return;
              }
            }
          }
          // Schritt 2: Timebox (wird separat in initTimeTracking behandelt)
          else if (currentStep >= 2) {
            console.log('[Goal Workflow] Step 3: Please click time button');
            return; // Blockiere Spielfeld und Tor komplett
          }
        }
        
        // TOR-BOXEN: immer Graupunkt
        if (isGoalBox) {
          const sampler = App.markerHandler.createImageSampler(img);
          if (!sampler || !sampler.valid) return;
          
          if (box.id === "goalGreenBox") {
            if (!sampler.isWhiteAt(pos.xPctContainer, pos.yPctContainer, 220)) return;
          } else if (box.id === "goalRedBox") {
            if (!sampler.isNeutralWhiteAt(pos.xPctContainer, pos.yPctContainer, 235, 12)) return;
          } else {
            if (!sampler.isWhiteAt(pos.xPctContainer, pos.yPctContainer, 220)) return;
          }
          
          const color = neutralGrey;
          
          // Determine marker type based on goal box
          const markerType = (box.id === "goalGreenBox") ? 'scored' : 'conceded';
          
          const workflowSessionId = workflowActive ? App.goalMapWorkflow.sessionId : null;
          
          App.markerHandler.createMarkerPercent(
            pos.xPctContainer,
            pos.yPctContainer,
            color,
            box,
            true,
            pointPlayer,
            workflowSessionId,
            markerType
          );
          
          if (workflowActive) {
            App.addGoalMapPoint(
              "goal",
              pos.xPctContainer,
              pos.yPctContainer,
              color,
              box.id
            );
          }
          return;
        }
        
        // FELD-BOX: grün/rot oder grau je nach Kontext
        if (box.classList.contains("field-box")) {
          let color = null;
          let markerType = null;

          // Im Goal-Workflow ist der Feldpunkt immer grau (neutral)
          if (isGoalWorkflow) {
            color = neutralGrey;
            // Determine marker type based on workflow type
            markerType = workflowType; // 'scored' or 'conceded'
          }
          // Longpress oder erzwungen grau (z.B. Doppelklick)
          else if (long || forceGrey) {
            color = neutralGrey;
            // For long press, determine type based on vertical position
            markerType = pos.yPctImage >= App.goalMap.VERTICAL_SPLIT_THRESHOLD ? 'conceded' : 'scored';
          }
          // Normaler manueller Klick: oben grün, unten rot
          else {
            const isBottomHalf = pos.yPctImage >= App.goalMap.VERTICAL_SPLIT_THRESHOLD;
            color = isBottomHalf ? "#ff0000" : "#00ff66";
            markerType = isBottomHalf ? 'conceded' : 'scored';
          }
          
          const workflowSessionId = workflowActive ? App.goalMapWorkflow.sessionId : null;
          
          App.markerHandler.createMarkerPercent(
            pos.xPctContainer,
            pos.yPctContainer,
            color,
            box,
            true,
            pointPlayer,
            workflowSessionId,
            markerType
          );
          
          if (workflowActive) {
            App.addGoalMapPoint(
              "field",
              pos.xPctContainer,
              pos.yPctContainer,
              color,
              box.id
            );
          }
        }
      };
      
      // Mouse Events
      img.addEventListener("mousedown", (ev) => {
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          const pos = getPosFromEvent(ev);
          placeMarker(pos, true);
        }, App.markerHandler.LONG_MARK_MS);
      });
      
      img.addEventListener("mouseup", (ev) => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        const now = Date.now();
        const pos = getPosFromEvent(ev);
        
        if (now - lastMouseUp < 300) {
          placeMarker(pos, true, true);
          lastMouseUp = 0;
        } else {
          if (!isLong) placeMarker(pos, false);
          lastMouseUp = now;
        }
        isLong = false;
      });
      
      img.addEventListener("mouseleave", () => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        isLong = false;
      });
      
      // Touch Events
      img.addEventListener("touchstart", (ev) => {
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          const touch = ev.touches[0];
          const pos = getPosFromEvent(touch);
          placeMarker(pos, true);
          if (navigator.vibrate) navigator.vibrate(50);
        }, App.markerHandler.LONG_MARK_MS);
      }, { passive: true });
      
      img.addEventListener("touchend", (ev) => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        const now = Date.now();
        const touch = ev.changedTouches[0];
        const pos = getPosFromEvent(touch);
        
        if (now - lastTouchEnd < 300) {
          placeMarker(pos, true, true);
          lastTouchEnd = 0;
        } else {
          if (!isLong) placeMarker(pos, false);
          lastTouchEnd = now;
        }
        isLong = false;
      }, { passive: true });
      
      img.addEventListener("touchcancel", () => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        isLong = false;
      }, { passive: true });
    });
  },
  
  // Time Tracking mit Spielerzuordnung
  initTimeTracking() {
    if (!this.timeTrackingBox) return;
    
    let timeData = JSON.parse(localStorage.getItem("timeData")) || {};
    let timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        const key = `${periodNum}_${idx}`;
        
        // Display-Value berechnen
        let displayValue = 0;
        if (timeDataWithPlayers[key]) {
          displayValue = Object.values(timeDataWithPlayers[key])
            .reduce((sum, val) => sum + Number(val), 0);
        } else if (timeData[periodNum] && typeof timeData[periodNum][idx] !== "undefined") {
          displayValue = Number(timeData[periodNum][idx]);
        }
        
        // KRITISCH: Button komplett ersetzen um ALLE alten Listener zu entfernen
        const newBtn = btn.cloneNode(true);
        newBtn.textContent = displayValue;
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Jetzt neuen Listener auf den NEUEN Button
        let lastTap = 0;
        let clickTimeout = null;
        
        const updateValue = (delta) => {
          const playerName =
            this.playerFilter ||
            (App.goalMapWorkflow?.active ? App.goalMapWorkflow.playerName : '_anonymous');
          
          if (!timeDataWithPlayers[key]) timeDataWithPlayers[key] = {};
          if (!timeDataWithPlayers[key][playerName]) timeDataWithPlayers[key][playerName] = 0;
          
          const current = Number(timeDataWithPlayers[key][playerName]);
          const newVal = Math.max(0, current + delta);
          timeDataWithPlayers[key][playerName] = newVal;
          
          localStorage.setItem("timeDataWithPlayers", JSON.stringify(timeDataWithPlayers));
          
          let displayVal = 0;
          if (this.playerFilter) {
            displayVal = timeDataWithPlayers[key][this.playerFilter] || 0;
          } else {
            displayVal = Object.values(timeDataWithPlayers[key])
              .reduce((sum, val) => sum + Number(val), 0);
          }
          newBtn.textContent = displayVal;
          
          if (!timeData[periodNum]) timeData[periodNum] = {};
          timeData[periodNum][idx] = displayVal;
          localStorage.setItem("timeData", JSON.stringify(timeData));
          
          if (delta > 0 && App.goalMapWorkflow?.active) {
            const btnRect = newBtn.getBoundingClientRect();
            const boxRect = this.timeTrackingBox.getBoundingClientRect();
            const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
            const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
            
            App.addGoalMapPoint('time', xPct, yPct, '#444444', 'timeTrackingBox');
          }
        };
        
        newBtn.addEventListener("click", () => {
          // Im Goal-Workflow: Nur im Schritt 2 (nach Feld + Tor) erlaubt
          if (App.goalMapWorkflow?.active && App.goalMapWorkflow?.eventType === 'goal') {
            const currentStep = App.goalMapWorkflow.collectedPoints?.length || 0;
            
            if (currentStep !== 2) {
              console.log('[Goal Workflow] Timebox only after field and goal');
              return;
            }
            
            const workflowType = App.goalMapWorkflow?.workflowType;
            const isTopRow = newBtn.closest('.period-buttons')?.classList.contains('top-row');
            const isBottomRow = newBtn.closest('.period-buttons')?.classList.contains('bottom-row');
            
            // Green workflow (scored): only top row buttons allowed
            if (workflowType === 'scored' && !isTopRow) {
              console.log('[Goal Workflow] Only green time buttons (top row) allowed for scored goals');
              return;
            }
            
            // Red workflow (conceded): only bottom row buttons allowed
            if (workflowType === 'conceded' && !isBottomRow) {
              console.log('[Goal Workflow] Only red time buttons (bottom row) allowed for conceded goals');
              return;
            }
            
            // Task 5: If it's a conceded goal workflow, goalie is already assigned - no modal needed
            if (workflowType === 'conceded' && isBottomRow) {
              // Record the time button click
              const btnRect = newBtn.getBoundingClientRect();
              const boxRect = this.timeTrackingBox.getBoundingClientRect();
              const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
              const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
              
              App.addGoalMapPoint('time', xPct, yPct, '#444444', 'timeTrackingBox');
              
              // Task 5: Ensure goalie is set in workflow
              if (!App.goalMapWorkflow.playerName) {
                // Fallback: Try to get active goalie from all possible sources
                const activeGoalie = App.goalMap.getActiveGoalie();
                if (activeGoalie) {
                  console.log(`[Goal Workflow] Goalie not in workflow, but found via getActiveGoalie: ${activeGoalie.name}`);
                  App.goalMapWorkflow.playerName = activeGoalie.name;
                } else {
                  // Only show error if no goalie can be found from any source
                  console.error('[Goal Workflow] ERROR: No goalie found in workflow or via getActiveGoalie()');
                  alert('Error: No goalie assigned. Please select a goalie first.');
                  return;
                }
              }
              
              console.log(`[Goal Workflow] Time button clicked - goalie assigned: ${App.goalMapWorkflow.playerName}`);
              
              // Increment the time counter for the goalie
              updateValue(1);
              
              // Workflow is complete - no modal needed
              return;
            }
          }
          
          const now = Date.now();
          const diff = now - lastTap;
          if (diff < 300) {
            if (clickTimeout) {
              clearTimeout(clickTimeout);
              clickTimeout = null;
            }
            updateValue(-1);
            lastTap = 0;
          } else {
            clickTimeout = setTimeout(() => {
              updateValue(+1);
              clickTimeout = null;
            }, 300);
            lastTap = now;
          }
        });
      });
    });
    
    if (this.playerFilter) {
      this.applyTimeTrackingFilter();
    }
  },
  
  // Player Filter Dropdown
  initPlayerFilter() {
    const filterSelect = document.getElementById("goalMapPlayerFilter");
    const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
    if (!filterSelect) return;
    
    // ALWAYS repopulate dropdowns (player list may have changed)
    filterSelect.innerHTML = '<option value="">All Players</option>';
    // All Players - exclude goalies (only field players)
    const players = (App.data.selectedPlayers || []).filter(p => p && p.name && p.position !== 'G');
    players.forEach(player => {
      const option = document.createElement("option");
      option.value = player.name;
      option.textContent = player.name;
      filterSelect.appendChild(option);
    });
    
    // Repopulate goalie dropdown
    if (goalieFilterSelect) {
      goalieFilterSelect.innerHTML = '<option value="">Select a Goalie</option>'; // Task 2: Default text
      const goalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
      console.log('[Goal Map] Populating goalie dropdown with', goalies.length, 'goalies:', goalies);
      goalies.forEach(goalie => {
        const option = document.createElement("option");
        option.value = goalie.name;
        option.textContent = goalie.name;
        goalieFilterSelect.appendChild(option);
      });
    }
    
    // Attach event listeners only once
    if (filterSelect.dataset.listenersAttached !== 'true') {
      console.log('[Goal Map] Attaching filter event listeners');
      
      filterSelect.addEventListener("change", () => {
        // Clear goalie filter when player filter is used
        if (goalieFilterSelect) {
          goalieFilterSelect.value = "";
        }
        
        this.playerFilter = filterSelect.value || null;
        this.filterType = filterSelect.value ? 'player' : null;
        
        console.log('[Goal Map] Player filter changed:', this.playerFilter, 'filterType:', this.filterType);
        
        // Task 1: Save filter state
        if (this.playerFilter) {
          localStorage.setItem("goalMapPlayerFilter", this.playerFilter);
          localStorage.setItem("goalMapPlayerFilterType", "player");
        } else {
          localStorage.removeItem("goalMapPlayerFilter");
          localStorage.removeItem("goalMapPlayerFilterType");
        }
        
        this.applyPlayerFilter();
        this.updateGoalieNameOverlay(); // Task 6
      });
      
      if (goalieFilterSelect) {
        goalieFilterSelect.addEventListener("change", () => {
          // Clear player filter when goalie filter is used
          if (filterSelect) {
            filterSelect.value = "";
          }
          
          // Set goalie as player filter (same logic as player filter)
          this.playerFilter = goalieFilterSelect.value || null;
          this.filterType = goalieFilterSelect.value ? 'goalie' : null;
          
          // CRITICAL: Save goalie directly for robustness
          if (this.playerFilter) {
            const goalie = (App.data.selectedPlayers || []).find(p => 
              p.name === this.playerFilter && p.position === 'G'
            );
            if (goalie) {
              this.selectedGoalie = goalie;
              window.selectedGoalie = goalie; // Global backup
              localStorage.setItem('activeGoalie', JSON.stringify(goalie));
              console.log('[Goal Map] Goalie selected and saved directly:', goalie);
            }
          } else {
            this.selectedGoalie = null;
            window.selectedGoalie = null;
            localStorage.removeItem('activeGoalie');
          }
          
          console.log('[Goal Map] Goalie filter changed:', this.playerFilter, 'filterType:', this.filterType);
          
          // Task 2 & 3: Update button title and active state
          this.updateGoalieButtonTitle(this.playerFilter);
          
          // Task 1: Save filter state
          if (this.playerFilter) {
            localStorage.setItem("goalMapPlayerFilter", this.playerFilter);
            localStorage.setItem("goalMapPlayerFilterType", "goalie");
          } else {
            localStorage.removeItem("goalMapPlayerFilter");
            localStorage.removeItem("goalMapPlayerFilterType");
          }
          
          this.applyPlayerFilter();
          this.updateGoalieNameOverlay(); // Task 6
        });
      }
      
      // Mark that listeners have been attached
      filterSelect.dataset.listenersAttached = 'true';
      if (goalieFilterSelect) {
        goalieFilterSelect.dataset.listenersAttached = 'true';
      }
    } else {
      console.log('[Goal Map] Filter listeners already attached, skipping re-attachment');
    }
    
    // Restore saved filter state
    this.restoreFilterState();
  },
  
  // Separate method to restore filter state (can be called independently)
  restoreFilterState() {
    const filterSelect = document.getElementById("goalMapPlayerFilter");
    const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
    const savedPlayerFilter = localStorage.getItem("goalMapPlayerFilter");
    const savedPlayerFilterType = localStorage.getItem("goalMapPlayerFilterType");
    
    console.log('[Goal Map] Restoring filter state:', savedPlayerFilter, savedPlayerFilterType);
    
    // Task 1: Restore saved filter on page load
    if (savedPlayerFilter && savedPlayerFilterType) {
      if (savedPlayerFilterType === 'player') {
        if (filterSelect) {
          filterSelect.value = savedPlayerFilter;
        }
        this.playerFilter = savedPlayerFilter;
        this.filterType = 'player';
      } else if (savedPlayerFilterType === 'goalie') {
        if (goalieFilterSelect) {
          goalieFilterSelect.value = savedPlayerFilter;
        }
        this.playerFilter = savedPlayerFilter;
        this.filterType = 'goalie';
        
        // Restore selectedGoalie from multiple sources
        const savedGoalie = localStorage.getItem('activeGoalie');
        if (savedGoalie) {
          try {
            this.selectedGoalie = JSON.parse(savedGoalie);
            window.selectedGoalie = this.selectedGoalie;
          } catch (e) {
            console.error('[Goal Map] Failed to parse saved goalie:', e);
            // Clean up corrupted data
            localStorage.removeItem('activeGoalie');
          }
        }
        // If not in localStorage, reconstruct from player data
        if (!this.selectedGoalie) {
          const goalie = (App.data.selectedPlayers || []).find(p => 
            p.name === savedPlayerFilter && p.position === 'G'
          );
          if (goalie) {
            this.selectedGoalie = goalie;
            window.selectedGoalie = goalie;
            localStorage.setItem('activeGoalie', JSON.stringify(goalie));
          }
        }
        
        this.updateGoalieButtonTitle(savedPlayerFilter); // Task 2 & 3
      }
      this.applyPlayerFilter();
      this.updateGoalieNameOverlay(); // Task 6
      
      console.log('[Goal Map] Filter state restored - playerFilter:', this.playerFilter, 'filterType:', this.filterType);
    } else {
      console.log('[Goal Map] No saved filter state found');
    }
  },
  
  // Task 2: Update Goalie Button Title
  updateGoalieButtonTitle(goalieName) {
    const goalieBtn = document.getElementById('goalMapGoalieFilter');
    if (!goalieBtn) return;
    
    if (goalieName) {
      // Task 3: Add active class for neon pulse animation
      goalieBtn.classList.add('active');
    } else {
      // Task 3: Remove active class when no goalie selected
      goalieBtn.classList.remove('active');
    }
  },
  
  // Task 6: Show Goalie Name Overlay in Red Area
  showGoalieNameOverlay(goalieName) {
    // Remove old overlays
    const oldFieldOverlay = document.querySelector('.goalie-name-overlay');
    const oldGoalOverlay = document.querySelector('.goalie-name-goal');
    if (oldFieldOverlay) oldFieldOverlay.remove();
    if (oldGoalOverlay) oldGoalOverlay.remove();
    
    if (!goalieName) return;
    
    // Extract surname (last name)
    const lastName = goalieName.split(' ').pop().toUpperCase();
    
    // Overlay in red field area (middle of bottom half)
    const fieldOverlay = document.createElement('div');
    fieldOverlay.className = 'goalie-name-overlay';
    fieldOverlay.textContent = lastName;
    
    // Overlay in goal area
    const goalOverlay = document.createElement('div');
    goalOverlay.className = 'goalie-name-goal';
    goalOverlay.textContent = lastName;
    
    // Add to field box
    const fieldBox = document.getElementById('fieldBox');
    if (fieldBox) {
      fieldBox.appendChild(fieldOverlay);
    }
    
    // Add to red goal box
    const goalRedBox = document.getElementById('goalRedBox');
    if (goalRedBox) {
      goalRedBox.appendChild(goalOverlay);
    }
  },
  
  // Task 6: Update overlay when filter changes
  updateGoalieNameOverlay() {
    if (this.filterType === 'goalie' && this.playerFilter) {
      this.showGoalieNameOverlay(this.playerFilter);
    } else {
      this.showGoalieNameOverlay(null);
    }
  },
  
  // Task 4 & 5: Get currently active goalie
  getActiveGoalie() {
    console.log('[Goal Map] getActiveGoalie called - filterType:', this.filterType, 'playerFilter:', this.playerFilter);
    
    // Priority 1: Direct storage
    if (this.selectedGoalie) {
      console.log('[Goal Map] Active goalie found (direct storage):', this.selectedGoalie);
      return this.selectedGoalie;
    }
    
    // Priority 2: Window global backup
    if (window.selectedGoalie) {
      console.log('[Goal Map] Active goalie found (window.selectedGoalie):', window.selectedGoalie);
      this.selectedGoalie = window.selectedGoalie; // Sync back
      return window.selectedGoalie;
    }
    
    // Priority 3: Filter type check
    if (this.filterType === 'goalie' && this.playerFilter) {
      const goalie = (App.data.selectedPlayers || []).find(p => 
        p.name === this.playerFilter && p.position === 'G'
      );
      if (goalie) {
        console.log('[Goal Map] Active goalie found (filter):', goalie);
        this.selectedGoalie = goalie;
        window.selectedGoalie = goalie;
        return goalie;
      }
    }
    
    // Priority 4: localStorage activeGoalie
    const savedGoalie = localStorage.getItem('activeGoalie');
    if (savedGoalie) {
      try {
        const goalie = JSON.parse(savedGoalie);
        console.log('[Goal Map] Active goalie found (localStorage activeGoalie):', goalie);
        this.selectedGoalie = goalie;
        window.selectedGoalie = goalie;
        return goalie;
      } catch (e) {
        console.error('[Goal Map] Failed to parse activeGoalie from localStorage:', e);
        // Clean up corrupted data
        localStorage.removeItem('activeGoalie');
      }
    }
    
    // Priority 5: localStorage filter fallback
    const savedPlayerFilter = localStorage.getItem("goalMapPlayerFilter");
    const savedPlayerFilterType = localStorage.getItem("goalMapPlayerFilterType");
    
    if (savedPlayerFilterType === 'goalie' && savedPlayerFilter) {
      console.log('[Goal Map] Active goalie found in localStorage filter (fallback):', savedPlayerFilter);
      // Restore state
      this.playerFilter = savedPlayerFilter;
      this.filterType = 'goalie';
      const goalie = (App.data.selectedPlayers || []).find(p => 
        p.name === savedPlayerFilter && p.position === 'G'
      );
      if (goalie) {
        this.selectedGoalie = goalie;
        window.selectedGoalie = goalie;
        localStorage.setItem('activeGoalie', JSON.stringify(goalie));
        return goalie;
      }
      // If not found in player data, return basic object
      const basicGoalie = {
        name: savedPlayerFilter,
        position: 'G'
      };
      this.selectedGoalie = basicGoalie;
      window.selectedGoalie = basicGoalie;
      return basicGoalie;
    }
    
    // Priority 6: Dropdown button text fallback
    const goalieBtn = document.getElementById('goalMapGoalieFilter');
    if (goalieBtn && goalieBtn.value && goalieBtn.value !== '') {
      const btnValue = goalieBtn.value;
      console.log('[Goal Map] Active goalie found from dropdown value:', btnValue);
      const goalie = (App.data.selectedPlayers || []).find(p => 
        p.name === btnValue && p.position === 'G'
      );
      if (goalie) {
        this.selectedGoalie = goalie;
        window.selectedGoalie = goalie;
        localStorage.setItem('activeGoalie', JSON.stringify(goalie));
        return goalie;
      }
    }
    
    console.log('[Goal Map] No active goalie found');
    return null;
  },
  
  applyPlayerFilter() {
    if (this.playerFilter) {
      localStorage.setItem("goalMapPlayerFilter", this.playerFilter);
    } else {
      localStorage.removeItem("goalMapPlayerFilter");
    }
    
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        const markerType = marker.dataset.type; // 'scored' or 'conceded' or undefined (legacy)
        const markerPlayer = marker.dataset.player;
        
        if (this.playerFilter) {
          // Player filter: only affect 'scored' markers (green area)
          if (this.filterType === 'player') {
            // Only filter scored markers, leave conceded markers visible
            // Legacy markers without type are also filtered (backward compatibility)
            if (markerType === 'scored' || !markerType) {
              // Filter scored markers by player
              marker.style.display = (markerPlayer === this.playerFilter) ? '' : 'none';
            }
            // Leave 'conceded' markers unaffected
          }
          // Goalie filter: only affect 'conceded' markers (red area)
          else if (this.filterType === 'goalie') {
            if (markerType === 'conceded') {
              // Filter conceded markers by goalie
              marker.style.display = (markerPlayer === this.playerFilter) ? '' : 'none';
            }
            // Leave 'scored' markers and legacy markers unaffected
          }
        } else {
          // No filter active - show all markers
          marker.style.display = '';
        }
      });
    });
    
    this.applyTimeTrackingFilter();
  },
  
  applyTimeTrackingFilter() {
    if (!this.timeTrackingBox) return;
    
    let timeDataWithPlayers = {};
    try {
      timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
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
    const indicator = document.getElementById("workflowStatusIndicator");
    const textEl = document.getElementById("workflowStatusText");
    if (!indicator || !textEl) return;
    
    if (App.goalMapWorkflow?.active) {
      const collected = App.goalMapWorkflow.collectedPoints.length;
      const required = App.goalMapWorkflow.requiredPoints;
      const eventType = App.goalMapWorkflow.eventType;
      const playerName = App.goalMapWorkflow.playerName;
      const workflowType = App.goalMapWorkflow.workflowType;
      
      let workflowDesc = '';
      if (workflowType === 'scored') {
        workflowDesc = '🟢 SCORED';
        document.body.setAttribute('data-workflow', 'scored');
      } else if (workflowType === 'conceded') {
        workflowDesc = '🔴 CONCEDED';
        document.body.setAttribute('data-workflow', 'conceded');
      }
      
      indicator.style.display = 'block';
      
      // Build text safely using textContent to prevent XSS
      textEl.textContent = '';
      
      const strong = document.createElement('strong');
      const eventTypeText = eventType ? eventType.toUpperCase() : '';
      const workflowText = workflowDesc ? ' - ' + workflowDesc : '';
      const playerText = playerName ? ' - ' + playerName : '';
      strong.textContent = eventTypeText + workflowText + playerText;
      
      textEl.appendChild(strong);
      textEl.appendChild(document.createTextNode(' • '));
      textEl.appendChild(document.createTextNode(`Punkte: ${collected}/${required}`));
      
      if (eventType === 'goal') {
        textEl.appendChild(document.createTextNode(' • 1. Field, 2. Goal, 3. Time'));
      } else {
        textEl.appendChild(document.createTextNode(' • 1. Click field'));
      }
    } else {
      indicator.style.display = 'none';
      textEl.textContent = "";
      document.body.removeAttribute('data-workflow');
    }
  },
  
  exportGoalMap() {
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
    
    // Time Data für Momentum-Tabelle exportieren
    const timeDataWithPlayers = JSON.parse(localStorage.getItem("timeDataWithPlayers")) || {};
    console.log('[Goal Map Export] timeDataWithPlayers:', timeDataWithPlayers);
    
    // ACCUMULATION: Merge new markers with existing markers instead of overwriting
    const existingMarkersRaw = localStorage.getItem("seasonMapMarkers");
    let existingMarkers = [];
    if (existingMarkersRaw) {
      try {
        existingMarkers = JSON.parse(existingMarkersRaw);
      } catch (e) {
        console.warn("Failed to parse existing seasonMapMarkers", e);
        existingMarkers = [];
      }
    }
    
    // Merge: For each box, add new markers to existing markers
    const mergedMarkers = allMarkers.map((newMarkersForBox, idx) => {
      const existingMarkersForBox = existingMarkers[idx] || [];
      return [...existingMarkersForBox, ...newMarkersForBox];
    });
    
    // ACCUMULATION: Merge time data per player/goalie instead of overwriting
    const existingTimeDataRaw = localStorage.getItem("seasonMapTimeDataWithPlayers");
    let existingTimeData = {};
    if (existingTimeDataRaw) {
      try {
        existingTimeData = JSON.parse(existingTimeDataRaw);
      } catch (e) {
        console.warn("Failed to parse existing seasonMapTimeDataWithPlayers", e);
        existingTimeData = {};
      }
    }
    
    // Merge: For each key, add values per player
    const mergedTimeData = { ...existingTimeData };
    Object.keys(timeDataWithPlayers).forEach(key => {
      if (!mergedTimeData[key]) {
        mergedTimeData[key] = {};
      }
      const newPlayerData = timeDataWithPlayers[key] || {};
      Object.keys(newPlayerData).forEach(playerName => {
        const existingValue = Number(mergedTimeData[key][playerName] || 0);
        const newValue = Number(newPlayerData[playerName] || 0);
        mergedTimeData[key][playerName] = existingValue + newValue;
      });
    });
    
    // Flaches Format für Momentum-Tabelle erstellen
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
    
    console.log('[Goal Map Export] momentumData:', momentumData);
    
    // ACCUMULATION: Merge momentum data instead of overwriting
    // Get existing momentum data
    const existingMomentumRaw = localStorage.getItem("seasonMapTimeData");
    let existingMomentum = {};
    if (existingMomentumRaw) {
      try {
        existingMomentum = JSON.parse(existingMomentumRaw);
      } catch (e) {
        console.warn("Failed to parse existing seasonMapTimeData", e);
        existingMomentum = {};
      }
    }
    
    // Merge: For each period, add button values
    const mergedMomentum = {};
    ['p1', 'p2', 'p3'].forEach(period => {
      const existingPeriod = existingMomentum[period] || [];
      const newPeriod = momentumData[period] || [];
      mergedMomentum[period] = newPeriod.map((val, idx) => {
        return Number(existingPeriod[idx] || 0) + Number(val || 0);
      });
    });
    
    // Speichere in seasonMapTimeData für Momentum-Graph
    localStorage.setItem("seasonMapTimeData", JSON.stringify(mergedMomentum));
    
    // Speichere auch die detaillierten Spieler-Daten (accumulated)
    localStorage.setItem("seasonMapTimeDataWithPlayers", JSON.stringify(mergedTimeData));
    
    // Auch seasonMapMarkers setzen damit Season Map die Marker anzeigt (accumulated)
    localStorage.setItem("seasonMapMarkers", JSON.stringify(mergedMarkers));
    
    // Alte timeData ebenfalls aktualisieren
    const timeData = this.readTimeTrackingFromBox();
    localStorage.setItem("timeData", JSON.stringify(timeData));
    
    alert("Goal Map data exported!");
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
    
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#torbildPage .time-btn").forEach(b => b.textContent = "0");
    
    localStorage.removeItem("timeData");
    localStorage.removeItem("timeDataWithPlayers");
    localStorage.removeItem("goalMapMarkers");
    
    // KRITISCH: Buttons neu initialisieren damit Closures neue leere Daten haben!
    this.initTimeTracking();
    
    alert("Goal Map reset.");
  },
  
  // Show Goalie Selection Modal
  showGoalieSelectionModal(callback) {
    // Get goalies from currently selected players
    const goalies = App.data.selectedPlayers?.filter(p => p.position === "G") || [];
    
    if (goalies.length === 0) {
      alert("No goalies available. Please add goalies in Player Selection.");
      callback(null);
      return;
    }
    
    const list = document.getElementById("goalieSelectionList");
    if (!list) {
      console.error("goalieSelectionList element not found");
      callback(null);
      return;
    }
    
    // Clear existing content
    list.innerHTML = "";
    
    // Create goalie options - clickable divs instead of radio buttons
    goalies.forEach(g => {
      const option = document.createElement("div");
      option.className = "goalie-option";
      option.textContent = g.name; // textContent automatically escapes HTML
      
      // Direct click handler - select and close immediately
      option.addEventListener('click', () => {
        const modal = document.getElementById("goalieSelectionModal");
        if (modal) {
          modal.style.display = "none";
        }
        callback(g.name);
      });
      
      list.appendChild(option);
    });
    
    const modal = document.getElementById("goalieSelectionModal");
    if (!modal) {
      console.error("goalieSelectionModal element not found");
      callback(null);
      return;
    }
    
    modal.style.display = "flex";
    
    // Only cancel button handler needed
    const cancelBtn = document.getElementById("goalieSelectionCancel");
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.style.display = "none";
        callback(null);
      };
    }
  }
};

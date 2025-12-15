// Goal Map Modul – Verhalten wie in Repo 912, erweitert um Goal/Shot-Workflow + Spieler-Filter
// Ziel: Feldpunkte wie bisher (grün/rot), alle Torpunkte (Workflow + manuell) identisch dunkelgrau & scharf
App.goalMap = {
  timeTrackingBox: null,
  playerFilter: null,
  VERTICAL_SPLIT_THRESHOLD: 50, // y-percent threshold for green (top) vs red (bottom) half
  WORKFLOW_STEP_FIELD: 0, // First step: click in field
  WORKFLOW_STEP_GOAL: 1, // Second step: click in goal
  WORKFLOW_STEP_TIME: 2, // Third step: click time button
  AUTO_NAVIGATION_DELAY_MS: 300, // Delay before auto-navigating after workflow completion
  
  init() {
    this.timeTrackingBox = document.getElementById("timeTrackingBox");
    
    // Event Listener für Export (speichert Marker + Timeboxen + Spielerinfos)
    document.getElementById("exportGoalMapBtn")?.addEventListener("click", () => {
      this.exportGoalMap();
    });
    
    // Event Listener für Export Season Map (gleiche Funktion)
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
    
    // Restore saved filter and goalie state
    this.restoreFilterState();
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
        
        if (!pos.insideImage) return;
        
        // Im Goal-Workflow: Strenge Schritt-Kontrolle
        if (isGoalWorkflow) {
          const isFieldBox = box.classList.contains("field-box");
          const isGreenGoal = box.id === "goalGreenBox";
          const isRedGoal = box.id === "goalRedBox";
          
          // Schritt 0: NUR Spielfeld erlaubt
          if (currentStep === this.WORKFLOW_STEP_FIELD) {
            if (!isFieldBox) {
              console.log('[Goal Workflow] Step 1: Please click point in field first');
              return; // Blockiere alle anderen Bereiche
            }
            // Detect which half was clicked and set workflow type
            if (isFieldBox && !workflowType) {
              // Use VERTICAL_SPLIT_THRESHOLD: top half (y < 50%) = scored (green), bottom half (y >= 50%) = conceded (red)
              const isRedZone = pos.yPctImage >= this.VERTICAL_SPLIT_THRESHOLD;
              App.goalMapWorkflow.workflowType = isRedZone ? 'conceded' : 'scored';
              console.log(`[Goal Workflow] Detected ${App.goalMapWorkflow.workflowType} workflow at y=${pos.yPctImage}%`);
              
              // Update overlays
              if (App.goalMap && typeof App.goalMap.updatePlayerNameOverlay === 'function') {
                App.goalMap.updatePlayerNameOverlay();
              }
              
              // Goalie should already be set by startGoalMapWorkflow
              // No modal needed here, workflow was started with goalie pre-selected
            }
          }
          // Schritt 1: Nur entsprechendes Tor erlaubt
          else if (currentStep === this.WORKFLOW_STEP_GOAL) {
            if (isScoredWorkflow && !isGreenGoal) {
              console.log('[Goal Workflow] Step 2: Please click point in green goal');
              return;
            }
            if (isConcededWorkflow && !isRedGoal) {
              console.log('[Goal Workflow] Step 2: Please click point in red goal');
              return;
            }
          }
          // Schritt 2: Timebox (wird separat in initTimeTracking behandelt)
          else if (currentStep >= 2) {
            console.log('[Goal Workflow] Step 3: Please click time button');
            return; // Blockiere Spielfeld und Tor komplett
          }
        }
        
        // ROTES TOR: Nur mit Workflow und im richtigen Schritt
        if (box.id === "goalRedBox") {
          const activeGoalie = this.getActiveGoalie();
          if (!activeGoalie) {
            alert('Please select a goalie first');
            return;
          }
          // Ohne Workflow: Kein Punkt im roten Tor
          if (!workflowActive) {
            return;
          }
          // Im Workflow: Nur in Schritt 1 (nach Feldpunkt) und im conceded workflow erlaubt
          if (!isConcededWorkflow || currentStep !== this.WORKFLOW_STEP_GOAL) {
            return;
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
          
          App.markerHandler.createMarkerPercent(
            pos.xPctContainer,
            pos.yPctContainer,
            color,
            box,
            true,
            pointPlayer
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
          const isRedZone = pos.yPctImage >= this.VERTICAL_SPLIT_THRESHOLD;
          
          // ROTE ZONE - Goalie muss ausgewählt sein
          if (!workflowActive && isRedZone) {
            const activeGoalie = this.getActiveGoalie();
            
            if (!activeGoalie) {
              alert('Please select a goalie first');
              return;
            }
            
            // Kurzer Klick = Roter Punkt (Shot) - NUR bei kurzem Klick!
            if (!long) {
              App.markerHandler.createMarkerPercent(
                pos.xPctContainer, pos.yPctContainer,
                "#ff0000", box, true,
                activeGoalie.name, null, 'conceded'
              );
              
              // NEU: Sofort zurück zu Game Data nach Shot
              setTimeout(() => {
                if (typeof App.showPage === 'function') {
                  App.showPage('stats');
                }
              }, 300); // Kurze Verzögerung damit der User den Punkt sieht
              
              return; // WICHTIG: Hier beenden, kein Workflow
            }
            
            // Langer Klick = DIREKT Workflow starten mit grauem Punkt
            // KEIN roter Punkt hier!
            if (long) {
              App.goalMapWorkflow.active = true;
              App.goalMapWorkflow.eventType = 'goal';
              App.goalMapWorkflow.workflowType = 'conceded';
              App.goalMapWorkflow.playerName = activeGoalie.name;
              App.goalMapWorkflow.requiredPoints = 3;
              App.goalMapWorkflow.pointTypes = ['field', 'goal', 'time'];
              App.goalMapWorkflow.collectedPoints = [];
              App.goalMapWorkflow.sessionId = 'wf_' + Date.now();
              
              // Update workflow indicator
              if (App.goalMap && typeof App.goalMap.updateWorkflowIndicator === 'function') {
                App.goalMap.updateWorkflowIndicator();
              }
              
              // KRITISCH: Lokale Variablen aktualisieren damit der graue Punkt erstellt wird
              // Diese Variablen wurden am Anfang von placeMarker gelesen, müssen jetzt aktualisiert werden
              workflowActive = true;
              eventType = 'goal';
              workflowType = 'conceded';
              isGoalWorkflow = true;
              isScoredWorkflow = false;
              isConcededWorkflow = true;
              currentStep = 0;
              
              // GRAUER Punkt wird unten in der field-box Sektion erstellt
              // (weil isGoalWorkflow jetzt true ist, wird dort neutralGrey verwendet)
            }
          }
          
          let color = null;

          // Im Goal-Workflow ist der Feldpunkt immer grau (neutral)
          if (isGoalWorkflow) {
            color = neutralGrey;
          }
          // Longpress in green zone or erzwungen grau (z.B. Doppelklick)
          else if ((long && !isRedZone) || forceGrey) {
            color = neutralGrey;
          }
          // Normaler manueller Klick: oben grün, unten rot
          else {
            color = pos.yPctImage > this.VERTICAL_SPLIT_THRESHOLD ? "#ff0000" : "#00ff66";
          }
          
          App.markerHandler.createMarkerPercent(
            pos.xPctContainer,
            pos.yPctContainer,
            color,
            box,
            true,
            pointPlayer
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
  
  // Get currently active goalie - simple dropdown check only
  getActiveGoalie() {
    const goalieDropdown = document.getElementById('goalMapGoalieFilter');
    if (goalieDropdown && goalieDropdown.value) {
      return { name: goalieDropdown.value, position: 'G' };
    }
    return null;
  },
  
  // Update goalie button title to show neon-pulse when active
  updateGoalieButtonTitle() {
    const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
    if (!goalieFilterSelect) return;
    
    const hasActiveGoalie = this.getActiveGoalie() !== null;
    
    // Add/remove active class for neon-pulse animation
    if (hasActiveGoalie) {
      goalieFilterSelect.classList.add("active");
    } else {
      goalieFilterSelect.classList.remove("active");
    }
  },
  
  // Show goalie name overlay - TRANSPARENT text only, no background
  showGoalieNameOverlay(goalieName) {
    // Remove old overlays
    document.querySelectorAll('.goalie-name-overlay, .goalie-name-goal').forEach(el => el.remove());
    
    if (!goalieName) return;
    
    // Extract last name
    const lastName = goalieName.split(' ').pop().toUpperCase();
    
    // Overlay in field (red half) - TRANSPARENT
    const fieldBox = document.getElementById('fieldBox');
    if (fieldBox) {
      const overlay = document.createElement('div');
      overlay.className = 'goalie-name-overlay';
      overlay.textContent = lastName;
      overlay.style.cssText = `
        position: absolute;
        bottom: 25%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 3rem;
        font-weight: bold;
        color: rgba(255, 0, 0, 0.15);
        pointer-events: none;
        z-index: 5;
        text-transform: uppercase;
        letter-spacing: 0.2em;
      `;
      fieldBox.appendChild(overlay);
    }
    
    // Overlay in red goal - TRANSPARENT
    const goalRedBox = document.getElementById('goalRedBox');
    if (goalRedBox) {
      const overlay = document.createElement('div');
      overlay.className = 'goalie-name-goal';
      overlay.textContent = lastName;
      overlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.5rem;
        font-weight: bold;
        color: rgba(255, 0, 0, 0.2);
        pointer-events: none;
        z-index: 5;
        text-transform: uppercase;
      `;
      goalRedBox.appendChild(overlay);
    }
  },
  
  // Update goalie name overlay
  updateGoalieNameOverlay() {
    const goalie = this.getActiveGoalie();
    
    if (goalie && goalie.name) {
      // If goalie is set, show overlay
      this.showGoalieNameOverlay(goalie.name);
    } else {
      // If no goalie, remove overlays
      document.querySelectorAll('.goalie-name-overlay, .goalie-name-goal').forEach(el => el.remove());
    }
  },
  
  // Show player name overlay in GREEN field area during scored workflow
  showPlayerNameOverlay(playerName) {
    // Remove old player overlays
    document.querySelectorAll('.player-name-overlay').forEach(el => el.remove());
    
    if (!playerName) return;
    
    // Extract last name
    const lastName = playerName.split(' ').pop().toUpperCase();
    
    // Overlay in field (GREEN half - top) - TRANSPARENT
    const fieldBox = document.getElementById('fieldBox');
    if (fieldBox) {
      const overlay = document.createElement('div');
      overlay.className = 'player-name-overlay';
      overlay.textContent = lastName;
      overlay.style.cssText = `
        position: absolute;
        top: 25%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 3rem;
        font-weight: bold;
        color: rgba(0, 255, 102, 0.15);
        pointer-events: none;
        z-index: 5;
        text-transform: uppercase;
        letter-spacing: 0.2em;
      `;
      fieldBox.appendChild(overlay);
    }
  },
  
  // Update player name overlay based on workflow state
  updatePlayerNameOverlay() {
    const workflow = App.goalMapWorkflow;
    
    if (workflow?.active && workflow?.eventType === 'goal' && workflow?.workflowType === 'scored' && workflow?.playerName) {
      // If scored workflow is active, show player name
      this.showPlayerNameOverlay(workflow.playerName);
    } else {
      // If no scored workflow, remove overlays
      document.querySelectorAll('.player-name-overlay').forEach(el => el.remove());
    }
  },
  
  // Restore filter state from localStorage
  restoreFilterState() {
    const savedFilter = localStorage.getItem("goalMapPlayerFilter");
    if (savedFilter) {
      this.playerFilter = savedFilter;
      const filterSelect = document.getElementById("goalMapPlayerFilter");
      if (filterSelect) {
        filterSelect.value = savedFilter;
      }
      this.applyPlayerFilter();
    }
    
    const savedGoalie = localStorage.getItem("goalMapActiveGoalie");
    if (savedGoalie) {
      const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
      if (goalieFilterSelect) {
        goalieFilterSelect.value = savedGoalie;
        
        // Also apply goalie filtering
        const goalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
        const goalieNames = goalies.map(g => g.name);
        if (goalieNames.includes(savedGoalie)) {
          this.filterByGoalies([savedGoalie]);
        }
      }
    }
    
    this.updateGoalieButtonTitle();
    this.updateGoalieNameOverlay();
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
          // Am Anfang des click handlers - ROTE BUTTONS blockieren
          const isBottomRow = newBtn.closest('.period-buttons')?.classList.contains('bottom-row');
          if (isBottomRow) {
            const activeGoalie = App.goalMap.getActiveGoalie();
            if (!activeGoalie) {
              alert('Please select a goalie first');
              return;
            }
            // Ohne Workflow oder falscher Schritt: blockieren
            if (!App.goalMapWorkflow?.active || 
                App.goalMapWorkflow?.workflowType !== 'conceded' ||
                (App.goalMapWorkflow.collectedPoints?.length || 0) !== App.goalMap.WORKFLOW_STEP_TIME) {
              return;
            }
          }
          
          // Im Goal-Workflow: Nur im Schritt 2 (nach Feld + Tor) erlaubt
          if (App.goalMapWorkflow?.active && App.goalMapWorkflow?.eventType === 'goal') {
            const currentStep = App.goalMapWorkflow.collectedPoints?.length || 0;
            
            if (currentStep !== App.goalMap.WORKFLOW_STEP_TIME) {
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
            
            // Record time button click by calling updateValue
            updateValue(1);
            
            // Automatisch zu Game Data (Stats Page) zurückkehren nach grünem Workflow
            if (workflowType === 'scored') {
              setTimeout(() => {
                if (typeof App.showPage === 'function') {
                  App.showPage('stats');
                } else {
                  // Fallback: Direkter Seitenwechsel
                  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
                  const statsPage = document.getElementById('statsPage');
                  if (statsPage) statsPage.style.display = '';
                }
              }, App.goalMap.AUTO_NAVIGATION_DELAY_MS); // Kurze Verzögerung damit der User den +1 sieht
            }
            
            return;
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
    if (!filterSelect) return;
    
    filterSelect.innerHTML = '<option value="">All Players</option>';
    // Nur Spieler ohne Goalie-Position (G) in die Liste aufnehmen
    (App.data.selectedPlayers || [])
      .filter(player => player.position !== "G" && !player.isGoalie)
      .forEach(player => {
        const option = document.createElement("option");
        option.value = player.name;
        option.textContent = player.name;
        filterSelect.appendChild(option);
      });
    
    filterSelect.addEventListener("change", () => {
      this.playerFilter = filterSelect.value || null;
      this.applyPlayerFilter();
      
      // NEU: Pulsieren aktivieren/deaktivieren
      if (this.playerFilter) {
        filterSelect.classList.add("active");
      } else {
        filterSelect.classList.remove("active");
      }
    });
    
    const savedFilter = localStorage.getItem("goalMapPlayerFilter");
    if (savedFilter) {
      filterSelect.value = savedFilter;
      this.playerFilter = savedFilter;
      this.applyPlayerFilter();
      filterSelect.classList.add("active");  // NEU: Pulsieren beim Laden
    }
    
    // Goalie Filter Dropdown - populate with currently selected goalies
    const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
    if (goalieFilterSelect) {
      goalieFilterSelect.innerHTML = '<option value="">All Goalies</option>';
      const goalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
      goalies.forEach(goalie => {
        const option = document.createElement("option");
        option.value = goalie.name;
        option.textContent = goalie.name;
        goalieFilterSelect.appendChild(option);
      });
      
      goalieFilterSelect.addEventListener("change", () => {
        const selectedGoalie = goalieFilterSelect.value;
        
        // Save to localStorage
        if (selectedGoalie) {
          localStorage.setItem("goalMapActiveGoalie", selectedGoalie);
        } else {
          localStorage.removeItem("goalMapActiveGoalie");
        }
        
        // Update UI to show neon-pulse and overlay
        this.updateGoalieButtonTitle();
        this.updateGoalieNameOverlay();
        
        // Also filter display
        if (selectedGoalie) {
          // Filter by single goalie
          this.filterByGoalies([selectedGoalie]);
        } else {
          // Show all goalies
          const goalieNames = goalies.map(g => g.name);
          this.filterByGoalies(goalieNames);
        }
      });
    }
  },
  
  filterByGoalies(goalieNames) {
    // Clear the player filter dropdown
    const filterSelect = document.getElementById("goalMapPlayerFilter");
    if (filterSelect) {
      filterSelect.value = "";
    }
    
    // Set filter to show only goalies
    this.playerFilter = null;
    localStorage.removeItem("goalMapPlayerFilter");
    
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        const playerName = marker.dataset.player;
        marker.style.display = goalieNames.includes(playerName) ? '' : 'none';
      });
    });
    
    // Update time tracking to show only goalie times
    this.applyGoalieTimeTrackingFilter(goalieNames);
  },
  
  applyGoalieTimeTrackingFilter(goalieNames) {
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
        
        // Sum up time for all goalies
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
      localStorage.setItem("goalMapPlayerFilter", this.playerFilter);
    } else {
      localStorage.removeItem("goalMapPlayerFilter");
    }
    
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
      } else if (workflowType === 'conceded') {
        workflowDesc = '🔴 CONCEDED';
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
    }
    
    // Update player name overlay for scored workflow
    this.updatePlayerNameOverlay();
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
    
    // ACCUMULATE markers to Season Map (merge instead of overwrite)
    const existingSeasonMarkers = JSON.parse(localStorage.getItem("seasonMapMarkers")) || [];
    const mergedMarkers = [];
    
    // Merge each box's markers
    for (let i = 0; i < Math.max(allMarkers.length, existingSeasonMarkers.length); i++) {
      const currentMarkers = allMarkers[i] || [];
      const existingMarkers = existingSeasonMarkers[i] || [];
      mergedMarkers[i] = [...existingMarkers, ...currentMarkers];
    }
    
    // ACCUMULATE time data (merge player times)
    const existingTimeData = JSON.parse(localStorage.getItem("seasonMapTimeDataWithPlayers")) || {};
    const mergedTimeData = { ...existingTimeData };
    
    // Merge time data for each button
    Object.keys(timeDataWithPlayers).forEach(key => {
      if (!mergedTimeData[key]) {
        mergedTimeData[key] = {};
      }
      const currentPlayers = timeDataWithPlayers[key];
      Object.keys(currentPlayers).forEach(playerName => {
        const currentValue = Number(currentPlayers[playerName]) || 0;
        const existingValue = Number(mergedTimeData[key][playerName]) || 0;
        mergedTimeData[key][playerName] = existingValue + currentValue;
      });
    });
    
    // Flaches Format für Momentum-Tabelle erstellen (from merged data)
    const momentumData = {};
    const periods = ['p1', 'p2', 'p3'];
    
    periods.forEach(periodNum => {
      const periodValues = [];
      // 8 Buttons pro Period (0-3 top-row/scored, 4-7 bottom-row/conceded)
      for (let btnIdx = 0; btnIdx < 8; btnIdx++) {
        const key = `${periodNum}_${btnIdx}`;
        const playerData = mergedTimeData[key] || {};
        const total = Object.values(playerData).reduce((sum, val) => sum + Number(val || 0), 0);
        periodValues.push(total);
      }
      momentumData[periodNum] = periodValues;
    });
    
    console.log('[Goal Map Export] momentumData:', momentumData);
    console.log('[Goal Map Export] Merged markers count:', mergedMarkers.map(m => m.length));
    
    // Speichere merged/accumulated data
    localStorage.setItem("seasonMapMarkers", JSON.stringify(mergedMarkers));
    localStorage.setItem("seasonMapTimeDataWithPlayers", JSON.stringify(mergedTimeData));
    localStorage.setItem("seasonMapTimeData", JSON.stringify(momentumData));
    
    // Alte timeData ebenfalls aktualisieren
    const timeData = this.readTimeTrackingFromBox();
    localStorage.setItem("timeData", JSON.stringify(timeData));
    
    alert("Goal Map data exported to Season Map!");
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
  }
};

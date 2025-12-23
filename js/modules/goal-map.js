// Goal Map Modul – Verhalten wie in Repo 912, erweitert um Goal/Shot-Workflow + Spieler-Filter
// Ziel: Feldpunkte wie bisher (grün/rot), alle Torpunkte (Workflow + manuell) identisch dunkelgrau & scharf
App.goalMap = {
  timeTrackingBox: null,
  playerFilter: null,
  timeTrackingInitialized: false, // Flag to prevent duplicate initialization
  VERTICAL_SPLIT_THRESHOLD: 50, // y-percent threshold for green (top) vs red (bottom) half
  WORKFLOW_STEP_FIELD: 0, // First step: click in field
  WORKFLOW_STEP_GOAL: 1, // Second step: click in goal
  WORKFLOW_STEP_TIME: 2, // Third step: click time button
  AUTO_NAVIGATION_DELAY_MS: 300, // Delay before auto-navigating after workflow completion
  MARKER_POSITION_TOLERANCE: 0.01, // Tolerance for marker position comparison (absolute percentage points)
  
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
    
    // Restore markers from localStorage
    this.restoreMarkers();
    
    // Apply both filters independently at the end
    this.applyPlayerFilter();  // Filter green zone
    
    // Apply goalie filter for red zone
    const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
    const savedGoalie = localStorage.getItem("goalMapActiveGoalie");
    if (savedGoalie && goalieFilterSelect && goalieFilterSelect.value === savedGoalie) {
      // Specific goalie is selected, filter red zone
      this.filterByGoalies([savedGoalie]);
    } else if (goalieFilterSelect) {
      // "All Goalies" or no goalie - show all red zone markers
      const allGoalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
      const goalieNames = allGoalies.map(g => g.name);
      this.filterByGoalies(goalieNames);
    }
    
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
    
    // Initial repositioning after markers are restored
    if (App.markerHandler && typeof App.markerHandler.repositionMarkers === 'function') {
      // Small delay to ensure images are loaded
      setTimeout(() => {
        App.markerHandler.repositionMarkers();
      }, 100);
    }
  },
  
  attachMarkerHandlers() {
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    
    boxes.forEach(box => {
      // KRITISCH: Prüfen ob Event-Listener bereits angehängt wurden
      if (box.dataset.handlersAttached === 'true') {
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
      let lastTouchTime = 0;
      let lastMarkerPlacedTime = 0;  // NEU: Flag für letzten Marker
      
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
          // BUGFIX: Add small tolerance (2px) for edge clicks to handle rounding/precision issues
          const tolerance = 2;
          insideImage = (
            clientX >= rendered.x - tolerance &&
            clientX <= rendered.x + rendered.width + tolerance && 
            clientY >= rendered.y - tolerance &&
            clientY <= rendered.y + rendered.height + tolerance
          );
          if (insideImage) {
            xPctImage = Math.max(0, Math.min(100, ((clientX - rendered.x) / (rendered.width || 1)) * 100));
            yPctImage = Math.max(0, Math.min(100, ((clientY - rendered.y) / (rendered.height || 1)) * 100));
          }
        } else {
          insideImage = true;
          xPctImage = xPctContainer;
          yPctImage = yPctContainer;
        }
        
        return { xPctContainer, yPctContainer, xPctImage, yPctImage, insideImage };
      };
      
      // Helper function to set zone attribute on last created marker
      const setMarkerZone = (box, zone) => {
        const markers = box.querySelectorAll(".marker-dot");
        const lastMarker = markers[markers.length - 1];
        if (lastMarker) {
          lastMarker.dataset.zone = zone;
        }
      };
      
      const placeMarker = (pos, long, forceGrey = false) => {
        let workflowActive = App.goalMapWorkflow?.active;
        let eventType = App.goalMapWorkflow?.eventType; // 'goal' | 'shot' | null
        let workflowType = App.goalMapWorkflow?.workflowType; // 'scored' | 'conceded' | null
        let isGoalWorkflow = workflowActive && eventType === 'goal';
        let isShotWorkflow = workflowActive && eventType === 'shot';
        let isScoredWorkflow = workflowType === 'scored';
        let isConcededWorkflow = workflowType === 'conceded';
        const neutralGrey = "#444444";
        let currentStep = App.goalMapWorkflow?.collectedPoints?.length || 0;
        
        let pointPlayer = workflowActive
          ? App.goalMapWorkflow.playerName
          : (this.playerFilter || null);
        
        const isGoalBox =
          box.classList.contains("goal-img-box") ||
          box.id === "goalGreenBox" ||
          box.id === "goalRedBox";
        
        if (!pos.insideImage) return;
        
        // Shot Workflow: Only allow clicks in field box (will be handled below)
        if (isShotWorkflow) {
          const isFieldBox = box.classList.contains("field-box");
          if (!isFieldBox) {
            console.log('[Shot Workflow] Please click in the field (green zone)');
            return;
          }
        }
        
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
            if (!sampler.isWhiteAt(pos.xPctImage, pos.yPctImage, 180)) return;  // War: 220
          } else if (box.id === "goalRedBox") {
            if (!sampler.isNeutralWhiteAt(pos.xPctImage, pos.yPctImage, 200, 30)) return;  // War: 235, 12
          } else {
            if (!sampler.isWhiteAt(pos.xPctImage, pos.yPctImage, 180)) return;  // War: 220
          }
          
          const color = neutralGrey;
          
          App.markerHandler.createMarkerPercent(
            pos.xPctImage,
            pos.yPctImage,
            color,
            box,
            true,
            pointPlayer
          );
          
          // Set data-zone attribute for goal boxes
          setMarkerZone(box, box.id === 'goalRedBox' ? 'red' : 'green');
          
          this.saveMarkers();
          
          if (workflowActive) {
            App.addGoalMapPoint(
              "goal",
              pos.xPctImage,
              pos.yPctImage,
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
                pos.xPctImage, pos.yPctImage,
                "#ff0000", box, true,
                activeGoalie.name, null, 'conceded'
              );
              
              // Set data-zone attribute for red zone shot
              setMarkerZone(box, 'red');
              
              this.saveMarkers();
              
              // Auto-Navigation entfernt - killt Workflow-Kontext
              
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
              
              // KRITISCH: pointPlayer neu setzen damit der Marker den Goalie-Namen bekommt
              pointPlayer = activeGoalie.name;
              
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
          
          // SHOT WORKFLOW: Only allow green zone (top half)
          if (workflowActive && eventType === 'shot') {
            if (isRedZone) {
              console.log('[Shot Workflow] Please click in the green zone (top half)');
              return;
            }
            
            // Force green color for shot workflow
            color = "#00ff66";
            
            App.markerHandler.createMarkerPercent(
              pos.xPctImage,
              pos.yPctImage,
              color,
              box,
              true,
              pointPlayer
            );
            
            // Set data-zone attribute for shot workflow
            setMarkerZone(box, 'green');
            
            this.saveMarkers();
            
            // Complete shot workflow immediately
            App.addGoalMapPoint(
              "field",
              pos.xPctImage,
              pos.yPctImage,
              color,
              box.id
            );
            // Note: addGoalMapPoint will call completeGoalMapWorkflow which removes overlay
            
            // Auto-navigate back to Game Data after short delay
            setTimeout(() => {
              if (typeof App.showPage === 'function') {
                App.showPage('stats');
              }
            }, App.goalMap.AUTO_NAVIGATION_DELAY_MS);
            
            return;
          }
          
          App.markerHandler.createMarkerPercent(
            pos.xPctImage,
            pos.yPctImage,
            color,
            box,
            true,
            pointPlayer
          );
          
          // Set data-zone attribute for normal field point
          setMarkerZone(box, isRedZone ? 'red' : 'green');
          
          this.saveMarkers();
          
          // Auto-Navigation entfernt - killt Workflow-Kontext
          
          if (workflowActive) {
            App.addGoalMapPoint(
              "field",
              pos.xPctImage,
              pos.yPctImage,
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
        // Ignoriere synthetischen Click nach Touch (Mobile/Tablet)
        if (Date.now() - lastTouchTime < 500) {
          ev.preventDefault();
          ev.stopPropagation();
          return;
        }
        
        // NEU: Blockiere wenn kürzlich ein Marker gesetzt wurde
        if (Date.now() - lastMarkerPlacedTime < 500) {
          ev.preventDefault();
          ev.stopPropagation();
          return;
        }
        
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        const now = Date.now();
        const pos = getPosFromEvent(ev);
        
        if (now - lastMouseUp < 300) {
          lastMarkerPlacedTime = Date.now();  // NEU: Setze Flag VOR placeMarker
          placeMarker(pos, true, true);
          lastMouseUp = 0;
        } else {
          if (!isLong) {
            lastMarkerPlacedTime = Date.now();  // NEU: Setze Flag VOR placeMarker
            placeMarker(pos, false);
          }
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
        ev.preventDefault();      // Prevent default touch behavior (zoom, scroll)
        ev.stopPropagation();     // Stop event bubbling
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          const touch = ev.touches[0];
          const pos = getPosFromEvent(touch);
          lastMarkerPlacedTime = Date.now();  // NEU: Setze Flag VOR placeMarker
          placeMarker(pos, true);
          if (navigator.vibrate) navigator.vibrate(50);
        }, App.markerHandler.LONG_MARK_MS);
      }, { passive: false });
      
      img.addEventListener("touchend", (ev) => {
        ev.preventDefault();      // Prevent default touch behavior and subsequent click events
        ev.stopPropagation();     // Stop event bubbling to prevent premature navigation
        lastTouchTime = Date.now();  // Store touch timestamp to block synthetic clicks
        
        // NEU: Blockiere wenn kürzlich ein Marker gesetzt wurde (verhindert Doppelmarker)
        if (Date.now() - lastMarkerPlacedTime < 500) {
          return;
        }
        
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        const now = Date.now();
        const touch = ev.changedTouches[0];
        const pos = getPosFromEvent(touch);
        
        if (now - lastTouchEnd < 300) {
          lastMarkerPlacedTime = Date.now();  // NEU: Setze Flag VOR placeMarker
          placeMarker(pos, true, true);
          lastTouchEnd = 0;
        } else {
          if (!isLong) {
            lastMarkerPlacedTime = Date.now();  // NEU: Setze Flag VOR placeMarker
            placeMarker(pos, false);
          }
          lastTouchEnd = now;
        }
        isLong = false;
      }, { passive: false });
      
      img.addEventListener("touchcancel", (ev) => {
        ev.preventDefault();      // Prevent default touch behavior
        ev.stopPropagation();     // Stop event bubbling
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        isLong = false;
      }, { passive: false });
    });
  },
  
  // Get currently active goalie - simple dropdown check only
  getActiveGoalie() {
    const goalieDropdown = document.getElementById('goalMapGoalieFilter');
    const value = goalieDropdown ? goalieDropdown.value : '';
    // Explicitly check for empty value or "All Goalies"
    if (value && value !== "" && value !== "All Goalies") {
      return { name: value, position: 'G' };
    }
    return null;
  },
  
  // Helper: Check if marker is in GREEN zone (top field half + green goal)
  isGreenZoneMarker(marker, box) {
    // Green goal box = always green zone
    if (box.id === 'goalGreenBox') return true;
    
    // Red goal box = never green zone
    if (box.id === 'goalRedBox') return false;
    
    // For field box: check data-zone attribute first (most reliable)
    if (marker.dataset.zone) {
      return marker.dataset.zone === 'green';
    }
    
    // FALLBACK for old markers without data-zone attribute:
    const color = marker.style.backgroundColor || '';
    
    // Green markers (#00ff66 / rgb(0, 255, 102)) = always green zone
    const isGreenColor = color.includes('0, 255, 102') || color.includes('00ff66') || color === 'rgb(0, 255, 102)';
    if (isGreenColor) {
      return true;
    }
    
    // Grey markers = check position (inverse of red zone check)
    const isGreyColor = color.includes('68, 68, 68') || color.includes('444444') || color === 'rgb(68, 68, 68)';
    if (isGreyColor) {
      const yPctImage = parseFloat(marker.dataset.yPctImage);
      if (!isNaN(yPctImage) && yPctImage > 0) {
        return yPctImage < this.VERTICAL_SPLIT_THRESHOLD;  // < 50% = green zone
      }
      
      const topStr = marker.style.top || '0';
      const top = parseFloat(topStr.replace('%', '')) || 0;
      return top < this.VERTICAL_SPLIT_THRESHOLD;
    }
    
    // Red markers = never green zone
    return false;
  },
  
  // Helper: Check if marker is in RED zone (bottom field half + red goal)
  isRedZoneMarker(marker, box) {
    // Red goal box = always red zone
    if (box.id === 'goalRedBox') return true;
    
    // Green goal box = never red zone
    if (box.id === 'goalGreenBox') return false;
    
    // For field box: check data-zone attribute first (most reliable)
    if (marker.dataset.zone) {
      return marker.dataset.zone === 'red';
    }
    
    // FALLBACK for old markers without data-zone attribute:
    // Check marker color to determine zone
    const color = marker.style.backgroundColor || '';
    
    // Red markers (#ff0000 / rgb(255, 0, 0)) = always red zone (shots)
    const isRedColor = color.includes('255, 0, 0') || color.includes('ff0000') || color === 'rgb(255, 0, 0)';
    if (isRedColor) {
      return true;
    }
    
    // Grey markers (#444444 / rgb(68, 68, 68)) = check position
    const isGreyColor = color.includes('68, 68, 68') || color.includes('444444') || color === 'rgb(68, 68, 68)';
    if (isGreyColor) {
      // Try to get image-relative Y position from data attribute
      const yPctImage = parseFloat(marker.dataset.yPctImage);
      if (!isNaN(yPctImage) && yPctImage > 0) {
        return yPctImage >= this.VERTICAL_SPLIT_THRESHOLD;  // >= 50% = red zone
      }
      
      // Last resort: use style.top (box-relative, less accurate but better than nothing)
      const topStr = marker.style.top || '0';
      const top = parseFloat(topStr.replace('%', '')) || 0;
      return top >= this.VERTICAL_SPLIT_THRESHOLD;
    }
    
    // Green markers = never red zone
    return false;
  },
  
  // Update goalie button title to show neon-pulse when active
  updateGoalieButtonTitle() {
    const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
    if (!goalieFilterSelect) return;
    
    // KRITISCH: Prüfe ob ein ECHTER Goalie ausgewählt ist (nicht "All Goalies")
    const selectedValue = goalieFilterSelect.value;
    const hasActiveGoalie = selectedValue && selectedValue !== "" && selectedValue !== "All Goalies";
    
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
    
    if (workflow?.active && workflow?.playerName) {
      // Show player name for shot workflow OR scored goal workflow
      if (workflow.eventType === 'shot' || 
          (workflow.eventType === 'goal' && workflow.workflowType === 'scored')) {
        this.showPlayerNameOverlay(workflow.playerName);
      } else {
        // For other workflows (conceded), remove player overlays
        document.querySelectorAll('.player-name-overlay').forEach(el => el.remove());
      }
    } else {
      // If no workflow, remove overlays
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
        // Check if saved goalie still exists as option in dropdown
        const goalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
        const goalieNames = goalies.map(g => g.name);
        
        if (goalieNames.includes(savedGoalie)) {
          // Goalie exists, restore it
          goalieFilterSelect.value = savedGoalie;
          
          // KRITISCH: Verify the value was actually set (option must exist in DOM)
          if (goalieFilterSelect.value === savedGoalie) {
            goalieFilterSelect.classList.add("active");
            this.filterByGoalies([savedGoalie]);
          } else {
            // Value couldn't be set, clean up
            localStorage.removeItem("goalMapActiveGoalie");
            goalieFilterSelect.value = ""; // Set to "All Goalies"
            goalieFilterSelect.classList.remove("active");
            // Remove overlays
            document.querySelectorAll('.goalie-name-overlay, .goalie-name-goal').forEach(el => el.remove());
          }
        } else {
          // Goalie doesn't exist anymore, clean up
          localStorage.removeItem("goalMapActiveGoalie");
          goalieFilterSelect.value = ""; // Set to "All Goalies"
          goalieFilterSelect.classList.remove("active");
          // Remove overlays
          document.querySelectorAll('.goalie-name-overlay, .goalie-name-goal').forEach(el => el.remove());
        }
      }
    } else {
      // No saved goalie = no pulsing
      const goalieFilterSelect = document.getElementById("goalMapGoalieFilter");
      if (goalieFilterSelect) {
        goalieFilterSelect.classList.remove("active");
      }
    }
    
    this.updateGoalieButtonTitle();
    this.updateGoalieNameOverlay();
  },
  
  // Save all markers to localStorage
  saveMarkers() {
    const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
    const allMarkers = boxes.map(box => {
      const markers = [];
      box.querySelectorAll(".marker-dot").forEach(dot => {
        // Save image-relative coordinates (from data attributes)
        const xPctImage = parseFloat(dot.dataset.xPctImage) || 0;
        const yPctImage = parseFloat(dot.dataset.yPctImage) || 0;
        const bg = dot.style.backgroundColor || "";
        const playerName = dot.dataset.player || null;
        const zone = dot.dataset.zone || null;
        markers.push({ xPct: xPctImage, yPct: yPctImage, color: bg, player: playerName, zone: zone });
      });
      return markers;
    });
    
    localStorage.setItem("goalMapMarkers", JSON.stringify(allMarkers));
  },
  
  // Restore markers from localStorage
  restoreMarkers() {
    const allMarkers = App.helpers.safeJSONParse("goalMapMarkers", null);
    if (!allMarkers) return;
      const boxes = Array.from(document.querySelectorAll(App.selectors.torbildBoxes));
      
      // Clear existing markers first to avoid duplicates (idempotent operation)
      boxes.forEach(box => {
        box.querySelectorAll(".marker-dot").forEach(dot => dot.remove());
      });
      
      allMarkers.forEach((markers, boxIndex) => {
        if (boxIndex >= boxes.length) return;
        const box = boxes[boxIndex];
        
        markers.forEach(marker => {
          // Skip markers with invalid coordinates (0, 0, undefined, null, or very small values)
          if (!marker.xPct || !marker.yPct || 
              marker.xPct < 0.1 || marker.yPct < 0.1 ||
              isNaN(marker.xPct) || isNaN(marker.yPct)) {
            console.warn('[Goal Map] Skipping marker with invalid coordinates:', marker);
            return;
          }
          
          App.markerHandler.createMarkerPercent(
            marker.xPct,
            marker.yPct,
            marker.color,
            box,
            true,
            marker.player
          );
          
          // Get the marker we just created (it's the last one in the box)
          const dots = box.querySelectorAll(".marker-dot");
          const lastDot = dots[dots.length - 1];
          
          if (!lastDot) return; // Safety check
          
          // Restore zone attribute or migrate old markers
          if (marker.zone) {
            // Marker has zone attribute - restore it
            lastDot.dataset.zone = marker.zone;
          } else {
            // Migration: Calculate zone for old markers without zone attribute
            if (box.id === 'goalRedBox') {
              lastDot.dataset.zone = 'red';
            } else if (box.id === 'goalGreenBox') {
              lastDot.dataset.zone = 'green';
            } else if (box.classList.contains('field-box')) {
              // For field box: use saved yPct (image coordinates) if available
              if (marker.yPct && marker.yPct > 0) {
                lastDot.dataset.zone = marker.yPct >= this.VERTICAL_SPLIT_THRESHOLD ? 'red' : 'green';
              } else {
                // Fallback: calculate from rendered position
                const topStr = lastDot.style.top || '0';
                const top = parseFloat(topStr.replace('%', '')) || 0;
                lastDot.dataset.zone = top >= this.VERTICAL_SPLIT_THRESHOLD ? 'red' : 'green';
              }
            }
          }
        });
      });
      
      // Save markers to persist any migrated zone attributes
      this.saveMarkers();
      
      // Apply both filters independently to ensure correct marker visibility
      this.applyPlayerFilter(); // Green zone
      
      // Apply goalie filter for red zone
      const savedGoalie = localStorage.getItem("goalMapActiveGoalie");
      if (savedGoalie) {
        const goalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
        const goalieNames = goalies.map(g => g.name);
        if (goalieNames.includes(savedGoalie)) {
          this.filterByGoalies([savedGoalie]);
        } else {
          // Goalie doesn't exist, show all red zone markers
          this.filterByGoalies(goalieNames);
        }
      } else {
        // No goalie filter, show all red zone markers
        const goalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
        const goalieNames = goalies.map(g => g.name);
        this.filterByGoalies(goalieNames);
      }
  },
  
  // Time Tracking mit Spielerzuordnung
  initTimeTracking() {
    if (!this.timeTrackingBox) return;
    
    // Verhindere doppelte Initialisierung
    if (this.timeTrackingInitialized) {
      console.log("[Goal Map] TimeTracking already initialized, skipping...");
      return;
    }
    this.timeTrackingInitialized = true;
    
    let timeData = App.helpers.safeJSONParse("timeData", {});
    let timeDataWithPlayers = App.helpers.safeJSONParse("timeDataWithPlayers", {});
    
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
            (App.goalMapWorkflow?.active && App.goalMapWorkflow?.playerName)
              ? App.goalMapWorkflow.playerName
              : (this.playerFilter || '_anonymous');
          
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
          // Shot-Workflow: KEINE Timebox-Buttons erlaubt
          if (App.goalMapWorkflow?.active && App.goalMapWorkflow?.eventType === 'shot') {
            console.log('[Shot Workflow] Timebox buttons not allowed during shot workflow');
            return; // Blockiere ALLE Buttons
          }
          
          // Am Anfang des click handlers - ROTE BUTTONS blockieren
          const isTopRow = newBtn.closest('.period-buttons')?.classList.contains('top-row');
          const isBottomRow = newBtn.closest('.period-buttons')?.classList.contains('bottom-row');
          
          // Im Goal-Workflow: Strikte Button-Kontrolle
          if (App.goalMapWorkflow?.active && App.goalMapWorkflow?.eventType === 'goal') {
            const currentStep = App.goalMapWorkflow.collectedPoints?.length || 0;
            const workflowType = App.goalMapWorkflow?.workflowType;
            
            // Nur im Schritt 2 (nach Feld + Tor) sind Timeboxen erlaubt
            if (currentStep !== App.goalMap.WORKFLOW_STEP_TIME) {
              console.log('[Goal Workflow] Timebox only after field and goal');
              return;
            }
            
            // GRÜNER Workflow (scored): NUR obere Reihe (grüne Buttons) erlaubt
            if (workflowType === 'scored') {
              if (!isTopRow) {
                console.log('[Goal Workflow] Only GREEN time buttons (top row) allowed for scored goals');
                return; // Blockiere rote Buttons komplett
              }
            }
            
            // ROTER Workflow (conceded): NUR untere Reihe (rote Buttons) erlaubt
            if (workflowType === 'conceded') {
              if (!isBottomRow) {
                console.log('[Goal Workflow] Only RED time buttons (bottom row) allowed for conceded goals');
                return; // Blockiere grüne Buttons komplett
              }
            }
            
            // Record time button click
            updateValue(1);
            
            // Nach grünem Workflow: Zurück zu Game Data
            if (workflowType === 'scored') {
              setTimeout(() => {
                if (typeof App.showPage === 'function') {
                  App.showPage('stats');
                }
              }, App.goalMap.AUTO_NAVIGATION_DELAY_MS);
            }
            
            return; // Workflow-Klick verarbeitet, keine weitere Logik
          }
          
          // ROTE BUTTONS ohne Workflow: Goalie muss ausgewählt sein
          if (isBottomRow) {
            const activeGoalie = App.goalMap.getActiveGoalie();
            if (!activeGoalie) {
              alert('Please select a goalie first');
              return;
            }
          }
          
          // Normale Klick-Logik (außerhalb Workflow)
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
        
        // Save to localStorage or remove if "All Goalies"
        if (selectedGoalie && selectedGoalie !== "") {
          localStorage.setItem("goalMapActiveGoalie", selectedGoalie);
          goalieFilterSelect.classList.add("active"); // Pulsieren AN
        } else {
          // "All Goalies" selected - remove localStorage and overlays
          localStorage.removeItem("goalMapActiveGoalie");
          goalieFilterSelect.classList.remove("active"); // Pulsieren AUS
          // Remove any existing goalie name overlays
          document.querySelectorAll('.goalie-name-overlay, .goalie-name-goal').forEach(el => el.remove());
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
      
      // KRITISCH: Restore saved goalie value after populating dropdown
      const savedGoalie = localStorage.getItem("goalMapActiveGoalie");
      if (savedGoalie) {
        // Check if saved goalie still exists as option in dropdown
        const goalieNames = goalies.map(g => g.name);
        
        if (goalieNames.includes(savedGoalie)) {
          // Goalie exists, restore it
          goalieFilterSelect.value = savedGoalie;
          
          // Verify the value was actually set (option must exist in DOM)
          if (goalieFilterSelect.value === savedGoalie) {
            goalieFilterSelect.classList.add("active");
            this.updateGoalieButtonTitle();
            this.updateGoalieNameOverlay();
            this.filterByGoalies([savedGoalie]);
          } else {
            // Value couldn't be set, clean up
            localStorage.removeItem("goalMapActiveGoalie");
            goalieFilterSelect.classList.remove("active");
          }
        } else {
          // Goalie doesn't exist anymore, clean up
          localStorage.removeItem("goalMapActiveGoalie");
          goalieFilterSelect.value = ""; // Set to "All Goalies"
          goalieFilterSelect.classList.remove("active");
        }
      } else {
        // No saved goalie = no pulsing
        goalieFilterSelect.classList.remove("active");
      }
    }
  },
  
  filterByGoalies(goalieNames) {
    // Player and goalie filters operate independently on different zones
    
    // Detect if "All Goalies" is selected
    const allGoalies = (App.data.selectedPlayers || []).filter(p => p.position === "G");
    const allGoalieNames = allGoalies.map(g => g.name);
    const isAllGoaliesFilter = (goalieNames.length === allGoalieNames.length && 
                                 goalieNames.every(name => allGoalieNames.includes(name)));
    
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    boxes.forEach(box => {
      const markers = box.querySelectorAll(".marker-dot");
      markers.forEach(marker => {
        // Only filter RED ZONE markers
        const isRedMarker = this.isRedZoneMarker(marker, box);
        
        if (isRedMarker) {
          const playerName = marker.dataset.player;
          
          if (isAllGoaliesFilter) {
            // "All Goalies" - show all red zone markers
            marker.style.display = '';
          } else if (playerName && goalieNames.includes(playerName)) {
            // Marker belongs to selected goalie - show
            marker.style.display = '';
          } else {
            // Marker doesn't belong to selected goalie - hide
            marker.style.display = 'none';
          }
        }
        // Green zone markers are not touched by this function
      });
    });
    
    // Update time tracking to show only goalie times
    this.applyGoalieTimeTrackingFilter(goalieNames);
  },
  
  applyGoalieTimeTrackingFilter(goalieNames) {
    if (!this.timeTrackingBox) return;
    
    const timeDataWithPlayers = App.helpers.safeJSONParse("timeDataWithPlayers", {});
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        // Only update bottom-row buttons (red zone, indices 4-7); skip top row
        if (idx < 4) return; // Skip indices 0-3 (top row)
        
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
        // Only filter GREEN ZONE markers
        const isGreenMarker = this.isGreenZoneMarker(marker, box);
        
        if (isGreenMarker) {
          if (this.playerFilter) {
            marker.style.display = (marker.dataset.player === this.playerFilter) ? '' : 'none';
          } else {
            marker.style.display = '';
          }
        }
        // Red zone markers are not touched by this function
      });
    });
    
    this.applyTimeTrackingFilter();
  },
  
  applyTimeTrackingFilter() {
    if (!this.timeTrackingBox) return;
    
    const timeDataWithPlayers = App.helpers.safeJSONParse("timeDataWithPlayers", {});
    
    this.timeTrackingBox.querySelectorAll(".period").forEach((period, pIdx) => {
      const periodNum = period.dataset.period || `p${pIdx}`;
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        // Only update top-row buttons (green zone, indices 0-3); skip bottom row
        if (idx >= 4) return; // Skip indices 4-7 (bottom row)
        
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
    
    // Body-Klassen für CSS-Styling (für Timebox-Button-Blocking)
    document.body.classList.remove('workflow-scored', 'workflow-conceded');
    if (App.goalMapWorkflow?.active && App.goalMapWorkflow?.workflowType) {
      document.body.classList.add('workflow-' + App.goalMapWorkflow.workflowType);
    }
    
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
        const bg = dot.style.backgroundColor || "";
        // Use image-relative coordinates from data attributes
        const xPct = parseFloat(dot.dataset.xPctImage) || 0;
        const yPct = parseFloat(dot.dataset.yPctImage) || 0;
        const playerName = dot.dataset.player || null;
        const zone = dot.dataset.zone || null; // Include zone attribute
        markers.push({ xPct, yPct, color: bg, player: playerName, zone: zone });
      });
      return markers;
    });
    
    localStorage.setItem("goalMapMarkers", JSON.stringify(allMarkers));
    
    // Time Data für Momentum-Tabelle exportieren
    const timeDataWithPlayers = App.helpers.safeJSONParse("timeDataWithPlayers", {});
    console.log('[Goal Map Export] timeDataWithPlayers:', timeDataWithPlayers);
    
    // ACCUMULATE markers to Season Map (merge instead of overwrite)
    const existingSeasonMarkers = App.helpers.safeJSONParse("seasonMapMarkers", []);
    const mergedMarkers = [];
    
    // Helper function to check if two markers are duplicates
    const isDuplicate = (marker1, marker2) => {
      return Math.abs(marker1.xPct - marker2.xPct) < this.MARKER_POSITION_TOLERANCE &&
             Math.abs(marker1.yPct - marker2.yPct) < this.MARKER_POSITION_TOLERANCE &&
             marker1.color === marker2.color &&
             marker1.player === marker2.player &&
             marker1.zone === marker2.zone;
    };
    
    // Merge each box's markers with deduplication
    for (let i = 0; i < Math.max(allMarkers.length, existingSeasonMarkers.length); i++) {
      const currentMarkers = allMarkers[i] || [];
      const existingMarkers = existingSeasonMarkers[i] || [];
      
      // Start with existing markers
      const combined = [...existingMarkers];
      
      // Add current markers only if they're not duplicates
      currentMarkers.forEach(newMarker => {
        const isAlreadyPresent = combined.some(existingMarker => isDuplicate(newMarker, existingMarker));
        if (!isAlreadyPresent) {
          combined.push(newMarker);
        }
      });
      
      mergedMarkers[i] = combined;
    }
    
    // ACCUMULATE time data (merge player times)
    const existingTimeData = App.helpers.safeJSONParse("seasonMapTimeDataWithPlayers", {});
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
    
    // Reset initialization flag to allow re-initialization
    this.timeTrackingInitialized = false;
    
    // KRITISCH: Buttons neu initialisieren damit Closures neue leere Daten haben!
    this.initTimeTracking();
    
    alert("Goal Map reset.");
  }
};

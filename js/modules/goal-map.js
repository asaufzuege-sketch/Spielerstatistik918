// Goal Map Modul
App.goalMap = {
  timeTrackingBox: null,
  
  init() {
    this.timeTrackingBox = document.getElementById("timeTrackingBox");
    this.playerFilter = null;
    
    // Marker Handler für Goal Map Boxen
    this.attachMarkerHandlers();
    
    // Time Tracking initialisieren
    this.initTimeTracking();
    
    // Player Filter initialisieren
    this.initPlayerFilter();
    
    // Reset Button
    document.getElementById("resetTorbildBtn")?.addEventListener("click", () => {
      this.reset();
    });
    
    // Back button handler for workflow cancellation
    document.getElementById("backToStatsBtn")?.addEventListener("click", () => {
      if (App.goalMapWorkflow.active) {
        if (confirm("Workflow abbrechen? Gesammelte Punkte gehen verloren.")) {
          App.cancelGoalMapWorkflow();
        }
      }
    });
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
    
    // Filter time tracking data (hide/show buttons based on player)
    // Note: Time buttons don't have player association yet, so this is a placeholder
    
    console.log(`Player filter applied: ${this.playerFilter || 'All players'}`);
  },
  
  updateWorkflowIndicator() {
    const indicator = document.getElementById("workflowStatusIndicator");
    const statusText = document.getElementById("workflowStatusText");
    
    if (!indicator || !statusText) return;
    
    if (App.goalMapWorkflow.active) {
      const collected = App.goalMapWorkflow.collectedPoints.length;
      const required = App.goalMapWorkflow.requiredPoints;
      const player = App.goalMapWorkflow.playerName;
      const eventType = App.goalMapWorkflow.eventType === 'goal' ? 'Tor' : 'Shot';
      
      let nextAction = '';
      if (App.goalMapWorkflow.eventType === 'goal') {
        if (collected === 0) nextAction = 'Punkt im Spielfeld setzen';
        else if (collected === 1) nextAction = 'Punkt im Tor setzen';
        else if (collected === 2) nextAction = 'Punkt in der Timebox setzen';
      } else {
        nextAction = 'Punkt im Spielfeld setzen';
      }
      
      statusText.textContent = `${eventType} für ${player} - Punkt ${collected + 1}/${required}: ${nextAction}`;
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  },
  
  attachMarkerHandlers() {
    const boxes = document.querySelectorAll(App.selectors.torbildBoxes);
    
    boxes.forEach(box => {
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
          insideImage = (clientX >= rendered.x && clientX <= rendered.x + rendered.width && 
                        clientY >= rendered.y && clientY <= rendered.y + rendered.height);
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
        let color = "#444";
        let pointType = null;
        let placed = false;
        
        if (box.classList.contains("field-box")) {
          if (!pos.insideImage) return;
          
          const sampler = App.markerHandler.createImageSampler(img);
          pointType = 'field';
          
          // Check if in workflow mode
          if (App.goalMapWorkflow.active) {
            // Gray for goal events, green for shot events
            if (App.goalMapWorkflow.eventType === 'goal') {
              color = "#888888";
            } else {
              color = "#00ff66";
            }
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, color, box, true, App.goalMapWorkflow.playerName);
            placed = true;
          } else {
            // Original behavior for manual placement
            if (long || forceGrey) {
              App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#444", box, true);
              color = "#444";
              placed = true;
            } else if (sampler && sampler.valid) {
              const isGreen = sampler.isGreenAt(pos.xPctImage, pos.yPctImage, 110, 30);
              const isRed = sampler.isRedAt(pos.xPctImage, pos.yPctImage, 95, 22);
              
              if (isGreen) {
                App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#00ff66", box, true);
                color = "#00ff66";
                placed = true;
              } else if (isRed) {
                App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#ff0000", box, true);
                color = "#ff0000";
                placed = true;
              }
            } else {
              color = pos.yPctImage > 50 ? "#ff0000" : "#00ff66";
              App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, color, box, true);
              placed = true;
            }
          }
        } else if (box.classList.contains("goal-img-box") || box.id === "goalGreenBox" || box.id === "goalRedBox") {
          const sampler = App.markerHandler.createImageSampler(img);
          if (!sampler || !sampler.valid) return;
          pointType = 'goal';
          
          const playerName = App.goalMapWorkflow.active ? App.goalMapWorkflow.playerName : null;
          
          if (box.id === "goalGreenBox") {
            if (!sampler.isWhiteAt(pos.xPctContainer, pos.yPctContainer, 220)) return;
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#444", box, true, playerName);
            color = "#444";
            placed = true;
          } else if (box.id === "goalRedBox") {
            if (!sampler.isNeutralWhiteAt(pos.xPctContainer, pos.yPctContainer, 235, 12)) return;
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#444", box, true, playerName);
            color = "#444";
            placed = true;
          } else {
            if (!sampler.isWhiteAt(pos.xPctContainer, pos.yPctContainer, 220)) return;
            App.markerHandler.createMarkerPercent(pos.xPctContainer, pos.yPctContainer, "#444", box, true, playerName);
            color = "#444";
            placed = true;
          }
        }
        
        // Add to workflow if active and point was placed
        if (placed && App.goalMapWorkflow.active && pointType) {
          App.addGoalMapPoint(pointType, pos.xPctContainer, pos.yPctContainer, color, box.id);
        }
      };
      
      // Mouse Events
      img.addEventListener("mousedown", (ev) => {
        isLong = false;
        if (mouseHoldTimer) clearTimeout(mouseHoldTimer);
        mouseHoldTimer = setTimeout(() => {
          isLong = true;
          placeMarker(getPosFromEvent(ev), true);
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
          placeMarker(getPosFromEvent(ev.touches[0]), true);
        }, App.markerHandler.LONG_MARK_MS);
      }, { passive: true });
      
      img.addEventListener("touchend", (ev) => {
        if (mouseHoldTimer) {
          clearTimeout(mouseHoldTimer);
          mouseHoldTimer = null;
        }
        const now = Date.now();
        const pos = getPosFromEvent(ev.changedTouches[0]);
        
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
  
  initTimeTracking() {
    if (!this.timeTrackingBox) return;
    
    let timeData = JSON.parse(localStorage.getItem("timeData")) || {};
    
    this.timeTrackingBox.querySelectorAll(".period").forEach(period => {
      const periodNum = period.dataset.period || Math.random().toString(36).slice(2, 6);
      const buttons = period.querySelectorAll(".time-btn");
      
      buttons.forEach((btn, idx) => {
        const hasStored = (timeData[periodNum] && typeof timeData[periodNum][idx] !== "undefined");
        const stored = hasStored ? Number(timeData[periodNum][idx]) : Number(btn.textContent) || 0;
        btn.textContent = stored;
        
        let lastTap = 0;
        let clickTimeout = null;
        let touchStart = 0;
        
        const updateValue = (delta) => {
          const current = Number(btn.textContent) || 0;
          const newVal = Math.max(0, current + delta);
          btn.textContent = newVal;
          if (!timeData[periodNum]) timeData[periodNum] = {};
          timeData[periodNum][idx] = newVal;
          localStorage.setItem("timeData", JSON.stringify(timeData));
          
          // Add to workflow if active and value was incremented
          if (delta > 0 && App.goalMapWorkflow.active) {
            const btnRect = btn.getBoundingClientRect();
            const boxRect = this.timeTrackingBox.getBoundingClientRect();
            
            // Calculate relative position within time tracking box
            const xPct = ((btnRect.left + btnRect.width / 2 - boxRect.left) / boxRect.width) * 100;
            const yPct = ((btnRect.top + btnRect.height / 2 - boxRect.top) / boxRect.height) * 100;
            
            App.addGoalMapPoint('time', xPct, yPct, '#444', 'timeTrackingBox');
          }
        };
        
        btn.addEventListener("click", () => {
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
        
        btn.addEventListener("touchstart", (e) => {
          const now = Date.now();
          const diff = now - touchStart;
          if (diff < 300) {
            e.preventDefault();
            if (clickTimeout) {
              clearTimeout(clickTimeout);
              clickTimeout = null;
            }
            updateValue(-1);
            touchStart = 0;
          } else {
            touchStart = now;
            setTimeout(() => {
              if (touchStart !== 0) {
                updateValue(+1);
                touchStart = 0;
              }
            }, 300);
          }
        }, { passive: true });
      });
    });
  },
  
  reset() {
    if (!confirm("Goal Map zurücksetzen?")) return;
    
    document.querySelectorAll("#torbildPage .marker-dot").forEach(d => d.remove());
    document.querySelectorAll("#torbildPage .time-btn").forEach(b => b.textContent = "0");
    localStorage.removeItem("timeData");
    
    alert("Goal Map zurückgesetzt.");
  }
};

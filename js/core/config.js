// Globale Konfiguration und Namespace
const App = {
  version: '2.0.0',
  
  // Seiten
  pages: {},
  
  // Daten
  data: {
    players: [
      { num: 4, name: "Ondrej Kastner" }, { num: 5, name: "Raphael Oehninger" },
      { num: 6, name: "Nuno Meier" }, { num: 7, name: "Silas Teuber" },
      { num: 8, name: "Diego Warth" }, { num: 9, name: "Mattia Crameri" },
      { num: 10, name: "Mael Bernath" }, { num: 11, name: "Sean Nef" },
      { num: 12, name: "Rafael Burri" }, { num: 13, name: "Lenny Schwarz" },
      { num: 14, name: "David Lienert" }, { num: 15, name: "Neven Severini" },
      { num: 16, name: "Nils Koubek" }, { num: 17, name: "Lio Kundert" },
      { num: 18, name: "Livio Berner" }, { num: 19, name: "Robin Strasser" },
      { num: 21, name: "Marlon Kreyenbühl" }, { num: 22, name: "Martin Lana" },
      { num: 23, name: "Manuel Isler" }, { num: 24, name: "Moris Hürlimann" },
      { num: "", name: "Levi Baumann" }, { num: "", name: "Corsin Blapp" },
      { num: "", name: "Lenny Zimmermann" }, { num: "", name: "Luke Böhmichen" },
      { num: "", name: "Livio Weissen" }, { num: "", name: "Raul Wütrich" },
      { num: "", name: "Marco Senn" }
    ],
    
    categories: ["Shot", "Goals", "Assist", "+/-", "FaceOffs", "FaceOffs Won", "Penaltys"],
    
    selectedPlayers: [],
    statsData: {},
    playerTimes: {},
    seasonData: {},
    activeTimers: {},
    goalMapData: {}
  },
  
  // Goal Map Workflow State
  goalMapWorkflow: {
    active: false,
    eventType: null, // 'goal' or 'shot'
    workflowType: null, // 'scored' (green) or 'conceded' (red)
    playerName: null,
    requiredPoints: 0,
    collectedPoints: [],
    pointTypes: [] // ['field', 'goal', 'time'] for goal, ['field'] for shot
  },
  
  // Selektoren
  selectors: {
    torbildBoxes: "#torbildPage .field-box, #torbildPage .goal-img-box",
    seasonMapBoxes: "#seasonMapPage .field-box, #seasonMapPage .goal-img-box"
  },
  
  // Theme Setup
  initTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  },
  
  // CSS Injection für Season/GoalValue Tables (SCROLL FIX eingearbeitet)
  injectTableStyles() {
    const existing = document.getElementById('season-goalvalue-scroll-fix');
    if (existing) existing.remove();
    
    const style = document.createElement('style');
    style.id = 'season-goalvalue-scroll-fix';
    style.textContent = `
      /* Season Table - KEINE widersprüchlichen Regeln */
      /* Alles wird über style.css gesteuert */
      
      /* Goal Value Container - Links ausgerichtet */
      #goalValueContainer {
        display: flex !important;
        justify-content: flex-start !important;
        width: 100% !important;
      }
      
      #goalValueContainer table {
        margin-left: 0 !important;
        margin-right: auto !important;
        width: auto !important;
      }
    `;
    document.head.appendChild(style);
  },
  
  // Page Navigation (sofort verfügbar!)
  showPage(page) {
    try {
      // Lazy-initialize pages wenn noch nicht geschehen
      if (!this.pages || Object.keys(this.pages).length === 0) {
        this.pages = {
          teamSelection: document.getElementById("teamSelectionPage"),
          selection: document.getElementById("playerSelectionPage"),
          stats: document.getElementById("statsPage"),
          torbild: document.getElementById("torbildPage"),
          goalValue: document.getElementById("goalValuePage"),
          season: document.getElementById("seasonPage"),
          seasonMap: document.getElementById("seasonMapPage"),
          lineUp: document.getElementById("lineUpPage")
        };
      }
      
      // Alle Seiten verstecken - WICHTIG: mit force
      Object.values(this.pages).forEach(p => {
        if (p) {
          p.style.cssText = 'display: none !important;';
        }
      });
      
      // Target-Seite anzeigen
      if (this.pages[page]) {
        this.pages[page].style.cssText = '';
        this.pages[page].style.display = 'block';
      }
      
      // Page in LocalStorage speichern
      if (this.storage && typeof this.storage.setCurrentPage === 'function') {
        this.storage.setCurrentPage(page);
      } else {
        try {
          AppStorage.setItem("currentPage", page);
        } catch (e) {}
      }
      
      // Title setzen
      const titles = {
        teamSelection: "Team Selection",
        selection: "Player Selection",
        stats: "Game Center",
        torbild: "Goal Map",
        goalValue: "Goal Value",
        season: "Season",
        seasonMap: "Season Map",
        lineUp: "Line Up"
      };
      document.title = titles[page] || "Player Statistics";
      
      // Render bei Seitenwechsel verzögert - NUR EINMAL
      // Verhindert mehrfache render() Aufrufe
      if (this._renderTimeout) {
        clearTimeout(this._renderTimeout);
      }
      
      this._renderTimeout = setTimeout(() => {
        console.log("[Config] Rendering page:", page); // Debug-Log
        
        if (page === "stats" && this.statsTable && typeof this.statsTable.render === 'function') {
          this.statsTable.render();
        }
        if (page === "season" && this.seasonTable && typeof this.seasonTable.render === 'function') {
          this.seasonTable.render();
          // setStickyOffsets() call removed - CSS vw units handle everything zoom-independently
          // setTimeout(() => {
          //   if (typeof this.seasonTable.setStickyOffsets === 'function') {
          //     this.seasonTable.setStickyOffsets();
          //   }
          // }, 100);
        }
        if (page === "goalValue" && this.goalValue && typeof this.goalValue.render === 'function') {
          this.goalValue.render();
        }
        if (page === "seasonMap" && this.seasonMap && typeof this.seasonMap.render === 'function') {
          // Check if markers are missing in DOM but exist in localStorage
          const markersInDOM = document.querySelectorAll("#seasonMapPage .marker-dot").length;
          const teamId = App.helpers.getCurrentTeamId();
          const savedMarkers = AppStorage.getItem(`seasonMapMarkers_${teamId}`);
          
          if (markersInDOM === 0 && savedMarkers) {
            console.log('[Season Map] Restoring markers from localStorage...');
            this.seasonMap.render();
          }
          
          if (typeof this.seasonMap.initPlayerFilter === 'function') {
            this.seasonMap.initPlayerFilter();
          }
          
          // Marker neu positionieren
          if (this.markerHandler && typeof this.markerHandler.repositionMarkers === 'function') {
            this.markerHandler.repositionMarkers();
          }
        }
        if (page === "torbild" && this.goalMap) {
          // Reset timeTracking initialization flag to ensure buttons are re-initialized
          this.goalMap.timeTrackingInitialized = false;
          
          // Nach dem Anzeigen der torbild-Seite, Marker wiederherstellen
          if (typeof this.goalMap.restoreMarkers === 'function') {
            this.goalMap.restoreMarkers();
          }
          
          // Filter anwenden
          this.goalMap.applyPlayerFilter();
          
          // Goalie Filter anwenden
          const teamId = App.helpers.getCurrentTeamId();
          const savedGoalie = AppStorage.getItem(`goalMapActiveGoalie_${teamId}`);
          if (savedGoalie) {
            this.goalMap.filterByGoalies([savedGoalie]);
          } else {
            const allGoalies = (this.data.selectedPlayers || []).filter(p => p.position === "G");
            const goalieNames = allGoalies.map(g => g.name);
            this.goalMap.filterByGoalies(goalieNames);
          }
          
          // Marker neu positionieren
          if (this.markerHandler && typeof this.markerHandler.repositionMarkers === 'function') {
            this.markerHandler.repositionMarkers();
          }
          
          if (typeof this.goalMap.updateWorkflowIndicator === 'function') {
            this.goalMap.updateWorkflowIndicator();
          }
          if (typeof this.goalMap.initPlayerFilter === 'function') {
            this.goalMap.initPlayerFilter();
          }
          // Show player name overlay if workflow is active
          if (this.goalMapWorkflow?.active) {
            if ((this.goalMapWorkflow.eventType === 'shot' || 
                 (this.goalMapWorkflow.eventType === 'goal' && this.goalMapWorkflow.workflowType === 'scored')) 
                 && this.goalMapWorkflow.playerName) {
              if (typeof this.goalMap.showPlayerNameOverlay === 'function') {
                this.goalMap.showPlayerNameOverlay(this.goalMapWorkflow.playerName);
              }
            }
          }
        }
        if (page === "teamSelection" && this.teamSelection && typeof this.teamSelection.updateButtonStates === 'function') {
          this.teamSelection.updateButtonStates();
        }
        if (page === "selection" && this.playerSelection && typeof this.playerSelection.render === 'function') {
          this.playerSelection.render();
        }
        if (page === "lineUp" && this.lineUp && typeof this.lineUp.render === 'function') {
          this.lineUp.loadData();
          this.lineUp.render();
        }
        
        this._renderTimeout = null;
      }, 60);
      
    } catch (err) {
      console.error("App.showPage failed:", err);
    }
  },
  
  // Goal Map Workflow Functions
  startGoalMapWorkflow(playerName, eventType) {
    this.goalMapWorkflow.active = true;
    this.goalMapWorkflow.playerName = playerName;
    this.goalMapWorkflow.eventType = eventType;
    this.goalMapWorkflow.workflowType = null; // Reset workflow type, will be set on field click
    this.goalMapWorkflow.collectedPoints = [];
    
    if (eventType === 'goal') {
      this.goalMapWorkflow.requiredPoints = 3;
      this.goalMapWorkflow.pointTypes = ['field', 'goal', 'time'];
    } else if (eventType === 'shot') {
      this.goalMapWorkflow.requiredPoints = 1;
      this.goalMapWorkflow.pointTypes = ['field'];
    }
    
    console.log(`Starting Goal Map workflow for ${playerName} - ${eventType}`);
    this.showPage('torbild');
  },
  
  addGoalMapPoint(pointType, xPct, yPct, color, boxId) {
    if (!this.goalMapWorkflow.active) return;
    
    const point = {
      type: pointType,
      xPct: xPct,
      yPct: yPct,
      color: color,
      boxId: boxId,
      timestamp: Date.now()
    };
    
    this.goalMapWorkflow.collectedPoints.push(point);
    console.log(`Point ${this.goalMapWorkflow.collectedPoints.length}/${this.goalMapWorkflow.requiredPoints} collected:`, point);
    
    // Update workflow indicator
    if (this.goalMap && typeof this.goalMap.updateWorkflowIndicator === 'function') {
      this.goalMap.updateWorkflowIndicator();
    }
    
    // Check if we have all required points
    if (this.goalMapWorkflow.collectedPoints.length >= this.goalMapWorkflow.requiredPoints) {
      this.completeGoalMapWorkflow();
    }
  },
  
  completeGoalMapWorkflow() {
    if (!this.goalMapWorkflow.active) return;
    
    const playerName = this.goalMapWorkflow.playerName;
    const eventType = this.goalMapWorkflow.eventType;
    const workflowType = this.goalMapWorkflow.workflowType;
    const points = this.goalMapWorkflow.collectedPoints;
    const teamId = App.helpers.getCurrentTeamId();
    
    // Save the collected points with player data
    if (!this.data.goalMapData) {
      this.data.goalMapData = {};
    }
    
    if (!this.data.goalMapData[playerName]) {
      this.data.goalMapData[playerName] = [];
    }
    
    this.data.goalMapData[playerName].push({
      eventType: eventType,
      workflowType: workflowType,
      points: points,
      timestamp: Date.now()
    });
    
    // Update the stats counter for Goals or Shot
    if (!this.data.statsData[playerName]) {
      this.data.statsData[playerName] = {};
    }
    
    // When it's a goal, increment both Goals AND Shot (since every goal is also a shot)
    if (eventType === 'goal') {
      this.data.statsData[playerName]['Goals'] = (this.data.statsData[playerName]['Goals'] || 0) + 1;
      this.data.statsData[playerName]['Shot'] = (this.data.statsData[playerName]['Shot'] || 0) + 1;
    } else {
      // For shot-only events, just increment Shot
      this.data.statsData[playerName]['Shot'] = (this.data.statsData[playerName]['Shot'] || 0) + 1;
    }
    
    // Save to localStorage
    AppStorage.setItem(`goalMapData_${teamId}`, JSON.stringify(this.data.goalMapData));
    AppStorage.setItem(`statsData_${teamId}`, JSON.stringify(this.data.statsData));
    
    console.log(`Goal Map workflow completed for ${playerName}:`, points);
    
    // WICHTIG: Workflow-Punkte AUCH in goalMapMarkers speichern (für restoreMarkers)
    const existingMarkers = App.helpers.safeJSONParse(`goalMapMarkers_${teamId}`, null) || [[], [], []];

    points.forEach(point => {
      // Skip timeTrackingBox markers - they are not stored in goalMapMarkers
      if (point.boxId === 'timeTrackingBox') {
        return;
      }
      
      // Determine zone based on boxId and position
      let zone;
      if (point.boxId === 'goalGreenBox') {
        zone = 'green';
      } else if (point.boxId === 'goalRedBox') {
        zone = 'red';
      } else if (point.boxId === 'fieldBox') {
        // Use VERTICAL_SPLIT_THRESHOLD from goal-map.js (defaults to 50%)
        const threshold = (this.goalMap && this.goalMap.VERTICAL_SPLIT_THRESHOLD) || 50;
        zone = point.yPct < threshold ? 'green' : 'red';
      }
      
      const markerData = {
        xPct: point.xPct,
        yPct: point.yPct,
        color: point.color,
        player: playerName,
        zone: zone
      };
      
      if (point.boxId === 'fieldBox') {
        existingMarkers[0].push(markerData);
      } else if (point.boxId === 'goalGreenBox') {
        existingMarkers[1].push(markerData);
      } else if (point.boxId === 'goalRedBox') {
        existingMarkers[2].push(markerData);
      }
    });

    AppStorage.setItem(`goalMapMarkers_${teamId}`, JSON.stringify(existingMarkers));
    console.log("[Workflow] Markers saved to goalMapMarkers:", existingMarkers);
    
    // Reset workflow state
    this.goalMapWorkflow.active = false;
    this.goalMapWorkflow.playerName = null;
    this.goalMapWorkflow.eventType = null;
    this.goalMapWorkflow.workflowType = null;
    this.goalMapWorkflow.collectedPoints = [];
    this.goalMapWorkflow.requiredPoints = 0;
    this.goalMapWorkflow.pointTypes = [];
    
    // Update workflow indicator to hide it
    if (this.goalMap && typeof this.goalMap.updateWorkflowIndicator === 'function') {
      this.goalMap.updateWorkflowIndicator();
    }
    
    // Remove player name overlay
    if (this.goalMap && typeof this.goalMap.updatePlayerNameOverlay === 'function') {
      this.goalMap.updatePlayerNameOverlay();
    }
    
    // REMOVED: Auto-navigation destroyed Goal Map DOM before timebox values were saved to localStorage,
    // and timeTrackingInitialized flag prevented re-initialization. User navigates manually after workflow.
    // setTimeout(() => {
    //   this.showPage('stats');
    // }, 300);
  },
  
  cancelGoalMapWorkflow() {
    this.goalMapWorkflow.active = false;
    this.goalMapWorkflow.playerName = null;
    this.goalMapWorkflow.eventType = null;
    this.goalMapWorkflow.workflowType = null;
    this.goalMapWorkflow.collectedPoints = [];
    this.goalMapWorkflow.requiredPoints = 0;
    this.goalMapWorkflow.pointTypes = [];
    console.log('Goal Map workflow cancelled');
    
    // Update workflow indicator to hide it and remove body classes
    if (this.goalMap && typeof this.goalMap.updateWorkflowIndicator === 'function') {
      this.goalMap.updateWorkflowIndicator();
    }
    
    // Remove player name overlay
    if (this.goalMap && typeof this.goalMap.updatePlayerNameOverlay === 'function') {
      this.goalMap.updatePlayerNameOverlay();
    }
  }
};

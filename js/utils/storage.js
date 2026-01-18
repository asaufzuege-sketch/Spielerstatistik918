// Storage Prefix for this app
const STORAGE_PREFIX = 's918_';

// Storage Utility Functions
const AppStorage = {
  prefix: STORAGE_PREFIX,
  
  getItem(key) {
    return localStorage.getItem(this.prefix + key);
  },
  
  setItem(key, value) {
    localStorage.setItem(this.prefix + key, value);
  },
  
  removeItem(key) {
    localStorage.removeItem(this.prefix + key);
  }
};

// LocalStorage Verwaltung
App.storage = {
  load() {
    const teamId = App.helpers.getCurrentTeamId();
    
    // ALL data should be team-specific
    try {
      const selectedPlayersData = AppStorage.getItem(`selectedPlayers_${teamId}`);
      App.data.selectedPlayers = selectedPlayersData ? JSON.parse(selectedPlayersData) : [];
    } catch (e) {
      console.error('Error loading selectedPlayers:', e);
      App.data.selectedPlayers = [];
    }
    
    try {
      const statsDataStr = AppStorage.getItem(`statsData_${teamId}`);
      App.data.statsData = statsDataStr ? JSON.parse(statsDataStr) : {};
    } catch (e) {
      console.error('Error loading statsData:', e);
      App.data.statsData = {};
    }
    
    try {
      const playerTimesStr = AppStorage.getItem(`playerTimes_${teamId}`);
      App.data.playerTimes = playerTimesStr ? JSON.parse(playerTimesStr) : {};
    } catch (e) {
      console.error('Error loading playerTimes:', e);
      App.data.playerTimes = {};
    }
    
    try {
      const seasonDataStr = AppStorage.getItem(`seasonData_${teamId}`);
      App.data.seasonData = seasonDataStr ? JSON.parse(seasonDataStr) : {};
    } catch (e) {
      console.error('Error loading seasonData:', e);
      App.data.seasonData = {};
    }
  },
  
  saveSelectedPlayers() {
    const teamId = App.helpers.getCurrentTeamId();
    AppStorage.setItem(`selectedPlayers_${teamId}`, JSON.stringify(App.data.selectedPlayers));
  },
  
  saveStatsData() {
    const teamId = App.helpers.getCurrentTeamId();
    AppStorage.setItem(`statsData_${teamId}`, JSON.stringify(App.data.statsData));
  },
  
  savePlayerTimes() {
    const teamId = App.helpers.getCurrentTeamId();
    AppStorage.setItem(`playerTimes_${teamId}`, JSON.stringify(App.data.playerTimes));
  },
  
  saveSeasonData() {
    const teamId = App.helpers.getCurrentTeamId();
    AppStorage.setItem(`seasonData_${teamId}`, JSON.stringify(App.data.seasonData));
  },
  
  saveAll() {
    this.saveSelectedPlayers();
    this.saveStatsData();
    this.savePlayerTimes();
    this.saveSeasonData();
  },
  
  getCurrentPage() {
    return AppStorage.getItem("currentPage") || "selection";
  },
  
  setCurrentPage(page) {
    AppStorage.setItem("currentPage", page);
  }
};

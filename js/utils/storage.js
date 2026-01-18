// LocalStorage Verwaltung with s918_ prefix
const STORAGE_PREFIX = 's918_';

App.storage = {
  load() {
    const teamId = App.helpers.getCurrentTeamId();
    
    // ALL data should be team-specific
    App.data.selectedPlayers = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}selectedPlayers_${teamId}`)) || [];
    App.data.statsData = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}statsData_${teamId}`)) || {};
    App.data.playerTimes = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}playerTimes_${teamId}`)) || {};
    App.data.seasonData = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}seasonData_${teamId}`)) || {};
  },
  
  saveSelectedPlayers() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`${STORAGE_PREFIX}selectedPlayers_${teamId}`, JSON.stringify(App.data.selectedPlayers));
  },
  
  saveStatsData() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`${STORAGE_PREFIX}statsData_${teamId}`, JSON.stringify(App.data.statsData));
  },
  
  savePlayerTimes() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`${STORAGE_PREFIX}playerTimes_${teamId}`, JSON.stringify(App.data.playerTimes));
  },
  
  saveSeasonData() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`${STORAGE_PREFIX}seasonData_${teamId}`, JSON.stringify(App.data.seasonData));
  },
  
  saveAll() {
    this.saveSelectedPlayers();
    this.saveStatsData();
    this.savePlayerTimes();
    this.saveSeasonData();
  },
  
  getCurrentPage() {
    return localStorage.getItem(`${STORAGE_PREFIX}currentPage`) || "selection";
  },
  
  setCurrentPage(page) {
    localStorage.setItem(`${STORAGE_PREFIX}currentPage`, page);
  }
};

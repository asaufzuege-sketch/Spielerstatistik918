// LocalStorage Verwaltung
App.storage = {
  load() {
    const teamId = App.helpers.getCurrentTeamId();
    
    // ALL data should be team-specific
    App.data.selectedPlayers = JSON.parse(localStorage.getItem(`selectedPlayers_${teamId}`)) || [];
    App.data.statsData = JSON.parse(localStorage.getItem(`statsData_${teamId}`)) || {};
    App.data.playerTimes = JSON.parse(localStorage.getItem(`playerTimes_${teamId}`)) || {};
    App.data.seasonData = JSON.parse(localStorage.getItem(`seasonData_${teamId}`)) || {};
  },
  
  saveSelectedPlayers() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`selectedPlayers_${teamId}`, JSON.stringify(App.data.selectedPlayers));
  },
  
  saveStatsData() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`statsData_${teamId}`, JSON.stringify(App.data.statsData));
  },
  
  savePlayerTimes() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`playerTimes_${teamId}`, JSON.stringify(App.data.playerTimes));
  },
  
  saveSeasonData() {
    const teamId = App.helpers.getCurrentTeamId();
    localStorage.setItem(`seasonData_${teamId}`, JSON.stringify(App.data.seasonData));
  },
  
  saveAll() {
    this.saveSelectedPlayers();
    this.saveStatsData();
    this.savePlayerTimes();
    this.saveSeasonData();
  },
  
  getCurrentPage() {
    return localStorage.getItem("currentPage") || "selection";
  },
  
  setCurrentPage(page) {
    localStorage.setItem("currentPage", page);
  }
};

// LocalStorage Verwaltung
App.storage = {
  load() {
    App.data.selectedPlayers = JSON.parse(localStorage.getItem("selectedPlayers")) || [];
    App.data.statsData = JSON.parse(localStorage.getItem("statsData")) || {};
    App.data.playerTimes = JSON.parse(localStorage.getItem("playerTimes")) || {};
    const teamId = App.helpers.getCurrentTeamId();
    App.data.seasonData = JSON.parse(localStorage.getItem(`seasonData_${teamId}`)) || {};
  },
  
  saveSelectedPlayers() {
    localStorage.setItem("selectedPlayers", JSON.stringify(App.data.selectedPlayers));
  },
  
  saveStatsData() {
    localStorage.setItem("statsData", JSON.stringify(App.data.statsData));
  },
  
  savePlayerTimes() {
    localStorage.setItem("playerTimes", JSON.stringify(App.data.playerTimes));
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

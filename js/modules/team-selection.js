// Team Selection Module
App.teamSelection = (function() {
    console.log('Team Selection Module loading...');
    
    const TEAMS = [
        { id: 'team1', name: 'Team 1' },
        { id: 'team2', name: 'Team 2' },
        { id: 'team3', name: 'Team 3' }
    ];
    
    let currentTeamId = null;
    let editingTeamId = null;
    
    function init() {
        console.log('Initializing Team Selection');
        
        // Load teams from localStorage or create defaults
        initializeTeams();
        
        // Render team selection UI
        renderTeamSelection();
        
        // Setup modal listeners
        setupModalListeners();
        
        // Load saved current team
        const savedTeamId = localStorage.getItem('currentTeamId');
        if (savedTeamId && getTeam(savedTeamId)) {
            currentTeamId = savedTeamId;
        }
    }
    
    function initializeTeams() {
        // Initialize teams if they don't exist
        TEAMS.forEach(team => {
            const teamData = localStorage.getItem(team.id);
            if (!teamData) {
                // Create empty team with no players
                saveTeam(team.id, {
                    name: team.name,
                    players: []
                });
            }
        });
    }
    
    function renderTeamSelection() {
        const container = document.getElementById('teamSelectionContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        TEAMS.forEach(teamDef => {
            const teamData = getTeam(teamDef.id);
            if (!teamData) return;
            
            const teamSlot = document.createElement('div');
            teamSlot.className = 'team-slot';
            
            const teamDisplay = document.createElement('div');
            teamDisplay.className = 'team-display';
            
            const teamTitle = document.createElement('h3');
            teamTitle.textContent = teamData.name;
            
            // For Team 1, show count of available players from App.data.players
            // For Team 2 & 3, show count of players from playerSelectionData
            let playersWithNames = 0;
            if (teamDef.id === 'team1') {
                // Count players with names from App.data.players
                playersWithNames = App.data.players ? App.data.players.filter(p => p.name && p.name.trim() !== '').length : 0;
            } else {
                // Count players with names from playerSelectionData for Team 2 & 3
                const savedPlayersKey = `playerSelectionData_${teamDef.id}`;
                try {
                    const savedPlayers = JSON.parse(localStorage.getItem(savedPlayersKey) || '[]');
                    playersWithNames = savedPlayers.filter(p => p.name && p.name.trim() !== '').length;
                } catch (e) {
                    playersWithNames = 0;
                }
            }
            const teamInfo = document.createElement('p');
            teamInfo.className = 'team-name';
            teamInfo.textContent = `${playersWithNames} Players`;
            
            teamDisplay.appendChild(teamTitle);
            teamDisplay.appendChild(teamInfo);
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'team-button-group';
            
            const selectBtn = document.createElement('button');
            selectBtn.className = 'team-btn';
            selectBtn.textContent = 'Select';
            selectBtn.onclick = () => selectTeam(teamDef.id);
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-team-btn';
            editBtn.innerHTML = '✏️';
            editBtn.onclick = () => openEditModal(teamDef.id);
            
            buttonGroup.appendChild(selectBtn);
            buttonGroup.appendChild(editBtn);
            
            teamSlot.appendChild(teamDisplay);
            teamSlot.appendChild(buttonGroup);
            
            container.appendChild(teamSlot);
        });
        
        updateButtonStates();
    }
    
    function updateButtonStates() {
        const container = document.getElementById('teamSelectionContainer');
        if (!container) return;
        
        const buttons = container.querySelectorAll('.team-btn');
        buttons.forEach((btn, index) => {
            const teamId = TEAMS[index].id;
            if (currentTeamId === teamId) {
                btn.classList.add('active-team');
                btn.textContent = 'Selected';
            } else {
                btn.classList.remove('active-team');
                btn.textContent = 'Select';
            }
        });
    }
    
    function selectTeam(teamId) {
        console.log('Selecting team:', teamId);
        currentTeamId = teamId;
        localStorage.setItem('currentTeamId', teamId);
        updateButtonStates();
        
        // Navigate to player selection
        if (App.showPage) {
            App.showPage('selection');
        }
    }
    
    function openEditModal(teamId) {
        editingTeamId = teamId;
        const teamData = getTeam(teamId);
        if (!teamData) return;
        
        const modal = document.getElementById('teamEditModal');
        const input = document.getElementById('teamNameInput');
        
        if (modal && input) {
            input.value = teamData.name;
            modal.style.display = 'flex';
            input.focus();
        }
    }
    
    function closeEditModal() {
        const modal = document.getElementById('teamEditModal');
        if (modal) {
            modal.style.display = 'none';
        }
        editingTeamId = null;
    }
    
    function saveTeamName() {
        if (!editingTeamId) return;
        
        const input = document.getElementById('teamNameInput');
        const newName = input ? input.value.trim() : '';
        
        if (newName) {
            const teamData = getTeam(editingTeamId);
            if (teamData) {
                teamData.name = newName;
                saveTeam(editingTeamId, teamData);
                renderTeamSelection();
            }
        }
        
        closeEditModal();
    }
    
    function setupModalListeners() {
        const saveBtn = document.getElementById('saveTeamNameBtn');
        const cancelBtn = document.getElementById('cancelTeamEditBtn');
        const modal = document.getElementById('teamEditModal');
        const input = document.getElementById('teamNameInput');
        
        if (saveBtn) {
            saveBtn.onclick = saveTeamName;
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = closeEditModal;
        }
        
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    closeEditModal();
                }
            };
        }
        
        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    saveTeamName();
                }
            };
        }
    }
    
    function getTeam(teamId) {
        const data = localStorage.getItem(teamId);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Error parsing team data:', e);
                return null;
            }
        }
        return null;
    }
    
    function saveTeam(teamId, data) {
        localStorage.setItem(teamId, JSON.stringify(data));
    }
    
    function saveTeams() {
        // Already saved via individual saveTeam calls
    }
    
    function getCurrentTeamInfo() {
        if (!currentTeamId) return null;
        const teamData = getTeam(currentTeamId);
        return teamData ? { id: currentTeamId, ...teamData } : null;
    }
    
    function resetCurrentTeam() {
        if (!currentTeamId) return false;
        
        const teamData = getTeam(currentTeamId);
        if (teamData) {
            teamData.players = [];
            saveTeam(currentTeamId, teamData);
            renderTeamSelection();
            return true;
        }
        return false;
    }
    
    // Language content for Info Modal
    const infoContent = {
        de: `Ablauf (Spiel)

1. Team Selection: Team wählen oder bearbeiten 
2. Player Selection: Spieler erfassen/aktivieren; bei Bedarf direkt zu Line Up oder Game Data. 
3. Line Up: Aufstellung setzen (Manuell, Normal + Power vorgegeben durch KI/AI)
4. Game Data: Spieldaten erfassen
5. Goal Map: Punkte im Feld/Tor/Time setzen, zurück zu Game Data. 
6. Nach Spiel: Goal Value je Gegner einschätzen (Schwierigkeit). 
7. Download: Game → Season und Season Map exportieren, um die Saison auszuwerten.

________________________________________

Team Selection
• Team wählen oder bearbeiten

________________________________________

Player Selection
• Spieler erfassen/bearbeiten: Nummer, Name, Position (G = Goalie, W = Wing, C= Center, D = Defense).
• Aktivieren (Checkbox) = Spieler ist für Line Up / Game Data verfügbar.
• Buttons: „Line Up" → zur Aufstellung; „Game Data" → direkt zur Spiel-Erfassung.

________________________________________

Line Up
Modi (umschaltbar per Modus-Button):
• Normal: Vorgabe durch KI/AI-Logik.
• Power: Spezial-Setup durch KI/AI für entscheidende Szenen.
• Manuell: Frei per Klick auf Position belegen.
• „Player Out": Spieler als OUT markieren (Bei Penalty-Strafe). Line Up wird automatisch angepasst.
• Positions-Buttons aus Player Selection zeigen den zugewiesenen Spieler; in Manuell per Klick wählbar, in Normal/Power vorgegeben.

________________________________________

Game Data
Spielerzeile:
• Klick auf Namen (nicht auf ⋮⋮): Timer Start/Stop.
• Klick auf Zeit: +10 s; Doppelklick: –10 s.
• Langer Druck auf ⋮⋮ → Drag & Drop für Reihenfolge

Statistikzellen (z. B. Goals, Shot):
• Klick: +1, Doppelklick: –1.
• Bei +1 auf Goals/Shot startet je nach Ereignis der Goal- bzw. Shot-Workflow in der Goal Map.

Gegner-Schüsse: In der Shot-Totals-Zelle (unten) per Klick/Doppelklick zählen (team-spezifisch).

Download Game → Season: Spiel in Saisonstatistik übertragen

________________________________________

Goal Map
Feldhälften: Oben = scored (grün), Unten = conceded (rot).

Goal-Workflow (Tor):
• Feldpunkt: Oben→scored, Unten→conceded (legt Art fest).
• Torpunkt: scored→nur grünes Tor; conceded→nur rotes Tor.
• Time-Button: scored→nur obere Reihe (grün); conceded→nur untere Reihe (rot).
• Danach Auto-Return zu Game Data.

Shot-Workflow (Schuss): Nur Feldpunkt (grüne Zone), kein Tor/Time; Auto-Return.

Goalie-Pflicht: Rotes Tor und rote Feldpunkte ohne Workflow nur mit aktivem Goalie im Dropdown.

Marker/Timeboxen bleiben bis Reset; Download/Export kopiert alles zur Season Map.

________________________________________

Season Map
• Only read

Filter:
• Player-Filter: Zeigt/aggregiert grüne (scored) Werte nur für diesen Spieler.
• Goalie-Filter: Zeigt/aggregiert rote (conceded) Werte nur für diesen Goalie.

Momentum-Grafik:
• Mit Player-Filter: grüne Werte nur dieses Spielers.
• Mit Goalie-Filter: rote Werte nur dieses Goalies.
• Ohne Filter: Gesamtwerte.

________________________________________

Goal Value
• Manuelle Eingabe der erzielten Tore gegen den jeweiligen Gegner
• Untere Skala (Bottom) gewichtet Gegnerstärke; Value = Summe (Wert × Gewicht).
• Reset setzt alle Werte, Skalen und Gegnernamen zurück.
• Goal Value wird für Season Gesamtstatistik benötigt.

________________________________________

Season
• Feldspieler-Saisonwerte (Goalies ausgeblendet).
• Klick/Doppelklick auf Werte: +1/–1 (bei +/- auch negativ).
• Long-Press auf Time-Zelle: Zusätzliche Zeit kann manuell eingegeben werden.
• Positionsfilter (Dropdown „Pos.").
• MVP Points/MVP = Wertvollster Spieler gemäss analysierter Statistik (KI/AI)

________________________________________

Reset (irreversibel)
• Game Data: Jede Seite Kann/muss einzeln zurückgesetzt werden`,
        
        en: `Workflow (Game)

1. Team Selection: Choose or edit team.
2. Player Selection: Add/activate players; go directly to Line Up or Game Data if needed.
3. Line Up: Set lineup (Manual, Normal + Power preset by AI)
4. Game Data: Record game data
5. Goal Map: Set points in field/goal/time, return to Game Data.
6. After Game: Assess Goal Value per opponent (difficulty).
7. Download: Export Game → Season and Season Map to analyze the season.

________________________________________

Team Selection
• Choose or edit team

________________________________________

Player Selection
• Add/edit players: Number, Name, Position (G = Goalie, W = Wing, C = Center, D = Defense).
• Activate (checkbox) = Player available for Line Up / Game Data.
• Buttons: "Line Up" → to lineup; "Game Data" → directly to game recording.

________________________________________

Line Up
Modes (switchable via mode button):
• Normal: Preset by AI logic.
• Power: Special AI setup for decisive moments.
• Manual: Free assignment by clicking positions.
• "Player Out": Mark player as OUT (penalty). Line Up adjusts automatically.
• Position buttons from Player Selection show assigned player; in Manual clickable, in Normal/Power preset.

________________________________________

Game Data
Player Row:
• Click on name (not on ⋮⋮): Timer Start/Stop.
• Click on time: +10 s; Double-click: –10 s.
• Long press on ⋮⋮ → Drag & Drop for order

Stat Cells (e.g., Goals, Shot):
• Click: +1, Double-click: –1.
• +1 on Goals/Shot triggers corresponding workflow in Goal Map.

Opponent Shots: Count in Shot-Totals cell (bottom) via click/double-click (team-specific).

Download Game → Season: Transfer game to season stats

________________________________________

Goal Map
Field Halves: Top = scored (green), Bottom = conceded (red).

Goal Workflow:
• Field point: Top→scored, Bottom→conceded (sets type).
• Goal point: scored→green goal only; conceded→red goal only.
• Time button: scored→top row only (green); conceded→bottom row only (red).
• Then auto-return to Game Data.

Shot Workflow: Field point only (green zone), no goal/time; auto-return.

Goalie Required: Red goal and red field points without workflow only with active goalie in dropdown.

Markers/Time boxes remain until Reset; Download/Export copies everything to Season Map.

________________________________________

Season Map
• Read only

Filters:
• Player Filter: Shows/aggregates green (scored) values for this player only.
• Goalie Filter: Shows/aggregates red (conceded) values for this goalie only.

Momentum Chart:
• With Player Filter: green values of this player only.
• With Goalie Filter: red values of this goalie only.
• Without filter: Total values.

________________________________________

Goal Value
• Manual entry of goals scored against each opponent
• Bottom scale weights opponent strength; Value = Sum (value × weight).
• Reset clears all values, scales, and opponent names.
• Goal Value is needed for Season overall statistics.

________________________________________

Season
• Field player season values (goalies hidden).
• Click/double-click on values: +1/–1 (+/- can be negative).
• Long-press on time cell: Additional time can be entered manually.
• Position filter (dropdown "Pos.").
• MVP Points/MVP = Most Valuable Player based on analyzed statistics (AI)

________________________________________

Reset (irreversible)
• Game Data: Each page can/must be reset individually`,
        
        ru: `Порядок действий (Игра)

1. Team Selection: Выбрать или редактировать команду.
2. Player Selection: Добавить/активировать игроков; при необходимости перейти в Line Up или Game Data.
3. Line Up: Установить состав (Ручной, Normal + Power предустановлены ИИ)
4. Game Data: Записать игровые данные
5. Goal Map: Установить точки на поле/воротах/времени, вернуться в Game Data.
6. После игры: Оценить Goal Value по соперникам (сложность).
7. Download: Экспортировать Game → Season и Season Map для анализа сезона.

________________________________________

Team Selection
• Выбрать или редактировать команду

________________________________________

Player Selection
• Добавить/редактировать игроков: Номер, Имя, Позиция (G = Вратарь, W = Крайний, C = Центр, D = Защитник).
• Активировать (чекбокс) = Игрок доступен для Line Up / Game Data.
• Кнопки: «Line Up» → к составу; «Game Data» → сразу к записи игры.

________________________________________

Line Up
Режимы (переключаются кнопкой режима):
• Normal: Предустановка логикой ИИ.
• Power: Специальная расстановка ИИ для решающих моментов.
• Manual: Свободное назначение кликом на позицию.
• «Player Out»: Отметить игрока как OUT (штраф). Line Up корректируется автоматически.
• Кнопки позиций из Player Selection показывают назначенного игрока; в Manual кликабельны, в Normal/Power предустановлены.

________________________________________

Game Data
Строка игрока:
• Клик по имени (не по ⋮⋮): Таймер Старт/Стоп.
• Клик по времени: +10 с; Двойной клик: –10 с.
• Долгое нажатие на ⋮⋮ → Drag & Drop для порядка

Ячейки статистики (например, Goals, Shot):
• Клик: +1, Двойной клик: –1.
• +1 на Goals/Shot запускает соответствующий процесс в Goal Map.

Броски соперника: Считать в ячейке Shot-Totals (внизу) кликом/двойным кликом (для команды).

Download Game → Season: Перенести игру в сезонную статистику

________________________________________

Goal Map
Половины поля: Верх = забито (зелёный), Низ = пропущено (красный).

Goal Workflow:
• Точка на поле: Верх→забито, Низ→пропущено (определяет тип).
• Точка ворот: забито→только зелёные ворота; пропущено→только красные ворота.
• Кнопка времени: забито→только верхний ряд (зелёный); пропущено→только нижний ряд (красный).
• Затем авто-возврат в Game Data.

Shot Workflow: Только точка на поле (зелёная зона), без ворот/времени; авто-возврат.

Требуется вратарь: Красные ворота и красные точки на поле без workflow только с активным вратарём в выпадающем списке.

Маркеры/Тайм-боксы сохраняются до Reset; Download/Export копирует всё в Season Map.

________________________________________

Season Map
• Только просмотр

Фильтры:
• Player Filter: Показывает/суммирует зелёные (забитые) значения только для этого игрока.
• Goalie Filter: Показывает/суммирует красные (пропущенные) значения только для этого вратаря.

Momentum-график:
• С Player Filter: зелёные значения только этого игрока.
• С Goalie Filter: красные значения только этого вратаря.
• Без фильтра: Общие значения.

________________________________________

Goal Value
• Ручной ввод забитых голов против каждого соперника
• Нижняя шкала (Bottom) весит силу соперника; Value = Сумма (значение × вес).
• Reset сбрасывает все значения, шкалы и имена соперников.
• Goal Value нужен для общей статистики Season.

________________________________________

Season
• Сезонные показатели полевых игроков (вратари скрыты).
• Клик/двойной клик по значениям: +1/–1 (+/- может быть отрицательным).
• Долгое нажатие на ячейку времени: Дополнительное время можно ввести вручную.
• Фильтр позиции (выпадающий «Pos.»).
• MVP Points/MVP = Самый ценный игрок по анализу статистики (ИИ)

________________________________________

Reset (необратимо)
• Game Data: Каждую страницу можно/нужно сбросить отдельно`,
        
        sv: `Arbetsflöde (Match)

1. Team Selection: Välj eller redigera lag.
2. Player Selection: Lägg till/aktivera spelare; gå direkt till Line Up eller Game Data vid behov.
3. Line Up: Sätt uppställning (Manuell, Normal + Power förinställt av AI)
4. Game Data: Registrera matchdata
5. Goal Map: Sätt punkter i fält/mål/tid, återgå till Game Data.
6. Efter match: Bedöm Goal Value per motståndare (svårighetsgrad).
7. Download: Exportera Game → Season och Season Map för att analysera säsongen.

________________________________________

Team Selection
• Välj eller redigera lag

________________________________________

Player Selection
• Lägg till/redigera spelare: Nummer, Namn, Position (G = Målvakt, W = Wing, C = Center, D = Back).
• Aktivera (kryssruta) = Spelare tillgänglig för Line Up / Game Data.
• Knappar: "Line Up" → till uppställning; "Game Data" → direkt till matchregistrering.

________________________________________

Line Up
Lägen (växla via lägesknapp):
• Normal: Förinställt av AI-logik.
• Power: Speciell AI-uppställning för avgörande situationer.
• Manuell: Fritt val genom att klicka på positioner.
• "Player Out": Markera spelare som OUT (utvisning). Line Up justeras automatiskt.
• Positionsknappar från Player Selection visar tilldelad spelare; i Manuell klickbar, i Normal/Power förinställd.

________________________________________

Game Data
Spelarrad:
• Klicka på namn (inte på ⋮⋮): Timer Start/Stop.
• Klicka på tid: +10 s; Dubbelklicka: –10 s.
• Långtryck på ⋮⋮ → Drag & Drop för ordning

Statistikceller (t.ex. Goals, Shot):
• Klick: +1, Dubbelklick: –1.
• +1 på Goals/Shot startar motsvarande arbetsflöde i Goal Map.

Motståndarskott: Räkna i Shot-Totals-cellen (nederst) via klick/dubbelklick (lagspecifikt).

Download Game → Season: Överför match till säsongsstatistik

________________________________________

Goal Map
Fälthalvor: Övre = gjorda (grön), Nedre = insläppta (röd).

Goal Workflow:
• Fältpunkt: Övre→gjort, Nedre→insläppt (bestämmer typ).
• Målpunkt: gjort→endast grönt mål; insläppt→endast rött mål.
• Tidknapp: gjort→endast övre rad (grön); insläppt→endast nedre rad (röd).
• Sedan auto-återgång till Game Data.

Shot Workflow: Endast fältpunkt (grön zon), inget mål/tid; auto-återgång.

Målvakt krävs: Rött mål och röda fältpunkter utan workflow endast med aktiv målvakt i dropdown.

Markörer/Tidrutor kvarstår till Reset; Download/Export kopierar allt till Season Map.

________________________________________

Season Map
• Endast läsning

Filter:
• Player Filter: Visar/aggregerar gröna (gjorda) värden endast för denna spelare.
• Goalie Filter: Visar/aggregerar röda (insläppta) värden endast för denna målvakt.

Momentum-graf:
• Med Player Filter: gröna värden endast för denna spelare.
• Med Goalie Filter: röda värden endast för denna målvakt.
• Utan filter: Totalvärden.

________________________________________

Goal Value
• Manuell inmatning av gjorda mål mot varje motståndare
• Nedre skala (Bottom) viktar motståndares styrka; Value = Summa (värde × vikt).
• Reset återställer alla värden, skalor och motståndarnamn.
• Goal Value behövs för Season övergripande statistik.

________________________________________

Season
• Utespelares säsongsvärden (målvakter dolda).
• Klick/dubbelklick på värden: +1/–1 (+/- kan vara negativt).
• Långtryck på tidcell: Extra tid kan matas in manuellt.
• Positionsfilter (dropdown "Pos.").
• MVP Points/MVP = Mest värdefulla spelaren baserat på analyserad statistik (AI)

________________________________________

Reset (oåterkallelig)
• Game Data: Varje sida kan/måste återställas individuellt`,
        
        fi: `Työnkulku (Peli)

1. Team Selection: Valitse tai muokkaa joukkuetta.
2. Player Selection: Lisää/aktivoi pelaajia; siirry tarvittaessa suoraan Line Up tai Game Data.
3. Line Up: Aseta kokoonpano (Manuaalinen, Normal + Power esiasetettu tekoälyllä)
4. Game Data: Tallenna pelitiedot
5. Goal Map: Aseta pisteet kentälle/maaliin/aikaan, palaa Game Dataan.
6. Pelin jälkeen: Arvioi Goal Value vastustajittain (vaikeusaste).
7. Download: Vie Game → Season ja Season Map kauden analysointiin.

________________________________________

Team Selection
• Valitse tai muokkaa joukkuetta

________________________________________

Player Selection
• Lisää/muokkaa pelaajia: Numero, Nimi, Pelipaikka (G = Maalivahti, W = Laitahyökkääjä, C = Keskushyökkääjä, D = Puolustaja).
• Aktivoi (valintaruutu) = Pelaaja käytettävissä Line Up / Game Data.
• Painikkeet: "Line Up" → kokoonpanoon; "Game Data" → suoraan pelin tallennukseen.

________________________________________

Line Up
Tilat (vaihda tilapainikkeella):
• Normal: Tekoälyn logiikan esiasetus.
• Power: Erityinen tekoälyasettelu ratkaiseviin hetkiin.
• Manuaalinen: Vapaa valinta klikkaamalla paikkoja.
• "Player Out": Merkitse pelaaja OUT (jäähy). Line Up mukautuu automaattisesti.
• Paikkapainikkeet Player Selectionista näyttävät määrätyn pelaajan; Manuaalisessa klikattava, Normal/Powerissa esiasetettu.

________________________________________

Game Data
Pelaajarivi:
• Klikkaa nimeä (ei ⋮⋮): Ajastin Käynnistä/Pysäytä.
• Klikkaa aikaa: +10 s; Tuplaklikkaa: –10 s.
• Pitkä painallus ⋮⋮ → Vedä ja pudota järjestykseen

Tilastosolut (esim. Goals, Shot):
• Klikkaus: +1, Tuplaklikkaus: –1.
• +1 Goals/Shot käynnistää vastaavan työnkulun Goal Mapissa.

Vastustajan laukaukset: Laske Shot-Totals-solussa (alhaalla) klikkauksella/tuplaklikkauksella (joukkuekohtainen).

Download Game → Season: Siirrä peli kauden tilastoihin

________________________________________

Goal Map
Kenttäpuoliskot: Ylä = tehty (vihreä), Ala = päästetty (punainen).

Goal Workflow:
• Kenttäpiste: Ylä→tehty, Ala→päästetty (määrittää tyypin).
• Maalipiste: tehty→vain vihreä maali; päästetty→vain punainen maali.
• Aikapainike: tehty→vain ylärivit (vihreä); päästetty→vain alarivit (punainen).
• Sitten automaattinen paluu Game Dataan.

Shot Workflow: Vain kenttäpiste (vihreä alue), ei maalia/aikaa; automaattinen paluu.

Maalivahti vaaditaan: Punainen maali ja punaiset kenttäpisteet ilman työnkulkua vain aktiivisella maalivahdilla pudotusvalikossa.

Merkinnät/Aikalaatikot säilyvät Resetiin asti; Download/Export kopioi kaiken Season Mapiin.

________________________________________

Season Map
• Vain luku

Suodattimet:
• Player Filter: Näyttää/kokoaa vihreät (tehdyt) arvot vain tälle pelaajalle.
• Goalie Filter: Näyttää/kokoaa punaiset (päästetyt) arvot vain tälle maalivahdille.

Momentum-kaavio:
• Player Filterin kanssa: vihreät arvot vain tämän pelaajan.
• Goalie Filterin kanssa: punaiset arvot vain tämän maalivahdin.
• Ilman suodatinta: Kokonaisarvot.

________________________________________

Goal Value
• Manuaalinen syöttö tehdyistä maaleista kutakin vastustajaa vastaan
• Alaskala (Bottom) painottaa vastustajan vahvuutta; Value = Summa (arvo × paino).
• Reset nollaa kaikki arvot, asteikot ja vastustajien nimet.
• Goal Value tarvitaan Season kokonaistilastoihin.

________________________________________

Season
• Kenttäpelaajien kauden arvot (maalivahdit piilotettu).
• Klikkaus/tuplaklikkaus arvoihin: +1/–1 (+/- voi olla negatiivinen).
• Pitkä painallus aikasoluun: Lisäaika voidaan syöttää manuaalisesti.
• Pelipaikkassuodatin (pudotusvalikko "Pos.").
• MVP Points/MVP = Arvokkain pelaaja analysoidun tilaston perusteella (tekoäly)

________________________________________

Reset (peruuttamaton)
• Game Data: Jokainen sivu voidaan/täytyy nollata erikseen`
    };
    
    const closeButtonText = {
        de: 'Schließen',
        en: 'Close',
        ru: 'Закрыть',
        sv: 'Stäng',
        fi: 'Sulje'
    };
    
    function convertMarkdownToHTML(markdown) {
        // Split by dividers (________________________________________) to get sections
        const sections = markdown.split(/_{20,}/);
        let html = '';
        
        sections.forEach((section, index) => {
            section = section.trim();
            if (!section) return;
            
            const lines = section.split('\n');
            let sectionHtml = '';
            let currentList = null;
            let listType = null;
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue;
                
                // Check for numbered list (1. 2. 3. etc.)
                const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
                if (numberedMatch) {
                    if (!currentList || listType !== 'ol') {
                        if (currentList) sectionHtml += `</${listType}>`;
                        currentList = [];
                        listType = 'ol';
                    }
                    currentList.push(`<li>${numberedMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`);
                    continue;
                }
                
                // Check for bullet list (• or - at start)
                const bulletMatch = line.match(/^[•\-]\s+(.+)$/);
                if (bulletMatch) {
                    if (!currentList || listType !== 'ul') {
                        if (currentList) sectionHtml += `</${listType}>`;
                        currentList = [];
                        listType = 'ul';
                    }
                    currentList.push(`<li>${bulletMatch[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`);
                    continue;
                }
                
                // Close any open list before processing non-list items
                if (currentList) {
                    sectionHtml += `<${listType}>` + currentList.join('') + `</${listType}>`;
                    currentList = null;
                    listType = null;
                }
                
                // Check if line looks like a section title (first line of a section, not containing : or starting with number)
                if (i === 0 && !line.includes(':') && !line.match(/^\d+\./)) {
                    sectionHtml += `<h2 class="info-section-title">${line}</h2>`;
                } else {
                    // Regular paragraph
                    sectionHtml += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
                }
            }
            
            // Close any remaining list
            if (currentList) {
                sectionHtml += `<${listType}>` + currentList.join('') + `</${listType}>`;
            }
            
            // Add section to HTML
            if (sectionHtml) {
                html += sectionHtml;
                // Add divider after each section except the last one
                if (index < sections.length - 1) {
                    html += '<hr class="info-divider">';
                }
            }
        });
        
        return html;
    }
    
    function updateInfoContent(language) {
        const contentDiv = document.querySelector('.info-content');
        if (!contentDiv) return;
        
        const content = infoContent[language] || infoContent.de;
        const htmlContent = convertMarkdownToHTML(content);
        
        // Update content while preserving the language selector and close button
        const languageSelector = contentDiv.querySelector('.info-language-selector');
        const closeButton = contentDiv.querySelector('#infoCloseBtn');
        
        contentDiv.innerHTML = htmlContent;
        
        // Re-add language selector at the top
        if (languageSelector) {
            contentDiv.insertBefore(languageSelector, contentDiv.firstChild);
        }
        
        // Re-add close button at the bottom
        if (closeButton) {
            closeButton.textContent = closeButtonText[language] || closeButtonText.de;
            contentDiv.appendChild(closeButton);
        }
    }
    
    function showInfo() {
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        
        // Get saved language or default to German
        const savedLanguage = localStorage.getItem('infoLanguage') || 'de';
        
        modal.innerHTML = `
            <div class="info-content">
                <div class="info-language-selector">
                    <select id="infoLanguageSelect">
                        <option value="de">&#x1F1E9;&#x1F1EA; Deutsch</option>
                        <option value="en">&#x1F1FA;&#x1F1F8; English</option>
                        <option value="ru">&#x1F1F7;&#x1F1FA; Русский</option>
                        <option value="sv">&#x1F1F8;&#x1F1EA; Svenska</option>
                        <option value="fi">&#x1F1EB;&#x1F1EE; Suomi</option>
                    </select>
                </div>
                <button id="infoCloseBtn">${closeButtonText[savedLanguage]}</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set the saved language
        const languageSelect = document.getElementById('infoLanguageSelect');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
            
            // Load content for saved language
            updateInfoContent(savedLanguage);
            
            // Language change event listener
            languageSelect.addEventListener('change', (e) => {
                const selectedLanguage = e.target.value;
                localStorage.setItem('infoLanguage', selectedLanguage);
                updateInfoContent(selectedLanguage);
            });
        }
        
        // Close button event listener
        document.getElementById('infoCloseBtn')?.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Public API
    return {
        init,
        getCurrentTeamInfo,
        saveTeams,
        updateButtonStates,
        resetCurrentTeam,
        showInfo
    };
})();

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
        de: `## Ablauf-Empfehlung (Spiel)

1. **Team Selection:** Team wählen oder bearbeiten.
2. **Player Selection:** Spieler erfassen/aktivieren; bei Bedarf direkt zu Line Up oder Game Data.
3. **Line Up:** Aufstellung prüfen/setzen (Normal/Power vorgegeben durch KI/AI, Manuell frei).
4. **Game Data:** Spiel erfassen; Goals/Shot starten Workflows in der Goal Map.
5. **Goal Map:** Punkte im Feld/Tor/Time setzen, zurück zu Game Data.
6. **Nach Spiel:** Goal Value je Gegner einschätzen (Schwierigkeit).
7. **Download:** Game → Season und Season Map exportieren, um die Saison auszuwerten.

---

## Team Selection
Team wählen oder bearbeiten (team-spezifische Daten/Reihenfolgen).

---

## Player Selection
- Spieler erfassen/bearbeiten: Nummer, Name, Position (G = Goalie, sonst Feld).
- Aktivieren (Checkbox) = Spieler ist für Line Up / Game Data verfügbar.
- Buttons: „Line Up" → zur Aufstellung; „Game Data" → direkt zur Spiel-Erfassung.

---

## Line Up
**Modi (umschaltbar per Modus-Button):**
- **Normal:** Vorgabe durch KI/AI-Logik.
- **Power:** Spezial-Setup durch KI/AI für entscheidende Szenen.
- **Manuell:** Frei per Klick auf Position belegen.

- „Player Out": Spieler als OUT markieren (aus allen Modi entfernt).
- Positions-Buttons zeigen den zugewiesenen Spieler; in Manuell per Klick wählbar, in Normal/Power vorgegeben.

---

## Game Data
**Spielerzeile:**
- Klick auf Namen (nicht auf ⋮⋮): Timer Start/Stop.
- Klick auf Zeit: +10 s; Doppelklick: –10 s.
- Langer Druck auf ⋮⋮ → Drag & Drop für Reihenfolge; Reihenfolge wird team-spezifisch gespeichert.

**Statistikzellen (z. B. Goals, Shot):**
- Klick: +1, Doppelklick: –1.
- Bei +1 auf Goals/Shot startet je nach Ereignis der Goal- bzw. Shot-Workflow in der Goal Map.

**Gegner-Schüsse:** In der Shot-Totals-Zelle (unten) per Klick/Doppelklick zählen (team-spezifisch).

**Download Game → Season:** Spiel in Saisonstatistik übertragen (optional Game Data leeren).

---

## Goal Map
**Feldhälften:** Oben = scored (grün), Unten = conceded (rot).

**Goal-Workflow (Tor):**
- Feldpunkt: Oben→scored, Unten→conceded (legt Art fest).
- Torpunkt: scored→nur grünes Tor; conceded→nur rotes Tor.
- Time-Button: scored→nur obere Reihe (grün); conceded→nur untere Reihe (rot).
- Danach Auto-Return zu Game Data.

**Shot-Workflow (Schuss):** Nur Feldpunkt (grüne Zone), kein Tor/Time; Auto-Return.

**Goalie-Pflicht:** Rotes Tor und rote Feldpunkte ohne Workflow nur mit aktivem Goalie im Dropdown.

**Marker/Timeboxen** bleiben bis Reset; Download/Export kopiert alles zur Season Map.

---

## Season Map
- Read-only Anzeige exportierter Goal-Map-Daten (Marker, Timeboxen).

**Filter:**
- **Player-Filter:** Zeigt/aggregiert grüne (scored) Werte nur für diesen Spieler.
- **Goalie-Filter:** Zeigt/aggregiert rote (conceded) Werte nur für diesen Goalie.

**Momentum-Grafik:**
- Mit Player-Filter: grüne Werte nur dieses Spielers.
- Mit Goalie-Filter: rote Werte nur dieses Goalies.
- Ohne Filter: Gesamtwerte.

**Download als PNG:** Boxen weiß hinterlegt, Header zeigt aktuelle Filter.

---

## Goal Value
- Matrix Spieler × Gegner: Klick +1, Doppelklick –1 (keine Goalies).
- Untere Skala (Bottom) gewichtet Gegnerstärke; Value = Summe (Wert × Gewicht).
- Reset setzt alle Werte, Skalen und Gegnernamen zurück.

---

## Season (Saison-Tabelle)
- Feldspieler-Saisonwerte (Goalies ausgeblendet).
- Klick/Doppelklick auf Werte: +1/–1 (bei +/- auch negativ).
- Long-Press auf Time-Zelle: Zeitdialog.
- Positionsfilter (Dropdown „Pos.").
- Download Season CSV (neu: „Download" statt „Export").

---

## Reset (irreversibel)
- **Game Data:** statsData, playerTimes, Timer, Gegner-Schüsse (team-spezifisch).
- **Goal Map:** Marker, Timeboxen, timeData/timeDataWithPlayers, goalMapMarkers.
- **Season Map:** seasonMapMarkers, seasonMapTimeData, seasonMapTimeDataWithPlayers, Momentum-Container.
- **Goal Value:** Werte/Skalen/Gegnernamen.
- **Season:** seasonData.`,
        
        en: `## Recommended Workflow (Game)

1. **Team Selection:** Choose or edit team.
2. **Player Selection:** Add/activate players; go directly to Line Up or Game Data if needed.
3. **Line Up:** Check/set lineup (Normal/Power preset by AI, Manual free choice).
4. **Game Data:** Record game; Goals/Shot trigger workflows in Goal Map.
5. **Goal Map:** Set points in field/goal/time, return to Game Data.
6. **After Game:** Assess Goal Value per opponent (difficulty).
7. **Download:** Export Game → Season and Season Map to analyze the season.

---

## Team Selection
Choose or edit team (team-specific data/order).

---

## Player Selection
- Add/edit players: Number, Name, Position (G = Goalie, otherwise field player).
- Activate (checkbox) = Player available for Line Up / Game Data.
- Buttons: "Line Up" → to lineup; "Game Data" → directly to game recording.

---

## Line Up
**Modes (switchable via mode button):**
- **Normal:** Preset by AI logic.
- **Power:** Special AI setup for decisive moments.
- **Manual:** Free assignment by clicking positions.

- "Player Out": Mark player as OUT (removed from all modes).
- Position buttons show assigned player; in Manual clickable, in Normal/Power preset.

---

## Game Data
**Player Row:**
- Click on name (not on ⋮⋮): Timer Start/Stop.
- Click on time: +10 s; Double-click: –10 s.
- Long press on ⋮⋮ → Drag & Drop for order; order saved team-specifically.

**Stat Cells (e.g., Goals, Shot):**
- Click: +1, Double-click: –1.
- +1 on Goals/Shot triggers corresponding workflow in Goal Map.

**Opponent Shots:** Count in Shot-Totals cell (bottom) via click/double-click (team-specific).

**Download Game → Season:** Transfer game to season stats (optionally clear Game Data).

---

## Goal Map
**Field Halves:** Top = scored (green), Bottom = conceded (red).

**Goal Workflow:**
- Field point: Top→scored, Bottom→conceded (sets type).
- Goal point: scored→green goal only; conceded→red goal only.
- Time button: scored→top row only (green); conceded→bottom row only (red).
- Then auto-return to Game Data.

**Shot Workflow:** Field point only (green zone), no goal/time; auto-return.

**Goalie Required:** Red goal and red field points without workflow only with active goalie in dropdown.

**Markers/Time boxes** remain until Reset; Download/Export copies everything to Season Map.

---

## Season Map
- Read-only display of exported Goal Map data (markers, time boxes).

**Filters:**
- **Player Filter:** Shows/aggregates green (scored) values for this player only.
- **Goalie Filter:** Shows/aggregates red (conceded) values for this goalie only.

**Momentum Chart:**
- With Player Filter: green values of this player only.
- With Goalie Filter: red values of this goalie only.
- Without filter: Total values.

**Download as PNG:** Boxes with white background, header shows current filters.

---

## Goal Value
- Matrix Players × Opponents: Click +1, Double-click –1 (no goalies).
- Bottom scale weights opponent strength; Value = Sum (value × weight).
- Reset clears all values, scales, and opponent names.

---

## Season (Season Table)
- Field player season values (goalies hidden).
- Click/double-click on values: +1/–1 (+/- can be negative).
- Long-press on time cell: Time dialog.
- Position filter (dropdown "Pos.").
- Download Season CSV (new: "Download" instead of "Export").

---

## Reset (irreversible)
- **Game Data:** statsData, playerTimes, timer, opponent shots (team-specific).
- **Goal Map:** Markers, time boxes, timeData/timeDataWithPlayers, goalMapMarkers.
- **Season Map:** seasonMapMarkers, seasonMapTimeData, seasonMapTimeDataWithPlayers, momentum container.
- **Goal Value:** Values/scales/opponent names.
- **Season:** seasonData.`,
        
        ru: `## Рекомендуемый порядок действий (Игра)

1. **Team Selection:** Выбрать или редактировать команду.
2. **Player Selection:** Добавить/активировать игроков; при необходимости перейти в Line Up или Game Data.
3. **Line Up:** Проверить/установить состав (Normal/Power предустановлены ИИ, Manual свободный выбор).
4. **Game Data:** Записать игру; Goals/Shot запускают процессы в Goal Map.
5. **Goal Map:** Установить точки на поле/воротах/времени, вернуться в Game Data.
6. **После игры:** Оценить Goal Value по соперникам (сложность).
7. **Download:** Экспортировать Game → Season и Season Map для анализа сезона.

---

## Team Selection
Выбрать или редактировать команду (данные/порядок для команды).

---

## Player Selection
- Добавить/редактировать игроков: Номер, Имя, Позиция (G = Вратарь, иначе полевой игрок).
- Активировать (чекбокс) = Игрок доступен для Line Up / Game Data.
- Кнопки: «Line Up» → к составу; «Game Data» → сразу к записи игры.

---

## Line Up
**Режимы (переключаются кнопкой режима):**
- **Normal:** Предустановка логикой ИИ.
- **Power:** Специальная расстановка ИИ для решающих моментов.
- **Manual:** Свободное назначение кликом на позицию.

- «Player Out»: Отметить игрока как OUT (удалён из всех режимов).
- Кнопки позиций показывают назначенного игрока; в Manual кликабельны, в Normal/Power предустановлены.

---

## Game Data
**Строка игрока:**
- Клик по имени (не по ⋮⋮): Таймер Старт/Стоп.
- Клик по времени: +10 с; Двойной клик: –10 с.
- Долгое нажатие на ⋮⋮ → Drag & Drop для порядка; порядок сохраняется для команды.

**Ячейки статистики (например, Goals, Shot):**
- Клик: +1, Двойной клик: –1.
- +1 на Goals/Shot запускает соответствующий процесс в Goal Map.

**Броски соперника:** Считать в ячейке Shot-Totals (внизу) кликом/двойным кликом (для команды).

**Download Game → Season:** Перенести игру в сезонную статистику (опционально очистить Game Data).

---

## Goal Map
**Половины поля:** Верх = забито (зелёный), Низ = пропущено (красный).

**Goal Workflow (Гол):**
- Точка на поле: Верх→забито, Низ→пропущено (определяет тип).
- Точка ворот: забито→только зелёные ворота; пропущено→только красные ворота.
- Кнопка времени: забито→только верхний ряд (зелёный); пропущено→только нижний ряд (красный).
- Затем авто-возврат в Game Data.

**Shot Workflow (Бросок):** Только точка на поле (зелёная зона), без ворот/времени; авто-возврат.

**Требуется вратарь:** Красные ворота и красные точки на поле без workflow только с активным вратарём в выпадающем списке.

**Маркеры/Тайм-боксы** сохраняются до Reset; Download/Export копирует всё в Season Map.

---

## Season Map
- Только просмотр экспортированных данных Goal Map (маркеры, тайм-боксы).

**Фильтры:**
- **Player Filter:** Показывает/суммирует зелёные (забитые) значения только для этого игрока.
- **Goalie Filter:** Показывает/суммирует красные (пропущенные) значения только для этого вратаря.

**Momentum-график:**
- С Player Filter: зелёные значения только этого игрока.
- С Goalie Filter: красные значения только этого вратаря.
- Без фильтра: Общие значения.

**Скачать как PNG:** Боксы с белым фоном, заголовок показывает текущие фильтры.

---

## Goal Value
- Матрица Игроки × Соперники: Клик +1, Двойной клик –1 (без вратарей).
- Нижняя шкала (Bottom) весит силу соперника; Value = Сумма (значение × вес).
- Reset сбрасывает все значения, шкалы и имена соперников.

---

## Season (Таблица сезона)
- Сезонные показатели полевых игроков (вратари скрыты).
- Клик/двойной клик по значениям: +1/–1 (+/- может быть отрицательным).
- Долгое нажатие на ячейку времени: Диалог времени.
- Фильтр позиции (выпадающий «Pos.»).
- Скачать Season CSV (новое: «Download» вместо «Export»).

---

## Reset (необратимо)
- **Game Data:** statsData, playerTimes, таймер, броски соперника (для команды).
- **Goal Map:** Маркеры, тайм-боксы, timeData/timeDataWithPlayers, goalMapMarkers.
- **Season Map:** seasonMapMarkers, seasonMapTimeData, seasonMapTimeDataWithPlayers, momentum-контейнер.
- **Goal Value:** Значения/шкалы/имена соперников.
- **Season:** seasonData.`,
        
        sv: `## Rekommenderat arbetsflöde (Match)

1. **Team Selection:** Välj eller redigera lag.
2. **Player Selection:** Lägg till/aktivera spelare; gå direkt till Line Up eller Game Data vid behov.
3. **Line Up:** Kontrollera/sätt uppställning (Normal/Power förinställt av AI, Manual fritt val).
4. **Game Data:** Registrera match; Goals/Shot startar arbetsflöden i Goal Map.
5. **Goal Map:** Sätt punkter i fält/mål/tid, återgå till Game Data.
6. **Efter match:** Bedöm Goal Value per motståndare (svårighetsgrad).
7. **Download:** Exportera Game → Season och Season Map för att analysera säsongen.

---

## Team Selection
Välj eller redigera lag (lagspecifik data/ordning).

---

## Player Selection
- Lägg till/redigera spelare: Nummer, Namn, Position (G = Målvakt, annars utespelare).
- Aktivera (kryssruta) = Spelare tillgänglig för Line Up / Game Data.
- Knappar: "Line Up" → till uppställning; "Game Data" → direkt till matchregistrering.

---

## Line Up
**Lägen (växla via lägesknapp):**
- **Normal:** Förinställt av AI-logik.
- **Power:** Speciell AI-uppställning för avgörande situationer.
- **Manual:** Fritt val genom att klicka på positioner.

- "Player Out": Markera spelare som OUT (borttagen från alla lägen).
- Positionsknappar visar tilldelad spelare; i Manual klickbar, i Normal/Power förinställd.

---

## Game Data
**Spelarrad:**
- Klicka på namn (inte på ⋮⋮): Timer Start/Stop.
- Klicka på tid: +10 s; Dubbelklicka: –10 s.
- Långtryck på ⋮⋮ → Drag & Drop för ordning; ordning sparas lagspecifikt.

**Statistikceller (t.ex. Goals, Shot):**
- Klick: +1, Dubbelklick: –1.
- +1 på Goals/Shot startar motsvarande arbetsflöde i Goal Map.

**Motståndarskott:** Räkna i Shot-Totals-cellen (nederst) via klick/dubbelklick (lagspecifikt).

**Download Game → Season:** Överför match till säsongsstatistik (valfritt rensa Game Data).

---

## Goal Map
**Fälthalvor:** Övre = gjorda (grön), Nedre = insläppta (röd).

**Goal Workflow:**
- Fältpunkt: Övre→gjort, Nedre→insläppt (bestämmer typ).
- Målpunkt: gjort→endast grönt mål; insläppt→endast rött mål.
- Tidknapp: gjort→endast övre rad (grön); insläppt→endast nedre rad (röd).
- Sedan auto-återgång till Game Data.

**Shot Workflow:** Endast fältpunkt (grön zon), inget mål/tid; auto-återgång.

**Målvakt krävs:** Rött mål och röda fältpunkter utan workflow endast med aktiv målvakt i dropdown.

**Markörer/Tidrutor** kvarstår till Reset; Download/Export kopierar allt till Season Map.

---

## Season Map
- Skrivskyddad visning av exporterad Goal Map-data (markörer, tidrutor).

**Filter:**
- **Player Filter:** Visar/aggregerar gröna (gjorda) värden endast för denna spelare.
- **Goalie Filter:** Visar/aggregerar röda (insläppta) värden endast för denna målvakt.

**Momentum-graf:**
- Med Player Filter: gröna värden endast för denna spelare.
- Med Goalie Filter: röda värden endast för denna målvakt.
- Utan filter: Totalvärden.

**Ladda ner som PNG:** Rutor med vit bakgrund, rubrik visar aktuella filter.

---

## Goal Value
- Matris Spelare × Motståndare: Klick +1, Dubbelklick –1 (inga målvakter).
- Nedre skala (Bottom) viktar motståndares styrka; Value = Summa (värde × vikt).
- Reset återställer alla värden, skalor och motståndarnamn.

---

## Season (Säsongstabell)
- Utespelares säsongsvärden (målvakter dolda).
- Klick/dubbelklick på värden: +1/–1 (+/- kan vara negativt).
- Långtryck på tidcell: Tidsdialog.
- Positionsfilter (dropdown "Pos.").
- Ladda ner Season CSV (nytt: "Download" istället för "Export").

---

## Reset (oåterkallelig)
- **Game Data:** statsData, playerTimes, timer, motståndarskott (lagspecifikt).
- **Goal Map:** Markörer, tidrutor, timeData/timeDataWithPlayers, goalMapMarkers.
- **Season Map:** seasonMapMarkers, seasonMapTimeData, seasonMapTimeDataWithPlayers, momentum-behållare.
- **Goal Value:** Värden/skalor/motståndarnamn.
- **Season:** seasonData.`,
        
        fi: `## Suositeltu työnkulku (Peli)

1. **Team Selection:** Valitse tai muokkaa joukkuetta.
2. **Player Selection:** Lisää/aktivoi pelaajia; siirry tarvittaessa suoraan Line Up tai Game Data.
3. **Line Up:** Tarkista/aseta kokoonpano (Normal/Power esiasetettu tekoälyllä, Manual vapaa valinta).
4. **Game Data:** Tallenna peli; Goals/Shot käynnistävät työnkulut Goal Mapissa.
5. **Goal Map:** Aseta pisteet kentälle/maaliin/aikaan, palaa Game Dataan.
6. **Pelin jälkeen:** Arvioi Goal Value vastustajittain (vaikeusaste).
7. **Download:** Vie Game → Season ja Season Map kauden analysointiin.

---

## Team Selection
Valitse tai muokkaa joukkuetta (joukkuekohtaiset tiedot/järjestys).

---

## Player Selection
- Lisää/muokkaa pelaajia: Numero, Nimi, Pelipaikka (G = Maalivahti, muuten kenttäpelaaja).
- Aktivoi (valintaruutu) = Pelaaja käytettävissä Line Up / Game Data.
- Painikkeet: "Line Up" → kokoonpanoon; "Game Data" → suoraan pelin tallennukseen.

---

## Line Up
**Tilat (vaihda tilapainikkeella):**
- **Normal:** Tekoälyn logiikan esiasetus.
- **Power:** Erityinen tekoälyasettelu ratkaiseviin hetkiin.
- **Manual:** Vapaa valinta klikkaamalla paikkoja.

- "Player Out": Merkitse pelaaja OUT (poistettu kaikista tiloista).
- Paikkapainikkeet näyttävät määrätyn pelaajan; Manual-tilassa klikattava, Normal/Power-tilassa esiasetettu.

---

## Game Data
**Pelaajarivi:**
- Klikkaa nimeä (ei ⋮⋮): Ajastin Käynnistä/Pysäytä.
- Klikkaa aikaa: +10 s; Tuplaklikkaa: –10 s.
- Pitkä painallus ⋮⋮ → Vedä ja pudota järjestykseen; järjestys tallennetaan joukkuekohtaisesti.

**Tilastosolut (esim. Goals, Shot):**
- Klikkaus: +1, Tuplaklikkaus: –1.
- +1 Goals/Shot käynnistää vastaavan työnkulun Goal Mapissa.

**Vastustajan laukaukset:** Laske Shot-Totals-solussa (alhaalla) klikkauksella/tuplaklikkauksella (joukkuekohtainen).

**Download Game → Season:** Siirrä peli kauden tilastoihin (valinnaisesti tyhjennä Game Data).

---

## Goal Map
**Kenttäpuoliskot:** Ylä = tehty (vihreä), Ala = päästetty (punainen).

**Goal Workflow:**
- Kenttäpiste: Ylä→tehty, Ala→päästetty (määrittää tyypin).
- Maalipiste: tehty→vain vihreä maali; päästetty→vain punainen maali.
- Aikapainike: tehty→vain ylärivit (vihreä); päästetty→vain alarivit (punainen).
- Sitten automaattinen paluu Game Dataan.

**Shot Workflow:** Vain kenttäpiste (vihreä alue), ei maalia/aikaa; automaattinen paluu.

**Maalivahti vaaditaan:** Punainen maali ja punaiset kenttäpisteet ilman työnkulkua vain aktiivisella maalivahdilla pudotusvalikossa.

**Merkinnät/Aikalaatikot** säilyvät Resetiin asti; Download/Export kopioi kaiken Season Mapiin.

---

## Season Map
- Vain luku -näkymä viedyistä Goal Map -tiedoista (merkinnät, aikalaatikot).

**Suodattimet:**
- **Player Filter:** Näyttää/kokoaa vihreät (tehdyt) arvot vain tälle pelaajalle.
- **Goalie Filter:** Näyttää/kokoaa punaiset (päästetyt) arvot vain tälle maalivahdille.

**Momentum-kaavio:**
- Player Filterin kanssa: vihreät arvot vain tämän pelaajan.
- Goalie Filterin kanssa: punaiset arvot vain tämän maalivahdin.
- Ilman suodatinta: Kokonaisarvot.

**Lataa PNG:nä:** Laatikot valkoisella taustalla, otsikko näyttää nykyiset suodattimet.

---

## Goal Value
- Matriisi Pelaajat × Vastustajat: Klikkaus +1, Tuplaklikkaus –1 (ei maalivahteja).
- Alaskala (Bottom) painottaa vastustajan vahvuutta; Value = Summa (arvo × paino).
- Reset nollaa kaikki arvot, asteikot ja vastustajien nimet.

---

## Season (Kauden taulukko)
- Kenttäpelaajien kauden arvot (maalivahdit piilotettu).
- Klikkaus/tuplaklikkaus arvoihin: +1/–1 (+/- voi olla negatiivinen).
- Pitkä painallus aikasoluun: Aikadialogi.
- Pelipaikkassuodatin (pudotusvalikko "Pos.").
- Lataa Season CSV (uusi: "Download" eikä "Export").

---

## Reset (peruuttamaton)
- **Game Data:** statsData, playerTimes, ajastin, vastustajan laukaukset (joukkuekohtainen).
- **Goal Map:** Merkinnät, aikalaatikot, timeData/timeDataWithPlayers, goalMapMarkers.
- **Season Map:** seasonMapMarkers, seasonMapTimeData, seasonMapTimeDataWithPlayers, momentum-säiliö.
- **Goal Value:** Arvot/asteikot/vastustajien nimet.
- **Season:** seasonData.`
    };
    
    const closeButtonText = {
        de: 'Schließen',
        en: 'Close',
        ru: 'Закрыть',
        sv: 'Stäng',
        fi: 'Sulje'
    };
    
    function convertMarkdownToHTML(markdown) {
        let html = markdown;
        
        // Convert headers
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gim, '<h3>$3</h3>');
        
        // Convert bold text
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert lists - handle multi-line list items
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Convert horizontal rules
        html = html.replace(/^---$/gim, '<hr>');
        
        // Convert line breaks
        html = html.replace(/\n\n/g, '<br><br>');
        
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
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="ru">🇷🇺 Русский</option>
                        <option value="sv">🇸🇪 Svenska</option>
                        <option value="fi">🇫🇮 Suomi</option>
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

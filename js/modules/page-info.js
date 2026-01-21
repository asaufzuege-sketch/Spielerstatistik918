// Page-Specific Info Module

App.pageInfo = (function() {
    console.log('Page Info Module loading...');
    
    // Page-specific info content for all languages
    const pageInfos = {
        'team-selection': {
            de: `📋 Team Selection

Hier wählst du dein Team aus oder erstellst ein neues Team.

• Team wählen oder bearbeiten
• Klick auf "Select" um ein Team auszuwählen
• Klick auf ✏️ um den Teamnamen zu bearbeiten
• Nach der Auswahl gelangst du zur Player Selection`,
            
            en: `📋 Team Selection

Here you select your team or create a new team.

• Choose or edit team
• Click "Select" to choose a team
• Click ✏️ to edit the team name
• After selection, you proceed to Player Selection`,
            
            ru: `📋 Team Selection

Здесь вы выбираете свою команду или создаёте новую команду.

• Выбрать или редактировать команду
• Нажмите "Select" чтобы выбрать команду
• Нажмите ✏️ чтобы изменить название команды
• После выбора вы переходите к Player Selection`,
            
            sv: `📋 Team Selection

Här väljer du ditt lag eller skapar ett nytt lag.

• Välj eller redigera lag
• Klicka på "Select" för att välja ett lag
• Klicka på ✏️ för att redigera lagnamnet
• Efter valet går du vidare till Player Selection`,
            
            fi: `📋 Team Selection

Täällä valitset joukkueesi tai luot uuden joukkueen.

• Valitse tai muokkaa joukkuetta
• Napsauta "Select" valitaksesi joukkueen
• Napsauta ✏️ muokataksesi joukkueen nimeä
• Valinnan jälkeen siirryt Player Selectioniin`,
            
            fr: `📋 Team Selection

Ici tu sélectionnes ton équipe ou crées une nouvelle équipe.

• Choisis ou modifie l'équipe
• Clique sur "Select" pour choisir une équipe
• Clique sur ✏️ pour modifier le nom de l'équipe
• Après la sélection, tu passes à Player Selection`
        },
        
        'player-selection': {
            de: `👥 Player Selection

• Spieler erfassen/bearbeiten: Nummer, Name, Position (G = Goalie, W = Wing, C = Center, D = Defense).
• Aktivieren (Checkbox) = Spieler ist für Line Up / Game Center verfügbar.
• Buttons: „Line Up" → zur Aufstellung; „Game Center" → direkt zur Spiel-Erfassung.`,
            
            en: `👥 Player Selection

• Add/edit players: Number, Name, Position (G = Goalie, W = Wing, C = Center, D = Defense).
• Activate (checkbox) = Player available for Line Up / Game Center.
• Buttons: "Line Up" → to lineup; "Game Center" → directly to game recording.`,
            
            ru: `👥 Player Selection

• Добавить/редактировать игроков: Номер, Имя, Позиция (G = Вратарь, W = Крайний, C = Центр, D = Защитник).
• Активировать (чекбокс) = Игрок доступен для Line Up / Game Center.
• Кнопки: «Line Up» → к составу; «Game Center» → сразу к записи игры.`,
            
            sv: `👥 Player Selection

• Lägg till/redigera spelare: Nummer, Namn, Position (G = Målvakt, W = Wing, C = Center, D = Back).
• Aktivera (kryssruta) = Spelare tillgänglig för Line Up / Game Center.
• Knappar: "Line Up" → till uppställning; "Game Center" → direkt till matchregistrering.`,
            
            fi: `👥 Player Selection

• Lisää/muokkaa pelaajia: Numero, Nimi, Pelipaikka (G = Maalivahti, W = Laitahyökkääjä, C = Keskushyökkääjä, D = Puolustaja).
• Aktivoi (valintaruutu) = Pelaaja käytettävissä Line Up / Game Center.
• Painikkeet: "Line Up" → kokoonpanoon; "Game Center" → suoraan pelin tallennukseen.`,
            
            fr: `👥 Player Selection

• Ajouter/modifier des joueurs: Numéro, Nom, Position (G = Gardien, W = Ailier, C = Centre, D = Défense).
• Activer (case à cocher) = Joueur disponible pour Line Up / Game Center.
• Boutons: "Line Up" → vers la formation; "Game Center" → directement à l'enregistrement du jeu.`
        },
        
        'line-up': {
            de: `📋 Line Up

Modi (umschaltbar per Modus-Button):

• Balanced: Ausgeglichenes Line Up. Vorgabe durch AI-Logik und Formeln.
• Power: Stärkstes Line Up, Spezial-Setup für entscheidende Szenen. Vorgabe durch AI-Logik und Formeln.
• Manuell: Frei erstellbares Line Up per Klick auf Position belegen.
• „Player Out": Spieler als OUT markieren (Bei Penalty-Strafe). Line Up wird automatisch angepasst.`,
            
            en: `📋 Line Up

Modes (switchable via Mode button):

• Balanced: Balanced Line Up. Preset by AI logic and formulas.
• Power: Strongest Line Up, special setup for decisive scenes. Preset by AI logic and formulas.
• Manual: Freely creatable Line Up by clicking on position to assign.
• "Player Out": Mark player as OUT (for penalty). Line Up is automatically adjusted.`,
            
            ru: `📋 Line Up

Режимы (переключаемые кнопкой режима):

• Balanced: Сбалансированный состав. Предустановка через AI-логику и формулы.
• Power: Сильнейший состав, специальная расстановка для решающих моментов. Предустановка через AI-логику и формулы.
• Manuell: Свободно создаваемый состав, назначение по клику на позицию.
• „Player Out": Отметить игрока как OUT (при удалении). Состав автоматически корректируется.`,
            
            sv: `📋 Line Up

Lägen (växlingsbart via Lägesknapp):

• Balanced: Balanserad Line Up. Förinställd av AI-logik och formler.
• Power: Starkaste Line Up, specialuppställning för avgörande scener. Förinställd av AI-logik och formler.
• Manuell: Fritt skapbar Line Up genom att klicka på position för att tilldela.
• "Player Out": Markera spelare som OUT (vid utvisning). Line Up justeras automatiskt.`,
            
            fi: `📋 Line Up

Tilat (vaihdettavissa Tila-painikkeella):

• Balanced: Tasapainoinen kokoonpano. AI-logiikan ja kaavojen esiasetus.
• Power: Vahvin kokoonpano, erikoisasettelu ratkaiseviin tilanteisiin. AI-logiikan ja kaavojen esiasetus.
• Manuell: Vapaasti luotava kokoonpano klikkaamalla paikkaa.
• "Player Out": Merkitse pelaaja OUT (rangaistuksessa). Kokoonpano mukautuu automaattisesti.`,
            
            fr: `📋 Line Up

Modes (commutables via le bouton Mode):

• Balanced: Line Up équilibré. Prédéfini par la logique AI et les formules.
• Power: Line Up le plus fort, configuration spéciale pour les scènes décisives. Prédéfini par la logique AI et les formules.
• Manuell: Line Up librement créable en cliquant sur la position à attribuer.
• "Player Out": Marquer le joueur comme OUT (en cas de pénalité). Le Line Up est automatiquement ajusté.`
        },
        
        'season': {
            de: `📊 Season Table

• Feldspieler-Saisonwerte (Goalies ausgeblendet).
• Klick/Doppelklick auf Werte: +1/–1 (bei +/- auch negativ).
• Long-Press auf Time-Zelle: Zusätzliche Zeit kann manuell eingegeben werden.
• Positionsfilter (Dropdown „Pos.").
• MVP Points/MVP = Wertvollster Spieler gemäss analysierter Statistik (AI-Formel)`,
            
            en: `📊 Season Table

• Field player season values (goalies hidden).
• Click/double-click on values: +1/–1 (+/- can be negative).
• Long-press on time cell: Additional time can be entered manually.
• Position filter (dropdown "Pos.").
• MVP Points/MVP = Most Valuable Player based on analyzed statistics (AI formula)`,
            
            ru: `📊 Season Table

• Сезонные показатели полевых игроков (вратари скрыты).
• Клик/двойной клик по значениям: +1/–1 (+/- может быть отрицательным).
• Долгое нажатие на ячейку времени: Дополнительное время можно ввести вручную.
• Фильтр позиции (выпадающий «Pos.»).
• MVP Points/MVP = Самый ценный игрок по анализу статистики (AI-формула)`,
            
            sv: `📊 Season Table

• Utespelares säsongsvärden (målvakter dolda).
• Klick/dubbelklick på värden: +1/–1 (+/- kan vara negativt).
• Långtryck på tidcell: Extra tid kan matas in manuellt.
• Positionsfilter (dropdown "Pos.").
• MVP Points/MVP = Mest värdefulla spelaren baserat på analyserad statistik (AI-formel)`,
            
            fi: `📊 Season Table

• Kenttäpelaajien kauden arvot (maalivahdit piilotettu).
• Klikkaus/tuplaklikkaus arvoihin: +1/–1 (+/- voi olla negatiivinen).
• Pitkä painallus aikasoluun: Lisäaika voidaan syöttää manuaalisesti.
• Pelipaikkassuodatin (pudotusvalikko "Pos.").
• MVP Points/MVP = Arvokkain pelaaja analysoidun tilaston perusteella (tekoälykaava)`,
            
            fr: `📊 Season Table

• Valeurs saisonnières des joueurs de champ (gardiens cachés).
• Clic/double-clic sur les valeurs: +1/–1 (+/- peut être négatif).
• Pression longue sur la cellule de temps: Le temps supplémentaire peut être saisi manuellement.
• Filtre de position (menu déroulant "Pos.").
• MVP Points/MVP = Joueur le plus précieux selon les statistiques analysées (formule IA)`
        },
        
        'game-center': {
            de: `🏒 Game Center

Spielerzeile:
• Klick auf Namen (nicht auf ⋮⋮): Timer Start/Stop für jeden Spieler. Die 5 Spieler mit grünen Werten haben die längste Eiszeit, die 5 Spieler mit roten Werten haben die niedrigste Eiszeit.
• Klick auf Zeit: +10 s; Doppelklick: –10 s.
• Langer Druck auf ⋮⋮ → Drag & Drop für Reihenfolge

Statistikzellen (z. B. Goals, Shot):
• Klick: +1, Doppelklick: –1.
• Bei +1 auf Goals/Shot startet je nach Ereignis der Goal- bzw. Shot-Workflow in der Goal Map.
• Gegner-Schüsse: In der Shot-Totals-Zelle (unten) per Klick/Doppelklick zählen.

Download: Spieldaten werden als Excel heruntergeladen.

Export Season: Spieldaten werden zu Saisonstatistiken addiert. Dabei werden Sie gebeten, einen Goal Value Wert einzugeben. Bsp: 1 Stern = sehr schwacher Gegner, einfach Tore zu erzielen, Gegner am untersten Tabellen Ende, Chance auf viele Schüsse. 10 Sterne = Sehr starker Gegner, Tabellen Leader, Schwer Chancen zu bekommen, eher weniger Schüsse zugelassen.

Mit Button (☀️/🌙) kann zwischen Light- und Dark Mode gewechselt werden.`,
            
            en: `🏒 Game Center

Player Row:
• Click on name (not on ⋮⋮): Timer Start/Stop for each player. The 5 players with green values have the longest ice time, the 5 players with red values have the lowest ice time.
• Click on time: +10 s; Double-click: –10 s.
• Long press on ⋮⋮ → Drag & Drop for order

Statistic Cells (e.g. Goals, Shot):
• Click: +1, Double-click: –1.
• When +1 on Goals/Shot, the Goal or Shot workflow starts in the Goal Map depending on the event.
• Opponent shots: Count in the Shot-Totals cell (bottom) via click/double-click.

Download: Game data is downloaded as Excel.

Export Season: Game data is added to season statistics. You will be asked to enter a Goal Value. Example: 1 star = very weak opponent, easy to score goals, opponent at the bottom of the table, chance for many shots. 10 stars = Very strong opponent, table leader, hard to get chances, fewer shots allowed.

With button (☀️/🌙) you can switch between Light and Dark Mode.`,
            
            ru: `🏒 Game Center

Строка игрока:
• Клик по имени (не по ⋮⋮): Старт/Стоп таймера для каждого игрока. 5 игроков с зелёными значениями имеют наибольшее время на льду, 5 игроков с красными значениями — наименьшее.
• Клик по времени: +10 с; Двойной клик: –10 с.
• Долгое нажатие на ⋮⋮ → Перетаскивание для изменения порядка

Ячейки статистики (напр. Goals, Shot):
• Клик: +1, Двойной клик: –1.
• При +1 на Goals/Shot запускается соответствующий процесс в Goal Map.
• Броски соперника: Считать в ячейке Shot-Totals (внизу) кликом/двойным кликом.

Download: Данные игры скачиваются в Excel.

Export Season: Данные игры добавляются к сезонной статистике. Вас попросят ввести Goal Value. Пример: 1 звезда = очень слабый соперник, 10 звёзд = очень сильный соперник.

Кнопкой (☀️/🌙) можно переключаться между светлым и тёмным режимом.`,
            
            sv: `🏒 Game Center

Spelarrad:
• Klick på namn (inte på ⋮⋮): Timer Start/Stopp för varje spelare. De 5 spelarna med gröna värden har längst istid, de 5 spelarna med röda värden har lägst istid.
• Klick på tid: +10 s; Dubbelklick: –10 s.
• Långt tryck på ⋮⋮ → Drag & Drop för ordning

Statistikceller (t.ex. Goals, Shot):
• Klick: +1, Dubbelklick: –1.
• Vid +1 på Goals/Shot startar Goal- eller Shot-arbetsflödet i Goal Map.
• Motståndarskott: Räkna i Shot-Totals-cellen (nere) via klick/dubbelklick.

Download: Speldata laddas ner som Excel.

Export Season: Speldata läggs till säsongsstatistik. Du kommer att bli ombedd att ange ett Goal Value. Exempel: 1 stjärna = mycket svag motståndare, 10 stjärnor = mycket stark motståndare.

Med knappen (☀️/🌙) kan du växla mellan ljust och mörkt läge.`,
            
            fi: `🏒 Game Center

Pelaajarivi:
• Klikkaa nimeä (ei ⋮⋮): Ajastin Start/Stop jokaiselle pelaajalle. 5 pelaajaa vihreillä arvoilla ovat eniten jäällä, 5 pelaajaa punaisilla arvoilla vähiten.
• Klikkaa aikaa: +10 s; Tuplaklikkaus: –10 s.
• Pitkä painallus ⋮⋮ → Vedä ja pudota järjestyksen muuttamiseksi

Tilastosolut (esim. Goals, Shot):
• Klikkaus: +1, Tuplaklikkaus: –1.
• +1 Goals/Shot käynnistää Goal- tai Shot-työnkulun Goal Mapissa.
• Vastustajan laukaukset: Laske Shot-Totals-solussa (alhaalla) klikkauksella/tuplaklikkauksella.

Download: Pelitiedot ladataan Excelinä.

Export Season: Pelitiedot lisätään kauden tilastoihin. Sinua pyydetään syöttämään Goal Value. Esimerkki: 1 tähti = erittäin heikko vastustaja, 10 tähteä = erittäin vahva vastustaja.

Painikkeella (☀️/🌙) voit vaihtaa vaalean ja tumman tilan välillä.`,
            
            fr: `🏒 Game Center

Ligne du joueur:
• Clic sur le nom (pas sur ⋮⋮): Démarrer/Arrêter le chrono pour chaque joueur. Les 5 joueurs avec des valeurs vertes ont le plus de temps de glace, les 5 joueurs avec des valeurs rouges ont le moins.
• Clic sur le temps: +10 s; Double-clic: –10 s.
• Appui long sur ⋮⋮ → Glisser-déposer pour l'ordre

Cellules statistiques (p.ex. Goals, Shot):
• Clic: +1, Double-clic: –1.
• Lors de +1 sur Goals/Shot, le workflow Goal ou Shot démarre dans Goal Map.
• Tirs adverses: Compter dans la cellule Shot-Totals (en bas) via clic/double-clic.

Download: Les données du match sont téléchargées en Excel.

Export Season: Les données du match sont ajoutées aux statistiques de saison. On vous demandera d'entrer une valeur Goal Value. Ex: 1 étoile = adversaire très faible, 10 étoiles = adversaire très fort.

Avec le bouton (☀️/🌙) vous pouvez basculer entre le mode clair et sombre.`
        },
        
        'goal-value': {
            de: `📈 Goal Value

Dieser Wert wird für die Saisonstatistiken benötigt.
Manuelle Eingabe der erzielten Tore gegen den jeweiligen Gegner möglich.
Untere Skala (Bottom) gewichtet Gegnerstärke; Value = Summe (Wert × Gewicht). Dieser Wert zeigt einen Mittelwert aller exportierten Werte für diesen Gegner an, kann manuell angepasst werden.
Reset setzt alle Werte, Skalen und Gegnernamen zurück.`,
            
            en: `📈 Goal Value

• This value is required for season statistics
• Manual entry of goals scored against each opponent
• Bottom scale weights opponent strength; Value = Sum (value × weight).
• Reset clears all values, scales, and opponent names.`,
            
            ru: `📈 Goal Value

• Это значение необходимо для сезонной статистики
• Ручной ввод забитых голов против каждого соперника
• Нижняя шкала (Bottom) весит силу соперника; Value = Сумма (значение × вес).
• Reset сбрасывает все значения, шкалы и имена соперников.`,
            
            sv: `📈 Goal Value

• Detta värde behövs för säsongsstatistik
• Manuell inmatning av gjorda mål mot varje motståndare
• Nedre skala (Bottom) viktar motståndares styrka; Value = Summa (värde × vikt).
• Reset återställer alla värden, skalor och motståndarnamn.`,
            
            fi: `📈 Goal Value

• Tämä arvo tarvitaan kauden tilastoihin
• Manuaalinen syöttö tehdyistä maaleista kutakin vastustajaa vastaan
• Alaskala (Bottom) painottaa vastustajan vahvuutta; Value = Summa (arvo × paino).
• Reset nollaa kaikki arvot, asteikot ja vastustajien nimet`,
            
            fr: `📈 Goal Value

Cette valeur est nécessaire pour les statistiques de la saison.
Saisie manuelle des buts marqués contre chaque adversaire.
L'échelle inférieure (Bottom) pèse la force de l'adversaire; Value = Somme (valeur × poids). Cette valeur montre une moyenne de toutes les valeurs exportées pour cet adversaire, peut être ajustée manuellement.
Reset efface toutes les valeurs, les échelles et les noms des adversaires.`
        },
        
        'goal-map': {
            de: `🎯 Goal Map / Torbild

Feldhälften: Grün/Oben = scored / Rot/Unten = conceded

Goal-Workflow (Beginnt mit Klick auf Goal in Game Center):
• 1. Grauen Punkt in grüne Spielhälfte setzen
• 2. Punkt in grünes Tor setzen
• 3. Zeit bestimmen in grünen Time-Buttons
• Danach Auto-Return zu Game Center.

Shot-Workflow (Beginnt mit Klick auf Shot in Game Center):
• 1. Grünen Punkt in grüne Spielhälfte setzen
• Danach Auto-Return zu Game Center.

Goal erhalten (es muss ein Goalie oben ausgewählt werden):
• 1. Grauen Punkt in rote Spielhälfte setzen
• 2. Punkt in rotes Tor setzen
• 3. Zeit bestimmen in roten Time-Buttons

Time Buttons:
• Klick: +1, Doppelklick: -1
• WICHTIG: +1/-1 gilt nur für den aktuell ausgewählten Spieler im Filter
• Ohne Filter wird "anonymous" verwendet
• Der angezeigte Wert ist die SUMME aller Spieler
• Um einen bestimmten Spieler zu korrigieren, wähle ihn zuerst im Filter aus und korrigiere per Klick auf Punkt (im Spielfeld und Tor) oder per Doppelklick (Time Buttons)

Export Season Map: Punkte werden zu Season Map addiert`,
            
            en: `🎯 Goal Map

Field Halves: Green/Top = scored / Red/Bottom = conceded

Goal Workflow (Starts with click on Goal in Game Center):
• 1. Place gray dot in green field half
• 2. Place dot in green goal
• 3. Determine time in green Time Buttons
• Then auto-return to Game Center.

Shot Workflow (Starts with click on Shot in Game Center):
• 1. Place green dot in green field half
• Then auto-return to Game Center.

Goal conceded (a goalie must be selected at the top):
• 1. Place gray dot in red field half
• 2. Place dot in red goal
• 3. Determine time in red Time Buttons

Time Buttons:
• Click: +1, Double-click: -1
• IMPORTANT: +1/-1 applies only to the currently selected player in the filter
• Without filter "anonymous" is used
• The displayed value is the SUM of all players
• To correct a specific player, first select them in the filter and correct by clicking on dots (in field and goal) or by double-clicking (Time Buttons)

Export Season Map: Dots are added to Season Map`,
            
            ru: `🎯 Goal Map

Половины поля: Зелёный/Верх = забито / Красный/Низ = пропущено

Goal-Workflow (Начинается с клика на Goal в Game Center):
• 1. Поставить серую точку в зелёную половину поля
• 2. Поставить точку в зелёные ворота
• 3. Определить время в зелёных Time-Buttons
• Затем авто-возврат в Game Center.

Shot-Workflow (Начинается с клика на Shot в Game Center):
• 1. Поставить зелёную точку в зелёную половину поля
• Затем авто-возврат в Game Center.

Пропущенный гол (вратарь должен быть выбран вверху):
• 1. Поставить серую точку в красную половину поля
• 2. Поставить точку в красные ворота
• 3. Определить время в красных Time-Buttons

Time Buttons:
• Клик: +1, Двойной клик: -1
• ВАЖНО: +1/-1 применяется только к выбранному игроку в фильтре
• Без фильтра используется "anonymous"
• Отображаемое значение - это СУММА всех игроков
• Чтобы исправить конкретного игрока, сначала выберите его в фильтре и исправьте кликом на точку (на поле и в воротах) или двойным кликом (Time Buttons)

Export Season Map: Точки добавляются к Season Map`,
            
            sv: `🎯 Goal Map

Fälthalvor: Grön/Övre = gjorda / Röd/Nedre = insläppta

Goal-Workflow (Börjar med klick på Goal i Game Center):
• 1. Placera grå punkt i grön fälthälft
• 2. Placera punkt i grönt mål
• 3. Bestäm tid i gröna Time-Buttons
• Sedan auto-återgång till Game Center.

Shot-Workflow (Börjar med klick på Shot i Game Center):
• 1. Placera grön punkt i grön fälthälft
• Sedan auto-återgång till Game Center.

Insläppt mål (en målvakt måste väljas överst):
• 1. Placera grå punkt i röd fälthälft
• 2. Placera punkt i rött mål
• 3. Bestäm tid i röda Time-Buttons

Time Buttons:
• Klick: +1, Dubbelklick: -1
• VIKTIGT: +1/-1 gäller endast för den valda spelaren i filtret
• Utan filter används "anonymous"
• Det visade värdet är SUMMAN av alla spelare
• För att korrigera en specifik spelare, välj dem först i filtret och korrigera genom att klicka på punkt (i fält och mål) eller genom dubbelklick (Time Buttons)

Export Season Map: Punkter läggs till Season Map`,
            
            fi: `🎯 Goal Map

Kenttäpuoliskot: Vihreä/Ylä = tehty / Punainen/Ala = päästetty

Goal-Workflow (Alkaa klikkauksella Goal Game Centerissä):
• 1. Aseta harmaa piste vihreälle kenttäpuoliskolle
• 2. Aseta piste vihreään maaliin
• 3. Määritä aika vihreissä Time-Buttons
• Sitten automaattinen paluu Game Centeriin.

Shot-Workflow (Alkaa klikkauksella Shot Game Centerissä):
• 1. Aseta vihreä piste vihreälle kenttäpuoliskolle
• Sitten automaattinen paluu Game Centeriin.

Päästetty maali (maalivahti on valittava yläosasta):
• 1. Aseta harmaa piste punaiselle kenttäpuoliskolle
• 2. Aseta piste punaiseen maaliin
• 3. Määritä aika punaisissa Time-Buttons

Time Buttons:
• Klikkaus: +1, Tuplaklikkaus: -1
• TÄRKEÄÄ: +1/-1 koskee vain suodattimessa valittua pelaajaa
• Ilman suodatinta käytetään "anonymous"
• Näytetty arvo on SUMMA kaikista pelaajista
• Korjataksesi tiettyä pelaajaa, valitse heidät ensin suodattimesta ja korjaa klikkaamalla pistettä (kentällä ja maalissa) tai tuplaklikkaamalla (Time Buttons)

Export Season Map: Pisteet lisätään Season Mapiin`,
            
            fr: `🎯 Goal Map

Moitiés de terrain: Vert/Haut = marqués / Rouge/Bas = encaissés

Flux Goal (Commence avec clic sur Goal dans Game Center):
• 1. Placer le point gris dans la moitié de terrain verte
• 2. Placer le point dans le but vert
• 3. Déterminer le temps dans les boutons Time verts
• Puis retour automatique à Game Center.

Flux Shot (Commence avec clic sur Shot dans Game Center):
• 1. Placer le point vert dans la moitié de terrain verte
• Puis retour automatique à Game Center.

But encaissé (un gardien doit être sélectionné en haut):
• 1. Placer le point gris dans la moitié de terrain rouge
• 2. Placer le point dans le but rouge
• 3. Déterminer le temps dans les boutons Time rouges

Boutons Time:
• Clic: +1, Double-clic: -1
• IMPORTANT: +1/-1 s'applique uniquement au joueur actuellement sélectionné dans le filtre
• Sans filtre "anonymous" est utilisé
• La valeur affichée est la SOMME de tous les joueurs
• Pour corriger un joueur spécifique, sélectionnez-le d'abord dans le filtre et corrigez en cliquant sur les points (sur le terrain et le but) ou en double-cliquant (boutons Time)

Export Season Map: Les points sont ajoutés à Season Map`
        },
        
        'season-map': {
            de: `🗺️ Season Map

• Only read

Filter:
• Player-Filter: Zeigt/aggregiert grüne (scored) Werte nur für diesen Spieler.
• Goalie-Filter: Zeigt/aggregiert rote (conceded) Werte nur für diesen Goalie.

Momentum-Grafik:
• Mit Player-Filter: grüne Werte nur dieses Spielers.
• Mit Goalie-Filter: rote Werte nur dieses Goalies.
• Ohne Filter: Gesamtwerte.`,
            
            en: `🗺️ Season Map

• Read only

Filters:
• Player Filter: Shows/aggregates green (scored) values for this player only.
• Goalie Filter: Shows/aggregates red (conceded) values for this goalie only.

Momentum Chart:
• With Player Filter: green values of this player only.
• With Goalie Filter: red values of this goalie only.
• Without filter: Total values.`,
            
            ru: `🗺️ Season Map

• Только просмотр

Фильтры:
• Player Filter: Показывает/суммирует зелёные (забитые) значения только для этого игрока.
• Goalie Filter: Показывает/суммирует красные (пропущенные) значения только для этого вратаря.

Momentum-график:
• С Player Filter: зелёные значения только этого игрока.
• С Goalie Filter: красные значения только этого вратаря.
• Без фильтра: Общие значения.`,
            
            sv: `🗺️ Season Map

• Endast läsning

Filter:
• Player Filter: Visar/aggregerar gröna (gjorda) värden endast för denna spelare.
• Goalie Filter: Visar/aggregerar röda (insläppta) värden endast för denna målvakt.

Momentum-graf:
• Med Player Filter: gröna värden endast för denna spelare.
• Med Goalie Filter: röda värden endast för denna målvakt.
• Utan filter: Totalvärden.`,
            
            fi: `🗺️ Season Map

• Vain luku

Suodattimet:
• Player Filter: Näyttää/kokoaa vihreät (tehdyt) arvot vain tälle pelaajalle.
• Goalie Filter: Näyttää/kokoaa punaiset (päästetyt) arvot vain tälle maalivahdille.

Momentum-kaavio:
• Player Filterin kanssa: vihreät arvot vain tämän pelaajan.
• Goalie Filterin kanssa: punaiset arvot vain tämän maalivahdin.
• Ilman suodatinta: Kokonaisarvot.`,
            
            fr: `🗺️ Season Map

• Lecture seule

Filtres:
• Player Filter: Affiche/agrège les valeurs vertes (marqués) uniquement pour ce joueur.
• Goalie Filter: Affiche/agrège les valeurs rouges (encaissés) uniquement pour ce gardien.

Graphique Momentum:
• Avec Player Filter: valeurs vertes uniquement de ce joueur.
• Avec Goalie Filter: valeurs rouges uniquement de ce gardien.
• Sans filtre: Valeurs totales.`
        }
    };
    
    const closeButtonText = {
        de: 'Schließen',
        en: 'Close',
        ru: 'Закрыть',
        sv: 'Stäng',
        fi: 'Sulje',
        fr: 'Fermer'
    };
    
    function detectCurrentPage(titleElement) {
        // Detect which page based on title text or parent container
        const text = titleElement.textContent.toLowerCase().trim();
        
        // Check parent page container
        const pageContainer = titleElement.closest('.page');
        if (pageContainer) {
            const pageId = pageContainer.id;
            if (pageId === 'teamSelectionPage') return 'team-selection';
            if (pageId === 'playerSelectionPage') return 'player-selection';
            if (pageId === 'lineUpPage') return 'line-up';
            if (pageId === 'seasonPage') return 'season';
            if (pageId === 'statsPage') return 'game-center';
            if (pageId === 'goalValuePage') return 'goal-value';
            if (pageId === 'torbildPage') return 'goal-map';
            if (pageId === 'seasonMapPage') return 'season-map';
        }
        
        // Fallback to text matching
        if (text.includes('team')) return 'team-selection';
        if (text.includes('player')) return 'player-selection';
        if (text.includes('season') && (text.includes('table') || text.includes('saison'))) return 'season';
        if (text.includes('game center')) return 'game-center';
        if (text.includes('goal value')) return 'goal-value';
        if (text.includes('goal map') || text.includes('torbild')) return 'goal-map';
        if (text.includes('season map')) return 'season-map';
        if (text.includes('season')) return 'season';
        
        return 'team-selection';
    }
    
    function convertMarkdownToHTML(markdown) {
        // Split by double newlines to get paragraphs
        const lines = markdown.split('\n');
        let html = '';
        let currentList = null;
        let listType = null;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) {
                // Close any open list on empty line
                if (currentList) {
                    html += `</${listType}>`;
                    currentList = null;
                    listType = null;
                }
                continue;
            }
            
            // Check for bullet list (• or - at start)
            const bulletMatch = line.match(/^[•\-]\s+(.+)$/);
            if (bulletMatch) {
                if (!currentList || listType !== 'ul') {
                    if (currentList) html += `</${listType}>`;
                    html += '<ul>';
                    currentList = [];
                    listType = 'ul';
                }
                html += `<li>${bulletMatch[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
                continue;
            }
            
            // Check for numbered list (1. 2. 3. etc.)
            const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
            if (numberedMatch) {
                if (!currentList || listType !== 'ol') {
                    if (currentList) html += `</${listType}>`;
                    html += '<ol>';
                    currentList = [];
                    listType = 'ol';
                }
                html += `<li>${numberedMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
                continue;
            }
            
            // Close any open list before processing non-list items
            if (currentList) {
                html += `</${listType}>`;
                currentList = null;
                listType = null;
            }
            
            // Check if line looks like a section title (contains emoji or is all caps)
            if (line.match(/^[🎯📊📈🏒👥🗺️📋💡]/)) {
                html += `<h2 class="info-section-title">${line}</h2>`;
            } else {
                // Regular paragraph
                html += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
            }
        }
        
        // Close any remaining list
        if (currentList) {
            html += `</${listType}>`;
        }
        
        return html;
    }
    
    function showPageSpecificInfo(page) {
        // Get saved language or default to German
        const savedLanguage = AppStorage.getItem('infoLanguage') || 'de';
        const lang = savedLanguage;
        const info = pageInfos[page]?.[lang] || pageInfos[page]?.['de'] || 'Info nicht verfügbar';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'info-modal';
        
        modal.innerHTML = `
            <div class="info-content">
                <div class="info-language-selector">
                    <select id="pageInfoLanguageSelect">
                        <option value="de">&#x1F1E9;&#x1F1EA; Deutsch</option>
                        <option value="en">&#x1F1FA;&#x1F1F8; English</option>
                        <option value="ru">&#x1F1F7;&#x1F1FA; Русский</option>
                        <option value="sv">&#x1F1F8;&#x1F1EA; Svenska</option>
                        <option value="fi">&#x1F1EB;&#x1F1EE; Suomi</option>
                        <option value="fr">&#x1F1EB;&#x1F1F7; Français</option>
                    </select>
                </div>
                ${convertMarkdownToHTML(info)}
                <button id="pageInfoCloseBtn" class="page-info-close-btn">${closeButtonText[lang] || closeButtonText.de}</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set the saved language
        const languageSelect = document.getElementById('pageInfoLanguageSelect');
        if (languageSelect) {
            languageSelect.value = savedLanguage;
            
            // Language change event listener
            languageSelect.addEventListener('change', (e) => {
                const selectedLanguage = e.target.value;
                AppStorage.setItem('infoLanguage', selectedLanguage);
                modal.remove();
                showPageSpecificInfo(page); // Reload with new language
            });
        }
        
        // Close button event listener
        document.getElementById('pageInfoCloseBtn')?.addEventListener('click', () => {
            modal.remove();
        });
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function initPageTitleInfo() {
        // Make all page titles (h1 elements) clickable
        const pageTitles = document.querySelectorAll('.page h1');
        
        pageTitles.forEach(title => {
            // Add pointer cursor
            title.style.cursor = 'pointer';
            
            // Add click event listener
            title.addEventListener('click', () => {
                const page = detectCurrentPage(title);
                showPageSpecificInfo(page);
            });
        });
        
        console.log('Page title info initialized for', pageTitles.length, 'titles');
    }
    
    // Public API
    return {
        init: initPageTitleInfo,
        showPageSpecificInfo
    };
})();

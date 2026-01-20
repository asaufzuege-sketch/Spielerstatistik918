// Page-Specific Info Module

App.pageInfo = (function() {
    console.log('Page Info Module loading...');
    
    // Page-specific info content for all languages
    const pageInfos = {
        'team-selection': {
            de: `💡 Tipp: Alle Seiteninfos sind über Klick auf den jeweiligen Seitentitel abrufbar.

📋 Team Selection

Hier wählst du dein Team aus oder erstellst ein neues Team.

• Team wählen oder bearbeiten
• Klick auf "Select" um ein Team auszuwählen
• Klick auf ✏️ um den Teamnamen zu bearbeiten
• Nach der Auswahl gelangst du zur Player Selection`,
            
            en: `💡 Tip: All page infos are accessible by clicking on the page title.

📋 Team Selection

Here you select your team or create a new team.

• Choose or edit team
• Click "Select" to choose a team
• Click ✏️ to edit the team name
• After selection, you proceed to Player Selection`,
            
            it: `💡 Suggerimento: Tutte le info delle pagine sono accessibili cliccando sul titolo della pagina.

📋 Team Selection

Qui selezioni la tua squadra o crei una nuova squadra.

• Scegli o modifica la squadra
• Clicca "Select" per scegliere una squadra
• Clicca ✏️ per modificare il nome della squadra
• Dopo la selezione, passi a Player Selection`,
            
            fr: `💡 Astuce: Toutes les infos des pages sont accessibles en cliquant sur le titre de la page.

📋 Team Selection

Ici tu sélectionnes ton équipe ou crées une nouvelle équipe.

• Choisis ou modifie l'équipe
• Clique sur "Select" pour choisir une équipe
• Clique sur ✏️ pour modifier le nom de l'équipe
• Après la sélection, tu passes à Player Selection`
        },
        
        'player-selection': {
            de: `👥 Player Selection

Hier wählst du die Spieler für dein Team aus.

• Spieler erfassen/bearbeiten: Nummer, Name, Position (G = Goalie, W = Wing, C = Center, D = Defense)
• Aktivieren (Checkbox) = Spieler ist für Line Up / Game Center verfügbar
• Buttons: "Line Up" → zur Aufstellung; "Game Center" → direkt zur Spiel-Erfassung`,
            
            en: `👥 Player Selection

Here you select the players for your team.

• Add/edit players: Number, Name, Position (G = Goalie, W = Wing, C = Center, D = Defense)
• Activate (checkbox) = Player available for Line Up / Game Center
• Buttons: "Line Up" → to lineup; "Game Center" → directly to game recording`,
            
            it: `👥 Player Selection

Qui selezioni i giocatori per la tua squadra.

• Aggiungi/modifica giocatori: Numero, Nome, Posizione (G = Portiere, W = Ala, C = Centro, D = Difesa)
• Attiva (checkbox) = Giocatore disponibile per Line Up / Game Center
• Pulsanti: "Line Up" → alla formazione; "Game Center" → direttamente alla registrazione del gioco`,
            
            fr: `👥 Player Selection

Ici tu sélectionnes les joueurs pour ton équipe.

• Ajouter/modifier des joueurs: Numéro, Nom, Position (G = Gardien, W = Ailier, C = Centre, D = Défense)
• Activer (case à cocher) = Joueur disponible pour Line Up / Game Center
• Boutons: "Line Up" → vers la formation; "Game Center" → directement à l'enregistrement du jeu`
        },
        
        'season': {
            de: `📊 Season Table

Übersicht aller Spielerstatistiken der Saison.

• Feldspieler-Saisonwerte (Goalies ausgeblendet)
• Klick/Doppelklick auf Werte: +1/–1 (bei +/- auch negativ)
• Long-Press auf Time-Zelle: Zusätzliche Zeit kann manuell eingegeben werden
• Positionsfilter (Dropdown "Pos.")
• MVP Points/MVP = Wertvollster Spieler gemäss analysierter Statistik (AI-Formel)
• Download: Saisondaten werden als Excel heruntergeladen`,
            
            en: `📊 Season Table

Overview of all player statistics for the season.

• Field player season values (goalies hidden)
• Click/double-click on values: +1/–1 (+/- can be negative)
• Long-press on time cell: Additional time can be entered manually
• Position filter (dropdown "Pos.")
• MVP Points/MVP = Most Valuable Player based on analyzed statistics (AI formula)
• Download: Season data is downloaded as Excel`,
            
            it: `📊 Season Table

Panoramica di tutte le statistiche dei giocatori della stagione.

• Valori stagionali giocatori di campo (portieri nascosti)
• Clicca/doppio clic sui valori: +1/–1 (+/- può essere negativo)
• Pressione lunga sulla cella del tempo: Il tempo aggiuntivo può essere inserito manualmente
• Filtro posizione (menu a tendina "Pos.")
• MVP Points/MVP = Giocatore più prezioso in base alle statistiche analizzate (formula AI)
• Download: I dati della stagione vengono scaricati come Excel`,
            
            fr: `📊 Season Table

Aperçu de toutes les statistiques des joueurs de la saison.

• Valeurs saisonnières des joueurs de champ (gardiens cachés)
• Clic/double-clic sur les valeurs: +1/–1 (+/- peut être négatif)
• Pression longue sur la cellule de temps: Le temps supplémentaire peut être saisi manuellement
• Filtre de position (menu déroulant "Pos.")
• MVP Points/MVP = Joueur le plus précieux selon les statistiques analysées (formule AI)
• Download: Les données de la saison sont téléchargées en tant qu'Excel`
        },
        
        'game-center': {
            de: `🏒 Game Center

Erfasse Spielereignisse live während des Spiels.

Spielerzeile:
• Klick auf Namen (nicht auf ⋮⋮): Timer Start/Stop für jeden Spieler
• Die 5 Spieler mit grünen Werten haben die längste Eiszeit
• Die 5 Spieler mit roten Werten haben die niedrigste Eiszeit
• Klick auf Zeit: +10 s; Doppelklick: –10 s
• Langer Druck auf ⋮⋮ → Drag & Drop für Reihenfolge

Statistikzellen (z. B. Goals, Shot):
• Klick: +1, Doppelklick: –1
• Bei +1 auf Goals/Shot startet je nach Ereignis der Goal- bzw. Shot-Workflow in der Goal Map

Gegner-Schüsse:
• In der Shot-Totals-Zelle (unten) per Klick/Doppelklick zählen

Download:
• Spieldaten werden als Excel heruntergeladen

Export Season:
• Spieldaten werden zu Saisonstatistiken addiert
• Dabei wird ein Goal Value Wert eingegeben (1 Stern = sehr schwacher Gegner, 10 Sterne = sehr starker Gegner)`,
            
            en: `🏒 Game Center

Record game events live during the match.

Player Row:
• Click on name (not on ⋮⋮): Timer Start/Stop for each player
• The 5 players with green values have the longest ice time
• The 5 players with red values have the shortest ice time
• Click on time: +10 s; Double-click: –10 s
• Long press on ⋮⋮ → Drag & Drop for order

Stat Cells (e.g., Goals, Shot):
• Click: +1, Double-click: –1
• +1 on Goals/Shot triggers corresponding Goal or Shot workflow in Goal Map

Opponent Shots:
• Count in Shot-Totals cell (bottom) via click/double-click

Download:
• Game data is downloaded as Excel

Export Season:
• Game data is added to season statistics
• A Goal Value must be entered (1 star = very weak opponent, 10 stars = very strong opponent)`,
            
            it: `🏒 Game Center

Registra gli eventi del gioco in diretta durante la partita.

Riga giocatore:
• Clicca sul nome (non su ⋮⋮): Timer Start/Stop per ogni giocatore
• I 5 giocatori con valori verdi hanno il tempo di ghiaccio più lungo
• I 5 giocatori con valori rossi hanno il tempo di ghiaccio più breve
• Clicca sul tempo: +10 s; Doppio clic: –10 s
• Pressione lunga su ⋮⋮ → Drag & Drop per l'ordine

Celle statistiche (ad es. Goals, Shot):
• Clic: +1, Doppio clic: –1
• +1 su Goals/Shot avvia il corrispondente flusso di lavoro Goal o Shot nella Goal Map

Tiri avversari:
• Conta nella cella Shot-Totals (in basso) tramite clic/doppio clic

Download:
• I dati del gioco vengono scaricati come Excel

Export Season:
• I dati del gioco vengono aggiunti alle statistiche stagionali
• Deve essere inserito un Goal Value (1 stella = avversario molto debole, 10 stelle = avversario molto forte)`,
            
            fr: `🏒 Game Center

Enregistre les événements du match en direct.

Ligne joueur:
• Clique sur le nom (pas sur ⋮⋮): Timer Démarrer/Arrêter pour chaque joueur
• Les 5 joueurs avec des valeurs vertes ont le temps de glace le plus long
• Les 5 joueurs avec des valeurs rouges ont le temps de glace le plus court
• Clic sur le temps: +10 s; Double-clic: –10 s
• Pression longue sur ⋮⋮ → Drag & Drop pour l'ordre

Cellules de statistiques (par ex. Goals, Shot):
• Clic: +1, Double-clic: –1
• +1 sur Goals/Shot déclenche le flux de travail Goal ou Shot correspondant dans Goal Map

Tirs adverses:
• Compter dans la cellule Shot-Totals (en bas) via clic/double-clic

Download:
• Les données du match sont téléchargées en tant qu'Excel

Export Season:
• Les données du match sont ajoutées aux statistiques de la saison
• Une Goal Value doit être saisie (1 étoile = adversaire très faible, 10 étoiles = adversaire très fort)`
        },
        
        'goal-value': {
            de: `📈 Goal Value

Bewerte die Leistung deiner Spieler gegen verschiedene Gegner.

• Dieser Wert wird für die Saisonstatistiken benötigt
• Manuelle Eingabe der erzielten Tore gegen den jeweiligen Gegner möglich
• Untere Skala (Bottom) gewichtet Gegnerstärke
• Value = Summe (Wert × Gewicht)
• Dieser Wert zeigt einen Mittelwert aller exportierten Werte für diesen Gegner an
• Reset setzt alle Werte, Skalen und Gegnernamen zurück`,
            
            en: `📈 Goal Value

Rate your players' performance against different opponents.

• This value is required for season statistics
• Manual entry of goals scored against each opponent
• Bottom scale weights opponent strength
• Value = Sum (value × weight)
• This value shows an average of all exported values for this opponent
• Reset clears all values, scales, and opponent names`,
            
            it: `📈 Goal Value

Valuta le prestazioni dei tuoi giocatori contro diversi avversari.

• Questo valore è necessario per le statistiche stagionali
• Inserimento manuale dei gol segnati contro ogni avversario
• La scala inferiore pesa la forza dell'avversario
• Value = Somma (valore × peso)
• Questo valore mostra una media di tutti i valori esportati per questo avversario
• Reset cancella tutti i valori, le scale e i nomi degli avversari`,
            
            fr: `📈 Goal Value

Évalue la performance de tes joueurs contre différents adversaires.

• Cette valeur est nécessaire pour les statistiques de la saison
• Saisie manuelle des buts marqués contre chaque adversaire
• L'échelle inférieure pèse la force de l'adversaire
• Value = Somme (valeur × poids)
• Cette valeur montre une moyenne de toutes les valeurs exportées pour cet adversaire
• Reset efface toutes les valeurs, les échelles et les noms des adversaires`
        },
        
        'goal-map': {
            de: `🎯 Goal Map / Torbild

Visualisiere wo die Tore gefallen sind.

Feldhälften:
• Grün/Oben = scored (Tore erzielt)
• Rot/Unten = conceded (Gegentore)

Goal-Workflow (Beginnt mit Klick auf Goal in Game Center):
• 1. Grauen Punkt in grüne Spielhälfte setzen
• 2. Punkt in grünes Tor setzen
• 3. Zeit bestimmen in grünen Time-Buttons
• Danach Auto-Return zu Game Center

Shot-Workflow (Beginnt mit Klick auf Shot in Game Center):
• 1. Grünen Punkt in grüne Spielhälfte setzen
• Danach Auto-Return zu Game Center

Goal erhalten (es muss ein Goalie oben ausgewählt werden):
• 1. Grauen Punkt in rote Spielhälfte setzen
• 2. Punkt in rotes Tor setzen
• 3. Zeit bestimmen in roten Time-Buttons

Time Buttons:
• Klick: +1, Doppelklick: -1
• WICHTIG: +1/-1 gilt nur für den aktuell ausgewählten Spieler im Filter
• Ohne Filter wird "anonymous" verwendet

Export Season Map:
• Punkte werden zu Season Map addiert`,
            
            en: `🎯 Goal Map

Visualize where the goals were scored.

Field Halves:
• Green/Top = scored (goals scored)
• Red/Bottom = conceded (goals against)

Goal Workflow (Starts with click on Goal in Game Center):
• 1. Place gray dot in green field half
• 2. Place dot in green goal
• 3. Determine time in green Time Buttons
• Then auto-return to Game Center

Shot Workflow (Starts with click on Shot in Game Center):
• 1. Place green dot in green field half
• Then auto-return to Game Center

Goal conceded (a goalie must be selected at the top):
• 1. Place gray dot in red field half
• 2. Place dot in red goal
• 3. Determine time in red Time Buttons

Time Buttons:
• Click: +1, Double-click: -1
• IMPORTANT: +1/-1 applies only to the currently selected player in the filter
• Without filter "anonymous" is used

Export Season Map:
• Dots are added to Season Map`,
            
            it: `🎯 Goal Map

Visualizza dove sono stati segnati i gol.

Metà campo:
• Verde/Alto = segnati (gol segnati)
• Rosso/Basso = subiti (gol contro)

Flusso Goal (Inizia con clic su Goal in Game Center):
• 1. Posiziona il punto grigio nella metà campo verde
• 2. Posiziona il punto nel goal verde
• 3. Determina il tempo nei Time Buttons verdi
• Poi auto-ritorno a Game Center

Flusso Shot (Inizia con clic su Shot in Game Center):
• 1. Posiziona il punto verde nella metà campo verde
• Poi auto-ritorno a Game Center

Gol subito (un portiere deve essere selezionato in alto):
• 1. Posiziona il punto grigio nella metà campo rossa
• 2. Posiziona il punto nel goal rosso
• 3. Determina il tempo nei Time Buttons rossi

Time Buttons:
• Clic: +1, Doppio clic: -1
• IMPORTANTE: +1/-1 si applica solo al giocatore attualmente selezionato nel filtro
• Senza filtro viene utilizzato "anonymous"

Export Season Map:
• I punti vengono aggiunti a Season Map`,
            
            fr: `🎯 Goal Map

Visualise où les buts ont été marqués.

Moitiés de terrain:
• Vert/Haut = marqués (buts marqués)
• Rouge/Bas = encaissés (buts contre)

Flux Goal (Commence avec clic sur Goal dans Game Center):
• 1. Placer le point gris dans la moitié de terrain verte
• 2. Placer le point dans le but vert
• 3. Déterminer le temps dans les Time Buttons verts
• Puis retour automatique à Game Center

Flux Shot (Commence avec clic sur Shot dans Game Center):
• 1. Placer le point vert dans la moitié de terrain verte
• Puis retour automatique à Game Center

But encaissé (un gardien doit être sélectionné en haut):
• 1. Placer le point gris dans la moitié de terrain rouge
• 2. Placer le point dans le but rouge
• 3. Déterminer le temps dans les Time Buttons rouges

Time Buttons:
• Clic: +1, Double-clic: -1
• IMPORTANT: +1/-1 s'applique uniquement au joueur actuellement sélectionné dans le filtre
• Sans filtre "anonymous" est utilisé

Export Season Map:
• Les points sont ajoutés à Season Map`
        },
        
        'season-map': {
            de: `🗺️ Season Map

Saisonübersicht aller Tore auf der Karte.

• Nur lesbar (Read only)
• Alle Tore der Saison visualisiert
• Heatmap-Darstellung der Torpositionen

Filter:
• Player-Filter: Zeigt/aggregiert grüne (scored) Werte nur für diesen Spieler
• Goalie-Filter: Zeigt/aggregiert rote (conceded) Werte nur für diesen Goalie

Momentum-Grafik:
• Mit Player-Filter: grüne Werte nur dieses Spielers
• Mit Goalie-Filter: rote Werte nur dieses Goalies
• Ohne Filter: Gesamtwerte

Download:
• Season Map Daten werden als Excel heruntergeladen`,
            
            en: `🗺️ Season Map

Season overview of all goals on the map.

• Read only
• All season goals visualized
• Heatmap display of goal positions

Filters:
• Player Filter: Shows/aggregates green (scored) values for this player only
• Goalie Filter: Shows/aggregates red (conceded) values for this goalie only

Momentum Chart:
• With Player Filter: green values of this player only
• With Goalie Filter: red values of this goalie only
• Without filter: Total values

Download:
• Season Map data is downloaded as Excel`,
            
            it: `🗺️ Season Map

Panoramica stagionale di tutti i gol sulla mappa.

• Solo lettura (Read only)
• Tutti i gol della stagione visualizzati
• Visualizzazione heatmap delle posizioni dei gol

Filtri:
• Player Filter: Mostra/aggrega valori verdi (segnati) solo per questo giocatore
• Goalie Filter: Mostra/aggrega valori rossi (subiti) solo per questo portiere

Grafico Momentum:
• Con Player Filter: valori verdi solo di questo giocatore
• Con Goalie Filter: valori rossi solo di questo portiere
• Senza filtro: Valori totali

Download:
• I dati di Season Map vengono scaricati come Excel`,
            
            fr: `🗺️ Season Map

Aperçu saisonnier de tous les buts sur la carte.

• Lecture seule (Read only)
• Tous les buts de la saison visualisés
• Affichage heatmap des positions des buts

Filtres:
• Player Filter: Affiche/agrège les valeurs vertes (marqués) uniquement pour ce joueur
• Goalie Filter: Affiche/agrège les valeurs rouges (encaissés) uniquement pour ce gardien

Graphique Momentum:
• Avec Player Filter: valeurs vertes uniquement de ce joueur
• Avec Goalie Filter: valeurs rouges uniquement de ce gardien
• Sans filtre: Valeurs totales

Download:
• Les données de Season Map sont téléchargées en tant qu'Excel`
        }
    };
    
    const closeButtonText = {
        de: 'Schließen',
        en: 'Close',
        it: 'Chiudi',
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
                        <option value="it">&#x1F1EE;&#x1F1F9; Italiano</option>
                        <option value="fr">&#x1F1EB;&#x1F1F7; Français</option>
                    </select>
                </div>
                ${convertMarkdownToHTML(info)}
                <button id="pageInfoCloseBtn" class="info-close-btn">${closeButtonText[lang] || closeButtonText.de}</button>
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

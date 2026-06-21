let currentGame = null; 
let masterConfig = null;
let globalMode = 'digital'; // Default to screen play
let cachedGames = []; // Store all published games for instant filtering
let activeSection = null; // Dynamically set based on configuration
let sectionsList = []; // Loaded from master config

function enterFullscreen() {
    const elem = document.documentElement;
    
    // Attempt to lock the browser into fullscreen
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.log("Fullscreen blocked by browser"));
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
    
    // Hide the splash gate and unlock audio
    document.getElementById('fullscreen-gate').style.display = 'none';
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
}

// 1. Fetch the master config
async function loadMasterConfig() {
    try {
        const res = await fetch('/api/config');
        masterConfig = await res.json();
        sectionsList = masterConfig.sections || [
            { id: 'numera', title: 'Numera 🎈', background_color: '#F0F8FF', primary_color: '#2196F3' }
        ];
        if (!activeSection && sectionsList.length > 0) {
            activeSection = sectionsList[0].id;
        }
        renderSectionTabs();
        applySectionStyle();
    } catch (error) {
        console.error("Failed to load master config:", error);
    }
}

// 2. Load and cache the published games
async function loadGames() {
    try {
        const res = await fetch('/api/games/published');
        cachedGames = await res.json();
        renderGrid();
    } catch (error) {
        console.error("Failed to load games:", error);
    }
}

// 3. Dynamic Section Navigation rendering
function renderSectionTabs() {
    const tabsContainer = document.getElementById('section-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';
    
    sectionsList.forEach(sec => {
        const btn = document.createElement('button');
        btn.className = 'section-tab';
        if (sec.id === activeSection) {
            btn.classList.add('active');
            btn.style.color = sec.primary_color;
            btn.style.borderColor = sec.primary_color;
        } else {
            btn.style.color = '#555';
        }
        btn.innerText = sec.title;
        btn.onclick = () => setSection(sec.id);
        tabsContainer.appendChild(btn);
    });
}

function applySectionStyle() {
    const secConfig = sectionsList.find(s => s.id === activeSection);
    if (!secConfig) return;
    
    // Apply body background color
    document.body.style.backgroundColor = secConfig.background_color;
    
    // Apply dynamic title text
    const titleEl = document.getElementById('app-title');
    if (titleEl) {
        titleEl.innerText = secConfig.title;
    }
}

function setSection(sectionId) {
    activeSection = sectionId;
    renderSectionTabs();
    applySectionStyle();
    renderGrid();
}

// 4. Render the grid based on the active global mode and active section
function renderGrid() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';

    // Filter games that support the current global mode and active section
    const visibleGames = cachedGames.filter(game => {
        const matchesMode = globalMode === 'digital' ? game.has_digital_mode : game.has_companion_mode;
        const matchesSection = game.section === activeSection;
        return matchesMode && matchesSection;
    });

    if (visibleGames.length === 0) {
        grid.innerHTML = `<div class="empty-state">No games available for ${globalMode} mode!</div>`;
        return;
    }

    visibleGames.forEach(game => {
        const el = document.createElement('div');
        el.className = 'card';
        
        // Render the new emoji icon right above the title
        el.innerHTML = `
            <div class="game-icon">${game.icon}</div>
            <h2>${game.title}</h2>
        `;
        
        el.onclick = () => launchGame(game.id); 
        grid.appendChild(el);
    });
}

// 5. Handle the Toggle Switch
function setMode(mode) {
    globalMode = mode;
    
    // Update UI tabs
    document.getElementById('toggle-digital').classList.remove('active');
    document.getElementById('toggle-companion').classList.remove('active');
    document.getElementById(`toggle-${mode}`).classList.add('active');
    
    // Re-render the filtered grid
    renderGrid();
}

// 6. Direct Launch Logic
async function launchGame(gameId) {
    const res = await fetch(`/api/games/${gameId}`);
    const gameData = await res.json();
    
    // Deep Merge
    const templateDefaults = masterConfig.templates[gameData.template_type];
    const mergedConfig = {
        digital: { ...templateDefaults.digital, ...(gameData.config.digital || {}) },
        companion: { ...templateDefaults.companion, ...(gameData.config.companion || {}) }
    };

    currentGame = { ...gameData, config: mergedConfig };
    
    const activeGameContainer = document.getElementById('active-game-container');
    activeGameContainer.style.display = 'flex';
    
    // Apply background color of active section to containers
    const secConfig = sectionsList.find(s => s.id === activeSection);
    if (secConfig) {
        activeGameContainer.style.backgroundColor = secConfig.background_color;
        const gameCanvas = document.getElementById('game-canvas');
        if (gameCanvas) {
            gameCanvas.style.backgroundColor = secConfig.background_color;
        }
    }
    
    // Unlock Speech Synthesis
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));

    // Route dynamically based on the template
    if (currentGame.template_type === 'template_a') {
        TemplateA.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_b') {
        TemplateB.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_c') {
        TemplateC.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_d') {
        TemplateD.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_e') {
        TemplateE.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_f') {
        TemplateF.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_g') {
        TemplateG.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_h') {
        TemplateH.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_i') {
        TemplateI.init('game-canvas', globalMode, currentGame.config);
    } else {
        alert(`Template ${currentGame.template_type} is not built yet!`);
    }
}

function exitGame() {
    document.getElementById('active-game-container').style.display = 'none';
    document.getElementById('game-canvas').innerHTML = ''; 
    window.speechSynthesis.cancel(); 
    
    // Clear Template H speech timeouts if active
    if (typeof TemplateH !== 'undefined' && TemplateH.state.speechTimeout) {
        clearTimeout(TemplateH.state.speechTimeout);
    }

    // Clear Template I resize listener if active
    if (typeof TemplateI !== 'undefined' && TemplateI.state.resizeHandler) {
        window.removeEventListener('resize', TemplateI.state.resizeHandler);
        TemplateI.state.resizeHandler = null;
    }
    
    currentGame = null; 
}

// Initialize safely
loadMasterConfig().then(() => loadGames());
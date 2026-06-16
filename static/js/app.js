let currentGame = null; 
let masterConfig = null;
let globalMode = 'digital'; // Default to screen play
let cachedGames = []; // Store all published games for instant filtering

// 1. Fetch the master config
async function loadMasterConfig() {
    try {
        const res = await fetch('/api/config');
        masterConfig = await res.json();
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

// 3. Render the grid based on the active global mode
function renderGrid() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';

    // Filter games that support the current global mode
    const visibleGames = cachedGames.filter(game => {
        return globalMode === 'digital' ? game.has_digital_mode : game.has_companion_mode;
    });

    if (visibleGames.length === 0) {
        grid.innerHTML = `<div class="empty-state">No games available for ${globalMode} mode!</div>`;
        return;
    }

    visibleGames.forEach(game => {
        const el = document.createElement('div');
        el.className = 'card';
        el.innerHTML = `<h2>${game.title}</h2>`;
        el.onclick = () => launchGame(game.id); // Direct launch!
        grid.appendChild(el);
    });
}

// 4. Handle the Toggle Switch
function setMode(mode) {
    globalMode = mode;
    
    // Update UI tabs
    document.getElementById('toggle-digital').classList.remove('active');
    document.getElementById('toggle-companion').classList.remove('active');
    document.getElementById(`toggle-${mode}`).classList.add('active');
    
    // Re-render the filtered grid
    renderGrid();
}

// 5. Direct Launch Logic
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
    
    document.getElementById('active-game-container').style.display = 'flex';
    
    // Unlock Speech Synthesis
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));

// Route dynamically based on the template
// Route dynamically based on the template
    if (currentGame.template_type === 'template_a') {
        TemplateA.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_b') {
        TemplateB.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_c') {
        TemplateC.init('game-canvas', globalMode, currentGame.config);
    } else if (currentGame.template_type === 'template_d') {
        TemplateD.init('game-canvas', globalMode, currentGame.config);
    } else {
        alert(`Template ${currentGame.template_type} is not built yet!`);
    }
}

function exitGame() {
    document.getElementById('active-game-container').style.display = 'none';
    document.getElementById('game-canvas').innerHTML = ''; 
    window.speechSynthesis.cancel(); 
    currentGame = null; 
}

// Initialize safely
loadMasterConfig().then(() => loadGames());
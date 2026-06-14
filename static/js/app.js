let currentGameId = null;

async function loadGames() {
    try {
        const res = await fetch('/api/games/published');
        const games = await res.json();
        const grid = document.getElementById('game-grid');
        grid.innerHTML = '';

        if (games.length === 0) {
            grid.innerHTML = '<div class="empty-state">Ask your parents to add games!</div>';
            return;
        }

        games.forEach(game => {
            const el = document.createElement('div');
            el.className = 'card';
            el.innerHTML = `<h2>${game.title}</h2>`;
            el.onclick = () => openGameMenu(game.id);
            grid.appendChild(el);
        });
    } catch (error) {
        console.error("Failed to load games:", error);
    }
}

async function openGameMenu(gameId) {
    currentGameId = gameId;
    const res = await fetch(`/api/games/${gameId}`);
    const game = await res.json();
    
    document.getElementById('overlay-title').innerText = game.title;
    
    document.getElementById('btn-digital').style.display = game.has_digital_mode ? 'block' : 'none';
    document.getElementById('btn-companion').style.display = game.has_companion_mode ? 'block' : 'none';
    
    document.getElementById('game-overlay').style.display = 'flex';
}

function closeOverlay() {
    document.getElementById('game-overlay').style.display = 'none';
    currentGameId = null;
}

function launchGame(mode) {
    alert(`Launching ${currentGameId} in ${mode} mode!`);
}

// Initialize
loadGames();
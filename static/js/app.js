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
    // Hide the overlay visually, but KEEP the currentGameId intact
    document.getElementById('game-overlay').style.display = 'none';
    
    if (currentGameId === 'put_in_the_box' && mode === 'digital') {
        document.getElementById('active-game-container').style.display = 'flex';
        PutInTheBox.init('game-canvas');
    } else {
        alert(`Coming soon! Launching ${currentGameId} in ${mode} mode.`);
    }
}

function exitGame() {
    document.getElementById('active-game-container').style.display = 'none';
    document.getElementById('game-canvas').innerHTML = ''; // Clean up memory
    window.speechSynthesis.cancel(); // Stop any ongoing counting
    
    // NOW we clear the ID since we are completely exiting back to the dashboard
    currentGameId = null; 
}

// Initialize
loadGames();
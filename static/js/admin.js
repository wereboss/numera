let sectionsList = [];

async function loadPortal() {
    try {
        // 1. Fetch master config to get sections
        const configRes = await fetch('/api/config');
        const config = await configRes.json();
        sectionsList = config.sections || [
            { id: 'numera', title: 'Numera 🎈' }
        ];

        // 2. Fetch all games for the parent admin view
        const gamesRes = await fetch('/api/admin/games');
        const games = await gamesRes.json();

        const container = document.getElementById('admin-sections-container');
        container.innerHTML = '';

        // Group games by section
        const groupedGames = {};
        sectionsList.forEach(sec => {
            groupedGames[sec.id] = [];
        });
        
        // Add a fallback for unknown sections
        const unknownSectionId = 'other';
        groupedGames[unknownSectionId] = [];

        games.forEach(game => {
            const secId = game.section || 'numera';
            if (groupedGames[secId]) {
                groupedGames[secId].push(game);
            } else {
                groupedGames[unknownSectionId].push(game);
            }
        });

        // 3. Render each section's games
        sectionsList.forEach(sec => {
            renderSection(container, sec, groupedGames[sec.id]);
        });

        // Render unknown section games if any exist
        if (groupedGames[unknownSectionId].length > 0) {
            renderSection(container, { id: 'other', title: 'Other Games 🎲' }, groupedGames[unknownSectionId]);
        }

    } catch (error) {
        console.error("Failed to load admin portal:", error);
    }
}

function renderSection(parentContainer, sectionInfo, gamesList) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'admin-section';
    sectionDiv.style.marginBottom = '40px';

    const header = document.createElement('h2');
    header.innerText = `${sectionInfo.title} Games`;
    header.className = 'admin-section-header';
    sectionDiv.appendChild(header);

    const listDiv = document.createElement('div');
    listDiv.className = 'admin-list';
    
    if (gamesList.length === 0) {
        listDiv.innerHTML = '<div style="color: #999; padding: 15px;">No games configured for this section.</div>';
    } else {
        gamesList.forEach(game => {
            const row = document.createElement('div');
            row.className = 'game-row';
            
            const btnClass = game.is_published ? 'btn-unpublish' : 'btn-publish';
            const btnText = game.is_published ? 'Unpublish' : `Publish to ${sectionInfo.title.split(' ')[0]}`;

            row.innerHTML = `
                <div class="game-title">${game.title}</div>
                <button class="${btnClass}" onclick="togglePublish('${game.id}')">${btnText}</button>
            `;
            listDiv.appendChild(row);
        });
    }

    sectionDiv.appendChild(listDiv);
    parentContainer.appendChild(sectionDiv);
}

async function togglePublish(gameId) {
    await fetch(`/api/admin/games/${gameId}/toggle-publish`, { method: 'POST' });
    loadPortal(); // Reload to reflect changes
}

// Initial boot
loadPortal();
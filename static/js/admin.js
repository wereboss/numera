        async function loadAdminGames() {
            const res = await fetch('/api/admin/games');
            const games = await res.json();
            const list = document.getElementById('admin-list');
            list.innerHTML = '';

            games.forEach(game => {
                const row = document.createElement('div');
                row.className = 'game-row';
                
                const btnClass = game.is_published ? 'btn-unpublish' : 'btn-publish';
                const btnText = game.is_published ? 'Unpublish' : 'Publish to Numera';

                row.innerHTML = `
                    <div class="game-title">${game.title}</div>
                    <button class="${btnClass}" onclick="togglePublish('${game.id}')">${btnText}</button>
                `;
                list.appendChild(row);
            });
        }

        async function togglePublish(gameId) {
            await fetch(`/api/admin/games/${gameId}/toggle-publish`, { method: 'POST' });
            loadAdminGames(); // Reload the list to show updated state
        }

        loadAdminGames();
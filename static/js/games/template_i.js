const TemplateI = {
    state: {
        rounds: 3,
        currentRound: 0,
        roundPairs: [],
        connections: [],
        activeDrag: null,
        connectedCount: 0,
        totalPairs: 3,
        config: null,
        resizeHandler: null
    },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentRound = 0;
        this.state.rounds = config.digital.rounds || 3;

        // Clean up any stale window resize listener
        if (this.state.resizeHandler) {
            window.removeEventListener('resize', this.state.resizeHandler);
            this.state.resizeHandler = null;
        }

        if (mode === 'digital') {
            this.startRound(containerId);
        } else if (mode === 'companion') {
            this.renderCompanion(containerId);
        }
    },

    startRound: function(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        this.state.connections = [];
        this.state.activeDrag = null;
        this.state.connectedCount = 0;

        // Determine dynamic number of pairs (rows) based on config
        const range = this.state.config.digital.pair_count_range || [3, 5];
        const min = range[0];
        const max = range[1];
        this.state.totalPairs = Math.floor(Math.random() * (max - min + 1)) + min;

        // Clean up previous event listener
        if (this.state.resizeHandler) {
            window.removeEventListener('resize', this.state.resizeHandler);
        }

        // 1. Generate left & right pairs based on game type
        const type = this.state.config.digital.game_type || "counts";
        let pairs = [];

        if (type === "counts") {
            // "Match the Counts" logic (expanded up to 6 counts to support up to 5 pairs)
            const availableCounts = [1, 2, 3, 4, 5, 6];
            availableCounts.sort(() => Math.random() - 0.5);
            const selectedCounts = availableCounts.slice(0, this.state.totalPairs);

            const emojis = ["🚗", "🍎", "🎈", "⭐️", "🐱", "🐶", "🦖", "🍕"];
            emojis.sort(() => Math.random() - 0.5);

            for (let i = 0; i < this.state.totalPairs; i++) {
                const count = selectedCounts[i];
                const emoji = emojis[i];
                // e.g., Left: "🚗🚗", Right: "2"
                pairs.push({
                    id: `pair-${i}`,
                    left: emoji.repeat(count),
                    right: count.toString(),
                    speechLeft: `${count} ${count === 1 ? 'item' : 'items'}`,
                    speechRight: count.toString()
                });
            }
        } else {
            // "Match the Names" logic
            const pool = [...this.state.config.digital.items];
            pool.sort(() => Math.random() - 0.5);
            const selectedItems = pool.slice(0, this.state.totalPairs);

            for (let i = 0; i < this.state.totalPairs; i++) {
                const item = selectedItems[i];
                // e.g., Left: "APPLE", Right: "🍎"
                pairs.push({
                    id: `pair-${i}`,
                    left: item.word.toUpperCase(),
                    right: item.emoji,
                    speechLeft: item.word,
                    speechRight: item.word
                });
            }
        }

        this.state.roundPairs = pairs;

        // Shuffle right column independently while ensuring <= 1 horizontal line
        let shuffledRight = [...pairs];
        let attempts = 0;
        while (attempts < 100) {
            shuffledRight.sort(() => Math.random() - 0.5);

            // Count horizontal alignments
            let horizontalCount = 0;
            for (let i = 0; i < pairs.length; i++) {
                if (pairs[i].id === shuffledRight[i].id) {
                    horizontalCount++;
                }
            }

            // Enforce at most 1 horizontal connector line
            if (horizontalCount <= 1) {
                break;
            }
            attempts++;
        }

        // 2. Build DOM structures
        const wrap = document.createElement('div');
        wrap.className = 'line-match-container';

        const title = document.createElement('div');
        title.className = 'line-match-title';
        title.innerText = this.state.config.digital.start_message || "Connect the matches!";
        wrap.appendChild(title);

        const canvas = document.createElement('canvas');
        canvas.className = 'line-match-canvas';
        wrap.appendChild(canvas);

        const columns = document.createElement('div');
        columns.className = 'line-match-columns';

        const leftCol = document.createElement('div');
        leftCol.className = 'line-match-column left-column';

        const rightCol = document.createElement('div');
        rightCol.className = 'line-match-column right-column';

        // Render Left Column
        pairs.forEach(pair => {
            const row = document.createElement('div');
            row.className = 'line-match-row left-row';

            const card = document.createElement('div');
            card.className = 'line-match-card';
            card.innerText = pair.left;
            if (type === "names") {
                card.classList.add('text-card');
            }

            const dot = document.createElement('div');
            dot.className = 'line-match-dot';
            dot.dataset.side = "left";
            dot.dataset.matchId = pair.id;
            dot.dataset.speechValue = pair.speechLeft;

            row.appendChild(card);
            row.appendChild(dot);
            leftCol.appendChild(row);

            // Bind drag handlers on the left dot
            this.bindDotEvents(dot, containerId);
        });

        // Render Right Column
        shuffledRight.forEach(pair => {
            const row = document.createElement('div');
            row.className = 'line-match-row right-row';

            const dot = document.createElement('div');
            dot.className = 'line-match-dot';
            dot.dataset.side = "right";
            dot.dataset.matchId = pair.id;
            dot.dataset.speechValue = pair.speechRight;

            const card = document.createElement('div');
            card.className = 'line-match-card';
            card.innerText = pair.right;

            row.appendChild(dot);
            row.appendChild(card);
            rightCol.appendChild(row);
        });

        columns.appendChild(leftCol);
        columns.appendChild(rightCol);
        wrap.appendChild(columns);
        container.appendChild(wrap);

        // 3. Set up high-DPI Canvas Resizing
        this.state.resizeHandler = () => this.resizeCanvas(canvas, wrap);
        window.addEventListener('resize', this.state.resizeHandler);
        // Delay slightly for render layouts to settle
        setTimeout(this.state.resizeHandler, 100);

        // Speech start message
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(title.innerText));
    },

    resizeCanvas: function(canvas, wrap) {
        const rect = wrap.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.drawLines();
    },

    bindDotEvents: function(dot, containerId) {
        dot.addEventListener('pointerdown', (e) => {
            if (dot.dataset.matched === "true") return;
            e.preventDefault();
            dot.setPointerCapture(e.pointerId);

            this.state.activeDrag = {
                pointerId: e.pointerId,
                startDot: dot,
                currentX: e.clientX,
                currentY: e.clientY
            };
            dot.classList.add('active');
        });

        dot.addEventListener('pointermove', (e) => {
            if (!this.state.activeDrag || this.state.activeDrag.pointerId !== e.pointerId) return;
            this.state.activeDrag.currentX = e.clientX;
            this.state.activeDrag.currentY = e.clientY;
            this.drawLines();
        });

        dot.addEventListener('pointerup', (e) => {
            if (!this.state.activeDrag || this.state.activeDrag.pointerId !== e.pointerId) return;
            const drag = this.state.activeDrag;
            this.state.activeDrag = null;
            dot.classList.remove('active');
            dot.releasePointerCapture(e.pointerId);

            // Search collision with right dots
            const x = e.clientX;
            const y = e.clientY;
            let targetDot = null;
            const container = document.getElementById(containerId);
            const rightDots = container.querySelectorAll('.line-match-dot[data-side="right"]');

            for (let rDot of rightDots) {
                if (rDot.dataset.matched === "true") continue;
                const rect = rDot.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    targetDot = rDot;
                    break;
                }
            }

            if (targetDot) {
                if (dot.dataset.matchId === targetDot.dataset.matchId) {
                    // Correct connection!
                    dot.dataset.matched = "true";
                    targetDot.dataset.matched = "true";
                    dot.classList.add('connected');
                    targetDot.classList.add('connected');

                    dot.closest('.line-match-row').classList.add('satisfied');
                    targetDot.closest('.line-match-row').classList.add('satisfied');

                    const colorOptions = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#00BCD4"];
                    const chosenColor = colorOptions[this.state.connections.length % colorOptions.length];

                    this.state.connections.push({
                        start: dot,
                        end: targetDot,
                        color: chosenColor
                    });

                    const speechValue = targetDot.dataset.speechValue;
                    const feedback = new SpeechSynthesisUtterance(`Yes! ${speechValue}`);
                    feedback.pitch = 1.4;
                    window.speechSynthesis.speak(feedback);

                    this.state.connectedCount++;

                    if (this.state.connectedCount === this.state.totalPairs) {
                        setTimeout(() => {
                            this.state.currentRound++;
                            if (this.state.currentRound < this.state.rounds) {
                                this.startRound(containerId);
                            } else {
                                this.triggerFinale(document.getElementById('game-canvas'));
                            }
                        }, 1500);
                    }
                } else {
                    // Incorrect Match
                    const oops = new SpeechSynthesisUtterance("Try again!");
                    oops.pitch = 1.1;
                    window.speechSynthesis.speak(oops);

                    // Wobble rows
                    const leftRow = dot.closest('.line-match-row');
                    const rightRow = targetDot.closest('.line-match-row');
                    leftRow.classList.add('wobble');
                    rightRow.classList.add('wobble');
                    setTimeout(() => {
                        leftRow.classList.remove('wobble');
                        rightRow.classList.remove('wobble');
                    }, 500);
                }
            }
            this.drawLines();
        });
    },

    drawLines: function() {
        const canvas = document.querySelector('.line-match-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const canvasRect = canvas.getBoundingClientRect();

        // Draw locked connections
        this.state.connections.forEach(conn => {
            const startRect = conn.start.getBoundingClientRect();
            const endRect = conn.end.getBoundingClientRect();

            const startX = startRect.left - canvasRect.left + startRect.width / 2;
            const startY = startRect.top - canvasRect.top + startRect.height / 2;
            const endX = endRect.left - canvasRect.left + endRect.width / 2;
            const endY = endRect.top - canvasRect.top + endRect.height / 2;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = conn.color;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.stroke();
        });

        // Draw active drag line
        if (this.state.activeDrag) {
            const drag = this.state.activeDrag;
            const startRect = drag.startDot.getBoundingClientRect();

            const startX = startRect.left - canvasRect.left + startRect.width / 2;
            const startY = startRect.top - canvasRect.top + startRect.height / 2;
            const endX = drag.currentX - canvasRect.left;
            const endY = drag.currentY - canvasRect.top;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = "#9C27B0";
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.setLineDash([8, 8]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    },

    triggerFinale: function(container) {
        if (this.state.resizeHandler) {
            window.removeEventListener('resize', this.state.resizeHandler);
            this.state.resizeHandler = null;
        }

        container.innerHTML = '';
        if (window.triggerEmojiRain) window.triggerEmojiRain();

        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = this.state.config.digital.success_message || "Splendid!";

        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🎉✏️🏆';

        const cheer = new SpeechSynthesisUtterance(title.innerText);
        cheer.pitch = 1.2;
        window.speechSynthesis.speak(cheer);

        wrap.appendChild(title);
        wrap.appendChild(visual);
        container.appendChild(wrap);
    },

    renderCompanion: function(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = "Parent Guide";
        title.style.color = '#FF9800';

        const listWrap = document.createElement('div');
        listWrap.className = 'companion-instructions';

        this.state.config.companion.instructions.forEach(instruction => {
            const step = document.createElement('div');
            step.className = 'companion-step';
            step.innerText = instruction;
            listWrap.appendChild(step);
        });

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'tap-anywhere-btn';
        refreshBtn.style.marginTop = '20px';
        refreshBtn.innerText = "Get New Prompts 🎲";
        refreshBtn.onclick = () => this.init(containerId, 'companion', this.state.config);

        wrap.appendChild(title);
        wrap.appendChild(listWrap);
        wrap.appendChild(refreshBtn);
        container.appendChild(wrap);
    }
};

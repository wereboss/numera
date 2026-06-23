const TemplateJ = {
    state: {
        rounds: 3,
        currentRound: 0,
        gameType: "counting",
        targetCount: 0,
        addendA: 0,
        addendB: 0,
        countedSoFar: 0,
        choices: [],
        config: null,
        locked: false
    },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentRound = 0;
        this.state.rounds = config.digital.rounds || 3;

        if (mode === 'digital') {
            this.startRound(containerId);
        } else if (mode === 'companion') {
            this.renderCompanion(containerId);
        }
    },

    startRound: function(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        this.state.countedSoFar = 0;
        this.state.locked = false;

        const gameType = this.state.config.digital.game_type || "counting";
        this.state.gameType = gameType;

        const emojis = this.state.config.digital.emojis || ["🍎", "🚗", "🍌", "⭐", "🎈", "🐶", "🦖", "🍕"];
        const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let targetCount = 0;
        let addendA = 0;
        let addendB = 0;

        if (gameType === "addition") {
            const minSingle = this.state.config.digital.min_single || 1;
            const maxSingle = this.state.config.digital.max_single || 5;
            addendA = Math.floor(Math.random() * (maxSingle - minSingle + 1)) + minSingle;
            addendB = Math.floor(Math.random() * (maxSingle - minSingle + 1)) + minSingle;
            targetCount = addendA + addendB;
        } else {
            const minCount = this.state.config.digital.min_count || 1;
            const maxCount = this.state.config.digital.max_count || 10;
            targetCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
        }

        this.state.targetCount = targetCount;
        this.state.addendA = addendA;
        this.state.addendB = addendB;

        this.state.choices = this.generateChoices(targetCount);

        // Render DOM Layout
        const wrap = document.createElement('div');
        wrap.className = 'helper-game-container';

        const title = document.createElement('div');
        title.className = 'helper-title';
        title.innerText = this.state.config.digital.start_message || "Count the items!";
        wrap.appendChild(title);

        const playArea = document.createElement('div');
        playArea.className = 'helper-play-area';

        // Left Pane: Emoji Display
        const leftPane = document.createElement('div');
        leftPane.className = 'helper-left-pane';

        const gridsRow = document.createElement('div');
        gridsRow.className = 'helper-grids-row';

        if (gameType === "addition") {
            // First Grid
            const gridA = document.createElement('div');
            gridA.className = 'helper-emoji-grid';
            gridA.dataset.size = addendA;
            for (let i = 0; i < addendA; i++) {
                const bubble = document.createElement('div');
                bubble.className = 'helper-emoji-bubble';
                bubble.innerText = selectedEmoji;
                bubble.dataset.counted = "false";
                bubble.addEventListener('pointerdown', () => this.handleEmojiTap(bubble));
                gridA.appendChild(bubble);
            }
            gridsRow.appendChild(gridA);

            // Plus Sign
            const plus = document.createElement('div');
            plus.className = 'helper-plus-sign';
            plus.innerText = "+";
            gridsRow.appendChild(plus);

            // Second Grid
            const gridB = document.createElement('div');
            gridB.className = 'helper-emoji-grid';
            gridB.dataset.size = addendB;
            for (let i = 0; i < addendB; i++) {
                const bubble = document.createElement('div');
                bubble.className = 'helper-emoji-bubble';
                bubble.innerText = selectedEmoji;
                bubble.dataset.counted = "false";
                bubble.addEventListener('pointerdown', () => this.handleEmojiTap(bubble));
                gridB.appendChild(bubble);
            }
            gridsRow.appendChild(gridB);
        } else {
            // Single Grid
            const grid = document.createElement('div');
            grid.className = 'helper-emoji-grid';
            grid.dataset.size = targetCount;
            for (let i = 0; i < targetCount; i++) {
                const bubble = document.createElement('div');
                bubble.className = 'helper-emoji-bubble';
                bubble.innerText = selectedEmoji;
                bubble.dataset.counted = "false";
                bubble.addEventListener('pointerdown', () => this.handleEmojiTap(bubble));
                grid.appendChild(bubble);
            }
            gridsRow.appendChild(grid);
        }
        leftPane.appendChild(gridsRow);

        // Visual Count/Equation Label under the grids
        const equationLabel = document.createElement('div');
        equationLabel.className = 'helper-equation-label';
        equationLabel.id = 'helper-equation-label';
        leftPane.appendChild(equationLabel);

        playArea.appendChild(leftPane);

        // Right Pane: Multiple Choices
        const rightPane = document.createElement('div');
        rightPane.className = 'helper-right-pane';

        const choicesGrid = document.createElement('div');
        choicesGrid.className = 'helper-choices-grid';

        this.state.choices.forEach(num => {
            const choiceCard = document.createElement('div');
            choiceCard.className = 'helper-choice-card';
            choiceCard.innerText = num;
            choiceCard.addEventListener('pointerdown', () => this.handleChoiceTap(choiceCard, num, containerId));
            choicesGrid.appendChild(choiceCard);
        });
        rightPane.appendChild(choicesGrid);
        playArea.appendChild(rightPane);

        wrap.appendChild(playArea);
        container.appendChild(wrap);

        // Start voice instruction
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(title.innerText));
    },

    generateChoices: function(target) {
        let choiceSet = new Set([target]);
        let attempts = 0;

        while (choiceSet.size < 4 && attempts < 100) {
            let offset = Math.floor(Math.random() * 7) - 3; // -3 to +3 range
            let num = target + offset;
            if (num > 0 && num !== target) {
                choiceSet.add(num);
            }
            attempts++;
        }

        let fallback = 1;
        while (choiceSet.size < 4) {
            if (fallback !== target) {
                choiceSet.add(fallback);
            }
            fallback++;
        }

        return Array.from(choiceSet).sort((a, b) => a - b);
    },

    handleEmojiTap: function(bubble) {
        if (bubble.dataset.counted === "true") return;
        bubble.dataset.counted = "true";
        bubble.classList.add('counted');
        this.state.countedSoFar++;

        const speech = new SpeechSynthesisUtterance(this.state.countedSoFar.toString());
        speech.rate = 1.0;
        speech.pitch = 1.3;
        window.speechSynthesis.speak(speech);
    },

    handleChoiceTap: function(cardEl, num, containerId) {
        if (this.state.locked) return;

        if (num === this.state.targetCount) {
            this.state.locked = true;
            cardEl.classList.add('correct-choice');

            // Show the visual number / equation under the grids
            const labelEl = document.getElementById('helper-equation-label');
            if (labelEl) {
                if (this.state.gameType === "addition") {
                    labelEl.innerText = `${this.state.addendA} + ${this.state.addendB} = ${this.state.targetCount}`;
                } else {
                    labelEl.innerText = `${this.state.targetCount}`;
                }
                labelEl.classList.add('visible');
            }

            let feedbackText = "";
            if (this.state.gameType === "addition") {
                feedbackText = `Yes! ${this.state.addendA} plus ${this.state.addendB} is ${this.state.targetCount}!`;
            } else {
                feedbackText = `Yes! That is ${this.state.targetCount}!`;
            }

            const speech = new SpeechSynthesisUtterance(feedbackText);
            speech.pitch = 1.3;
            
            // Brief delay so child visualizes the visual number before hearing it
            setTimeout(() => {
                window.speechSynthesis.speak(speech);
            }, 400);

            setTimeout(() => {
                this.state.currentRound++;
                if (this.state.currentRound < this.state.rounds) {
                    this.startRound(containerId);
                } else {
                    this.triggerFinale(document.getElementById('game-canvas'));
                }
            }, 2000);
        } else {
            this.state.locked = true;
            cardEl.classList.add('incorrect-choice');

            const oops = new SpeechSynthesisUtterance("Try again!");
            oops.pitch = 1.2;
            window.speechSynthesis.speak(oops);

            setTimeout(() => {
                cardEl.classList.remove('incorrect-choice');
                this.state.locked = false;
            }, 500);
        }
    },

    triggerFinale: function(container) {
        container.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = this.state.config.digital.success_message || "Splendid!";

        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🎉🔢🏆';

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

        if (!this.state.targetCount || this.state.targetCount === 0) {
            const gameType = this.state.config.digital.game_type || "counting";
            this.state.gameType = gameType;
            if (gameType === "addition") {
                const minSingle = this.state.config.digital.min_single || 1;
                const maxSingle = this.state.config.digital.max_single || 5;
                this.state.addendA = Math.floor(Math.random() * (maxSingle - minSingle + 1)) + minSingle;
                this.state.addendB = Math.floor(Math.random() * (maxSingle - minSingle + 1)) + minSingle;
                this.state.targetCount = this.state.addendA + this.state.addendB;
            } else {
                const minCount = this.state.config.digital.min_count || 1;
                const maxCount = this.state.config.digital.max_count || 10;
                this.state.targetCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
            }
            this.state.choices = this.generateChoices(this.state.targetCount);
        }

        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = "Parent Guide";
        title.style.color = '#FF9800';

        const listWrap = document.createElement('div');
        listWrap.className = 'companion-instructions';

        const choicesStr = this.state.choices.join(', ');

        this.state.config.companion.instructions.forEach(instruction => {
            let parsedText = instruction
                .replace('{target_count}', this.state.targetCount)
                .replace('{choices}', choicesStr)
                .replace('{addendA}', this.state.addendA)
                .replace('{addendB}', this.state.addendB);

            const step = document.createElement('div');
            step.className = 'companion-step';
            step.innerText = parsedText;
            listWrap.appendChild(step);
        });

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'tap-anywhere-btn';
        refreshBtn.style.marginTop = '20px';
        refreshBtn.innerText = "Get New Prompts 🎲";
        refreshBtn.onclick = () => {
            this.state.targetCount = 0; // force re-generation
            this.init(containerId, 'companion', this.state.config);
        };

        wrap.appendChild(title);
        wrap.appendChild(listWrap);
        wrap.appendChild(refreshBtn);
        container.appendChild(wrap);
    }
};

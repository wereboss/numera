const TemplateG = {
    state: {
        rounds: 3,
        currentRound: 0,
        roundChoices: [],
        config: null
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

        const categories = this.state.config.digital.categories;
        const keys = Object.keys(categories);

        // Select two unique categories
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
        const mainCatKey = shuffledKeys[0];
        const oddCatKey = shuffledKeys[1];

        // Pick 3 random unique items from main category
        const mainItems = [...categories[mainCatKey]].sort(() => Math.random() - 0.5).slice(0, 3);
        // Pick 1 random item from the odd category
        const oddItem = categories[oddCatKey][Math.floor(Math.random() * categories[oddCatKey].length)];

        // Assemble the four choices
        const choices = [
            { emoji: mainItems[0], isOdd: false },
            { emoji: mainItems[1], isOdd: false },
            { emoji: mainItems[2], isOdd: false },
            { emoji: oddItem, isOdd: true }
        ];

        // Randomize grid positions
        choices.sort(() => Math.random() - 0.5);
        this.state.roundChoices = choices;

        // Render layout
        const wrap = document.createElement('div');
        wrap.className = 'odd-game-container';

        const prompt = document.createElement('div');
        prompt.className = 'odd-prompt';
        prompt.innerText = this.state.config.digital.start_message || "Find the one that is different!";
        wrap.appendChild(prompt);

        const grid = document.createElement('div');
        grid.className = 'odd-choices-grid';

        choices.forEach((choice, index) => {
            const card = document.createElement('div');
            card.className = 'odd-choice-card';
            card.innerText = choice.emoji;
            card.dataset.index = index;

            card.addEventListener('pointerdown', () => this.handleCardTap(card, choice, containerId));
            grid.appendChild(card);
        });

        wrap.appendChild(grid);
        container.appendChild(wrap);

        // Speak the prompt
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(prompt.innerText));
    },

    handleCardTap: function(cardEl, choice, containerId) {
        // Prevent tapping during transition animations
        const grid = cardEl.parentElement;
        if (grid.dataset.locked === "true") return;

        if (choice.isOdd) {
            grid.dataset.locked = "true";
            cardEl.classList.add('correct-card');

            // Success feedback
            const feedback = new SpeechSynthesisUtterance("Yes! That is different!");
            feedback.pitch = 1.3;
            window.speechSynthesis.speak(feedback);

            setTimeout(() => {
                this.state.currentRound++;
                if (this.state.currentRound < this.state.rounds) {
                    this.startRound(containerId);
                } else {
                    this.triggerFinale(document.getElementById('game-canvas'));
                }
            }, 1500);
        } else {
            // Lock grid temporarily for the wobble animation duration
            grid.dataset.locked = "true";
            cardEl.classList.add('incorrect-card');

            const oops = new SpeechSynthesisUtterance("Try again!");
            oops.pitch = 1.2;
            window.speechSynthesis.speak(oops);

            setTimeout(() => {
                cardEl.classList.remove('incorrect-card');
                grid.dataset.locked = "false";
            }, 500);
        }
    },

    triggerFinale: function(container) {
        container.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = this.state.config.digital.success_message || "Super job!";

        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🌟🕵️‍♂️🏆';

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

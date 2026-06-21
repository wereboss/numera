const TemplateH = {
    state: {
        rounds: 3,
        currentRound: 0,
        roundItems: [],
        targetItem: null,
        choices: [],
        config: null,
        speechTimeout: null
    },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentRound = 0;
        this.state.rounds = config.digital.rounds || 3;

        // Shuffle the item pool and pick subset for the rounds
        const itemsCopy = [...config.digital.items];
        itemsCopy.sort(() => Math.random() - 0.5);
        this.state.roundItems = itemsCopy.slice(0, this.state.rounds);

        if (mode === 'digital') {
            this.startRound(containerId);
        } else if (mode === 'companion') {
            this.renderCompanion(containerId);
        }
    },

    startRound: function(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        this.state.targetItem = this.state.roundItems[this.state.currentRound];

        // Pick 3 random distractor items from the items pool that are not the target
        const distractors = this.state.config.digital.items
            .filter(item => item.word.toUpperCase() !== this.state.targetItem.word.toUpperCase())
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const choices = [this.state.targetItem, ...distractors];
        choices.sort(() => Math.random() - 0.5);
        this.state.choices = choices;

        // Render layout
        const wrap = document.createElement('div');
        wrap.className = 'sound-game-container';

        const prompt = document.createElement('div');
        prompt.className = 'sound-prompt';
        prompt.innerHTML = `${this.state.config.digital.start_message || "SHOW ME THE "}<span class="highlight-word">${this.state.targetItem.word.toUpperCase()}</span>!`;
        wrap.appendChild(prompt);

        const replayBtn = document.createElement('button');
        replayBtn.className = 'sound-replay-btn';
        replayBtn.innerHTML = '🔊 HEAR AGAIN';
        replayBtn.onclick = () => this.speakPrompt();
        wrap.appendChild(replayBtn);

        const grid = document.createElement('div');
        grid.className = 'sound-choices-grid';

        choices.forEach((choice, index) => {
            const card = document.createElement('div');
            card.className = 'sound-choice-card';
            card.innerText = choice.emoji;
            card.dataset.index = index;

            card.addEventListener('pointerdown', () => this.handleCardTap(card, choice, containerId));
            grid.appendChild(card);
        });

        wrap.appendChild(grid);
        container.appendChild(wrap);

        // Speak the prompt automatically at round start
        this.speakPrompt();
    },

    speakPrompt: function() {
        if (!this.state.targetItem) return;
        
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        if (this.state.speechTimeout) {
            clearTimeout(this.state.speechTimeout);
        }

        // 1. Speak target word first
        const wordUtterance = new SpeechSynthesisUtterance(this.state.targetItem.word);
        wordUtterance.pitch = 1.3;
        window.speechSynthesis.speak(wordUtterance);

        // 2. Wait 1 second and speak target instruction phrase
        this.state.speechTimeout = setTimeout(() => {
            const phrase = `${this.state.config.digital.start_message || "Show me the "}${this.state.targetItem.word}`;
            const utterance = new SpeechSynthesisUtterance(phrase);
            utterance.pitch = 1.3;
            window.speechSynthesis.speak(utterance);
        }, 1000);
    },

    handleCardTap: function(cardEl, choice, containerId) {
        const grid = cardEl.parentElement;
        if (grid.dataset.locked === "true") return;

        if (choice.word.toUpperCase() === this.state.targetItem.word.toUpperCase()) {
            grid.dataset.locked = "true";
            cardEl.classList.add('correct-card');

            // Speak confirmation and clear timers
            window.speechSynthesis.cancel();
            if (this.state.speechTimeout) {
                clearTimeout(this.state.speechTimeout);
            }

            const feedback = new SpeechSynthesisUtterance(`Yes! ${choice.word}!`);
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
            grid.dataset.locked = "true";
            cardEl.classList.add('incorrect-card');

            window.speechSynthesis.cancel();
            if (this.state.speechTimeout) {
                clearTimeout(this.state.speechTimeout);
            }

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
        title.innerText = this.state.config.digital.success_message || "Splendid!";

        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🎉🔊🏆';

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

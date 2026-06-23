const TemplateE = {
    state: { currentRound: 0, rounds: 4, roundItems: [], targetItem: null, choices: [], config: null },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentRound = 0;
        
        // Determine number of rounds (default to 4 or config rounds)
        this.state.rounds = config.digital.rounds || 4;
        
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
        this.generateChoices();

        const wrap = document.createElement('div');
        wrap.className = 'word-match-container';

        // 1. Left Side: Large Emoji Card
        const leftSide = document.createElement('div');
        leftSide.className = 'word-match-left';
        
        const emojiCard = document.createElement('div');
        emojiCard.className = 'emoji-display-card wobble';
        emojiCard.innerText = this.state.targetItem.emoji;
        leftSide.appendChild(emojiCard);

        // 2. Right Side: Word Buttons Grid
        const rightSide = document.createElement('div');
        rightSide.className = 'word-match-right';
        
        const grid = document.createElement('div');
        grid.className = 'word-buttons-grid';

        this.state.choices.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'word-choice-btn';
            btn.innerText = word;
            btn.onclick = () => this.handleChoice(btn, word, containerId);
            grid.appendChild(btn);
        });
        rightSide.appendChild(grid);

        wrap.appendChild(leftSide);
        wrap.appendChild(rightSide);
        container.appendChild(wrap);

        // Speech prompt
        const prompt = this.state.config.digital.start_message || "What is the name of this?";
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(prompt));
    },

    generateChoices: function() {
        const targetWord = this.state.targetItem.word.toUpperCase();
        
        // Pool of all words in items (excluding target) + distractors
        const otherItemWords = this.state.config.digital.items
            .map(i => i.word.toUpperCase())
            .filter(w => w !== targetWord);
            
        const distractorWords = (this.state.config.digital.distractors || [])
            .map(w => w.toUpperCase());
            
        const pool = Array.from(new Set([...otherItemWords, ...distractorWords]));

        // Select the smart distractor (same first letter)
        const targetFirstLetter = targetWord[0];
        const sameLetterCandidates = pool.filter(w => w[0] === targetFirstLetter);
        
        let selectedIncorrect = [];
        if (sameLetterCandidates.length > 0) {
            const smartChoice = sameLetterCandidates[Math.floor(Math.random() * sameLetterCandidates.length)];
            selectedIncorrect.push(smartChoice);
            // Remove from pool
            const index = pool.indexOf(smartChoice);
            if (index > -1) pool.splice(index, 1);
        }

        // Fill remaining slots to get exactly 3 incorrect choices
        pool.sort(() => Math.random() - 0.5);
        while (selectedIncorrect.length < 3 && pool.length > 0) {
            selectedIncorrect.push(pool.pop());
        }

        // Combine target with incorrect choices and shuffle
        const finalChoices = [targetWord, ...selectedIncorrect];
        finalChoices.sort(() => Math.random() - 0.5);
        this.state.choices = finalChoices;
    },

    handleChoice: function(btn, word, containerId) {
        const targetWord = this.state.targetItem.word.toUpperCase();
        const buttons = document.querySelectorAll('.word-choice-btn');

        if (word === targetWord) {
            // Correct Choice!
            buttons.forEach(b => b.disabled = true); // Lock screen
            btn.classList.add('correct');
            
            // Speak confirmation
            const utterance = new SpeechSynthesisUtterance(this.state.targetItem.word);
            utterance.pitch = 1.3;
            window.speechSynthesis.speak(utterance);

            // Wait 1.5s and advance
            setTimeout(() => {
                this.state.currentRound++;
                if (this.state.currentRound < this.state.rounds) {
                    this.startRound(containerId);
                } else {
                    this.triggerFinale(document.getElementById('game-canvas'));
                }
            }, 1500);
        } else {
            // Incorrect Choice
            btn.classList.add('incorrect');
            btn.classList.add('wobble');
            setTimeout(() => btn.classList.remove('wobble'), 500);
            
            const oopsText = window.getGlobalFeedback("incorrect", "Try again!");
            const oops = new SpeechSynthesisUtterance(oopsText);
            oops.pitch = 1.0;
            window.speechSynthesis.speak(oops);
        }
    },

    triggerFinale: function(container) {
        if (window.triggerEmojiRain) window.triggerEmojiRain();
        container.innerHTML = '';

        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = this.state.config.digital.success_message || "Great job!";

        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🎉📖🏆';

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
        refreshBtn.innerText = "Get New Words 🎲";
        refreshBtn.onclick = () => this.init(containerId, 'companion', this.state.config);

        wrap.appendChild(title);
        wrap.appendChild(listWrap);
        wrap.appendChild(refreshBtn);
        container.appendChild(wrap);
    }
};

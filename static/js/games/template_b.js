const TemplateB = {
    state: { currentCount: 0, targetCount: 0, activeAction: null, config: null },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentCount = 0;
        
        // Randomly determine target count
        const min = config.digital.count_range[0];
        const max = config.digital.count_range[1];
        this.state.targetCount = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Randomly pick an action (Jumps, Claps, etc.)
        const actions = config.digital.actions;
        this.state.activeAction = actions[Math.floor(Math.random() * actions.length)];

        if (mode === 'digital') {
            this.renderDigital(containerId);
        } else if (mode === 'companion') {
            this.renderCompanion(containerId);
        }
    },

    renderDigital: function(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; 

        const wrap = document.createElement('div');
        wrap.className = 'clicker-container';

        // 1. The Header Instruction
        const header = document.createElement('div');
        header.className = 'clicker-header';
        
        // Use innerHTML instead of innerText to render the span tag
        header.innerHTML = `Let's do <span class="highlight-number">${this.state.targetCount}</span> ${this.state.activeAction.name}!`;

        // 2. The Progress Tracker
        const tracker = document.createElement('div');
        tracker.className = 'progress-tracker';
        tracker.id = 'progress-tracker';
        for (let i = 0; i < this.state.targetCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.id = `dot-${i + 1}`;
            tracker.appendChild(dot);
        }

        // 3. The Massive Tactile Button
        const btn = document.createElement('button');
        btn.className = 'giant-click-btn';
        btn.innerHTML = this.state.activeAction.emoji;

        // The Click Logic
        btn.addEventListener('pointerdown', () => {
            if (this.state.currentCount < this.state.targetCount) {
                this.state.currentCount++;
                
                // Fill the corresponding dot
                document.getElementById(`dot-${this.state.currentCount}`).classList.add('filled');
                
                // Announce the number
                const speech = new SpeechSynthesisUtterance(this.state.currentCount.toString());
                speech.rate = 0.9; speech.pitch = 1.2;
                window.speechSynthesis.speak(speech);

                // Win Condition
                if (this.state.currentCount === this.state.targetCount) {
                    btn.classList.add('locked');
                    header.innerText = this.state.config.digital.success_message;
                    header.style.color = '#4CAF50';
                    btn.innerHTML = '🎉';
                    
                    if (window.triggerEmojiRain) window.triggerEmojiRain();
                    setTimeout(() => {
                        const cheerText = window.getGlobalFeedback("correct_completion", "Yay! You did it!");
                        const cheer = new SpeechSynthesisUtterance(cheerText);
                        cheer.pitch = 1.2; window.speechSynthesis.speak(cheer);
                    }, 500);
                }
            }
        });

        wrap.appendChild(header);
        wrap.appendChild(tracker);
        wrap.appendChild(btn);
        container.appendChild(wrap);
        
        // Initial Audio Prompt
        const promptSpeech = new SpeechSynthesisUtterance(header.innerText);
        window.speechSynthesis.speak(promptSpeech);
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

        // Mail-merge loop for dynamic instructions
        this.state.config.companion.instructions.forEach(instruction => {
            let parsedText = instruction
                .replace('{target_count}', this.state.targetCount)
                .replace('{action_name}', this.state.activeAction.name);

            const step = document.createElement('div');
            step.className = 'companion-step';
            step.innerText = parsedText;
            listWrap.appendChild(step);
        });

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'tap-anywhere-btn';
        refreshBtn.style.marginTop = '20px';
        refreshBtn.innerText = "Roll New Action 🎲";
        refreshBtn.onclick = () => this.init(containerId, 'companion', this.state.config);

        wrap.appendChild(title);
        wrap.appendChild(listWrap);
        wrap.appendChild(refreshBtn);
        container.appendChild(wrap);
    }
};
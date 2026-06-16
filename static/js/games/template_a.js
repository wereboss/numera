const TemplateA = {
    state: { currentCount: 0, targetCount: 0, choices: [], config: null },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentCount = 0;
        
        // Generate random target count based on the configured range
        const min = config.digital.count_range[0];
        const max = config.digital.count_range[1];
        this.state.targetCount = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Generate multiple choice distractors
        this.generateChoices();

        if (mode === 'digital') {
            this.renderDigital(containerId);
        } else if (mode === 'companion') {
            this.renderCompanion(containerId);
        }
    },

    generateChoices: function() {
        const numChoices = this.state.config.digital.choice_count;
        const minRange = this.state.config.digital.count_range[0];
        const maxRange = this.state.config.digital.count_range[1] + 2;
        
        // Start the set with the guaranteed correct answer
        let choiceSet = new Set([this.state.targetCount]);
        
        // Build a pool of all possible incorrect answers within the bounds
        let possibleWrongAnswers = [];
        for (let i = minRange; i <= maxRange; i++) {
            if (i !== this.state.targetCount) {
                possibleWrongAnswers.push(i);
            }
        }
        
        // Shuffle the pool of wrong answers for true randomness
        possibleWrongAnswers.sort(() => Math.random() - 0.5);
        
        // Draw from the shuffled pool until we have the required number of choices
        let index = 0;
        while (choiceSet.size < numChoices && index < possibleWrongAnswers.length) {
            choiceSet.add(possibleWrongAnswers[index]);
            index++;
        }
        
        // Convert to array and sort numerically so the correct answer isn't always first or last
        this.state.choices = Array.from(choiceSet).sort((a, b) => a - b);
    },

    // ==========================================
    // DIGITAL MODE
    // ==========================================

    renderDigital: function(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; 

        // 1. Create the Target Area
        const box = document.createElement('div');
        box.className = 'game-box';
        box.innerHTML = this.state.config.digital.target_emoji;
        container.appendChild(box);

        // 2. Spawn Draggable Items based on targetCount
        for (let i = 0; i < this.state.targetCount; i++) {
            const item = document.createElement('div');
            item.className = 'game-item';
            item.innerHTML = this.state.config.digital.item_emoji;
            
            // Randomize starting positions near the top of the screen
            const randomX = Math.floor(Math.random() * (window.innerWidth - 100)) + 10;
            const randomY = Math.floor(Math.random() * 150) + 50;
            
            item.style.left = `${randomX}px`;
            item.style.top = `${randomY}px`;
            
            this.makeDraggable(item, box);
            container.appendChild(item);
        }
    },

    makeDraggable: function(el, target) {
        let isDragging = false;
        let offsetX, offsetY;
        const originLeft = el.style.left;
        const originTop = el.style.top;

        el.addEventListener('pointerdown', (e) => {
            isDragging = true;
            el.setPointerCapture(e.pointerId);
            const rect = el.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            el.style.zIndex = 30;
            el.style.transform = 'scale(1.1)';
        });

        el.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            el.style.left = `${e.clientX - offsetX}px`;
            el.style.top = `${e.clientY - offsetY}px`;
        });

        el.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            el.releasePointerCapture(e.pointerId);
            el.style.transform = 'scale(1)';
            el.style.zIndex = 20;

            // AABB Collision Detection
            const rect1 = el.getBoundingClientRect();
            const rect2 = target.getBoundingClientRect();
            const collided = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);

            if (collided) {
                el.style.display = 'none';
                this.state.currentCount++;
                
                target.classList.add('success-pop');
                setTimeout(() => target.classList.remove('success-pop'), 300);

                const speech = new SpeechSynthesisUtterance(this.state.currentCount.toString());
                speech.rate = 0.9; speech.pitch = 1.2;
                window.speechSynthesis.speak(speech);

                if (this.state.currentCount === this.state.targetCount) {
                    setTimeout(() => this.triggerFinale(document.getElementById('game-canvas')), 1000);
                }
            } else {
                // Snap back to original position if missed
                el.style.left = originLeft;
                el.style.top = originTop;
            }
        });
    },

    triggerFinale: function(container) {
        container.innerHTML = ''; 

        const wrap = document.createElement('div');
        wrap.className = 'companion-container'; // Reusing the centered layout class

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = "How many were there?";

        const btnContainer = document.createElement('div');
        btnContainer.className = 'choices-container';

        // Render the multiple choice buttons
        this.state.choices.forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = num;
            
            btn.onclick = () => {
                if (num === this.state.targetCount) {
                    title.innerText = this.state.config.digital.success_message;
                    btnContainer.innerHTML = '🎉🥳🎈';
                    btnContainer.style.fontSize = '4rem';
                    const cheer = new SpeechSynthesisUtterance("Yay! You got it!");
                    cheer.pitch = 1.2; 
                    window.speechSynthesis.speak(cheer);
                } else {
                    title.innerText = "Let's try again!";
                    const oops = new SpeechSynthesisUtterance("Uh oh, try again.");
                    window.speechSynthesis.speak(oops);
                }
            };
            btnContainer.appendChild(btn);
        });

        wrap.appendChild(title);
        wrap.appendChild(btnContainer);
        container.appendChild(wrap);
    },

    // ==========================================
    // COMPANION MODE
    // ==========================================

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

        // Format choices array into a readable string (e.g., "3, 4, 5")
        const choicesStr = this.state.choices.join(', ');

        // Mail-merge loop for dynamic instructions
        this.state.config.companion.instructions.forEach(instruction => {
            let parsedText = instruction
                .replace('{target_count}', this.state.targetCount)
                .replace('{choices}', choicesStr);

            const step = document.createElement('div');
            step.className = 'companion-step';
            step.innerText = parsedText;
            listWrap.appendChild(step);
        });

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'tap-anywhere-btn';
        refreshBtn.style.marginTop = '20px';
        refreshBtn.innerText = "Generate New Numbers 🎲";
        
        // Clicking refresh just re-initializes the engine to generate a new target
        refreshBtn.onclick = () => this.init(containerId, 'companion', this.state.config);

        wrap.appendChild(title);
        wrap.appendChild(listWrap);
        wrap.appendChild(refreshBtn);
        container.appendChild(wrap);
    }
};
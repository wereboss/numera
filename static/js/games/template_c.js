const TemplateC = {
    state: { currentCount: 0, targetCount: 0, config: null, receivers: [] },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentCount = 0;
        this.state.receivers = [];
        
        const min = config.digital.count_range[0];
        const max = config.digital.count_range[1];
        this.state.targetCount = Math.floor(Math.random() * (max - min + 1)) + min;

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
        wrap.className = 'split-screen-container';

        // Top Area (Receivers)
        const topHalf = document.createElement('div');
        topHalf.className = 'split-top';
        
        const possibleReceivers = [...this.state.config.digital.receivers];
        possibleReceivers.sort(() => Math.random() - 0.5);
        let requiredFoods = []; 

        // NEW: Check the mode (defaulting to multiple if not found)
        const mode = this.state.config.digital.receiver_mode || "multiple";
        
        // If single mode, pick ONE animal for the entire board right now
        let lockedReceiverPair = null;
        if (mode === "single") {
            lockedReceiverPair = possibleReceivers[Math.floor(Math.random() * possibleReceivers.length)];
        }

        for (let i = 0; i < this.state.targetCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'receiver-slot';
            
            // Assign the pair based on the chosen mode (using index i for uniqueness in multiple mode)
            const activePair = (mode === "single") 
                ? lockedReceiverPair 
                : possibleReceivers[i % possibleReceivers.length];

            slot.innerHTML = activePair.idle;
            if (activePair.idle && activePair.idle.length > 2) {
                slot.classList.add('text-slot');
            } else if (activePair.idle && activePair.idle.length === 1 && /^[A-Z]$/i.test(activePair.idle)) {
                slot.classList.add('letter-slot');
            }
            slot.dataset.filled = "false";
            slot.dataset.satisfied = activePair.satisfied;
            slot.dataset.required = activePair.item; 

            this.state.receivers.push(slot);
            topHalf.appendChild(slot);
            
            requiredFoods.push(activePair.item); 
        }

        // Shuffle the foods so it's an actual puzzle
        requiredFoods.sort(() => Math.random() - 0.5);

        // Bottom Area (Items)
        const bottomHalf = document.createElement('div');
        bottomHalf.className = 'split-bottom';
        
        for (let i = 0; i < requiredFoods.length; i++) {
            const item = document.createElement('div');
            item.className = 'draggable-item';
            item.innerHTML = requiredFoods[i];
            item.dataset.itemType = requiredFoods[i]; // Identify this dragged item
            
            this.makeDraggable(item, this.state.receivers);
            bottomHalf.appendChild(item);
        }

        wrap.appendChild(topHalf);
        wrap.appendChild(bottomHalf);
        container.appendChild(wrap);
        
        const msg = this.state.config.digital.start_message || "Who gets what?";
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
    },

    makeDraggable: function(el, receivers) {
        let isDragging = false;
        let offsetX, offsetY;

        el.addEventListener('pointerdown', (e) => {
            isDragging = true;
            el.setPointerCapture(e.pointerId);
            
            const rect = el.getBoundingClientRect();
            const parentRect = el.parentElement.getBoundingClientRect(); // .split-bottom
            
            // Where did the finger touch inside the item?
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // Lock it to its exact current visual position to prevent the "jump"
            const absoluteLeft = rect.left - parentRect.left;
            const absoluteTop = rect.top - parentRect.top;

            el.style.position = 'absolute';
            el.style.zIndex = 30;
            el.style.transform = 'scale(1.2)';
            
            el.style.left = `${absoluteLeft}px`;
            el.style.top = `${absoluteTop}px`;
        });

        el.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const parentRect = el.parentElement.getBoundingClientRect();
            
            // Move smoothly relative to the bottom container
            el.style.left = `${e.clientX - parentRect.left - offsetX}px`;
            el.style.top = `${e.clientY - parentRect.top - offsetY}px`;
        });

        el.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            el.releasePointerCapture(e.pointerId);
            el.style.transform = 'scale(1)';
            el.style.zIndex = 20;

            const itemRect = el.getBoundingClientRect();
            let matchedSlot = null;

           // Check collision against all unfilled receivers
            for (let slot of receivers) {
                if (slot.dataset.filled === "true") continue;
                
                const slotRect = slot.getBoundingClientRect();
                const collided = !(itemRect.right < slotRect.left || itemRect.left > slotRect.right || 
                                   itemRect.bottom < slotRect.top || itemRect.top > slotRect.bottom);
                
                if (collided) {
                    // Update check to match the new simple name
                    if (el.dataset.itemType === slot.dataset.required) { 
                        matchedSlot = slot;
                        break;
                    } else {
                        const oops = new SpeechSynthesisUtterance("Try again!");
                        oops.pitch = 1.5; window.speechSynthesis.speak(oops);
                    }
                }
            }

            if (matchedSlot) {
                el.style.display = 'none';
                matchedSlot.dataset.filled = "true";
                
                // Update to pull from the new simple name
                matchedSlot.innerHTML = matchedSlot.dataset.satisfied; 
                
                matchedSlot.classList.add('satisfied');
                
                const pop = new SpeechSynthesisUtterance("Yum!");
                pop.pitch = 1.5; window.speechSynthesis.speak(pop);
                
                this.state.currentCount++;

                if (this.state.currentCount === this.state.targetCount) {
                    setTimeout(() => this.triggerFinale(document.getElementById('game-canvas')), 1000);
                }
            } else {
                // Missed! Clear the inline styles so it snaps perfectly back
                el.style.position = '';
                el.style.left = '';
                el.style.top = '';
            }
        });
    },

    triggerFinale: function(container) {
        if (window.triggerEmojiRain) window.triggerEmojiRain();
        container.innerHTML = ''; 

        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = this.state.config.digital.success_message;
        
        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🎉😻🎉';

        const cheer = new SpeechSynthesisUtterance("Yay! You did it! Everyone is happy.");
        cheer.pitch = 1.2; window.speechSynthesis.speak(cheer);

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
            let parsedText = instruction.replace('{target_count}', this.state.targetCount);

            const step = document.createElement('div');
            step.className = 'companion-step';
            step.innerText = parsedText;
            listWrap.appendChild(step);
        });

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'tap-anywhere-btn';
        refreshBtn.style.marginTop = '20px';
        refreshBtn.innerText = "Generate New Count 🎲";
        refreshBtn.onclick = () => this.init(containerId, 'companion', this.state.config);

        wrap.appendChild(title);
        wrap.appendChild(listWrap);
        wrap.appendChild(refreshBtn);
        container.appendChild(wrap);
    }
};
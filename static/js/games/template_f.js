const TemplateF = {
    state: {
        rounds: 3,
        currentRound: 0,
        roundItems: [],
        targetItem: null,
        config: null,
        slots: [], // References to empty drop zones
        revealedIndices: [], // Indices that are pre-populated
        inventoryLetters: [], // Combined letters list
        filledCount: 0,
        neededCount: 0
    },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.currentRound = 0;
        this.state.rounds = config.digital.rounds || 3;

        // Shuffle items pool and select N random items
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
        this.state.slots = [];
        this.state.revealedIndices = [];
        this.state.filledCount = 0;

        const word = this.state.targetItem.word.toUpperCase();
        const len = word.length;

        // 1. Determine number of pre-populated (revealed) letters P
        let numRevealed = 0;
        if (len === 3) {
            numRevealed = Math.random() < 0.5 ? 0 : 1;
        } else if (len === 4) {
            numRevealed = Math.random() < 0.5 ? 1 : 2;
        } else if (len === 5) {
            numRevealed = 2;
        }

        // Randomly select which indices to reveal
        const indices = [];
        for (let i = 0; i < len; i++) indices.push(i);
        indices.sort(() => Math.random() - 0.5);
        this.state.revealedIndices = indices.slice(0, numRevealed);
        this.state.neededCount = len - numRevealed;

        // 2. Generate draggable letter tiles
        // Missing letters (duplicates preserved)
        const missingLetters = [];
        for (let i = 0; i < len; i++) {
            if (!this.state.revealedIndices.includes(i)) {
                missingLetters.push(word[i]);
            }
        }

        // Add random distractor fillers (allowing copies)
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const totalTiles = 8; // Total items in inventory
        const numFillers = totalTiles - missingLetters.length;
        const fillers = [];
        for (let i = 0; i < numFillers; i++) {
            fillers.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
        }

        const combinedList = [...missingLetters, ...fillers];
        combinedList.sort(() => Math.random() - 0.5);
        this.state.inventoryLetters = combinedList;

        // 3. Render dynamic split layout
        const wrap = document.createElement('div');
        wrap.className = 'spell-drag-container';

        // Left Area (Emoji + Slots)
        const leftSide = document.createElement('div');
        leftSide.className = 'spell-drag-left';

        const emojiCard = document.createElement('div');
        emojiCard.className = 'spell-emoji-card wobble';
        emojiCard.innerText = this.state.targetItem.emoji;
        leftSide.appendChild(emojiCard);

        const slotsRow = document.createElement('div');
        slotsRow.className = 'spell-slots-row';

        for (let i = 0; i < len; i++) {
            const slot = document.createElement('div');
            slot.className = 'spell-slot-box';
            
            if (this.state.revealedIndices.includes(i)) {
                slot.classList.add('revealed');
                slot.innerText = word[i];
                slot.dataset.filled = "true";
            } else {
                slot.classList.add('empty');
                slot.innerText = "_";
                slot.dataset.filled = "false";
                slot.dataset.required = word[i];
                slot.dataset.index = i;
                this.state.slots.push(slot);
            }
            slotsRow.appendChild(slot);
        }
        leftSide.appendChild(slotsRow);

        // Right Area (Letter Inventory Tiles)
        const rightSide = document.createElement('div');
        rightSide.className = 'spell-drag-right';

        const inventory = document.createElement('div');
        inventory.className = 'spell-inventory';

        this.state.inventoryLetters.forEach(letter => {
            const tile = document.createElement('div');
            tile.className = 'spell-letter-tile';
            tile.innerText = letter;
            tile.dataset.letter = letter;

            this.makeDraggable(tile, this.state.slots, containerId);
            inventory.appendChild(tile);
        });
        rightSide.appendChild(inventory);

        wrap.appendChild(leftSide);
        wrap.appendChild(rightSide);
        container.appendChild(wrap);

        // Speech start message
        const prompt = this.state.config.digital.start_message || "Spell the word!";
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(prompt));
    },

    makeDraggable: function(el, slots, containerId) {
        let isDragging = false;
        let offsetX, offsetY;

        el.addEventListener('pointerdown', (e) => {
            isDragging = true;
            el.setPointerCapture(e.pointerId);

            const rect = el.getBoundingClientRect();
            const parentRect = el.parentElement.getBoundingClientRect(); // .spell-inventory

            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

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
            el.style.left = `${e.clientX - parentRect.left - offsetX}px`;
            el.style.top = `${e.clientY - parentRect.top - offsetY}px`;
        });

        el.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            el.releasePointerCapture(e.pointerId);
            el.style.transform = 'scale(1)';
            el.style.zIndex = 20;

            const tileRect = el.getBoundingClientRect();
            let matchedSlot = null;
            let collidedWithAnySlot = false;

            // Collision check against unfilled slots
            for (let slot of slots) {
                if (slot.dataset.filled === "true") continue;

                const slotRect = slot.getBoundingClientRect();
                const collided = !(tileRect.right < slotRect.left || tileRect.left > slotRect.right || 
                                   tileRect.bottom < slotRect.top || tileRect.top > slotRect.bottom);

                if (collided) {
                    collidedWithAnySlot = true;
                    if (el.dataset.letter === slot.dataset.required) {
                        matchedSlot = slot;
                        break;
                    }
                }
            }

            if (matchedSlot) {
                el.style.display = 'none';
                matchedSlot.dataset.filled = "true";
                matchedSlot.innerText = el.dataset.letter;
                matchedSlot.classList.remove('empty');
                matchedSlot.classList.add('revealed');
                matchedSlot.classList.add('success-pop');
                setTimeout(() => matchedSlot.classList.remove('success-pop'), 300);

                // Speak matching letter
                const letterSpeech = new SpeechSynthesisUtterance(el.dataset.letter);
                letterSpeech.pitch = 1.4;
                window.speechSynthesis.speak(letterSpeech);

                this.state.filledCount++;

                if (this.state.filledCount === this.state.neededCount) {
                    // Word spelling complete!
                    setTimeout(() => {
                        const wordSpeech = new SpeechSynthesisUtterance(this.state.targetItem.word);
                        wordSpeech.pitch = 1.2;
                        window.speechSynthesis.speak(wordSpeech);
                    }, 500);

                    setTimeout(() => {
                        this.state.currentRound++;
                        if (this.state.currentRound < this.state.rounds) {
                            this.startRound(containerId);
                        } else {
                            this.triggerFinale(document.getElementById('game-canvas'));
                        }
                    }, 2000);
                }
            } else {
                if (collidedWithAnySlot) {
                    // Turn red and wobble!
                    el.classList.add('incorrect-tile');
                    el.classList.add('wobble');
                    el.style.transform = '';
                    el.style.pointerEvents = 'none';

                    const oops = new SpeechSynthesisUtterance("Try again!");
                    oops.pitch = 1.3;
                    window.speechSynthesis.speak(oops);

                    setTimeout(() => {
                        el.classList.remove('incorrect-tile');
                        el.classList.remove('wobble');
                        el.style.pointerEvents = '';
                        // Snap back
                        el.style.position = '';
                        el.style.left = '';
                        el.style.top = '';
                    }, 500);
                } else {
                    // Snap back immediately
                    el.style.position = '';
                    el.style.left = '';
                    el.style.top = '';
                }
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
        title.innerText = this.state.config.digital.success_message || "Great job!";

        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🎉🧩🏆';

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

const TemplateD = {
    state: { sortedCount: 0, totalItems: 0, config: null, buckets: [] },

    init: function(containerId, mode, config) {
        this.state.config = config;
        this.state.sortedCount = 0;
        this.state.totalItems = 0;
        this.state.buckets = [];

        // NEW: Shuffle the full category pool and slice out the requested count
        const allCategories = config.digital.categories;
        const count = config.digital.category_count || 2; 
        
        const shuffledCats = [...allCategories].sort(() => Math.random() - 0.5);
        this.state.activeCategories = shuffledCats.slice(0, count);

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
        wrap.className = 'sorter-container';

        const topArea = document.createElement('div');
        topArea.className = 'buckets-area';
        
        let messyItems = [];

        // NEW: Loop through our randomly selected active categories, not the full config list
        this.state.activeCategories.forEach(cat => {
            const bucket = document.createElement('div');
            bucket.className = 'bucket-dropzone';
            bucket.dataset.category = cat.name;
            
            bucket.innerHTML = `
                <div class="bucket-emoji">${cat.bucket_emoji}</div>
                <div class="bucket-label">${cat.name}</div>
                <div class="bucket-description">${cat.description}</div>
            `;

            bucket.onclick = () => {
                const speech = new SpeechSynthesisUtterance(cat.instruction);
                window.speechSynthesis.speak(speech);
            };

            this.state.buckets.push(bucket);
            topArea.appendChild(bucket);

            const min = this.state.config.digital.items_per_category[0];
            const max = this.state.config.digital.items_per_category[1];
            const itemCount = Math.floor(Math.random() * (max - min + 1)) + min;
            
            this.state.totalItems += itemCount;

            const shuffledCatItems = [...cat.items].sort(() => Math.random() - 0.5);
            for(let i=0; i < itemCount; i++) {
                messyItems.push({
                    emoji: shuffledCatItems[i % shuffledCatItems.length],
                    category: cat.name
                });
            }
        });

        const bottomArea = document.createElement('div');
        bottomArea.className = 'messy-pile';

        messyItems.sort(() => Math.random() - 0.5);

        messyItems.forEach(itemData => {
            const itemEl = document.createElement('div');
            itemEl.className = 'draggable-sort-item';
            itemEl.innerHTML = itemData.emoji;
            itemEl.dataset.category = itemData.category;
            
            const randomRotation = Math.floor(Math.random() * 40) - 20;
            itemEl.style.transform = `rotate(${randomRotation}deg)`;
            
            this.makeDraggable(itemEl, this.state.buckets);
            bottomArea.appendChild(itemEl);
        });

        wrap.appendChild(topArea);
        wrap.appendChild(bottomArea);
        container.appendChild(wrap);
        
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("Time to clean up!"));
    },

    makeDraggable: function(el, buckets) {
        let isDragging = false;
        let offsetX, offsetY;

        el.addEventListener('pointerdown', (e) => {
            isDragging = true;
            el.setPointerCapture(e.pointerId);
            
            const rect = el.getBoundingClientRect();
            const parentRect = el.parentElement.getBoundingClientRect(); 
            
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            const absoluteLeft = rect.left - parentRect.left;
            const absoluteTop = rect.top - parentRect.top;

            el.style.position = 'absolute';
            el.style.zIndex = 30;
            // Remove the messy rotation temporarily while dragging
            el.style.transform = 'scale(1.2) rotate(0deg)'; 
            
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
            el.style.zIndex = 20;

            const itemRect = el.getBoundingClientRect();
            let matchedBucket = null;

            // Check collision against all buckets
            for (let bucket of buckets) {
                const bucketRect = bucket.getBoundingClientRect();
                const collided = !(itemRect.right < bucketRect.left || itemRect.left > bucketRect.right || 
                                   itemRect.bottom < bucketRect.top || itemRect.top > bucketRect.bottom);
                if (collided) {
                    matchedBucket = bucket;
                    break;
                }
            }

            if (matchedBucket) {
                if (el.dataset.category === matchedBucket.dataset.category) {
                    // Correct! Swallow the item
                    el.style.display = 'none';
                    matchedBucket.classList.add('swallow');
                    setTimeout(() => matchedBucket.classList.remove('swallow'), 200);
                    
                    const pop = new SpeechSynthesisUtterance("Pop!");
                    pop.pitch = 2; window.speechSynthesis.speak(pop);
                    
                    this.state.sortedCount++;

                    if (this.state.sortedCount === this.state.totalItems) {
                        setTimeout(() => this.triggerFinale(document.getElementById('game-canvas')), 800);
                    }
                } else {
                    // Wrong Bucket!
                    this.snapBack(el);
                    matchedBucket.classList.add('wobble');
                    setTimeout(() => matchedBucket.classList.remove('wobble'), 400);
                    
                    const oops = new SpeechSynthesisUtterance("Uh oh!");
                    oops.pitch = 1.5; window.speechSynthesis.speak(oops);
                }
            } else {
                // Dropped outside buckets
                this.snapBack(el);
            }
        });
    },

    snapBack: function(el) {
        el.style.position = '';
        el.style.left = '';
        el.style.top = '';
        const randomRotation = Math.floor(Math.random() * 40) - 20;
        el.style.transform = `rotate(${randomRotation}deg)`;
    },

    triggerFinale: function(container) {
        container.innerHTML = ''; 
        const wrap = document.createElement('div');
        wrap.className = 'companion-container';

        const title = document.createElement('div');
        title.className = 'celebration-text';
        title.innerText = this.state.config.digital.success_message;
        
        const visual = document.createElement('div');
        visual.style.fontSize = '8rem';
        visual.innerHTML = '🎉🧹🎉';

        const cheer = new SpeechSynthesisUtterance("Wow! The room is perfectly clean!");
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

        // NEW: Dynamically build the names and instructions for the mail-merge
        const catNames = this.state.activeCategories.map(c => c.name).join(' and ');
        const catInstructions = this.state.activeCategories.map(c => c.instruction).join(' ');

        this.state.config.companion.instructions.forEach(instruction => {
            let parsedText = instruction
                .replace('{category_names}', catNames)
                .replace('{category_instructions}', catInstructions);

            const step = document.createElement('div');
            step.className = 'companion-step';
            step.innerText = parsedText;
            listWrap.appendChild(step);
        });

        wrap.appendChild(title);
        wrap.appendChild(listWrap);
        container.appendChild(wrap);
    }
};
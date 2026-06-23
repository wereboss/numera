const PutInTheBox = {
    state: { count: 0, total: 5 },
    
    init: function(containerId) {
        this.state.count = 0;
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // Clear canvas

        // Create the Target Box
        const box = document.createElement('div');
        box.className = 'game-box';
        box.id = 'target-box';
        box.innerHTML = '📦';
        container.appendChild(box);

        // Create draggable items scattered at the top
        for (let i = 0; i < this.state.total; i++) {
            const item = document.createElement('div');
            item.className = 'game-item';
            item.innerHTML = '🍎'; // Using an apple emoji as the toy
            
            // Randomize starting positions slightly
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

        // Origin coords in case we need to snap back
        const originLeft = el.style.left;
        const originTop = el.style.top;

        el.addEventListener('pointerdown', (e) => {
            isDragging = true;
            el.setPointerCapture(e.pointerId); // Locks the pointer to this element
            const rect = el.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            el.style.zIndex = 30; // Bring to front
            el.style.transform = 'scale(1.1)';
        });

        el.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            // Calculate new position
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
        });

        el.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            el.releasePointerCapture(e.pointerId);
            el.style.transform = 'scale(1)';
            el.style.zIndex = 20;

            if (this.checkCollision(el, target)) {
                this.handleSuccess(el, target);
            } else {
                // Snap back to origin if missed
                el.style.left = originLeft;
                el.style.top = originTop;
            }
        });
    },

    checkCollision: function(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        // AABB Collision Detection (Checking if boxes overlap)
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    },

    handleSuccess: function(item, box) {
        // Remove item from screen
        item.style.display = 'none';
        
        // Update count
        this.state.count++;
        
        // Visual feedback
        box.classList.add('success-pop');
        setTimeout(() => box.classList.remove('success-pop'), 300);

        // Audio feedback via Web Speech API
        const speech = new SpeechSynthesisUtterance(this.state.count.toString());
        speech.rate = 0.9; // Slightly slower, friendlier voice
        speech.pitch = 1.2;
        window.speechSynthesis.speak(speech);

        if (this.state.count === this.state.total) {
            if (window.triggerEmojiRain) window.triggerEmojiRain();
            setTimeout(() => {
                const cheer = new SpeechSynthesisUtterance("Yay! You did it!");
                window.speechSynthesis.speak(cheer);
                // Optional: reset game or exit automatically
            }, 1000);
        }
    }
};
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    const letterTilesDiv = document.getElementById('letter-tiles');
    const wordSlotsDiv = document.getElementById('word-slots');
    const resetBtn = document.getElementById('reset-btn');
    const feedbackDiv = document.getElementById('feedback');
    const helpBtn = document.getElementById('help-btn');
    const helpDialog = document.getElementById('help-dialog');
    const closeHelpBtn = document.getElementById('close-help-btn');
    const congratsDialog = document.getElementById('congrats-dialog');
    const continueBtn = document.getElementById('continue-btn');

    let puzzles = [];
    let gameState = {};
    let usedWords = new Set();
    let draggedTile = null;

    function loadPuzzles() {
        return fetch('data/puzzles.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load puzzles.json');
                return response.json();
            })
            .then(data => {
                puzzles = data;
                gameState = initializeGame(5);
                displayLetters();
                displayWordSlots();
            })
            .catch(error => {
                console.error('Error loading puzzles:', error);
                feedbackDiv.textContent = 'Error loading puzzles. Please try again.';
            });
    }

    function initializeGame(maxLetters) {
        usedWords.clear();
        if (puzzles.length === 0) return { letters: [], possibleWords: [] };
        
        const filteredPuzzles = puzzles.filter(p => p.letters.length === maxLetters);
        if (filteredPuzzles.length === 0) {
            console.warn(`No puzzles found with ${maxLetters} letters`);
            return { letters: [], possibleWords: [] };
        }
        
        const puzzle = filteredPuzzles[Math.floor(Math.random() * filteredPuzzles.length)];
        return {
            letters: puzzle.letters,
            possibleWords: puzzle.answers
        };
    }

    function generateWords(maxLetters) {
        return gameState;
    }

    function displayLetters() {
        letterTilesDiv.innerHTML = '';
        const shuffledLetters = [...gameState.letters].sort(() => Math.random() - 0.5);
        const radius = 100;
        const centerX = radius;
        const centerY = radius;
        const angleStep = (2 * Math.PI) / shuffledLetters.length;

        shuffledLetters.forEach((letter, index) => {
            const angle = index * angleStep;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = letter;
            tile.draggable = true;
            tile.id = `tile-${index}`;
            tile.style.left = `${x}px`;
            tile.style.top = `${y}px`;
            tile.dataset.originalLeft = `${x}px`;
            tile.dataset.originalTop = `${y}px`;

            tile.addEventListener('dragstart', dragStart);
            tile.addEventListener('dragend', dragEnd);
            tile.addEventListener('touchstart', touchStart, { passive: false });
            tile.addEventListener('touchmove', touchMove, { passive: false });
            tile.addEventListener('touchend', touchEnd, { passive: false });

            letterTilesDiv.appendChild(tile);
        });
    }

    function displayWordSlots() {
        wordSlotsDiv.innerHTML = '';
        const sortedWords = gameState.possibleWords.sort((a, b) => a.length - b.length);
        sortedWords.forEach(word => {
            const row = document.createElement('div');
            row.className = 'slot-row';
            row.dataset.wordLength = word.length;

            for (let i = 0; i < word.length; i++) {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.addEventListener('dragover', dragOver);
                slot.addEventListener('drop', drop);
                slot.addEventListener('click', removeLetter);
                row.appendChild(slot);
            }

            const trash = document.createElement('span');
            trash.className = 'trash-icon';
            trash.textContent = '🗑️';
            trash.addEventListener('click', () => clearRow(row));
            row.appendChild(trash);

            wordSlotsDiv.appendChild(row);
        });
    }

    function dragStart(e) {
        draggedTile = e.target;
        e.dataTransfer.setData('text', e.target.textContent);
    }

    function dragEnd(e) {
        draggedTile = null;
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        const letter = e.dataTransfer.getData('text');
        if (!e.target.textContent && draggedTile) {
            e.target.textContent = letter;
            if (isValidDrop(e.target.parentElement)) {
                e.target.classList.add('filled');
                checkWord(e.target.parentElement);
            } else {
                e.target.textContent = '';
                feedbackDiv.textContent = `Cannot use "${letter}" here - check letter availability!`;
            }
        }
    }

    function touchStart(e) {
        e.preventDefault();
        draggedTile = e.target;
        draggedTile.classList.add('dragging');
    }

    function touchMove(e) {
        e.preventDefault();
        if (!draggedTile) return;

        const touch = e.touches[0];
        draggedTile.style.left = `${touch.clientX - 25}px`;
        draggedTile.style.top = `${touch.clientY - 25}px`;
    }

    function touchEnd(e) {
        e.preventDefault();
        if (!draggedTile) return;

        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

        if (dropTarget && dropTarget.classList.contains('slot') && !dropTarget.textContent) {
            dropTarget.textContent = draggedTile.textContent;
            if (isValidDrop(dropTarget.parentElement)) {
                dropTarget.classList.add('filled');
                checkWord(dropTarget.parentElement);
            } else {
                dropTarget.textContent = '';
                feedbackDiv.textContent = `Cannot use "${draggedTile.textContent}" here - check letter availability!`;
            }
        }

        draggedTile.style.left = draggedTile.dataset.originalLeft;
        draggedTile.style.top = draggedTile.dataset.originalTop;
        draggedTile.classList.remove('dragging');
        draggedTile = null;
    }

    function isValidDrop(slotRow) {
        const slots = Array.from(slotRow.getElementsByClassName('slot'));
        const word = slots.map(slot => slot.textContent || '').join('');
        const wordFreq = {};
        word.split('').forEach(letter => {
            if (letter) wordFreq[letter] = (wordFreq[letter] || 0) + 1;
        });
        const letterFreq = {};
        gameState.letters.forEach(letter => {
            letterFreq[letter] = (letterFreq[letter] || 0) + 1;
        });
        return Object.keys(wordFreq).every(letter => 
            wordFreq[letter] <= (letterFreq[letter] || 0)
        );
    }

    function removeLetter(e) {
        if (e.target.textContent) {
            e.target.textContent = '';
            e.target.classList.remove('filled', 'correct');
            feedbackDiv.textContent = '';
        }
    }

    function clearRow(row) {
        const slots = row.getElementsByClassName('slot');
        const word = Array.from(slots).map(slot => slot.textContent).join('');
        if (usedWords.has(word)) {
            usedWords.delete(word);
        }
        for (let slot of slots) {
            slot.textContent = '';
            slot.classList.remove('filled', 'correct');
        }
        feedbackDiv.textContent = '';
    }

    function checkWord(slotRow) {
        const slots = Array.from(slotRow.getElementsByClassName('slot'));
        const word = slots.map(slot => slot.textContent).join('');
        const isRowFilled = slots.every(slot => slot.textContent);

        if (isRowFilled) {
            if (usedWords.has(word)) {
                feedbackDiv.textContent = `"${word}" has already been used. Try a different word!`;
            } else if (gameState.possibleWords.includes(word)) {
                feedbackDiv.textContent = `Success! "${word}" is correct!`;
                slots.forEach(slot => slot.classList.add('correct'));
                usedWords.add(word);

                // Check if all words are solved
                if (usedWords.size === gameState.possibleWords.length) {
                    congratsDialog.showModal();
                }
            } else {
                feedbackDiv.textContent = `"${word}" is not correct. Try again!`;
            }
        }
    }

    resetBtn.addEventListener('click', () => {
        const nextMaxLetters = gameState.letters.length === 5 ? 6 : 5;
        gameState = initializeGame(nextMaxLetters);
        displayLetters();
        displayWordSlots();
        feedbackDiv.textContent = '';
    });

    helpBtn.addEventListener('click', () => {
        helpDialog.showModal();
    });

    closeHelpBtn.addEventListener('click', () => {
        helpDialog.close();
    });

    continueBtn.addEventListener('click', () => {
        congratsDialog.close();
        const nextMaxLetters = gameState.letters.length === 5 ? 6 : 5;
        gameState = initializeGame(nextMaxLetters);
        displayLetters();
        displayWordSlots();
        feedbackDiv.textContent = '';
    });

    loadPuzzles();
}

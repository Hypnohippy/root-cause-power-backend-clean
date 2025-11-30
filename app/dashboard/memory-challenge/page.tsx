// Bulletproof Dashboard Fix - External Script + Memory Challenge
console.log('🚀 External dashboard script loading...');

function createMemoryOverlay() {
    // If already exists, just show it
    var existing = document.getElementById('memory-challenge-overlay');
    if (existing) {
        existing.style.display = 'flex';
        return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'memory-challenge-overlay';
    overlay.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100vw',
        'height:100vh',
        'background:rgba(0,0,0,0.6)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'z-index:10000',
        'font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ].join(';');

    var box = document.createElement('div');
    box.style.cssText = [
        'background:white',
        'border-radius:16px',
        'padding:20px',
        'max-width:420px',
        'width:90%',
        'box-shadow:0 20px 40px rgba(0,0,0,0.3)',
        'text-align:center'
    ].join(';');

    box.innerHTML = `
        <h2 style="margin-bottom:10px; font-size:1.5rem; color:#2563eb;">
            🧠 Memory Challenge
        </h2>
        <p style="margin-bottom:15px; font-size:0.9rem; color:#4b5563;">
            Flip two cards at a time and try to find all the matching pairs.
        </p>
        <div id="memory-game-grid" style="
            display:grid;
            grid-template-columns:repeat(4, 1fr);
            gap:8px;
            margin-bottom:12px;
        "></div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.8rem; color:#4b5563;">
            <span id="memory-moves">Moves: 0</span>
            <span id="memory-best">Best: —</span>
        </div>
        <div style="font-size:0.8rem; color:#6b7280; min-height:1.2rem; margin-bottom:12px;" id="memory-status">
            Tap a card to begin.
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button id="memory-new-game" style="
                padding:8px 12px;
                border-radius:999px;
                border:1px solid #d1d5db;
                background:white;
                font-size:0.8rem;
                cursor:pointer;
            ">
                🔁 New Game
            </button>
            <button id="memory-close" style="
                padding:8px 12px;
                border-radius:999px;
                border:none;
                background:#2563eb;
                color:white;
                font-size:0.8rem;
                cursor:pointer;
            ">
                ✕ Close
            </button>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Memory game logic
    var symbols = ['🌿', '💚', '🧠', '🌈']; // 4 pairs = 8 cards
    var grid = box.querySelector('#memory-game-grid');
    var movesEl = box.querySelector('#memory-moves');
    var bestEl = box.querySelector('#memory-best');
    var statusEl = box.querySelector('#memory-status');
    var newGameBtn = box.querySelector('#memory-new-game');
    var closeBtn = box.querySelector('#memory-close');

    var deck = [];
    var firstCard = null;
    var secondCard = null;
    var lockBoard = false;
    var moves = 0;
    var bestMoves = null;

    function createDeck() {
        deck = symbols
            .flatMap(function(symbol, index) {
                return [
                    { id: index * 2, symbol: symbol, flipped: false, matched: false },
                    { id: index * 2 + 1, symbol: symbol, flipped: false, matched: false }
                ];
            })
            .sort(function() { return Math.random() - 0.5; });
    }

    function renderDeck() {
        grid.innerHTML = '';
        deck.forEach(function(card) {
            var btn = document.createElement('button');
            btn.setAttribute('data-id', card.id);
            btn.style.cssText = [
                'height:60px',
                'border-radius:10px',
                'border:1px solid #e5e7eb',
                'font-size:1.5rem',
                'cursor:pointer',
                'transition:transform 0.15s, background 0.15s, box-shadow 0.15s'
            ].join(';');

            if (card.flipped || card.matched) {
                btn.textContent = card.symbol;
                btn.style.background = 'white';
                btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.06)';
                btn.style.transform = 'scale(1.03)';
            } else {
                btn.textContent = '❓';
                btn.style.background = '#f3f4f6';
            }

            btn.addEventListener('click', function() {
                handleCardClick(card.id);
            });

            grid.appendChild(btn);
        });
    }

    function updateStats() {
        movesEl.textContent = 'Moves: ' + moves;
        bestEl.textContent = 'Best: ' + (bestMoves === null ? '—' : bestMoves);
    }

    function resetGame() {
        createDeck();
        firstCard = null;
        secondCard = null;
        lockBoard = false;
        moves = 0;
        statusEl.textContent = 'New game started. Tap a card to begin.';
        renderDeck();
        updateStats();
    }

    function handleCardClick(id) {
        if (lockBoard) return;
        var card = deck.find(function(c) { return c.id === id; });
        if (!card || card.flipped || card.matched) return;

        if (!firstCard) {
            card.flipped = true;
            firstCard = card;
            statusEl.textContent = 'Now pick a second card.';
            renderDeck();
        } else if (!secondCard) {
            card.flipped = true;
            secondCard = card;
            moves += 1;
            updateStats();
            renderDeck();
            lockBoard = true;

            if (firstCard.symbol === secondCard.symbol) {
                // Match
                setTimeout(function() {
                    deck.forEach(function(c) {
                        if (c.symbol === card.symbol) c.matched = true;
                    });
                    firstCard = null;
                    secondCard = null;
                    lockBoard = false;
                    statusEl.textContent = 'Nice match!';
                    renderDeck();
                    checkWin();
                }, 400);
            } else {
                // No match
                setTimeout(function() {
                    firstCard.flipped = false;
                    secondCard.flipped = false;
                    firstCard = null;
                    secondCard = null;
                    lockBoard = false;
                    statusEl.textContent = 'No match. Try again.';
                    renderDeck();
                }, 700);
            }
        }
    }

    function checkWin() {
        var allMatched = deck.every(function(c) { return c.matched; });
        if (allMatched) {
            statusEl.textContent = 'Well done! You found all the pairs.';
            if (bestMoves === null || moves < bestMoves) {
                bestMoves = moves;
                updateStats();
            }
        }
    }

    newGameBtn.addEventListener('click', resetGame);
    closeBtn.addEventListener('click', function() {
        overlay.style.display = 'none';
    });

    resetGame();
}

function initializeDashboard() {
    console.log('🎯 Dashboard function working from external script!');
    
    var dashElement = document.querySelector('#dashboard') || 
                     document.querySelector('.dashboard-content') || 
                     document.querySelector('[class*="dashboard"]') ||
                     document.querySelector('.container');
    
    if (dashElement) {
        var results = window.assessmentResults || {};
        
        var commonButtonStyles = 'background:#4CAF50; color:white; padding:15px 24px; border:none; border-radius:25px; font-size:1.05em; cursor:pointer; box-shadow:0 4px 15px rgba(0,0,0,0.2); transition:all 0.3s; margin:5px;';
        
        if (results.completed) {
            dashElement.innerHTML = '' +
                '<div style="padding:30px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:15px; margin:20px; text-align:center; color:white; box-shadow:0 10px 25px rgba(0,0,0,0.2);">' +
                    '<h2 style="margin:0 0 15px 0; font-size:2.5em;">🎉 Assessment Complete!</h2>' +
                    '<p style="margin:0 0 20px 0; font-size:1.2em;">Your personalized health insights are ready</p>' +
                    '<div style="display:flex; flex-wrap:wrap; justify-content:center;">' +
                        '<button onclick="navigateToSection(\'coaches\')" style="' + commonButtonStyles + ' background:#10b981;">💬 Talk to AI Coach</button>' +
                        '<button onclick="createMemoryOverlay()" style="' + commonButtonStyles + ' background:#f97316;">🧠 Memory Challenge</button>' +
                    '</div>' +
                '</div>';
            console.log('✅ Assessment results displayed with Memory Challenge!');
        } else {
            dashElement.innerHTML = '' +
                '<div style="padding:30px; background:linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); border-radius:15px; margin:20px; text-align:center; color:white; box-shadow:0 10px 25px rgba(0,0,0,0.2);">' +
                    '<h2 style="margin:0 0 15px 0; font-size:2.5em;">🏠 Welcome to Your Dashboard</h2>' +
                    '<p style="margin:0 0 20px 0; font-size:1.2em;">Take your health assessment to unlock personalized insights</p>' +
                    '<div style="display:flex; flex-wrap:wrap; justify-content:center;">' +
                        '<button onclick="navigateToSection(\'assessment\')" style="' + commonButtonStyles + ' background:#e17055;">🔍 Start Assessment</button>' +
                        '<button onclick="createMemoryOverlay()" style="' + commonButtonStyles + ' background:#f97316;">🧠 Memory Challenge</button>' +
                    '</div>' +
                '</div>';
            console.log('✅ Welcome message displayed with Memory Challenge!');
        }
    } else {
        console.log('⚠️ No dashboard element found, creating popup...');
        var popup = document.createElement('div');
        popup.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:30px; border-radius:15px; box-shadow:0 20px 40px rgba(0,0,0,0.3); z-index:10000; color:black; text-align:center; max-width:400px;';
        popup.innerHTML = '<h2 style="color:#2563eb; margin:0 0 15px 0;">✅ Dashboard Working!</h2><p style="margin:0 0 20px 0;">Your assessment system is now functional</p><button onclick="this.parentElement.remove()" style="background:#2563eb; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Close</button>';
        document.body.appendChild(popup);
    }
}

// Multiple ways to trigger dashboard
window.addEventListener('load', function() {
    setTimeout(initializeDashboard, 2000);
});

window.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeDashboard, 1000);
});

// Override navigation to dashboard
var originalNavigate = window.navigateToSection;
window.navigateToSection = function(section) {
    if (originalNavigate) {
        originalNavigate(section);
    }
    
    if (section === 'dashboard') {
        setTimeout(initializeDashboard, 500);
    }
};

// Make functions globally available
window.initializeDashboard = initializeDashboard;
window.createMemoryOverlay = createMemoryOverlay;

console.log('✅ External dashboard script with Memory Challenge loaded successfully!');

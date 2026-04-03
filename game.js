class Game2048 {
    constructor() {
        this.board = document.getElementById('game-board');
        this.overlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayText = document.getElementById('overlay-text');
        this.overlayStats = document.getElementById('overlay-stats');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.movesElement = document.getElementById('moves-counter');
        this.timerElement = document.getElementById('timer');
        
        this.newGameBtn = document.getElementById('new-game');
        this.hintBtn = document.getElementById('hint-btn');
        this.overlayNewGameBtn = document.getElementById('overlay-new-game');
        this.overlayContinueBtn = document.getElementById('overlay-continue');
        
        this.grid = null;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048-best-score')) || 0;
        this.moves = 0;
        this.gameTime = 0;
        this.timerInterval = null;
        this.gameActive = true;
        this.gameWon = false;
        
        this.init();
    }
    
    init() {
        this.startNewGame();
        this.setupEventListeners();
    }
    
    startNewGame() {
        if (this.grid) {
            this.grid.clear();
            setTimeout(() => {
                this.initNewGame();
            }, 300);
        } else {
            this.initNewGame();
        }
    }
    
    initNewGame() {
        this.grid = new Grid(this.board);
        this.score = 0;
        this.moves = 0;
        this.gameTime = 0;
        this.gameActive = true;
        this.gameWon = false;
        
        this.hideOverlay();
        this.updateUI();
        this.startTimer();
        
        console.log('Новая игра начата');
    }
    
    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.hintBtn.addEventListener('click', () => this.showHint());
        this.overlayNewGameBtn.addEventListener('click', () => this.startNewGame());
        this.overlayContinueBtn.addEventListener('click', () => this.continueGame());
        
        this.setupTouchControls();
        
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            const keyMap = {
                'ArrowUp': 'up',
                'ArrowRight': 'right',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'w': 'up',
                'd': 'right',
                's': 'down',
                'a': 'left'
            };
            
            if (keyMap[e.key]) {
                e.preventDefault();
                this.handleMove(keyMap[e.key]);
            }
        });
    }
    
    setupTouchControls() {
        let touchStartX = null;
        let touchStartY = null;
        const minSwipeDistance = 20;
        
        const handleTouchStart = (e) => {
            if (!this.gameActive) return;
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        };
        
        const handleTouchMove = (e) => {
            e.preventDefault();
        };
        
        const handleTouchEnd = (e) => {
            if (!touchStartX || !touchStartY || !this.gameActive) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // Определяем свайп
            if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Горизонтальный свайп
                    this.handleMove(dx > 0 ? 'right' : 'left');
                } else {
                    // Вертикальный свайп
                    this.handleMove(dy > 0 ? 'down' : 'up');
                }
            }
            
            touchStartX = null;
            touchStartY = null;
            e.preventDefault();
        };
        
        const gameArea = document.querySelector('.game-board-container');
        gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    handleMove(direction) {
        if (!this.gameActive) return;
        
        console.log(`Ход: ${direction}`);
        const result = this.grid.move(direction);
        
        if (result.moved) {
            this.moves++;
            this.score += result.score;
            
            // Обновляем рекорд
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('2048-best-score', this.bestScore);
            }
            
            this.updateUI();
            
            // Проверка победы
            if (!this.gameWon) {
                setTimeout(() => {
                    if (this.grid.hasWon()) {
                        this.gameWon = true;
                        this.showWinOverlay();
                    }
                }, 300);
            }
            
            // Проверка конца игры
            setTimeout(() => {
                this.checkGameOver();
            }, 400);
        } else {
            console.log('Ход не выполнен');
        }
    }
    
    checkGameOver() {
        if (!this.gameActive) return;
        
        if (this.grid.isGameOver()) {
            console.log('Игра окончена!');
            this.gameActive = false;
            clearInterval(this.timerInterval);
            
            setTimeout(() => {
                this.showGameOverOverlay();
            }, 500);
        }
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.bestScoreElement.textContent = this.bestScore;
        this.movesElement.textContent = this.moves;
    }
    
    startTimer() {
        clearInterval(this.timerInterval);
        this.gameTime = 0;
        this.updateTimer();
        
        this.timerInterval = setInterval(() => {
            if (!this.gameActive) return;
            
            this.gameTime++;
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    showHint() {
        if (!this.gameActive) {
            alert('Игра не активна. Начните новую игру.');
            return;
        }
        
        const directions = ['up', 'right', 'down', 'left'];
        const availableMoves = [];
        
        for (const dir of directions) {
            if (this.grid.canMoveInDirection(dir)) {
                availableMoves.push(dir);
            }
        }
        
        if (availableMoves.length > 0) {
            const dirNames = {
                'up': '↑ Вверх',
                'right': '→ Вправо',
                'down': '↓ Вниз',
                'left': '← Влево'
            };
            
            const hintText = availableMoves.map(d => dirNames[d]).join(', ');
            alert(`Возможные ходы:\n${hintText}`);
        } else {
            alert('Нет доступных ходов!');
            this.checkGameOver();
        }
    }
    
    showWinOverlay() {
        this.overlayTitle.textContent = '🎉 Победа!';
        this.overlayText.textContent = 'Вы получили плитку 2048!';
        this.updateOverlayStats();
        this.overlayContinueBtn.style.display = 'flex';
        this.showOverlay();
    }
    
    showGameOverOverlay() {
        this.overlayTitle.textContent = '😔 Игра окончена';
        this.overlayText.textContent = 'Нет возможных ходов';
        this.updateOverlayStats();
        this.overlayContinueBtn.style.display = 'none';
        this.showOverlay();
    }
    
    updateOverlayStats() {
        this.overlayStats.innerHTML = '';
        
        const maxTile = this.getMaxTileValue();
        const timeFormatted = this.formatTime(this.gameTime);
        
        const stats = [
            ['Счёт', this.score],
            ['Рекорд', this.bestScore],
            ['Ходов', this.moves],
            ['Время', timeFormatted],
            ['Максимальная плитка', maxTile]
        ];
        
        stats.forEach(([label, value]) => {
            const statElement = document.createElement('div');
            statElement.className = 'overlay-stat';
            statElement.innerHTML = `
                <span>${label}</span>
                <span>${value}</span>
            `;
            this.overlayStats.appendChild(statElement);
        });
    }
    
    getMaxTileValue() {
        let max = 0;
        if (this.grid && this.grid.tiles) {
            this.grid.tiles.forEach(tile => {
                if (tile.value > max) max = tile.value;
            });
        }
        return max > 0 ? max : '—';
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    showOverlay() {
        this.overlay.classList.add('active');
        this.gameActive = false;
    }
    
    hideOverlay() {
        this.overlay.classList.remove('active');
        this.gameActive = true;
    }
    
    continueGame() {
        this.hideOverlay();
        this.gameActive = true;
    }
}

// Инициализация игры
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game2048();
    window.game2048 = game;
    
    // Функция для отладки
    window.debug = function() {
        console.log('Отладка игры:');
        console.log('Счёт:', game.score);
        console.log('Ходов:', game.moves);
        console.log('Плиток:', game.grid.tiles.length);
        console.log('Активна:', game.gameActive);
        console.log('Окончена:', game.grid.isGameOver());
        
        // Показать сетку
        for (let y = 0; y < 4; y++) {
            let row = '';
            for (let x = 0; x < 4; x++) {
                const tile = game.grid.getTileAt(x, y);
                row += tile ? tile.value.toString().padStart(4) : '   .';
            }
            console.log(row);
        }
    };
});
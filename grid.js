class Grid {
    constructor(container, size = 4) {
        this.container = container;
        this.size = size;
        this.cells = Array(size).fill().map(() => Array(size).fill(null));
        this.tiles = [];
        this.cellSize = 0;
        this.gap = 0;
        this.score = 0;
        this.lastMoveScore = 0;
        // Убираем сложный флаг isMoving
        this.pendingAnimations = 0;
        
        this.init();
        this.calculateDimensions();
        window.addEventListener('resize', () => this.calculateDimensions());
    }
    
    init() {
        this.container.innerHTML = '';
        
        // Создаем визуальные ячейки сетки
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                this.container.appendChild(cell);
            }
        }
        
        // Добавляем начальные плитки с задержкой
        setTimeout(() => {
            this.addRandomTile();
            setTimeout(() => {
                this.addRandomTile();
            }, 150);
        }, 100);
    }
    
    calculateDimensions() {
        const containerWidth = this.container.clientWidth;
        this.gap = Math.max(5, Math.min(10, containerWidth * 0.015));
        this.cellSize = (containerWidth - (this.size + 1) * this.gap) / this.size;
        
        document.documentElement.style.setProperty('--cell-size', `${this.cellSize}px`);
        document.documentElement.style.setProperty('--grid-gap', `${this.gap}px`);
        
        const cells = this.container.querySelectorAll('.cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            cell.style.width = `${this.cellSize}px`;
            cell.style.height = `${this.cellSize}px`;
            cell.style.left = `${x * (this.cellSize + this.gap) + this.gap}px`;
            cell.style.top = `${y * (this.cellSize + this.gap) + this.gap}px`;
        });
        
        this.tiles.forEach(tile => {
            tile.updatePosition(true); // Instant update
        });
    }
    
    addRandomTile() {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length === 0) return null;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const tile = new Tile(this, randomCell);
        
        this.tiles.push(tile);
        this.container.appendChild(tile.element);
        this.cells[randomCell.y][randomCell.x] = tile;
        
        return tile;
    }
    
    getEmptyCells() {
        const emptyCells = [];
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (!this.cells[y][x]) {
                    emptyCells.push({ x, y });
                }
            }
        }
        return emptyCells;
    }
    
    getTileAt(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return null;
        }
        return this.cells[y][x];
    }
    
    // Основной исправленный метод движения
    move(direction) {
        // Если есть незавершенные анимации, пропускаем ход
        if (this.pendingAnimations > 0) {
            return { moved: false, score: 0 };
        }
        
        let moved = false;
        this.lastMoveScore = 0;
        
        // Сохраняем позиции плиток перед движением
        this.tiles.forEach(tile => {
            tile.savePosition();
            tile.mergedFrom = null;
        });
        
        const vector = this.getVector(direction);
        const traversals = this.buildTraversals(vector);
        
        // Список плиток, которые нужно удалить после анимации
        const tilesToRemove = [];
        
        // Сначала обрабатываем логику движения
        for (let x of traversals.x) {
            for (let y of traversals.y) {
                const tile = this.getTileAt(x, y);
                if (tile) {
                    const positions = this.findFarthestPosition({ x, y }, vector);
                    const nextTile = this.getTileAt(positions.next.x, positions.next.y);
                    
                    // Проверяем возможность слияния
                    if (nextTile && 
                        nextTile.value === tile.value &&
                        !nextTile.mergedFrom &&
                        !tile.mergedFrom) {
                        
                        // Отмечаем плитки для слияния
                        nextTile.mergedFrom = [tile, nextTile];
                        tile.mergedFrom = [tile, nextTile];
                        tilesToRemove.push(tile);
                        
                        // Обновляем значение плитки
                        const newValue = tile.value * 2;
                        nextTile.prepareForMerge(newValue);
                        this.lastMoveScore += newValue;
                        
                        // Обновляем состояние сетки
                        this.cells[tile.y][tile.x] = null;
                        this.cells[nextTile.y][nextTile.x] = nextTile;
                        
                        moved = true;
                        
                    } else if (!this.positionsEqual({ x, y }, positions.farthest)) {
                        // Простое перемещение
                        this.cells[tile.y][tile.x] = null;
                        this.cells[positions.farthest.y][positions.farthest.x] = tile;
                        tile.moveTo(positions.farthest.x, positions.farthest.y);
                        moved = true;
                    }
                }
            }
        }
        
        if (moved) {
            // Увеличиваем счетчик анимаций
            this.pendingAnimations++;
            
            // Удаляем слитые плитки после анимации
            setTimeout(() => {
                this.removeTiles(tilesToRemove);
                
                // Добавляем новую плитку
                setTimeout(() => {
                    this.addRandomTile();
                    
                    // Уменьшаем счетчик анимаций
                    this.pendingAnimations--;
                    
                }, 150);
                
            }, 200);
            
            return { moved: true, score: this.lastMoveScore };
        }
        
        return { moved: false, score: 0 };
    }
    
    removeTiles(tilesToRemove) {
        tilesToRemove.forEach(tile => {
            // Удаляем из массива плиток
            const index = this.tiles.indexOf(tile);
            if (index > -1) {
                this.tiles.splice(index, 1);
            }
            
            // Удаляем из DOM с анимацией
            tile.remove();
        });
    }
    
    getVector(direction) {
        const map = {
            'up': { x: 0, y: -1 },
            'right': { x: 1, y: 0 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 }
        };
        return map[direction];
    }
    
    buildTraversals(vector) {
        const traversals = { x: [], y: [] };
        
        for (let i = 0; i < this.size; i++) {
            traversals.x.push(i);
            traversals.y.push(i);
        }
        
        if (vector.x === 1) traversals.x = traversals.x.reverse();
        if (vector.y === 1) traversals.y = traversals.y.reverse();
        
        return traversals;
    }
    
    findFarthestPosition(cell, vector) {
        let previous;
        
        do {
            previous = cell;
            cell = {
                x: previous.x + vector.x,
                y: previous.y + vector.y
            };
        } while (this.withinBounds(cell) && !this.getTileAt(cell.x, cell.y));
        
        return {
            farthest: previous,
            next: cell
        };
    }
    
    withinBounds(position) {
        return position.x >= 0 && position.x < this.size &&
               position.y >= 0 && position.y < this.size;
    }
    
    positionsEqual(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }
    
    hasWon() {
        return this.tiles.some(tile => tile.value === 2048);
    }
    
    isGameOver() {
        if (this.getEmptyCells().length > 0) {
            return false;
        }
        
        const directions = ['up', 'right', 'down', 'left'];
        
        for (const direction of directions) {
            if (this.canMoveInDirection(direction)) {
                return false;
            }
        }
        
        return true;
    }
    
    canMoveInDirection(direction) {
        const vector = this.getVector(direction);
        
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const tile = this.getTileAt(x, y);
                if (!tile) continue;
                
                const nextX = x + vector.x;
                const nextY = y + vector.y;
                
                if (nextX < 0 || nextX >= this.size || nextY < 0 || nextY >= this.size) {
                    continue;
                }
                
                const nextTile = this.getTileAt(nextX, nextY);
                
                if (!nextTile || nextTile.value === tile.value) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    clear() {
        // Плавное исчезновение всех плиток
        this.tiles.forEach(tile => {
            tile.element.style.transition = 'all 0.3s ease';
            tile.element.style.opacity = '0';
            tile.element.style.transform += ' scale(0)';
        });
        
        setTimeout(() => {
            this.tiles.forEach(tile => {
                if (tile.element && tile.element.parentNode) {
                    tile.element.parentNode.removeChild(tile.element);
                }
            });
            
            this.tiles = [];
            this.cells = Array(this.size).fill().map(() => Array(this.size).fill(null));
            this.score = 0;
            this.lastMoveScore = 0;
            this.pendingAnimations = 0;
        }, 300);
    }
}
class Tile {
    constructor(grid, position, value, isNew = true) {
        this.grid = grid;
        this.x = position.x;
        this.y = position.y;
        this.value = value || this.getRandomStartValue();
        this.mergedFrom = null;
        this.previousPosition = null;
        this.element = this.createElement(isNew);
        this.setInitialPosition();
    }
    
    getRandomStartValue() {
        return Math.random() < 0.9 ? 2 : 4;
    }
    
    createElement(isNew) {
        const element = document.createElement('div');
        element.className = `tile tile-${this.value}`;
        element.textContent = this.value;
        element.dataset.value = this.value;
        
        // Изначально скрываем новую плитку
        if (isNew) {
            element.style.opacity = '1';
            element.style.transform = 'scale(0.1)';
        }
        
        return element;
    }
    
    setInitialPosition() {
        this.updatePosition(true); // Instant positioning
    }
    
    savePosition() {
        this.previousPosition = { x: this.x, y: this.y };
    }
    
    moveTo(newX, newY) {
        this.x = newX;
        this.y = newY;
        this.updatePosition();
    }
    
    updatePosition(instant = false) {
        const cellSize = this.grid.cellSize;
        const gap = this.grid.gap;
        const x = this.x * (cellSize + gap) + gap;
        const y = this.y * (cellSize + gap) + gap;
        
        if (instant) {
            this.element.style.transition = 'none';
            this.element.style.transform = `translate(${x}px, ${y}px) scale(1)`;
            this.element.style.opacity = '1';
            void this.element.offsetWidth; // Force reflow
            this.element.style.transition = '';
        } else {
            // Плавное движение
            this.element.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
            this.element.style.transform = `translate(${x}px, ${y}px) scale(1)`;
            this.element.style.opacity = '1';
        }
    }
    
    prepareForMerge(newValue) {
        // Анимация слияния
        this.element.classList.add('tile-merge');
        
        // Обновляем значение после небольшой задержки
        setTimeout(() => {
            this.value = newValue;
            this.element.textContent = newValue;
            this.element.dataset.value = newValue;
            
            // Плавная смена цвета
            this.element.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            this.element.className = `tile tile-${newValue} tile-merge`;
            
            // Убираем класс анимации после завершения
            setTimeout(() => {
                this.element.classList.remove('tile-merge');
                this.element.style.transition = '';
            }, 300);
            
        }, 100);
    }
    
    remove() {
        if (this.element && this.element.parentNode) {
            // Плавное исчезновение
            this.element.style.transition = 'all 0.2s ease';
            this.element.style.opacity = '0';
            this.element.style.transform += ' scale(0.8)';
            
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }, 200);
        }
    }
}
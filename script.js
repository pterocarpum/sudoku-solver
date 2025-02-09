class Board {
    constructor() {
        this.board = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ''));
        this.cells = [];
        this.initialBoard = null;
        this.createBoard();
    }

    createBoard() {
        const container = document.getElementById('sudoku-grid');
        const table = document.createElement('table');
        table.classList.add('sudoku-grid');
    
        for (let y = 0; y < 9; y++) {
            const row = document.createElement('tr');
            let rowCells = [];

            for (let x = 0; x < 9; x++) {
                const cell = document.createElement('td');
    
                // Input
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = '1';

                // Restrict to 1-9
                input.addEventListener('input', function(event) {
                    const invalidNums = this.findInvalidNums(y,x);
                    // Validate input
                    if (!/^[1-9]$/.test(event.target.value) || invalidNums.has(event.target.value)) {
                        event.target.value = '';
                    }
                    this.board[y][x] = input.value;
                }.bind(this));
                
                // Move input easily
                input.addEventListener('keydown', function(event) {
                    let nextInput = input;
                    switch(event.key) {
                        case 'ArrowUp':
                            if (y > 0) nextInput = this.cells[y-1][x];
                            break;
                        case 'ArrowDown':
                            if (y < 8) nextInput = this.cells[y+1][x];
                            break;
                        case 'ArrowLeft':
                            if (x > 0) nextInput = this.cells[y][x-1];
                            break;
                        case 'ArrowRight':
                            if (x < 9) nextInput = this.cells[y][x+1];
                            break;
                    }
                    nextInput.focus();
                    nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
                }.bind(this));

                rowCells.push(input)
                cell.appendChild(input);
                row.appendChild(cell);
            }
            this.cells.push(rowCells);
            table.appendChild(row);
        }
        container.appendChild(table);
    }

    updateBoard() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                this.cells[y][x].value = this.board[y][x];
            }
        }
    }

    clearBoard() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                this.cells[y][x].value = '';
                this.board[y][x] = '';
            }
        }
    }

    saveInitialState() {
        this.initialBoard = this.board.map(row => [...row]);
    }

    revertToInitialState() {
        if (this.initialBoard) {
            this.board = this.initialBoard.map(row => [...row]);
            this.updateBoard();
            this.initialBoard = null;
        }
    }

    changeCellState(disable=true) {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                this.cells[y][x].disabled = disable;
            }
        }
    }

    findInvalidNums(y,x) {
        let invalidNums = new Set();

        const startX = Math.floor(x/3)*3;
        const startY = Math.floor(y/3)*3;
        for (let i = 0; i < 9; i++) {
            if (i !== x && this.board[y][i]) {
                invalidNums.add(this.board[y][i]);
            }
            if (i !== y && this.board[i][x]) {
                invalidNums.add(this.board[i][x]);
            }
            if (startY+Math.floor(i/3) !== y &&
                startX+i%3 !== x &&
                this.board[startY+Math.floor(i/3)][startX+i%3]) {
                invalidNums.add(this.board[startY+Math.floor(i/3)][startX+i%3]);
            }
        }
        return invalidNums; 
    }

    async solve() {  
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
        let emptyCells = [];
    
        // Collect empty cells
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                if (!this.board[y][x]) {
                    emptyCells.push([y, x]);
                }
            }
        }
        
        let tries = 0;
        let i = 0;
        while (i < emptyCells.length) {
            let [y, x] = emptyCells[i];
            let value = parseInt(this.board[y][x]) || 0;
    
            let invalidNums = this.findInvalidNums(y, x);
    
            let found = false;
            for (let n = value + 1; n <= 9; n++) {
                if (invalidNums.has(n.toString())) continue;
                this.board[y][x] = n.toString(); 
                i++;
                found = true;
                break;
            }
    
            if (!found) {
                this.board[y][x] = '';
                i--;
                if (i < 0) return [false, tries]; 
            }
            tries++;

            // Short pause to not overwork program
            if (tries%1000000==0) await delay(1);
        }
        this.updateBoard();
        return [true, tries];
    }        
}

const sudokuBoard = new Board();
const solveButton = document.querySelector('.solve');
const clearButton = document.querySelector('.clear');
const infoText = document.querySelector('.info-text')

solveButton.addEventListener('click', async () => {
    if (solveButton.classList.contains('unsolve')) {
        sudokuBoard.revertToInitialState();
        solveButton.textContent = 'Solve';
        solveButton.classList.remove('unsolve');
        infoText.innerHTML = 'Reverted to the original state.';
        return;
    }

    if (solveButton.disabled) return;
    sudokuBoard.saveInitialState(); // Save the initial board state
    solveButton.disabled = true;
    clearButton.disabled = true;
    sudokuBoard.changeCellState(true);
    infoText.innerHTML = 'Solving...';

    const [solved, tries] = await sudokuBoard.solve()
    infoText.innerHTML = `${!solved ? 'Sudoku cannot be solved' : 'Sudoku is solved'}. Iterations: ${tries}`;
    if (solved) {
        solveButton.textContent = 'Unsolve';
        solveButton.classList.add('unsolve');
    }
    sudokuBoard.changeCellState(false);
    solveButton.disabled = false;
    clearButton.disabled = false;
});


clearButton.addEventListener('click', function() {
    sudokuBoard.clearBoard();
    infoText.innerHTML = '';
    solveButton.textContent = 'Solve';
    solveButton.classList.remove('unsolve');
});


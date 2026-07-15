const DIFFICULTIES = {
    small:  { rows: 9,  cols: 9,  bombs: 10, cellSize: 32 },
    medium: { rows: 16, cols: 16, bombs: 40, cellSize: 26 },
    large:  { rows: 16, cols: 30, bombs: 99, cellSize: 20 },
};
let currentDifficulty = 'small';

let board = [];
let col = DIFFICULTIES.small.cols;
let row = DIFFICULTIES.small.rows;
let numBombs = DIFFICULTIES.small.bombs;
let numCells = col * row;
let numFlags = numBombs;
let numCorrectFlags = 0;
const winLose = document.getElementById("win-lose");
const numFlagView = document.getElementById("num-flag-view");
const gameBoard = document.getElementById("game-board");
const timerView = document.getElementById("timer-view");
numFlagView.textContent = numFlags;
let gameOver = false;
let firstClick = false;
let timer = 1;
let timeID = null;

gameBoard.style.setProperty('--cell-size', DIFFICULTIES[currentDifficulty].cellSize + 'px');

class Cell {
    constructor(r, c) {
        this.row = r;
        this.col = c;
        this.val = 0;
        this.hasClicked = false;
        this.flagged = false;
        this.numFlagsAround = 0;
        this.btn = document.createElement("div");
        this.btn.className = "cell";
    }

    changeButtonVal() {
        if (gameOver) return;
        if (this.val === 0) {
            this.btn.innerText = "";
        } else {
            this.btn.innerText = this.val;
            const colors = { 1: "#7b8cde", 2: "#81b29a", 3: "#e07a5f", 4: "#c8b4e8", 5: "#fcbf49", 6: "#00f5d4", 7: "#f4a6b5", 8: "#888" };
            if (this.val === "B") {
                this.btn.innerText = "💣";
                this.btn.style.color = "#e07a5f";
                loseGame();
            } else {
                this.btn.style.color = colors[this.val] || "#f0ede8";
            }
        }
        this.btn.classList.add('revealed');
        this.hasClicked = true;
        numCells--;
        if (numCells === numBombs && !gameOver) winGame();
    }

    flagButton() {
        if (this.hasClicked || gameOver) return;
        if (!this.flagged) {
            this.btn.innerText = "🚩";
            this.flagged = true;
            numFlags--;
            numFlagView.textContent = numFlags;
            if (this.val === "B") {
                numCorrectFlags++;
                if (numCorrectFlags === numBombs) winGame();
            }
            this._adjustNeighborFlags(1);
        } else {
            this.btn.innerText = "";
            this.flagged = false;
            numFlags++;
            numFlagView.textContent = numFlags;
            if (this.val === "B") numCorrectFlags--;
            this._adjustNeighborFlags(-1);
        }
    }

    _adjustNeighborFlags(delta) {
        for (let k = this.row - 1; k <= this.row + 1; k++) {
            for (let t = this.col - 1; t <= this.col + 1; t++) {
                if (k < 0 || k >= row || t < 0 || t >= col || (k === this.row && t === this.col)) continue;
                board[k][t].numFlagsAround += delta;
            }
        }
    }
}

function createBoard() {
    for (let i = 0; i < row; i++) {
        board[i] = [];
        const rowDiv = document.createElement("div");
        rowDiv.style.display = "flex";
        for (let j = 0; j < col; j++) {
            board[i][j] = new Cell(i, j);
            board[i][j].btn.addEventListener("click", () => buttonClick(i, j));
            board[i][j].btn.addEventListener("contextmenu", () => flag(i, j));
            rowDiv.appendChild(board[i][j].btn);
        }
        gameBoard.appendChild(rowDiv);
    }

    // Place bombs
    for (let i = 0; i < numBombs; i++) {
        while (true) {
            const x = Math.floor(Math.random() * row);
            const y = Math.floor(Math.random() * col);
            if (board[x][y].val === 0) { board[x][y].val = "B"; break; }
        }
    }

    // Calculate adjacent bomb counts
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {
            if (board[i][j].val === "B") continue;
            let bCount = 0;
            for (let k = i - 1; k <= i + 1; k++) {
                for (let t = j - 1; t <= j + 1; t++) {
                    if (k >= 0 && k < row && t >= 0 && t < col && board[k][t].val === "B") bCount++;
                }
            }
            if (bCount > 0) board[i][j].val = bCount;
        }
    }

    // Mark a random empty cell as a safe starting hint
    while (true) {
        const x = Math.floor(Math.random() * row);
        const y = Math.floor(Math.random() * col);
        if (board[x][y].val === 0) {
            board[x][y].btn.innerText = "✦";
            board[x][y].btn.style.color = "rgba(252,191,73,0.4)";
            board[x][y].btn.style.fontSize = "calc(var(--cell-size, 28px) * 0.35)";
            break;
        }
    }
}

gameBoard.addEventListener("contextmenu", e => e.preventDefault());
createBoard();

function startGame() {
    const d = DIFFICULTIES[currentDifficulty];
    row = d.rows;
    col = d.cols;
    numBombs = d.bombs;
    gameBoard.style.setProperty('--cell-size', d.cellSize + 'px');

    gameBoard.innerHTML = "";
    board = [];
    createBoard();

    winLose.innerText = "";
    winLose.style.color = "";
    gameOver = false;
    numFlags = numBombs;
    numCorrectFlags = 0;
    numCells = col * row;
    numFlagView.textContent = numFlags;
    firstClick = false;
    timerView.textContent = "00:00";
    clearInterval(timeID);
}

function setDifficulty(diff) {
    currentDifficulty = diff;
    document.querySelectorAll('.size-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === diff));
    startGame();
}

function buttonClick(x, y) {
    if (!firstClick) { firstClick = true; startTimer(); }
    if (x < 0 || x >= row || y < 0 || y >= col) return;
    if (board[x][y].flagged || board[x][y].hasClicked) {
        if (board[x][y].hasClicked && board[x][y].numFlagsAround >= board[x][y].val) {
            for (let k = x - 1; k <= x + 1; k++) {
                for (let t = y - 1; t <= y + 1; t++) {
                    if (k < 0 || k >= row || t < 0 || t >= col || (k === x && t === y)) continue;
                    if (!board[k][t].hasClicked && !board[k][t].flagged) buttonClick(k, t);
                }
            }
        }
        return;
    }
    board[x][y].changeButtonVal();
    if (board[x][y].val === 0) {
        for (let k = x - 1; k <= x + 1; k++) {
            for (let t = y - 1; t <= y + 1; t++) {
                if (k < 0 || k >= row || t < 0 || t >= col || (k === x && t === y)) continue;
                buttonClick(k, t);
            }
        }
    }
}

function flag(x, y) {
    event.preventDefault();
    board[x][y].flagButton();
}

function loseGame() {
    winLose.innerText = "💣  BOOM — YOU LOSE";
    winLose.style.color = "#e07a5f";
    gameOver = true;
    clearInterval(timeID);
}

function winGame() {
    winLose.innerText = "✓  CLEAR — ALL MINES FOUND";
    winLose.style.color = "#81b29a";
    gameOver = true;
    clearInterval(timeID);
}

function startTimer() {
    timer = 1;
    timeID = setInterval(() => {
        const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
        const seconds = String(timer % 60).padStart(2, '0');
        timerView.textContent = minutes + ":" + seconds;
        timer++;
    }, 1000);
}

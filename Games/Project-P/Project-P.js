let board = [];
let col = 11;
let row = 11;

let gameBoard = document.getElementById("game-board")

class cell{

    
    btn = document.createElement("div")
    
    
    constructor(row, col){
        this.row = row
        this.col = col
        this.btn.setAttribute("class", "cell")
    }
    
    get btn(){
        return btn
    }

}

for (let i = 0; i < row; i++) {
    board[i] = [];
    var rows = document.createElement("div")
    rows.style.display = "flex"
    for (let j = 0; j < col; j++) {
        board[i][j] = new cell(i,j);
        board[i][j].btn.style.backgroundColor = "slategrey"
        rows.appendChild(board[i][j].btn);
        gameBoard.appendChild(rows)
        
    }
}

let moveInterval = null;

document.addEventListener('keydown', function(event) {
  if (moveInterval) return; // already moving, do nothing

  if (event.key === 'ArrowRight') {
    moveInterval = setInterval(() => {
      console.log('moving right');
      // You can update your object's position here

    }, 20); // every 20ms = smooth
  }
  else if (event.key === 'ArrowLeft') {
    moveInterval = setInterval(() => {
      console.log('moving left');
    }, 20);
  }
  else if (event.key === 'ArrowUp') {
    moveInterval = setInterval(() => {
      console.log('moving up');
    }, 20);
  }
  else if (event.key === 'ArrowDown') {
    moveInterval = setInterval(() => {
      console.log('moving down');
    }, 20);
  }
});

document.addEventListener('keyup', function(event) {
  clearInterval(moveInterval);
  moveInterval = null;
});
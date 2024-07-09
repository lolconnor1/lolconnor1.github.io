let board = [];
let col = 10;
let row = 10;
let numCells = col * row
let numBombs = 15;
let numFlags = numBombs
let numCorrectFlags = 0
let winLose = document.getElementById("win-lose")
let numFlagView = document.getElementById("num-flag-view")
let gameBoard = document.getElementById("game-board")
let timerView = document.getElementById("timer-view")
numFlagView.textContent = "FLAGS:" + numFlags
let gameOver = false
let firstClick = false
let timer = 1
let timeID = null


class cell{

    val = 0
    hasClicked = false
    flagged = false
    btn = document.createElement("button")
    numFlagsAround = 0
    
    constructor(row, col){
        this.row = row
        this.col = col
    }
    

    get val(){
        return val
    }
    set val(newVal){
        this.val = newVal
    }
    get btn(){
        return btn
    }

    get hasClicked(){
        return hasClicked
    }
    set hasClicked(newClicked){
        this.hasClicked = newClicked
    }
    get flagged(){
        return flagged
    }
    get numFlagsAround(){
        return numFlagsAround
    }
    set numFlagsAround(newNumFlags){
        this.numFlagsAround = newNumFlags
    }

    changeButtonVal(){
        if(!gameOver){
            if(this.val == 0){
                this.btn.innerText = ""
            }
            else{
                this.btn.innerText = this.val

                if(this.val == 1){
                    this.btn.style.color = "blue"
                }
                else if(this.val == 2){
                    this.btn.style.color = "green"
                }
                else if(this.val == 3){
                    this.btn.style.color = "red"
                }
                else if(this.val == 4){
                    this.btn.style.color = "black"
                }
                else if(this.val == 5){
                    this.btn.style.color = "orange"
                }
                else if(this.val == 6){
                    this.btn.style.color = "turquoise"
                }
                else if(this.val == 7){
                    this.btn.style.color = "goldenrod"
                }
                else if(this.val == "B"){
                    this.btn.style.color = "purple"
                    loseGame()
                }
            }
            this.btn.style.backgroundColor = "seashell"
            this.hasClicked = true
            numCells--
            if(numCells == numBombs && !gameOver){
                winGame()
            }
        }
        
    }

    flagButton(){
        if(!this.hasClicked && !gameOver){
            if(!this.flagged){
                this.btn.innerText = "\u0394"
                this.flagged = true
                numFlags--
                numFlagView.textContent = "FLAGS:" + numFlags
                if(this.val == "B"){
                    numCorrectFlags++
                    if(numCorrectFlags == numBombs){
                        winGame()
                    }
                }
                for (let k = this.row-1; k <= this.row+1; k++){
                    for (let t = this.col-1; t <= this.col+1; t++){
            
                        if((k < 0 || k >= row || t < 0 || t >= col || (k == this.row && t == this.col))){
                            continue
                        }
                        else{
                            board[k][t].numFlagsAround += 1
                        }
                        
                    }
                }
            }
            else{
                this.btn.innerText = ""
                this.flagged = false
                numFlags++
                numFlagView.textContent = "FLAGS:" + numFlags
                if(this.val == "B"){
                    numCorrectFlags--
                }
                for (let k = this.row-1; k <= this.row+1; k++){
                    for (let t = this.col-1; t <= this.col+1; t++){
            
                        if((k < 0 || k >= row || t < 0 || t >= col || (k == this.row && t == this.col))){
                            continue
                        }
                        else{
                            board[k][t].numFlagsAround -= 1
                        }
                        
                    }
                }
            }
        }
    }
    
    reset(){
        this.val = 0
        this.hasClicked = false
        this.flagged = false
        this.btn.innerText = ""
        this.btn.style.backgroundColor = "slategrey"
        this.btn.style.color = ""
        this.numFlagsAround = 0
    }
}

//create an array of cells
for (let i = 0; i < row; i++) {
    board[i] = [];
    var rows = document.createElement("div")
    for (let j = 0; j < col; j++) {
        board[i][j] = new cell(i,j);
        board[i][j].btn.style.backgroundColor = "slategrey"
        board[i][j].btn.addEventListener("click", () => buttonClick(i,j))
        board[i][j].btn.addEventListener("contextmenu", (event) => flag(i,j))
        rows.appendChild(board[i][j].btn);
        gameBoard.appendChild(rows)
        
    }
}

gameBoard.addEventListener("contextmenu", (event) => event.preventDefault())

//next: add bombs to array of cells

for (let i = 0; i < numBombs;i++){
    while(true){
        let x = Math.floor(Math.random() * (row - 1))
        let y = Math.floor(Math.random() * (col - 1))

        if(board[x][y].val === 0){
            board[x][y].val = "B"
            break
        }

    }
    
}



for (let i = 0; i < row; i++) {
    for (let j = 0; j < col; j++){
        if(board[i][j].val != "B"){
            let bCount = 0
            //search around the square
            for (let k = i-1; k < i+2; k++){
                for (let t = j-1; t < j+2; t++){
                    if(k == row || k < 0 || t == col || t < 0){

                    }
                    else{
                        if(board[k][t].val == "B"){
                            bCount ++
                        }
                    }
                }
            }
            if(bCount > 0){
                board[i][j].val = bCount
            }
            
            
        }
    }
}

while(true){
    let x = Math.floor(Math.random() * (row - 1))
    let y = Math.floor(Math.random() * (col - 1))

    if(board[x][y].val === 0){
        board[x][y].btn.innerText = "X"
        break
    }
}

function startGame(){
    
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++) {
            board[i][j].reset()
        }
    }
    for (let i = 0; i < numBombs;i++){
        while(true){
            let x = Math.floor(Math.random() * (row - 1))
            let y = Math.floor(Math.random() * (col - 1))
    
            if(board[x][y].val === 0){
                board[x][y].val = "B"
                break
            }
        }
    }
    for (let i = 0; i < row; i++) {
        for (let j = 0; j < col; j++){
            if(board[i][j].val != "B"){
                let bCount = 0
                //search around the square
                for (let k = i-1; k < i+2; k++){
                    for (let t = j-1; t < j+2; t++){
                        if(k == row || k < 0 || t == col || t < 0){
    
                        }
                        else{
                            if(board[k][t].val == "B"){
                                bCount ++
                            }
                        }
                    }
                }
                if(bCount > 0){
                    board[i][j].val = bCount
                }
                
                
            }
        }
    }
    while(true){
        let x = Math.floor(Math.random() * (row - 1))
        let y = Math.floor(Math.random() * (col - 1))

        if(board[x][y].val === 0){
            board[x][y].btn.innerText = "X"
            break
        }
    }
    winLose.innerText = ""
    winLose.style.backgroundColor = ""
    gameOver = false
    numFlags = numBombs
    numCorrectFlags = 0
    numCells = col * row
    numFlagView.textContent = "FLAGS:" + numFlags
    firstClick = false
    timerView.textContent = "00:00"
    clearInterval(timeID)
}


function buttonClick(x,y){
    
    if(!firstClick){
        firstClick = true
        startTimer()
    }

    if(x < 0 || x >= row || y < 0 || y >= col){
        return;
    }
    else if(board[x][y].flagged){
        return
    }
    else if(board[x][y].hasClicked){
        if(board[x][y].numFlagsAround >= board[x][y].val){
            for (let k = x-1; k <= x+1; k++){
                for (let t = y-1; t <= y+1; t++){
                    if((k < 0 || k >= row || t < 0 || t >= col || (k == x && t == y))){
                        continue
                    }
                    else{
                        if(!board[k][t].hasClicked && !board[k][t].flagged){
                            buttonClick(k,t)
                        }
                    }
                    
                        
                }
                    
            }
        }
        return;
    }
    
    board[x][y].changeButtonVal()

    if(board[x][y].val == 0){
        for (let k = x-1; k <= x+1; k++){
            for (let t = y-1; t <= y+1; t++){

                if((k < 0 || k >= row || t < 0 || t >= col || (k == x && t == y))){
                    continue
                }
                else{
                    console.log(k + " " + t)
                    buttonClick(k,t)
                }
                
            }
        }
    }
    
    return;
    
}

function flag(x,y){
    event.preventDefault()
    board[x][y].flagButton()
}

function loseGame(){
    winLose.innerText = "BOOM: YOU LOSE"
    winLose.style.backgroundColor = "orangered"
    gameOver = true
    clearInterval(timeID)
}
function winGame(){
    winLose.innerText = "CLEAR: ALL MINES FOUND"
    winLose.style.backgroundColor = "springgreen"
    gameOver = true
    clearInterval(timeID)
}

function startTimer(){
    timer = 1
    timeID = setInterval(timeFunc, 1000)
}

var timeFunc = function(){

    let minutes = parseInt(timer / 60, 10)
    let seconds = parseInt(timer % 60, 10)

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    timerView.textContent = minutes + ":" + seconds;
    timer++
}
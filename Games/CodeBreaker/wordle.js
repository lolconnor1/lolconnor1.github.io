let gameBoard = document.getElementById("game-board")
let selector = document.getElementById("selector")
let enter = document.getElementById("enter")
enter.addEventListener("click", () => checkGuess())
let back = document.getElementById("back")
back.addEventListener("click", () => goBack())
let startGameBtn = document.getElementById("start-game")
startGameBtn.addEventListener("click", () => startGame())
let gameStatus = document.getElementById("game-win")
let guessNum = 0
let posNum = 0
let gameOver = false
let correct = createCode()
let guesses = []





class letter{

    box = document.createElement("div")
    val = -1

    constructor(){
        this.box.setAttribute("class", "guess-box-empty")
    }

    get box(){
        return box
    }

    set val(newVal){
        this.val = newVal
    }
    get val(){
        return this.val
    }

    updateColor(){
        if(this.val == 0){
            this.box.style.backgroundColor = "green"
        }
        else if(this.val == 1){
            this.box.style.backgroundColor = "red"
        }
        else if(this.val == 2){
            this.box.style.backgroundColor = "aqua"
        }
        else if(this.val == 3){
            this.box.style.backgroundColor = "aquamarine"
        }
        else if(this.val == 4){
            this.box.style.backgroundColor = "blueviolet"
        }
        else{
            this.box.style.backgroundColor = ""
        }
    }
}

class colorBtn{
    
    btn = document.createElement("div")

    constructor(val){
        this.val = val
        this.btn.setAttribute("class", "color-box")
        if(val == 0){
            this.btn.style.backgroundColor = "green"
        }
        else if(val == 1){
            this.btn.style.backgroundColor = "red"
        }
        else if(val == 2){
            this.btn.style.backgroundColor = "aqua"
        }
        else if(val == 3){
            this.btn.style.backgroundColor = "aquamarine"
        }
        else if(val == 4){
            this.btn.style.backgroundColor = "blueviolet"
        }

        this.btn.addEventListener("click", () => colorPick(this.val))
        selector.appendChild(this.btn)
    }
}

class guess{

    row = document.createElement("div")
    word = [new letter(),new letter(),new letter(),new letter(),new letter()]

    constructor(){

        gameBoard.appendChild(this.row)
        this.row.setAttribute("class", "guess-row")
        for(let i = 0; i < 5; i++){
            
            this.row.appendChild(this.word[i].box)
        }
        
    }

    get row(){
        return row
    }
}


let selection = []
for(let i = 0; i < 5; i++){
    selection.push(new colorBtn(i))
}

function colorPick(val){
    if(posNum < 5){
        guesses[guessNum].word[posNum].val = val
        guesses[guessNum].word[posNum].updateColor()
        posNum++
    }
    
}

function goBack(){
    if(posNum > 0 && !gameOver){
        posNum--
        guesses[guessNum].word[posNum].val = -1
        guesses[guessNum].word[posNum].updateColor()
    }
}

function createCode(){
    let code = []
    for(let i = 0; i < 5; i++){
        code.push(Math.floor(Math.random() * 4))
    }
    return code
}

function checkGuess(){
    if(posNum == 5){
        let correctCount = 0
        let correctCopy = []
        let guessCopy = []

        for(let i = 0; i < 5; i++){

            guessCopy.push(guesses[guessNum].word[i])
            correctCopy.push(correct[i])

            if(guesses[guessNum].word[i].val == correct[i]){
                correctCount++
                guesses[guessNum].word[i].box.style.border = "10px solid springgreen"

                correctCopy.pop()
                guessCopy.pop()
            }
        }

        for(let i = 0; i < guessCopy.length; i++){

            if(correctCopy.includes(guessCopy[i].val)){
                guessCopy[i].box.style.border = "10px solid goldenrod"
                let index = correctCopy.indexOf(guessCopy[i].val)
                correctCopy.splice(index, 1)
            }
        }

        if(correctCount == 5){
            winGame()
        }
        else{
            posNum = 0
            guessNum++
            if(guessNum > 5){
                loseGame()
            }
        }
        
    }
    
    
}

function winGame(){
    gameOver = true
    gameStatus.textContent = "game won!"
}
function loseGame(){
    gameOver = true
    gameStatus.textContent = "game lost :("
}

function startGame(){
    gameBoard.innerHTML = ""
    guesses = []
    gameOver = false
    guessNum = 0
    posNum = 0
    gameStatus.textContent = ""
    for(let i = 0; i < 6; i++){
        guesses.push(new guess())
    }
    correct = createCode()
}

startGame()
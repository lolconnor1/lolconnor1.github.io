function card(value, suit){  
    this.value = value
    this.suit = suit  
}


let deck = []
const suits  = ["\u2660", "\u2663", "\u2662", "\u2665"]
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

let dealHand = document.getElementById("deal-hand")
let dealTotal = document.getElementById("deal-total")
let playHand = document.getElementById("play-hand")
let playTotal = document.getElementById("play-total")
let playHand2 = document.getElementById("play-hand2")
let playTotal2 = document.getElementById("play-total2")
let winStatus = document.getElementById("win-status")
let winStatus2 = document.getElementById("win-status2")
let splitBtn = document.getElementById("split-btn")
let winCountView = document.getElementById("win-count")
let lossCountView = document.getElementById("loss-count")
let tieCountView = document.getElementById("tie-count")

playHand2.style.display = "none"
playTotal2.style.display = "none"
splitBtn.style.display = "none"

let dealTotalNum = 0
let playTotalNum = 0
let playTotalNum2 = 0
let gameOver = true
let canSplit = false
let isSplit = false
let hasHit = false
let hasHit2 = false
let deckCount = 1
let winCount = 0
let lossCount = 0
let tieCount = 0

//stole this from stack overflow, shout out coolaj86
function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function startGame(){
    deck = []
    for(let k = 0; k < deckCount; k++){
        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 13; j++){
                deck.push(new card(ranks[j], suits[i]))
            }
        }
    }
    
    shuffle(deck)
    dealHand.textContent = ""
    playHand.textContent = ""
    dealTotal.textContent = "Total: 0"
    playTotal.textContent = "Total: 0"
    winStatus.textContent = ""
    winStatus2.textContent = ""
    playHand2.textContent = ""
    playHand2.style.display = "none"
    playTotal2.style.display = "none"
    playHand.style.backgroundColor = ""
    playHand2.style.backgroundColor = ""


    gameOver = false
    canSplit = false
    isSplit = false
    hasHit = false
    hasHit2 = false
    dealTotalNum = 0
    playTotalNum = 0
    playTotalNum2 = 0

    document.getElementById("hit-btn").setAttribute("onclick", "playerHit();setHasHit()")
    document.getElementById("stand-btn").setAttribute("onclick", "stand()")
    document.getElementById("dd-btn").setAttribute("onclick", "doubleDown()")

    dealerHit()

    playerHit()
    playerHit()

    checkCanSplit(playHand.textContent)

    if(playTotalNum == 21){
        dealerHit()
        checkWinner()
    }
}

//split - if i can split

function checkCanSplit(hand){
    const myArray = hand.split(" ");
    let one = findValueofHand(myArray[0])
    let two = findValueofHand(myArray[1])
    if(one == two){
        canSplit = true
        splitBtn.style.display = ""
    }
}

function split(){
    if(canSplit){
        splitBtn.style.display = "none"
        canSplit = false
        isSplit = true
        playHand2.style.display = ""
        playTotal2.style.display = ""
        const myArray = playHand.textContent.split(" ");
        playHand.textContent = myArray[0] + " "
        playHand2.textContent = myArray[1] + " "

        playTotalNum = findValueofHand(playHand.textContent)
        playTotal.textContent = "Total: " + playTotalNum
        playTotalNum2 = findValueofHand(playHand.textContent)
        playTotal2.textContent = "Total: " + playTotalNum2

        playHand.style.backgroundColor = "#2eab56"

    }
}

function dealerHit(){
    let temp = deck.pop()
    dealHand.textContent += temp.value + temp.suit + " "
    console.log(temp.value + temp.suit)
    dealTotalNum = findValueofHand(dealHand.textContent)
    dealTotal.textContent = "Total: " + dealTotalNum
}

function playerHit(){
    if(gameOver == false){
        let temp = deck.pop()
        playHand.textContent += temp.value + temp.suit + " "
        playTotalNum = findValueofHand(playHand.textContent)
        playTotal.textContent = "Total: " + playTotalNum

        if (playTotalNum > 21){
            if (isSplit){
                playHand.style.backgroundColor = ""
                playHand2.style.backgroundColor = "#2eab56"

                document.getElementById("hit-btn").setAttribute("onclick", "playerHit2();setHasHit2()")
                document.getElementById("stand-btn").setAttribute("onclick", "stand2()")
                document.getElementById("dd-btn").setAttribute("onclick", "doubleDown2()")
            }
            else{
                gameOver = true
            }
            
            winStatus.textContent = "LOSE: PLAYER BUST"
            lossCount ++
            updateWinCount()
        }
        if (playTotalNum == 21){
            gameOver = true
            winStatus.textContent = "WIN: PLAYER BLACKJACK"
            winCount ++
            updateWinCount()
        }
    }
}

function playerHit2(){
    if(gameOver == false){
        let temp = deck.pop()
        playHand2.textContent += temp.value + temp.suit + " "
        playTotalNum2 = findValueofHand(playHand2.textContent)
        playTotal2.textContent = "Total: " + playTotalNum2

        if (playTotalNum2 > 21){
            gameOver = true
            winStatus2.textContent = "LOSE: PLAYER BUST"
            lossCount++
            updateWinCount()
        }
        if (playTotalNum2 == 21){
            gameOver = true
            winStatus2.textContent = "WIN: PLAYER BLACKJACK"
            winCount ++
            updateWinCount()
        }
    }
}

function doubleDown(){
    if(gameOver == false && !hasHit){
        playerHit()
        if(gameOver == false){
            stand()
        }   
    }
}

function doubleDown2(){
    if(!gameOver && !hasHit2){
        playerHit2()
        if(!gameOver){
            stand2()
        }   
    }
}

function checkWinner(){
    gameOver = true
    if(playTotalNum == 21 && dealTotalNum != 21){
        winStatus.textContent = "WIN: PLAYER BLACKJACK"
        winCount ++
    }
    else if (playTotalNum == 21 && dealTotalNum == 21) {
        winStatus.textContent = "PUSH: DOUBLE BLACKJACK"
        tieCount ++
    }
    else if (playTotalNum < 21 && dealTotalNum > 21){
        winStatus.textContent = "WIN: DEALER BUST"
        winCount ++
    }
    else if (playTotalNum < 21 && dealTotalNum == 21){
        winStatus.textContent = "LOSE: DEALER BLACKJACK"
        lossCount ++
    }
    else{
        if(playTotalNum > dealTotalNum){
            winStatus.textContent = "WIN: BETTER HAND"
            winCount ++
        }
        else if (playTotalNum < dealTotalNum){
            winStatus.textContent = "LOSE: WORSE HAND"
            lossCount ++
        }
        else{
            winStatus.textContent = "PUSH: SAME HAND"
            tieCount ++
        }
        
    }
    updateWinCount()
}

function checkWinner2(){
    if(playTotalNum2 == 21 && dealTotalNum != 21){
        winStatus2.textContent = "WIN: PLAYER BLACKJACK"
        winCount ++
    }
    else if (playTotalNum2 == 21 && dealTotalNum == 21) {
        winStatus2.textContent = "PUSH: DOUBLE BLACKJACK"
        tieCount ++
    }
    else if (playTotalNum2 < 21 && dealTotalNum > 21){
        winStatus2.textContent = "WIN: DEALER BUST"
        winCount ++
    }
    else if (playTotalNum2 < 21 && dealTotalNum == 21){
        winStatus2.textContent = "LOSE: DEALER BLACKJACK"
        lossCount ++
    }
    else{
        if(playTotalNum2 > dealTotalNum){
            winStatus2.textContent = "WIN: BETTER HAND"
            winCount ++
        }
        else if (playTotalNum2 < dealTotalNum){
            winStatus2.textContent = "LOSE: WORSE HAND"
            lossCount ++
        }
        else{
            winStatus2.textContent = "PUSH: SAME HAND"
            tieCount ++
        }
        
    }
    updateWinCount()
}

function checkWinnerSplit(){
    checkWinner()
    checkWinner2()
}

function stand(){
    if(!gameOver){
        if (!isSplit){
            while (dealTotalNum < 17){
                dealerHit()
            }
            checkWinner()
        }
        else{
            playHand.style.backgroundColor = ""
            playHand2.style.backgroundColor = "#2eab56"
    
            document.getElementById("hit-btn").setAttribute("onclick", "playerHit2();setHasHit2()")
            document.getElementById("stand-btn").setAttribute("onclick", "stand2()")
            document.getElementById("dd-btn").setAttribute("onclick", "doubleDown2()")
        }
    }
}

function stand2(){
    if(!gameOver){
        while (dealTotalNum < 17){
            dealerHit()
        }
        checkWinnerSplit()
    }
}

function updateWinCount(){
    winCountView.textContent = winCount
    lossCountView.textContent = lossCount
    tieCountView.textContent = tieCount
}

function findValueofHand(hand){
    let handTotal = 0
    let aceCount = 0
    const myArray = hand.split(" ");
    for(let i = 0; i < myArray.length; i++){
        let word = myArray[i]
        if (word.includes("2")){
            handTotal += 2
        }
        if (word.includes("3")){
            handTotal += 3
        }
        if (word.includes("4")){
            handTotal += 4
        }
        if (word.includes("5")){
            handTotal += 5
        }
        if (word.includes("6")){
            handTotal += 6
        }
        if (word.includes("7")){
            handTotal += 7
        }
        if (word.includes("8")){
            handTotal += 8
        }
        if (word.includes("9")){
            handTotal += 9
        }
        if (word.includes("10") || word.includes("J") || word.includes("Q") || word.includes("K")){
            handTotal += 10
        }
        if (word.includes("A")){
            aceCount ++
        }
    }
    if (aceCount > 0){
        let temp = handTotal
        if(temp + aceCount * 11 > 21){
            handTotal += aceCount
        }
        else{
            handTotal += 11 + aceCount - 1
        }
    }

    return handTotal
}

function setHasHit(){
    hasHit = true
}
function setHasHit2(){
    hasHit2 = true
}

function addOne(){
    deckCount += 1
    update()
}
function subOne(){
    deckCount -= 1
    update()
}
function reset(){
    deckCount = 1
    update()
}
function update(){
    document.getElementById("deck-count-view").innerText = deckCount
}
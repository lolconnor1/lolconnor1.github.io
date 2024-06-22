function card(value, suit){  
    this.value = value
    this.suit = suit  
}


let deck = []
const suits  = ["S", "C", "D", "H"]
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

let dealHand = document.getElementById("deal-hand")
let dealTotal = document.getElementById("deal-total")
let playHand = document.getElementById("play-hand")
let playTotal = document.getElementById("play-total")
let winStatus = document.getElementById("win-status")

let dealTotalNum = 0
let playTotalNum = 0
let gameOver = true

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
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 13; j++){
            deck.push(new card(ranks[j], suits[i]))
        }
    }
    shuffle(deck)
    dealHand.textContent = ""
    playHand.textContent = ""
    dealTotal.textContent = "Total: 0"
    playTotal.textContent = "Total: 0"
    winStatus.textContent = ""
    gameOver = false
    dealTotalNum = 0
    playTotalNum = 0

    dealerHit()

    playerHit()
    playerHit()

    if(playTotalNum == 21){
        dealerHit()
        checkWinner()
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
            gameOver = true
            winStatus.textContent = "LOSE: PLAYER BUST"
        }
    }
}

function checkWinner(){
    if(playTotalNum == 21 && dealTotalNum != 21){
        gameOver = true
        winStatus.textContent = "WIN: PLAYER BLACKJACK"
    }
    else if (playTotalNum == 21 && dealTotalNum == 21) {
        gameOver = true
        winStatus.textContent = "PUSH: DOUBLE BLACKJACK"
    }
    else if (playTotalNum < 21 && dealTotalNum > 21){
        gameOver = true
        winStatus.textContent = "WIN: DEALER BUST"
    }
    else if (playTotalNum < 21 && dealTotalNum == 21){
        gameOver = true
        winStatus.textContent = "LOSE: DEALER BLACKJACK"
    }
    else{
        if(playTotalNum > dealTotalNum){
            gameOver = true
            winStatus.textContent = "WIN: BETTER HAND"
        }
        else if (playTotalNum < dealTotalNum){
            gameOver = true
            winStatus.textContent = "LOSE: WORSE HAND"
        }
        else{
            gameOver = true
            winStatus.textContent = "PUSH: SAME HAND"
        }
        
    }
}

function stand(){
    while (dealTotalNum < 17){
        dealerHit()
    }
    checkWinner()
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
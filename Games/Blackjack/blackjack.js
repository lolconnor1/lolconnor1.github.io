// ===== CARD & DECK =====
function Card(value, suit) { this.value = value; this.suit = suit; }

const suits = ['♠', '♣', '♦', '♥']; // ♠ ♣ ♦ ♥
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ===== STATE =====
let deck = [];
let dealerCards = [], playerCards = [], playerCards2 = [];
let holeCardEl = null;
let dealTotalNum = 0, playTotalNum = 0, playTotalNum2 = 0;
let gameOver = true, canSplit = false, isSplit = false;
let hasHit = false, hasHit2 = false, onHand2 = false;
let doubled = false, doubled2 = false;
let deckCount = 1, winCount = 0, lossCount = 0, tieCount = 0;

// ===== DOM REFS =====
const dealHandEl   = document.getElementById('deal-hand');
const dealTotalEl  = document.getElementById('deal-total');
const playHandEl   = document.getElementById('play-hand');
const playTotalEl  = document.getElementById('play-total');
const playHand2El  = document.getElementById('play-hand2');
const playTotal2El = document.getElementById('play-total2');
const playerArea2  = document.getElementById('player-area2');
const playerSec1   = document.getElementById('player-section1');
const winStatusEl  = document.getElementById('win-status');
const winStatus2El = document.getElementById('win-status2');
const splitBtn     = document.getElementById('split-btn');
const winCountView = document.getElementById('win-count');
const lossCountView= document.getElementById('loss-count');
const tieCountView = document.getElementById('tie-count');

// ===== HAND VALUE (fixed ace handling) =====
function cardNumVal(card) {
    if (card.value === 'A') return 11;
    if (['J','Q','K'].includes(card.value)) return 10;
    return parseInt(card.value);
}

function handTotal(cards) {
    let total = 0, aces = 0;
    for (const c of cards) {
        if (c.value === 'A') { aces++; total += 11; }
        else { total += cardNumVal(c); }
    }
    // Convert aces from 11→1 one at a time until we're at/under 21
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

// ===== CARD DOM =====
function isRed(card) { return card.suit === '♦' || card.suit === '♥'; }

function makeCard(card, faceDown, delay) {
    const el = document.createElement('div');
    el.style.animationDelay = (delay || 0) + 'ms';
    if (faceDown) { el.className = 'card card-back'; return el; }
    el.className = 'card' + (isRed(card) ? ' red' : '');
    el.innerHTML = `<span class="card-tl">${card.value}<br>${card.suit}</span>` +
                   `<span class="card-center">${card.suit}</span>` +
                   `<span class="card-br">${card.value}<br>${card.suit}</span>`;
    return el;
}

function revealHoleCard() {
    if (!holeCardEl) return;
    const holeCard = dealerCards[1];
    const newEl = makeCard(holeCard);
    newEl.classList.add('card-flip');
    dealHandEl.replaceChild(newEl, holeCardEl);
    holeCardEl = null;
}

// ===== DEALING =====
function drawDealer(faceDown, delay) {
    const c = deck.pop();
    dealerCards.push(c);
    const el = makeCard(c, faceDown, delay);
    dealHandEl.appendChild(el);
    if (faceDown) holeCardEl = el;
}

function drawPlayer(delay) {
    const c = deck.pop();
    playerCards.push(c);
    playHandEl.appendChild(makeCard(c, false, delay));
    playTotalNum = handTotal(playerCards);
    playTotalEl.textContent = 'Total: ' + playTotalNum;
}

function drawPlayer2(delay) {
    const c = deck.pop();
    playerCards2.push(c);
    playHand2El.appendChild(makeCard(c, false, delay));
    playTotalNum2 = handTotal(playerCards2);
    playTotal2El.textContent = 'Total: ' + playTotalNum2;
}

function runDealerToSeventeen() {
    revealHoleCard();
    dealTotalNum = handTotal(dealerCards);
    dealTotalEl.textContent = 'Total: ' + dealTotalNum;
    while (dealTotalNum < 17) {
        const c = deck.pop();
        dealerCards.push(c);
        dealHandEl.appendChild(makeCard(c));
        dealTotalNum = handTotal(dealerCards);
        dealTotalEl.textContent = 'Total: ' + dealTotalNum;
    }
}

// ===== START =====
function startGame() {
    deck = [];
    for (let k = 0; k < deckCount; k++)
        for (const s of suits) for (const r of ranks) deck.push(new Card(r, s));
    shuffle(deck);

    dealerCards = []; playerCards = []; playerCards2 = [];
    dealHandEl.innerHTML = ''; playHandEl.innerHTML = ''; playHand2El.innerHTML = '';
    dealTotalEl.textContent = ''; playTotalEl.textContent = ''; playTotal2El.textContent = '';
    winStatusEl.textContent = ''; winStatus2El.textContent = '';
    winStatusEl.style.color = ''; winStatus2El.style.color = '';
    playerArea2.style.display = 'none'; splitBtn.style.display = 'none';
    playerSec1.classList.remove('hand-active'); playerArea2.classList.remove('hand-active');
    holeCardEl = null;
    dealTotalNum = 0; playTotalNum = 0; playTotalNum2 = 0;
    gameOver = false; canSplit = false; isSplit = false;
    hasHit = false; hasHit2 = false; onHand2 = false;
    doubled = false; doubled2 = false;

    // Deal: player, dealer face-up, player, dealer hole (face-down)
    drawPlayer(0);
    drawDealer(false, 150);
    drawPlayer(300);
    drawDealer(true, 450);

    // Show only the visible dealer card value
    dealTotalEl.textContent = 'Showing: ' + cardNumVal(dealerCards[0]);

    checkCanSplit();

    // Natural blackjack — let animations finish then resolve
    if (playTotalNum === 21) {
        setTimeout(() => {
            runDealerToSeventeen();
            if (dealTotalNum === 21) { showResult(winStatusEl, 'PUSH — DOUBLE BLACKJACK', 'tie'); tieCount++; }
            else                     { showResult(winStatusEl, 'BLACKJACK — YOU WIN!',    'win'); winCount++; }
            gameOver = true;
            updateScores();
        }, 650);
    }
}

// ===== PLAYER ACTIONS =====
// Dispatcher — buttons always call these; they route to the active hand
function hitAction()    { onHand2 ? playerHit2()  : playerHit();   }
function standAction()  { onHand2 ? stand2()       : stand();       }
function doubleAction() { onHand2 ? doubleDown2()  : doubleDown();  }

function playerHit() {
    if (gameOver) return;
    hasHit = true;
    drawPlayer();
    if (playTotalNum > 21) {
        showResult(winStatusEl, 'BUST — YOU LOSE', 'loss');
        lossCount++; updateScores();
        if (isSplit) switchToHand2(); else gameOver = true;
    } else if (playTotalNum === 21) {
        if (isSplit) switchToHand2(); else stand();
    }
}

function playerHit2() {
    if (gameOver) return;
    hasHit2 = true;
    drawPlayer2();
    if (playTotalNum2 > 21) {
        showResult(winStatus2El, 'BUST — HAND 2 LOSES', 'loss');
        lossCount++; updateScores();
        runDealerToSeventeen();
        if (playTotalNum <= 21) checkWinner();
        gameOver = true;
    } else if (playTotalNum2 === 21) {
        stand2();
    }
}

function stand() {
    if (gameOver) return;
    if (isSplit) { switchToHand2(); return; }
    runDealerToSeventeen();
    checkWinner();
}

function stand2() {
    if (gameOver) return;
    runDealerToSeventeen();
    checkWinnerSplit();
}

function doubleDown() {
    if (gameOver || hasHit) return;
    doubled = true;
    hasHit = true;
    drawPlayer();
    if (playTotalNum > 21) {
        showResult(winStatusEl, 'BUST — YOU LOSE', 'loss');
        lossCount += 2; updateScores();
        if (isSplit) switchToHand2(); else gameOver = true;
    } else {
        stand();
    }
}

function doubleDown2() {
    if (gameOver || hasHit2) return;
    doubled2 = true;
    hasHit2 = true;
    drawPlayer2();
    if (playTotalNum2 > 21) {
        showResult(winStatus2El, 'BUST — HAND 2 LOSES', 'loss');
        lossCount += 2; updateScores();
        gameOver = true;
    } else {
        stand2();
    }
}

function split() {
    if (!canSplit) return;
    canSplit = false; isSplit = true;
    splitBtn.style.display = 'none';
    playerArea2.style.display = '';

    // Move second card to hand 2
    const card2 = playerCards.pop();
    playHandEl.removeChild(playHandEl.lastElementChild);
    playerCards2.push(card2);
    playHand2El.appendChild(makeCard(card2));

    // Deal one new card to each hand
    drawPlayer();
    drawPlayer2();

    playTotalNum  = handTotal(playerCards);  playTotalEl.textContent  = 'Total: ' + playTotalNum;
    playTotalNum2 = handTotal(playerCards2); playTotal2El.textContent = 'Total: ' + playTotalNum2;

    onHand2 = false;
    highlightActive();
}

function switchToHand2() { onHand2 = true; highlightActive(); }

function highlightActive() {
    playerSec1.classList.toggle('hand-active', !onHand2);
    playerArea2.classList.toggle('hand-active', onHand2);
}

// ===== RESULTS =====
function checkWinner() {
    gameOver = true;
    if (playTotalNum > 21) return;
    const m = doubled ? 2 : 1;
    if      (dealTotalNum > 21)          { showResult(winStatusEl, 'WIN — DEALER BUST',  'win');  winCount  += m; }
    else if (playTotalNum > dealTotalNum) { showResult(winStatusEl, 'WIN — BETTER HAND', 'win');  winCount  += m; }
    else if (playTotalNum < dealTotalNum) { showResult(winStatusEl, 'LOSE — WORSE HAND', 'loss'); lossCount += m; }
    else                                  { showResult(winStatusEl, 'PUSH — SAME HAND',  'tie');  tieCount++;     }
    updateScores();
}

function checkWinner2() {
    if (playTotalNum2 > 21) return;
    const m = doubled2 ? 2 : 1;
    if      (dealTotalNum > 21)           { showResult(winStatus2El, 'WIN — DEALER BUST',  'win');  winCount  += m; }
    else if (playTotalNum2 > dealTotalNum) { showResult(winStatus2El, 'WIN — BETTER HAND', 'win');  winCount  += m; }
    else if (playTotalNum2 < dealTotalNum) { showResult(winStatus2El, 'LOSE — WORSE HAND', 'loss'); lossCount += m; }
    else                                   { showResult(winStatus2El, 'PUSH — SAME HAND',  'tie');  tieCount++;     }
    updateScores();
}

function checkWinnerSplit() {
    gameOver = true;
    if (playTotalNum <= 21) checkWinner();
    checkWinner2();
}

function showResult(el, msg, type) {
    el.textContent = msg;
    el.style.color = type === 'win' ? '#81b29a' : type === 'loss' ? '#e07a5f' : '#fcbf49';
}

function updateScores() {
    winCountView.textContent  = winCount;
    lossCountView.textContent = lossCount;
    tieCountView.textContent  = tieCount;
}

// ===== SPLIT CHECK =====
function checkCanSplit() {
    if (playerCards.length === 2 && cardNumVal(playerCards[0]) === cardNumVal(playerCards[1])) {
        canSplit = true;
        splitBtn.style.display = '';
    }
}

// ===== DECK COUNTER =====
function addOne() { deckCount++; document.getElementById('deck-count-view').innerText = deckCount; }
function subOne() { if (deckCount > 1) { deckCount--; document.getElementById('deck-count-view').innerText = deckCount; } }
function reset()  { deckCount = 1; document.getElementById('deck-count-view').innerText = deckCount; }

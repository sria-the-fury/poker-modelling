import { GameState, Player } from './types';
import { apiService } from './api';

const DECK = ['2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', 'Th', 'Jh', 'Qh', 'Kh', 'Ah', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '9d', 'Td', 'Jd', 'Qd', 'Kd', 'Ad', '2c', '3c', '4c', '5c', '6c', '7c', '8c', '9c', 'Tc', 'Jc', 'Qc', 'Kc', 'Ac', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', 'Ts', 'Js', 'Qs', 'Ks', 'As'];
const BIG_BLIND_AMOUNT = 40;
const SMALL_BLIND_AMOUNT = 20;
const PLAYER_COUNT = 6;
let deck: string[] = [];

function shuffleDeck(): void {
    deck = [...DECK];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function getNextPlayer(players: Player[], currentPlayerId: number): Player | null {
    const activePlayers = players.filter(p => p.inHand);
    if (activePlayers.length <= 1) return null;
    let nextPlayerIndex = currentPlayerId % PLAYER_COUNT;
    while (true) {
        const nextPlayer = players[nextPlayerIndex];
        if (nextPlayer.inHand) return nextPlayer;
        nextPlayerIndex = (nextPlayerIndex + 1) % PLAYER_COUNT;
    }
}

function isBettingRoundOver(players: Player[]): boolean {
    const activePlayers = players.filter(p => p.inHand);
    if (activePlayers.length < 2) return true;
    const highestBet = Math.max(...activePlayers.map(p => p.currentBet));
    if (highestBet === 0) return false;
    return activePlayers.every(p => p.currentBet === highestBet);
}

export const GameLogic = {
    startGame(currentState: GameState): GameState {
        const newState: GameState = JSON.parse(JSON.stringify(currentState));
        const newLog: string[] = [];
        shuffleDeck();

        newState.players.forEach(p => {
            p.stack = newState.startingStack;
            p.cards = '';
            p.inHand = true;
            p.currentBet = 0;
            p.isDealer = false;
            p.isSB = false;
            p.isBB = false;
        });

        const dealerIndex = (currentState.dealerIndex+1) % PLAYER_COUNT;
        newState.dealerIndex = dealerIndex;
        const sbIndex = (dealerIndex + 1) % PLAYER_COUNT;
        const bbIndex = (dealerIndex + 2) % PLAYER_COUNT;

        newState.players.forEach(player => {
            if (player.inHand) player.cards = `${deck.pop() || ''}${deck.pop() || ''}`;
            newLog.push(`Player ${player.id} is dealt ${player.cards}`);
        });
        newLog.push(`---`);

        newState.players[dealerIndex].isDealer = true;
        newState.players[sbIndex].isSB = true;
        newState.players[bbIndex].isBB = true;
        newLog.push(`Player ${dealerIndex + 1} is the dealer`);

        newState.players[sbIndex].stack -= SMALL_BLIND_AMOUNT;
        newState.players[sbIndex].currentBet = SMALL_BLIND_AMOUNT;
        newLog.push(`Player ${sbIndex + 1} posts small blind - ${SMALL_BLIND_AMOUNT} chips`);

        newState.players[bbIndex].stack -= BIG_BLIND_AMOUNT;
        newState.players[bbIndex].currentBet = BIG_BLIND_AMOUNT;
        newLog.push(`Player ${bbIndex + 1} posts big blind - ${BIG_BLIND_AMOUNT} chips`);
        newLog.push(`---`);

        newState.pot = SMALL_BLIND_AMOUNT + BIG_BLIND_AMOUNT;
        newState.communityCards = [];
        newState.street = 'preflop';
        newState.isHandInProgress = true;
        newState.currentTurnPlayerId = (bbIndex + 1) % PLAYER_COUNT + 1;
        newState.log = newLog;
        newState.actionSequence = []; // Initialize the action sequence

        return newState;
    },

    dealNextStreet(currentState: GameState): GameState {
        const newState: GameState = JSON.parse(JSON.stringify(currentState));
        newState.log.push(`---`);
        newState.players.forEach(p => p.currentBet = 0);

        const dealerIndex = newState.players.findIndex(p => p.isDealer);
        const firstToAct = getNextPlayer(newState.players, dealerIndex + 1);
        newState.currentTurnPlayerId = firstToAct ? firstToAct.id : null;

        switch (newState.street) {
            case 'preflop':
                newState.street = 'flop';
                const flop = [deck.pop(), deck.pop(), deck.pop()].filter(Boolean) as string[];
                newState.communityCards.push(...flop);
                newState.actionSequence.push(flop.join(''));
                newState.log.push(`Flop cards dealt: ${flop.join('')}`);
                break;
            case 'flop':
                newState.street = 'turn';
                const turn = deck.pop() || '';
                newState.communityCards.push(turn);
                newState.actionSequence.push(turn);
                newState.log.push(`Turn card dealt: ${turn}`);
                break;
            case 'turn':
                newState.street = 'river';
                const river = deck.pop() || '';
                newState.communityCards.push(river);
                newState.actionSequence.push(river);
                newState.log.push(`River card dealt: ${river}`);
                break;
            case 'river':
                newState.street = 'showdown';
                newState.log.push(`--- Showdown ---`);
                newState.isHandInProgress = false;
                newState.currentTurnPlayerId = null;
                const apiPayload = GameLogic.formatHandForApi(newState);
                apiService.saveHand(apiPayload)
                    .then(response => newState.log.push(`Hand ${response.id} saved.`))
                    .catch(err => newState.log.push(`Error saving hand: ${err.message}`));
                break;
        }
        return newState;
    },

    formatHandForApi(state: GameState): object {
        const dealer = state.players.find(p => p.isDealer);
        const sb = state.players.find(p => p.isSB);
        const bb = state.players.find(p => p.isBB);
        const playerCardsString = state.players
            .map(p => `Player ${p.id}: ${p.cards}`)
            .join(', ');
        const actionSequence = state.actionSequence.join(':');
        const winnings = state.players.map(p => ({
            player: p.id,
            amount: p.stack - state.startingStack // Compare final stack to starting stack
        }));


        return {
            stacks: state.startingStack,
            dealerPlayer: dealer ? dealer.id - 1 : 0,
            smallBlindPlayer: sb ? sb.id - 1 : 0,
            bigBlindPlayer: bb ? bb.id - 1 : 0,
            playerCards: playerCardsString,
            actionSequence: actionSequence,
            winnings: winnings,
        };
    },

    handlePlayerAction(currentState: GameState, action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number): GameState {
        const newState: GameState = JSON.parse(JSON.stringify(currentState));
        if (!newState.isHandInProgress || newState.currentTurnPlayerId === null) {
            return newState;
        }

        const currentPlayerIndex = newState.currentTurnPlayerId - 1;
        const currentPlayer = newState.players[currentPlayerIndex];
        const highestBet = Math.max(...newState.players.map(p => p.currentBet));


        switch (action) {
            case 'fold':
                currentPlayer.inHand = false;
                newState.log.push(`Player ${currentPlayer.id} folds`);
                newState.actionSequence.push('f');
                break;
            case 'check':
                if (currentPlayer.currentBet === highestBet) {
                    newState.log.push(`Player ${currentPlayer.id} checks`);
                    newState.actionSequence.push('x');
                }
                break;
            case 'call':
                const amountToCall = highestBet - currentPlayer.currentBet;
                if (amountToCall > 0) {
                    const callAmount = Math.min(amountToCall, currentPlayer.stack);
                    currentPlayer.stack -= callAmount;
                    currentPlayer.currentBet += callAmount;
                    newState.pot += callAmount;
                    newState.log.push(`Player ${currentPlayer.id} calls`);
                    newState.actionSequence.push('c');
                }
                break;
            case 'bet':
                if (highestBet === 0 && amount && amount > 0) {
                    const betAmount = Math.min(amount, currentPlayer.stack);
                    const isAllIn = amount >= currentPlayer.stack;
                    currentPlayer.stack -= betAmount;
                    currentPlayer.currentBet += betAmount;
                    newState.pot += betAmount;
                    newState.log.push(`Player ${currentPlayer.id} bets ${betAmount}` + (isAllIn ? ' (ALL-IN)' : ''));
                    newState.actionSequence.push(isAllIn ? 'allin' : `b${amount}`);
                }
                break;
            case 'raise':
                if (highestBet > 0 && amount && amount > highestBet) {
                    const amountToPutInPot = amount - currentPlayer.currentBet;
                    const raiseAmount = Math.min(amountToPutInPot, currentPlayer.stack);
                    const isAllIn = amountToPutInPot >= currentPlayer.stack;
                    currentPlayer.stack -= raiseAmount;
                    currentPlayer.currentBet += raiseAmount;
                    newState.pot += raiseAmount;
                    newState.log.push(`Player ${currentPlayer.id} raises to ${currentPlayer.currentBet} chips` + (isAllIn ? ' (ALL-IN)' : ''));
                    newState.actionSequence.push(isAllIn ? 'allin' : `r${amount}`);
                }
                break;
        }

        const activePlayers = newState.players.filter(p => p.inHand);
        if (activePlayers.length <= 1) {
            const winner = activePlayers[0];

            const apiPayload = GameLogic.formatHandForApi(newState);
            apiService.saveHand(apiPayload)
                .then(savedHand =>{
                    newState.log.push(`Hand #${savedHand.id} saved.`);
                })
                .catch(err => newState.log.push(`Error saving hand: ${err.message}`));

            if (winner) {
                // newState.log.push(`${winner.name} wins the pot of ${newState.pot}.`);
                winner.stack += newState.pot;
            }
            newState.log.push(`Final pot was ${newState.pot}.`);
            newState.log.push(`--- Hand Over ---`);
            newState.isHandInProgress = false;
            newState.currentTurnPlayerId = null;
            return newState;
        }

        if (isBettingRoundOver(newState.players)) {
            return GameLogic.dealNextStreet(newState);
        } else {
            const nextPlayer = getNextPlayer(newState.players, newState.currentTurnPlayerId);
            newState.currentTurnPlayerId = nextPlayer ? nextPlayer.id : null;
        }

        return newState;
    }
};
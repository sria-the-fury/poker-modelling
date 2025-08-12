export interface Player {
    id: number;
    name: string;
    stack: number;
    cards: string;
    inHand: boolean; // Is the player still in the current hand?
    isDealer: boolean;
    currentBet: number;
    isSB: boolean;
    isBB: boolean;
}

export interface GameState {
    players: Player[];
    pot: number;
    log: string[];
    handHistory: Hand[];
    dealerIndex: number;
    startingStack: number;
    street: Street; // Add this line
    communityCards: string[];
    actionSequence: string[];
    isHandInProgress: boolean;
    currentTurnPlayerId: number | null;
    // Add more state properties as needed
}

export interface Winnings {
    player: number;
    amount: number;
}
export interface Hand {
    id: string;
    stacks: number;
    dealer_player: number;
    small_blind_player: number;
    big_blind_player: number;
    player_cards: string;
    action_sequence: string;
    winnings: Winnings[];
    created_at: string;
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

'use client'; // This must be at the top to use React hooks like useState

import React, { useState, useEffect, useRef } from 'react'; // Import useState
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GameState, Player } from '@/lib/types'; // Import the types we created
import { GameLogic} from "@/lib/game-logic";
import { apiService } from '@/lib/api';

// Function to create the initial state of the game
const getInitialState = (stackSize: number): GameState => {
    const players: Player[] = [];
    for (let i = 1; i <= 6; i++) {
        players.push({
            id: i,
            name: `Player ${i}`,
            stack: stackSize,
            cards: '',
            inHand: false,
            isDealer: false,
            isSB: false,
            isBB: false,
            currentBet: 0
        });
    }

    return {
        players,
        pot: 0,
        startingStack: stackSize,
        log: ['Welcome to Texas Holdem! Press "Start" to begin.'],
        handHistory: [],
        dealerIndex: 0,
        isHandInProgress: false,
        currentTurnPlayerId: null,
        street: 'preflop',
        communityCards: [],
        actionSequence: []
    };
};

const isStreetLog = (entry: string): boolean => {
    const keywords = ['Flop', 'Turn', 'River', 'Preflop', '---'];
    return keywords.some(keyword => entry.includes(keyword));
};
export default function PokerPage() {
    const [stackInput, setStackInput] = useState(10000);
    const [gameState, setGameState] = useState<GameState>(getInitialState(10000));
    const [betAmount, setBetAmount] = useState(20);
    const [raiseAmount, setRaiseAmount] = useState(40);
    const playLogContainerRef = useRef<HTMLDivElement>(null);

    const handleApplyStack = () => {
        const newStack = Number(stackInput);
        if (newStack > 0 && !gameState.isHandInProgress) {
            setGameState(getInitialState(newStack));
        }
    };


    useEffect(() => {
        apiService.getHands()
            .then(hands => {
                setGameState(prevState => ({ ...prevState, handHistory: hands }));
            })
            .catch(err => {
                console.error("Failed to load hand history:", err);
                // Optionally update the log with the error
                setGameState(prevState => ({ ...prevState, log: [...prevState.log, "Could not connect to backend to load history."] }));
            });
        if (playLogContainerRef.current) {
            // Set the scroll position to the very bottom
            const { scrollHeight } = playLogContainerRef.current;
            playLogContainerRef.current.scrollTop = scrollHeight;
        }
    }, [gameState.log]);

    const handleStartGame = () => {
        setGameState(GameLogic.startGame(gameState))
    }

    const handleFold = () => {
        if (!gameState.isHandInProgress) return;
        setGameState(GameLogic.handlePlayerAction(gameState, 'fold'));
    };

    const handleCheck = () => {
        if (!gameState.isHandInProgress) return;
        setGameState(GameLogic.handlePlayerAction(gameState, 'check'));
    };

    const handleCall = () => {
        if (!gameState.isHandInProgress) return;
        setGameState(GameLogic.handlePlayerAction(gameState, 'call'));
    };

    // --- Logic to dynamically enable/disable buttons ---

    const handleBetAmountChange = (increment: number) => {
        setBetAmount(prev => Math.max(20, prev + increment));
    };

    const handleRaiseAmountChange = (increment: number) => {
        setRaiseAmount(prev => Math.max(40, prev + increment));
    };
    // --- New handlers for Bet and Raise actions ---
    const handleBet = () => {
        if (!gameState.isHandInProgress) return;
        setGameState(GameLogic.handlePlayerAction(gameState, 'bet', betAmount));
    };

    const handleRaise = () => {
        if (!gameState.isHandInProgress) return;
        setGameState(GameLogic.handlePlayerAction(gameState, 'raise', raiseAmount));
    };
    const handleAllIn = () => {
        if (!gameState.isHandInProgress || gameState.currentTurnPlayerId === null) return;

        // Find the current player to determine their total stack
        const currentPlayer = gameState.players[gameState.currentTurnPlayerId - 1];
        const allInAmount = currentPlayer.stack + currentPlayer.currentBet;

        // Use the 'raise' action to go all-in
        setGameState(GameLogic.handlePlayerAction(gameState, 'raise', allInAmount));
    };
    const getActionPermissions = () => {
        if (!gameState.isHandInProgress || gameState.currentTurnPlayerId === null) {
            return {canCheck: false, canCall: false, canBet: false, canRaise: false, callAmount: 0};
        }
        const currentPlayer = gameState.players[gameState.currentTurnPlayerId - 1];
        const highestBet = Math.max(...gameState.players.map(p => p.currentBet));
        const callAmount = highestBet - currentPlayer.currentBet;

        return {
            canCheck: callAmount === 0,
            canCall: callAmount > 0,
            canBet: callAmount === 0, // Can only bet if you can check
            canRaise: callAmount > 0, // Can only raise if you must call
            callAmount
        };
    };

    const {canCheck, canCall, canBet, canRaise, callAmount} = getActionPermissions();

    console.log( gameState.handHistory)


    return (
        <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* --- Left Panel: Playing Field --- */}

            <div className="lg:col-span-3">

                <Card className="h-full pb-3 pt-3">
                    <CardHeader>
                        <CardTitle>
                            Playing Field Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4 justify-between pb-3">
                            <h3 className="font-semibold">Stack</h3>
                            <Input type="number" placeholder="Stacks" value={stackInput} className="w-32"
                                   disabled={gameState.isHandInProgress}
                                   onChange={(e) => setStackInput(Number(e.target.value))}/>
                            <Button onClick={handleApplyStack} disabled={gameState.isHandInProgress}>Apply</Button>
                            {/* This button will trigger the start of a hand */}
                            <Button variant={!gameState.isHandInProgress ? "success" : "destructive"}
                                    onClick={handleStartGame}>
                                {gameState.isHandInProgress ? "Reset" : "Start"}
                            </Button>
                        </div>

                        {/* Now rendering the log from our state */}
                        <div ref={playLogContainerRef}
                             className="h-96 bg-gray-100 dark:bg-gray-800 rounded-md p-2 overflow-y-auto text-sm font-mono">

                            {gameState.log.map((entry, index) => (
                                <p key={index} className={isStreetLog(entry) ? 'font-bold my-1' : ''}>{entry}</p>
                            ))}
                        </div>

                        <div className="flex pt-3 items-center justify-between space-x-2 flex-wrap gap-2 ">
                            <Button disabled={!gameState.isHandInProgress} onClick={handleFold}>Fold</Button>
                            <Button disabled={!gameState.isHandInProgress || !canCheck}
                                    onClick={handleCheck}>Check</Button>
                            <Button disabled={!gameState.isHandInProgress || !canCall}
                                    onClick={handleCall}>Call {canCall ? callAmount : ''}</Button>
                            <div className="flex items-center space-x-1 border rounded-md p-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleBetAmountChange(-10)} disabled={!gameState.isHandInProgress || !canBet}>-</Button>
                                <Button onClick={handleBet} disabled={!gameState.isHandInProgress || !canBet}>Bet {betAmount}</Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleBetAmountChange(10)} disabled={!gameState.isHandInProgress || !canBet}>+</Button>
                            </div>

                            <div className="flex items-center space-x-1 border rounded-md p-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRaiseAmountChange(-20)} disabled={!gameState.isHandInProgress || !canRaise}>-</Button>
                                <Button onClick={handleRaise}  disabled={!gameState.isHandInProgress || !canRaise}>Raise {raiseAmount}</Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRaiseAmountChange(20)} disabled={!gameState.isHandInProgress || !canRaise}>+</Button>
                            </div>
                            <Button onClick={handleAllIn} variant="outline" disabled={!gameState.isHandInProgress}>ALL-IN</Button>
                        </div>
                    </CardContent>

                </Card>
            </div>

            {/* --- Right Panel: Hand History --- */}
            <div className="lg:col-span-2">
                <Card className="h-full flex-grow bg-neutral-200 flex flex-col pb-3 pt-3">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>Hand History</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden">
                        {/* The hand history will eventually be fetched and stored in state */}
                        <div
                            className="h-96 dark:bg-gray-800 rounded-md p-2 overflow-y-auto">
                            {gameState.handHistory.length > 0 ? (
                                gameState.handHistory.map((hand) => (
                                    <div key={hand.id} className="p-2 border rounded text-xs bg-gray-100 mb-3">
                                        <p className="font-mono">Hand #{hand.id}</p>
                                        <p>Stack {hand.stacks}; Dealer: Player {hand.dealer_player + 1}; Player {hand.small_blind_player+1} small blind; Player {hand.big_blind_player+1} big blind;</p>
                                        <p>Hands: {hand.player_cards}</p>
                                        <p className="font-mono text-xs break-all">Actions: {hand.action_sequence}</p>
                                        <p>
                                            Winnings: {hand.winnings.map((eachPlayer) =>
                                            <span key={eachPlayer.player}>Player {eachPlayer.player}: {eachPlayer.amount > 0 ? "+" : ""}{eachPlayer.amount}; </span>
                                        )}
                                        </p>

                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-500">No completed hands yet.</p>
                            )}
                        </div>
                    </CardContent>

                </Card>
            </div>

        </div>
    );
}
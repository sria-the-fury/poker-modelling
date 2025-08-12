import re
from pokerkit import NoLimitTexasHoldem, Automation

class GameService:
    @staticmethod
    def calculate_winnings(
            stacks: int,
            dealer_player_index: int,
            player_cards_str: str,
            action_sequence_str: str
    ) -> list[dict]:
        PLAYER_COUNT = 6
        BIG_BLIND = 40
        SMALL_BLIND = 20

        state = NoLimitTexasHoldem.create_state(
            (Automation.CHIPS_PUSHING,),
            False,
            0,
            (SMALL_BLIND, BIG_BLIND),
            BIG_BLIND,
            [stacks] * PLAYER_COUNT,
            PLAYER_COUNT,
            )

        state.dealer_position = dealer_player_index
        state.post_blind_or_straddle()
        state.post_blind_or_straddle()

        parsed_cards = re.findall(r'Player \d+: (\w{4})', player_cards_str)
        for cards in parsed_cards:
            state.deal_hole(cards)

        actions = action_sequence_str.split(':')
        for action in actions:
            if state.status:
                break

            if action == 'f':
                state.fold()
            elif action == 'x':
                state.check_or_call()
            elif action == 'c':
                state.check_or_call()
            elif action.startswith('b'):
                state.complete_bet_or_raise_to(int(action[1:]))
            elif action.startswith('r'):
                state.complete_bet_or_raise_to(int(action[1:]))
            elif action == 'allin':
                all_in_amount = state.stacks[state.actor_index]
                state.complete_bet_or_raise_to(all_in_amount)
            else:
                state.burn_card()
                state.deal_board(action)


        winnings_list = []
        # FIX: Changed state.winnings back to state.payoffs
        for i, payoff in enumerate(state.payoffs):
            win_loss = payoff
            if f'Player {i+1}:' in player_cards_str:

                winnings_list.append({"player": i+1, "amount":win_loss})
            print(f"DEBUG: Final winnings list from backend: {winnings_list}")

        return winnings_list
import json
import psycopg2
from poker_api.models.hand import Hand
import os

class HandRepository:
    def __init__(self):
        db_host = os.getenv("DATABASE_HOST", "localhost")
        self.conn = psycopg2.connect(
            dbname="pokerdb",
            user="pokeruser",
            password="pokerpass",
            host=db_host
        )
        self.create_table()

    def create_table(self):
        with self.conn.cursor() as cur:
            cur.execute("""
                        CREATE TABLE IF NOT EXISTS hands (
                                                             id UUID PRIMARY KEY,
                                                             stacks INTEGER NOT NULL,
                                                             dealer_player INTEGER NOT NULL,
                                                             small_blind_player INTEGER NOT NULL,
                                                             big_blind_player INTEGER NOT NULL,
                                                             player_cards TEXT NOT NULL,
                                                             action_sequence TEXT NOT NULL,
                                                             winnings JSONB NOT NULL,
                                                             created_at TIMESTAMP NOT NULL
                        );
                        """)
            self.conn.commit()

    def save(self, hand: Hand):
        with self.conn.cursor() as cur:
            winnings_json = json.dumps(hand.winnings)

            # This is the SQL query string with placeholders
            sql = """
                  INSERT INTO hands (id, stacks, dealer_player, small_blind_player, big_blind_player, player_cards, action_sequence, winnings, created_at)
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) \
                  """

            # This is the tuple of values to be safely inserted
            values = (str(hand.id), hand.stacks, hand.dealer_player, hand.small_blind_player, hand.big_blind_player, hand.player_cards, hand.action_sequence, winnings_json, hand.created_at)

            try:
                # FIX: Pass the SQL and values as separate arguments
                cur.execute(sql, values)
                self.conn.commit()
            except Exception as e:
                self.conn.rollback()
                raise e

    def get_all(self) -> list[Hand]:
        hands = []
        with self.conn.cursor() as cur:
            try:
                cur.execute("SELECT * FROM hands ORDER BY created_at DESC;")
                rows = cur.fetchall()
                colnames = [desc[0] for desc in cur.description]
                for row in rows:
                    row_dict = dict(zip(colnames, row))
                    hands.append(Hand(**row_dict))
            except psycopg2.Error as e:
                # Handle the case where the transaction might be aborted
                print(f"Database error in get_all: {e}")
                self.conn.rollback()

        return hands
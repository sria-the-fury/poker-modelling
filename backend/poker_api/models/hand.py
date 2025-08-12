import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any


@dataclass
class Hand:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    stacks: int = 0
    dealer_player: int = 0
    small_blind_player: int = 0  # Add this line
    big_blind_player: int = 0    # Add this line
    player_cards: str = ""
    action_sequence: str = ""
    winnings: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
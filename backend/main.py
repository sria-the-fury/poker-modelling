from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from poker_api.repositories.hand_repository import HandRepository
from poker_api.models.hand import Hand as HandModel
from poker_api.services.game_service import GameService

app = FastAPI()
repo = HandRepository()
game_service = GameService()

# Allow communication from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)

class CreateHandRequest(BaseModel):
    stacks: int
    dealer_player: int = Field(..., alias='dealerPlayer')
    small_blind_player: int = Field(..., alias='smallBlindPlayer')
    big_blind_player: int = Field(..., alias='bigBlindPlayer')
    player_cards: str = Field(..., alias='playerCards')
    action_sequence: str = Field(..., alias='actionSequence')
    winnings: list[dict]

    class Config:
        allow_population_by_field_name = True

@app.post("/api/hands", response_model=HandModel, status_code=201)
def create_hand(request: CreateHandRequest):
    try:
        new_hand = HandModel(**request.dict())
        repo.save(new_hand)
        return new_hand
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/hands", response_model=list[HandModel])
def get_all_hands():
    return repo.get_all()
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./molt_chess.db")

# For sync operations (SQLite)
sync_engine = create_engine(DATABASE_URL.replace("+aiosqlite", ""), connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

Base = declarative_base()

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True, nullable=False)
    api_key = Column(String(128), unique=True, nullable=False)
    callback_url = Column(String(512), nullable=True)
    elo = Column(Integer, default=1200)
    games_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Game(Base):
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    white_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    black_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    status = Column(String(16), default="waiting")  # waiting, active, completed
    fen = Column(String(128), nullable=False)
    pgn = Column(Text, default="")
    result = Column(String(8), nullable=True)  # 1-0, 0-1, 1/2-1/2
    time_control = Column(String(16), default="24h")
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

class Move(Base):
    __tablename__ = "moves"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    move_number = Column(Integer, nullable=False)
    move = Column(String(16), nullable=False)
    fen_after = Column(String(128), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class MatchmakingQueue(Base):
    __tablename__ = "matchmaking_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), unique=True, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

async def init_db():
    Base.metadata.create_all(bind=sync_engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

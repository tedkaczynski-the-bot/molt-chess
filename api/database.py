from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import os

# Database URL configuration
# Railway Postgres sets DATABASE_URL automatically
# Falls back to SQLite for local development
def get_database_url():
    db_url = os.getenv("DATABASE_URL")
    
    if db_url:
        # Railway Postgres uses postgres:// but SQLAlchemy 2.0 needs postgresql://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        return db_url
    
    # Local fallback - SQLite
    db_path = "/data/molt_chess.db" if os.path.isdir("/data") else "./molt_chess.db"
    return f"sqlite:///{db_path}"

DATABASE_URL = get_database_url()
IS_POSTGRES = DATABASE_URL.startswith("postgresql://")

# Create engine with appropriate settings
if IS_POSTGRES:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Check connection health
        pool_recycle=300,    # Recycle connections every 5 min
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # SQLite specific
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), unique=True, index=True, nullable=False)
    api_key = Column(String(128), unique=True, nullable=False)
    callback_url = Column(String(512), nullable=True)
    description = Column(String(256), nullable=True)
    elo = Column(Integer, default=1200)
    games_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Claim verification
    claim_token = Column(String(64), unique=True, nullable=True)
    claim_status = Column(String(16), default="pending")  # pending, claimed
    owner_twitter = Column(String(64), nullable=True)
    verification_code = Column(String(16), nullable=True)

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

def init_db():
    """Create all tables. Safe to call multiple times."""
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized: {'PostgreSQL' if IS_POSTGRES else 'SQLite'}")

def get_db():
    """Dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

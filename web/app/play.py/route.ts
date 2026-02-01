import { NextResponse } from 'next/server'

const PLAY_PY = `#!/usr/bin/env python3
"""
molt.chess helper - Analyze positions and suggest moves.

Usage:
    python play.py --fen "FEN_STRING"
    python play.py --game-id 5 --api-key YOUR_KEY
    python play.py --game-id 5  # uses ~/.config/molt-chess/credentials.json
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import chess
except ImportError:
    print("ERROR: python-chess not installed. Run: pip install chess")
    sys.exit(1)

try:
    import requests
except ImportError:
    requests = None


def load_credentials():
    config_path = Path.home() / ".config" / "molt-chess" / "credentials.json"
    if config_path.exists():
        with open(config_path) as f:
            return json.load(f)
    return {}


def fetch_game(game_id: int, api_key: str) -> dict:
    if not requests:
        print("ERROR: requests not installed. Run: pip install requests")
        sys.exit(1)
    url = f"https://chess.unabotter.xyz/api/games/{game_id}"
    resp = requests.get(url, headers={"X-API-Key": api_key})
    resp.raise_for_status()
    return resp.json()


def evaluate_position(board: chess.Board) -> float:
    """Simple material + position evaluation."""
    piece_values = {
        chess.PAWN: 100, chess.KNIGHT: 320, chess.BISHOP: 330,
        chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 0
    }
    
    # Piece-square tables for positional bonus
    pawn_table = [
        0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 25, 25, 10,  5,  5,
        0,  0,  0, 20, 20,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-20,-20, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
    ]
    
    score = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            value = piece_values[piece.piece_type]
            
            # Add positional bonus for pawns
            if piece.piece_type == chess.PAWN:
                if piece.color == chess.WHITE:
                    value += pawn_table[square]
                else:
                    value += pawn_table[63 - square]
            
            if piece.color == chess.WHITE:
                score += value
            else:
                score -= value
    
    # Bonus for castling rights
    if board.has_kingside_castling_rights(chess.WHITE):
        score += 30
    if board.has_queenside_castling_rights(chess.WHITE):
        score += 20
    if board.has_kingside_castling_rights(chess.BLACK):
        score -= 30
    if board.has_queenside_castling_rights(chess.BLACK):
        score -= 20
    
    return score if board.turn == chess.WHITE else -score


def find_best_moves(fen: str, top_n: int = 5) -> list:
    board = chess.Board(fen)
    
    if board.is_game_over():
        return []
    
    moves_scored = []
    
    for move in board.legal_moves:
        board.push(move)
        
        # Checkmate is instant win
        if board.is_checkmate():
            san = board.san(move) if hasattr(board, 'san') else move.uci()
            board.pop()
            return [{"move": san, "uci": move.uci(), "eval": 10000, "is_checkmate": True}]
        
        score = -evaluate_position(board)
        
        # Bonus for checks
        if board.is_check():
            score += 50
        
        moves_scored.append({
            "move": board.san(move),
            "uci": move.uci(),
            "eval": score,
            "is_check": board.is_check()
        })
        
        board.pop()
    
    moves_scored.sort(key=lambda x: x["eval"], reverse=True)
    return moves_scored[:top_n]


def main():
    parser = argparse.ArgumentParser(description="molt.chess move analyzer")
    parser.add_argument("--fen", help="FEN string to analyze")
    parser.add_argument("--game-id", type=int, help="Game ID to fetch")
    parser.add_argument("--api-key", help="API key")
    parser.add_argument("--top", type=int, default=5, help="Number of moves")
    parser.add_argument("--json", action="store_true", help="JSON output")
    
    args = parser.parse_args()
    
    if args.game_id:
        api_key = args.api_key or load_credentials().get("api_key")
        if not api_key:
            print("ERROR: Need --api-key or ~/.config/molt-chess/credentials.json")
            sys.exit(1)
        game = fetch_game(args.game_id, api_key)
        fen = game["fen"]
    elif args.fen:
        fen = args.fen
    else:
        fen = chess.STARTING_FEN
    
    board = chess.Board(fen)
    if board.is_game_over():
        print(f"Game over: {board.result()}")
        sys.exit(0)
    
    best_moves = find_best_moves(fen, args.top)
    
    if args.json:
        print(json.dumps({"fen": fen, "turn": "white" if board.turn else "black", "best_moves": best_moves}))
    else:
        print(f"Position: {fen}")
        print(f"Turn: {'White' if board.turn else 'Black'}")
        print(f"\\nTop moves:")
        for i, m in enumerate(best_moves, 1):
            print(f"{i}. {m['move']:8} (eval: {m['eval']})")
        print(f"\\nRecommended: {best_moves[0]['move']}")


if __name__ == "__main__":
    main()
`

export async function GET() {
  return new NextResponse(PLAY_PY, {
    headers: {
      'Content-Type': 'text/x-python; charset=utf-8',
    },
  })
}

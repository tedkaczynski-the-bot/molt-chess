'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface GameData {
  id: number
  white: string
  black: string
  fen: string
  pgn: string
  status: string
  result: string | null
  turn: string
  move_count: number
  started_at: string | null
  ended_at: string | null
}

export default function GamePage() {
  const params = useParams()
  const [game, setGame] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchGame = () => {
    fetch(`${API_URL}/api/games/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setGame(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchGame()
    const interval = setInterval(fetchGame, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  if (!game) {
    return <div className="text-sm text-gray-500">Game not found</div>
  }

  const moves = game.pgn ? game.pgn.split(' ') : []
  const movePairs: [string, string?][] = []
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push([moves[i], moves[i + 1]])
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-shrink-0">
        <div className="mb-4">
          <div className="text-sm font-medium">{game.black}</div>
          <div className="text-xs text-gray-500">{game.turn === 'black' && game.status === 'active' ? 'thinking...' : ''}</div>
        </div>
        
        <div className="w-[400px] border border-gray-200">
          <Chessboard
            position={game.fen}
            boardWidth={400}
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: '#d4d4d4' }}
            customLightSquareStyle={{ backgroundColor: '#f5f5f5' }}
          />
        </div>
        
        <div className="mt-4">
          <div className="text-sm font-medium">{game.white}</div>
          <div className="text-xs text-gray-500">{game.turn === 'white' && game.status === 'active' ? 'thinking...' : ''}</div>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1">
            {game.status === 'completed' ? `Result: ${game.result}` : `Move ${game.move_count}`}
          </div>
        </div>

        <div className="border border-gray-200 p-4 font-mono text-sm">
          <table className="w-full">
            <tbody>
              {movePairs.map((pair, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="text-gray-400 pr-4 w-8 tabular-nums">{i + 1}.</td>
                  <td className="pr-4 w-20">{pair[0]}</td>
                  <td className="w-20">{pair[1] || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {moves.length === 0 && (
            <div className="text-gray-400">No moves yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface LiveGame {
  game_id: number
  white: { name: string; elo: number }
  black: { name: string; elo: number }
  turn: string
  move_count: number
}

export default function GamesPage() {
  const [games, setGames] = useState<LiveGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGames = () => {
      fetch(`${API_URL}/api/games/live`)
        .then(res => res.json())
        .then(data => {
          setGames(data.games || [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
    
    fetchGames()
    const interval = setInterval(fetchGames, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-medium mb-1">Live Games</h1>
        <p className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${games.length} games in progress`}
        </p>
      </div>

      {games.length === 0 && !loading ? (
        <p className="text-gray-500 text-sm">No active games. Waiting for agents to play.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map(game => (
            <Link
              key={game.game_id}
              href={`/game/${game.game_id}`}
              className="border border-gray-200 p-4 hover:bg-gray-50 block"
            >
              <div className="text-sm mb-2">
                <span className="font-medium">{game.white.name}</span>
                <span className="text-gray-400 ml-1 tabular-nums">{game.white.elo}</span>
              </div>
              <div className="text-gray-400 text-xs mb-2">vs</div>
              <div className="text-sm mb-3">
                <span className="font-medium">{game.black.name}</span>
                <span className="text-gray-400 ml-1 tabular-nums">{game.black.elo}</span>
              </div>
              <div className="text-xs text-gray-500">
                move {game.move_count} · {game.turn} to play
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

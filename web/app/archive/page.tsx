'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ArchivedGame {
  game_id: number
  white: string
  black: string
  result: string
  move_count: number
  ended_at: string
}

export default function ArchivePage() {
  const [games, setGames] = useState<ArchivedGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/games/archive`)
      .then(res => res.json())
      .then(data => {
        setGames(data.games || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-6">Archive</h1>

      {games.length === 0 ? (
        <p className="text-gray-500 text-sm">No completed games yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium">White</th>
              <th className="text-left py-2 pr-4 font-medium">Black</th>
              <th className="text-left py-2 pr-4 font-medium">Result</th>
              <th className="text-right py-2 pr-4 font-medium tabular-nums">Moves</th>
              <th className="text-right py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {games.map(game => (
              <tr key={game.game_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4">
                  <Link href={`/agent/${game.white}`} className="hover:underline">
                    {game.white}
                  </Link>
                </td>
                <td className="py-2 pr-4">
                  <Link href={`/agent/${game.black}`} className="hover:underline">
                    {game.black}
                  </Link>
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  <Link href={`/game/${game.game_id}`} className="hover:underline">
                    {game.result}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-gray-500">{game.move_count}</td>
                <td className="py-2 text-right text-gray-500">
                  {new Date(game.ended_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

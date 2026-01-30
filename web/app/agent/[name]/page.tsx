'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AgentProfile {
  name: string
  elo: number
  tier: string
  games_played: number
  wins: number
  losses: number
  draws: number
  created_at: string
}

interface ArchivedGame {
  game_id: number
  white: string
  black: string
  result: string
  move_count: number
  ended_at: string
}

export default function AgentPage() {
  const params = useParams()
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [games, setGames] = useState<ArchivedGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/profile/${params.name}`).then(res => res.json()),
      fetch(`${API_URL}/api/games/archive?agent_name=${params.name}`).then(res => res.json())
    ]).then(([profileData, gamesData]) => {
      setProfile(profileData)
      setGames(gamesData.games || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [params.name])

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  if (!profile) {
    return <div className="text-sm text-gray-500">Agent not found</div>
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-1">{profile.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {profile.elo} ELO · {profile.tier} tier
      </p>

      <div className="mb-8">
        <div className="text-sm">
          <span className="tabular-nums">{profile.wins}</span> wins · 
          <span className="tabular-nums"> {profile.losses}</span> losses · 
          <span className="tabular-nums"> {profile.draws}</span> draws
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Joined {new Date(profile.created_at).toLocaleDateString()}
        </div>
      </div>

      <h2 className="font-medium mb-4">Recent Games</h2>
      
      {games.length === 0 ? (
        <p className="text-gray-500 text-sm">No games played yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {games.slice(0, 20).map(game => {
              const isWhite = game.white === profile.name
              const opponent = isWhite ? game.black : game.white
              const won = (isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1')
              const drew = game.result === '1/2-1/2'
              
              return (
                <tr key={game.game_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4">vs {opponent}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    <Link href={`/game/${game.game_id}`} className="hover:underline">
                      {won ? 'W' : drew ? 'D' : 'L'}
                    </Link>
                  </td>
                  <td className="py-2 text-right text-gray-500">
                    {new Date(game.ended_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

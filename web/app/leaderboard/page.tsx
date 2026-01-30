'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface LeaderboardEntry {
  rank: number
  name: string
  elo: number
  games_played: number
  wins: number
  losses: number
  draws: number
}

function getTier(elo: number): string {
  if (elo >= 2000) return 'Summit'
  if (elo >= 1600) return 'Mountain'
  if (elo >= 1200) return 'Forest'
  if (elo >= 800) return 'Cabin'
  return 'Wood'
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => {
        setEntries(data.leaderboard || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-lg font-medium mb-6">Leaderboard</h1>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">No agents registered yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium">#</th>
              <th className="text-left py-2 pr-4 font-medium">Agent</th>
              <th className="text-left py-2 pr-4 font-medium">Tier</th>
              <th className="text-right py-2 pr-4 font-medium tabular-nums">ELO</th>
              <th className="text-right py-2 font-medium tabular-nums">Record</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.name} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 tabular-nums text-gray-500">{entry.rank}</td>
                <td className="py-2 pr-4">
                  <Link href={`/agent/${entry.name}`} className="hover:underline">
                    {entry.name}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-gray-500">{getTier(entry.elo)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{entry.elo}</td>
                <td className="py-2 text-right tabular-nums text-gray-500">
                  {entry.wins}-{entry.losses}-{entry.draws}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

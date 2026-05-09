import { useEffect, useState } from 'react'
import { Search, UserPlus, Users, Check, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { Card, Button, Avatar, Badge, EmptyState } from '@/components/ui'
import type { Profile } from '@/types'

export const FriendsPage = () => {
  const { user } = useAuthStore()
  const {
    friends, pendingRequests, loadingFriends,
    fetchFriends, searchUsers, sendFriendRequest, acceptFriendRequest
  } = useAppStore()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [sentIds, setSentIds] = useState<string[]>([])

  useEffect(() => {
    if (user) fetchFriends(user.id)
  }, [user?.id])

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await searchUsers(query)
      // Filter out self and existing friends
      const friendIds = new Set(friends.map((f) => f.id))
      setResults(res.filter((r) => r.id !== user?.id && !friendIds.has(r.id)))
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query, friends])

  const handleAdd = async (friendId: string) => {
    const err = await sendFriendRequest(user!.id, friendId)
    if (!err) setSentIds((s) => [...s, friendId])
  }

  const handleAccept = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId)
    fetchFriends(user!.id)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-ink-900">Friends</h1>
        <p className="text-ink-400 text-sm mt-0.5">Add your hostel mates to split expenses</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-ink-100 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent"
          placeholder="Search by username or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Search results */}
      {query.length >= 2 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Search results</p>
          {searching ? (
            <p className="text-sm text-ink-300 py-3 text-center">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-ink-300 py-3 text-center">No users found</p>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((person) => (
                <Card key={person.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={person.full_name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900">{person.full_name}</p>
                      <p className="text-xs text-ink-400">@{person.username}</p>
                    </div>
                    {sentIds.includes(person.id) ? (
                      <Badge variant="default">
                        <Clock size={10} />
                        Sent
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => handleAdd(person.id)}>
                        <UserPlus size={13} />
                        Add
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
            Pending requests ({pendingRequests.length})
          </p>
          <div className="flex flex-col gap-2">
            {pendingRequests.map((req) => {
              const sender = req.user as Profile
              return (
                <Card key={req.id}>
                  <div className="flex items-center gap-3">
                    <Avatar name={sender?.full_name || '?'} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900">{sender?.full_name}</p>
                      <p className="text-xs text-ink-400">wants to be your friend</p>
                    </div>
                    <Button size="sm" onClick={() => handleAccept(req.id)}>
                      <Check size={13} />
                      Accept
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
          Your friends ({friends.length})
        </p>
        {loadingFriends ? (
          <p className="text-sm text-ink-300 py-4 text-center">Loading…</p>
        ) : friends.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No friends yet"
            description="Search for your hostel mates by username or name"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((friend) => (
              <Card key={friend.id}>
                <div className="flex items-center gap-3">
                  <Avatar name={friend.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900">{friend.full_name}</p>
                    <p className="text-xs text-ink-400">@{friend.username}</p>
                  </div>
                  <Badge variant="success">Friend</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { CommunityPostCard } from '@/components/community/community-post-card'
import { ContestCard } from '@/components/community/contest-card'
import { Users, Trophy, Search, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import type { CommunityPostData, ContestData } from '@/lib/types/community'

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPostData[]>([])
  const [contests, setContests] = useState<ContestData[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [isLoadingContests, setIsLoadingContests] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPosts()
    fetchContests()
  }, [])

  const fetchPosts = async (q = '') => {
    setIsLoadingPosts(true)
    try {
      const params = new URLSearchParams({ orderBy: 'likes', orderDir: 'desc', limit: '24' })
      if (q) params.set('search', q)
      const res = await fetch(`/api/community/posts?${params}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setPosts(data.data.items)
    } catch {
      toast.error('Erro ao carregar posts da comunidade')
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const fetchContests = async () => {
    try {
      const res = await fetch('/api/community/contests')
      const data = await res.json()
      if (data.success) setContests(data.data)
    } finally {
      setIsLoadingContests(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPosts(search)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Comunidade
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore criações da comunidade, participe de contests e inspire-se.
        </p>
      </div>

      <Tabs defaultValue="trending">
        <TabsList>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-3.5 w-3.5" />Trending
          </TabsTrigger>
          <TabsTrigger value="contests" className="gap-2">
            <Trophy className="h-3.5 w-3.5" />Contests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4 mt-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar na comunidade..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>

          {isLoadingPosts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum post na comunidade ainda.</p>
              <p className="text-sm">Seja o primeiro a compartilhar!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map((post) => (
                <CommunityPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contests" className="space-y-4 mt-4">
          {isLoadingContests ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : contests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum contest ativo no momento.</p>
              <p className="text-sm">Fique de olho — novos contests em breve!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contests.map((contest) => (
                <ContestCard key={contest.id} contest={contest} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

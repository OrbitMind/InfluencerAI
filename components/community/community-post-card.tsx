'use client'

import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, Eye, Play } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { CommunityPostData } from '@/lib/types/community'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CommunityPostCardProps {
  post: CommunityPostData
  showAuthor?: boolean
}

export function CommunityPostCard({ post, showAuthor = true }: CommunityPostCardProps) {
  const [likes, setLikes] = useState(post.likes)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLiking) return
    setIsLiking(true)
    try {
      await fetch(`/api/community/posts/${post.id}/like`, { method: 'POST' })
      setLikes((prev) => prev + 1)
    } catch {
      toast.error('Erro ao curtir')
    } finally {
      setIsLiking(false)
    }
  }

  const authorName = post.user?.name ?? 'Criador'
  const authorInitials = authorName.charAt(0).toUpperCase()

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all">
      <div className="relative aspect-square bg-muted overflow-hidden">
        {post.mediaType === 'video' ? (
          <>
            {post.thumbnailUrl ? (
              <Image src={post.thumbnailUrl} alt={post.title ?? 'Video'} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="h-12 w-12 text-white/80" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">Vídeo</Badge>
            </div>
          </>
        ) : (
          <Image src={post.mediaUrl} alt={post.title ?? 'Post'} fill className="object-cover transition-transform group-hover:scale-105" />
        )}
        {post.contest && (
          <div className="absolute top-2 right-2">
            <Badge className="text-xs bg-amber-500 text-white">🏆 Contest</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        {post.title && <p className="text-sm font-medium line-clamp-1">{post.title}</p>}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">#{tag}</Badge>
            ))}
          </div>
        )}
        {showAuthor && (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={post.user?.image ?? undefined} />
              <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">{authorName}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-3 pb-3 pt-0 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-red-500"
          onClick={handleLike}
        >
          <Heart className="h-3.5 w-3.5" />
          {likes}
        </Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {post.views}
        </div>
      </CardFooter>
    </Card>
  )
}

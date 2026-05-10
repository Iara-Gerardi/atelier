import type { SearchChannel } from '@/hooks/useArenaSearch'

export function ChannelItem({ channel }: { channel: SearchChannel }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-2">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-blue-50 text-xs text-blue-400">
        ⊞
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-700">{channel.title}</p>
        <p className="text-xs text-gray-400">{channel.length} blocks · {channel.user.username}</p>
      </div>
    </div>
  )
}

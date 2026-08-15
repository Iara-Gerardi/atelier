/**
 * Atelier shim for `next/image`.
 *
 * Renders a plain `<img>`, dropping Next-only props (`fill`, `priority`,
 * `loader`, `placeholder`, `blurDataURL`, `quality`, `sizes`). `fill` is
 * approximated with absolute positioning so layouts that rely on it don't
 * collapse. No optimization/CDN rewriting happens — `src` is used verbatim.
 */
import type { CSSProperties, ImgHTMLAttributes, ReactEventHandler } from 'react'

type StaticImport = { src: string; height?: number; width?: number }

export interface ImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'loading'> {
  src: string | StaticImport
  alt: string
  width?: number | `${number}`
  height?: number | `${number}`
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: string
  blurDataURL?: string
  loader?: unknown
  sizes?: string
  loading?: 'lazy' | 'eager'
  onLoadingComplete?: () => void
}

function resolveSrc(src: ImageProps['src']): string {
  return typeof src === 'string' ? src : src.src
}

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  quality,
  placeholder,
  blurDataURL,
  loader,
  sizes,
  loading,
  onLoadingComplete,
  style,
  ...rest
}: ImageProps) {
  const fillStyle: CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    : {}

  const handleLoad: ReactEventHandler<HTMLImageElement> | undefined = onLoadingComplete
    ? () => onLoadingComplete()
    : undefined

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveSrc(src)}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      onLoad={handleLoad}
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  )
}

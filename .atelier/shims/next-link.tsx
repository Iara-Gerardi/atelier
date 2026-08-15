/**
 * Atelier shim for `next/link`.
 *
 * Renders a plain anchor. In scene mode, clicking a link whose `href` matches
 * a declared outcome dispatches that outcome (and prevents navigation) so
 * `<Link>`-driven flows work in the preview.
 */
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'
import { useSceneOutcome } from '../SceneActionContext'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | { pathname?: string }
  children?: ReactNode
  // Next-specific props accepted and ignored by the preview.
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  legacyBehavior?: boolean
}

function hrefToString(href: LinkProps['href']): string {
  return typeof href === 'string' ? href : (href.pathname ?? '#')
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, onClick, prefetch, replace, scroll, shallow, passHref, legacyBehavior, ...rest },
  ref,
) {
  const scene = useSceneOutcome()
  const target = hrefToString(href)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (scene) {
      event.preventDefault()
      scene.dispatchByHref(target)
    }
  }

  return (
    <a ref={ref} href={target} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
})

export default Link

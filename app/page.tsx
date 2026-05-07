import { registry } from '@/registry'
import PreviewShell from './_preview/PreviewShell'

export default function Home() {
  return <PreviewShell registry={registry} />
}

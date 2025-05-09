import { Metadata } from 'next'
import { Analytics } from "@vercel/analytics/react"

export async function generateMetadata({ params }: { params: { address: string } }): Promise<Metadata> {
  return {
    title: `Profile - ${params.address}`,
    description: `View profile and stats for ${params.address}`,
    openGraph: {
      images: [`/profile/${params.address}/opengraph-image`],
    },
  }
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
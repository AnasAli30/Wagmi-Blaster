import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/feed.jpg`,
  button: {
    title: 'Play WAGMI Blaster',
    action: {
      type: 'launch_frame',
      name: 'WAGMI Blaster',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.jpg`,
      splashBackgroundColor: '#000',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'WAGMI Blaster',
    openGraph: {
      title: 'WAGMI Blaster',
      description: 'Fire memecoins at lightning speed on Farcaster!',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}

// Disable static generation for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

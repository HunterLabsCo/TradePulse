import { useState } from 'react'
import Header from '@/components/layout/Header'
import TabNav from '@/components/layout/TabNav'
import VideoConverter from '@/components/VideoConverter'
import ScreenRecorder from '@/components/ScreenRecorder'
import ImageSequence from '@/components/ImageSequence'

const TABS = [
  { id: 'video', label: 'Video to GIF' },
  { id: 'screen', label: 'Screen Recorder' },
  { id: 'images', label: 'Image Sequence' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('video')

  return (
    <div className="flex min-h-dvh flex-col bg-black">
      <Header />
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {activeTab === 'video' && <VideoConverter />}
        {activeTab === 'screen' && <ScreenRecorder />}
        {activeTab === 'images' && <ImageSequence />}
      </main>
      <footer className="border-t border-border-subtle py-4 text-center">
        <p className="text-[11px] text-text-muted">
          All processing happens in your browser — nothing is uploaded anywhere.
        </p>
      </footer>
    </div>
  )
}

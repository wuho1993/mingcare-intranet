'use client'

import { useRouter } from 'next/navigation'

export function BackToHomeButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/dashboard')}
      className="btn-apple-secondary flex items-center"
    >
      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      返回儀表板
    </button>
  )
}
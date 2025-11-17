'use client'

import { useState } from 'react'

interface ShareCodeProps {
  code: string
}

export default function ShareCode({ code }: ShareCodeProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const text = `Join my Feast Finder session: ${window.location.origin}/session/${code}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4 text-white text-center">
      <p className="text-sm opacity-90 mb-2">Session Code</p>
      <div className="flex items-center justify-center gap-2">
        <code className="text-3xl font-mono font-bold tracking-wider">{code}</code>
        <button
          onClick={copyToClipboard}
          className="bg-white text-orange-600 px-3 py-2 rounded-lg font-semibold hover:bg-orange-50 transition text-sm"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs opacity-75 mt-2">Share this code with friends to join</p>
    </div>
  )
}

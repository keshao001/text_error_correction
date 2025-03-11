'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', gaId)
  }, [gaId])

  return (
    <>
      {/* <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script> */}
    </>
  )
}

declare global {
  interface Window {
    dataLayer: any[]
  }
}


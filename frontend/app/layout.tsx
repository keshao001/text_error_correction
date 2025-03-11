import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from './context/auth-context'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/Footer'
import { MenuProvider } from './context/MenuContext'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '基于大模型的中文文本校正',
  description: '使用大模型进行中文文本校正和优化',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='zh'>
      <body className={inter.className}>
        <AuthProvider>
          <div className='min-h-screen flex flex-col'>
            <Header />
            <main className='flex-1 container mx-auto px-4 py-8 pb-24'>
              <MenuProvider>{children}</MenuProvider>
              <GoogleAnalytics gaId='G-XXXXXXXXXX' />
            </main>
            <Footer />
            <Toaster />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

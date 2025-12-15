import './global.css'

import Header from '@/components/Header'
import PageLayout from '@/components/layout/PageLayout'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <PageLayout header={<Header />}>{children}</PageLayout>
            </body>
        </html>
    )
}

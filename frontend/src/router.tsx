import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { AuditPage } from '@/features/admin/AuditPage'
import { CamerasZonesPage } from '@/features/admin/CamerasZonesPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { RequireRole } from '@/features/auth/RequireRole'
import { createBrowserRouter } from 'react-router-dom'
import { EventDetailPage } from '@/features/events/EventDetailPage'
import { EventsPage } from '@/features/events/EventsPage'
import { LiveViewPage } from '@/features/live/LiveViewPage'
import { LazyRecordsPage } from '@/features/records/LazyRecordsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  // Bileşen örnek sayfası: yalnızca geliştirmede. DEV üretimde `false`'a çevrilir, import'u derlemeye girmez.
  ...(import.meta.env.DEV
    ? [
        {
          path: '/dev/ui',
          lazy: async () => ({ Component: (await import('@/pages/dev/UiKitPage')).UiKitPage }),
        },
      ]
    : []),
  {
    // Bu grubun altındaki her şey için giriş şart.
    element: <RequireAuth />,
    children: [
      {
        // Girişli sayfaların ortak kabuğu: üst bar, içerik alanı, asistan düğmesi.
        element: <AppShell />,
        children: [
          { path: '/', element: <LiveViewPage /> },
          { path: '/events', element: <EventsPage /> },
          { path: '/events/:id', element: <EventDetailPage /> },
          { path: '/records', element: <LazyRecordsPage /> },
          { path: '/agents', element: <PlaceholderPage title="Ajan akışı" /> },
          {
            // Yalnızca admin.
            element: <RequireRole role="admin" />,
            children: [
              {
                path: '/admin/cameras',
                element: <CamerasZonesPage />,
              },
              { path: '/admin/users', element: <UsersPage /> },
              { path: '/admin/audit', element: <AuditPage /> },
            ],
          },
          // Bilinmeyen adres de korumalı: girişsiz kullanıcı 404 yerine giriş ekranını görür.
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

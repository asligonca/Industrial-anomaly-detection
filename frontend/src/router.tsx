import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireRole } from '@/features/auth/RequireRole'
import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    // Bu grubun altındaki her şey için giriş şart.
    element: <RequireAuth />,
    children: [
      {
        // Girişli sayfaların ortak kabuğu: üst bar, içerik alanı, asistan düğmesi.
        element: <AppShell />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/events', element: <PlaceholderPage title="Olaylar" /> },
          { path: '/events/:id', element: <PlaceholderPage title="Olay detayı" /> },
          { path: '/records', element: <PlaceholderPage title="Kayıtlar" /> },
          { path: '/agents', element: <PlaceholderPage title="Ajan akışı" /> },
          {
            // Yalnızca admin.
            element: <RequireRole role="admin" />,
            children: [
              {
                path: '/admin/cameras',
                element: <PlaceholderPage title="Kameralar ve bölgeler" />,
              },
              { path: '/admin/users', element: <PlaceholderPage title="Kullanıcılar" /> },
              { path: '/admin/audit', element: <PlaceholderPage title="Denetim kayıtları" /> },
            ],
          },
          // Bilinmeyen adres de korumalı: girişsiz kullanıcı 404 yerine giriş ekranını görür.
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

import { config } from '@/config'

export function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Endüstriyel Güvenlik Paneli</h1>
      <p className="mt-2 text-zinc-600">Frontend iskeleti çalışıyor.</p>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-sm">
        <dt className="text-zinc-500">API</dt>
        <dd>{config.apiUrl}</dd>
        <dt className="text-zinc-500">Mock</dt>
        <dd>{String(config.useMock)}</dd>
      </dl>
    </main>
  )
}

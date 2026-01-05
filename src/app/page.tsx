import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">VidFlow</h1>
      <p className="mt-4 text-gray-600">YouTube Automation Platform</p>

      <nav className="mt-8 flex gap-4">
        <Link
          href="/thumbnails"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Thumbnail Generator
        </Link>
      </nav>
    </main>
  );
}

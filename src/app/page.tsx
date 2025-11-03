export const dynamic = 'force-dynamic'

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl mb-6 text-gray-600">
          This template is configured to be absolutely lenient - builds never fail on validation errors.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-left">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">✅ Always Builds</h3>
            <ul className="text-green-700 space-y-1">
              <li>• TypeScript errors ignored</li>
              <li>• ESLint warnings ignored</li>
              <li>• Global error boundaries</li>
              <li>• Asset type safety</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🚀 Production Ready</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Next.js 15.5.2 App Router</li>
              <li>• Vercel optimized</li>
              <li>• SSR/SEO friendly</li>
              <li>• Browser API protection</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-gray-500">
          Start building your amazing project here! This template will never fail builds due to validation errors.
        </p>
      </div>
    </div>
  );
}
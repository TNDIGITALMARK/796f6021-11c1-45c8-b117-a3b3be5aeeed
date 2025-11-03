'use client'

// Global error boundary - catches any errors that escape regular error boundaries  
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 font-sans">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          Something went wrong!
        </h1>
        <p className="text-lg mb-8 text-gray-600">
          The application encountered an unexpected error. This is likely temporary.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-500 text-white border-0 rounded-lg cursor-pointer text-base hover:bg-blue-600"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-500 text-white border-0 rounded-lg cursor-pointer text-base hover:bg-gray-600"
          >
            Go Home
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer font-bold">
              Error Details (Development Only)
            </summary>
            <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm overflow-auto">
              {error.message}
              {error.stack && '\n\nStack trace:\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
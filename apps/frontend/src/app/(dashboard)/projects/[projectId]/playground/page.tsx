/**
 * Playground — single chat + A/B split view for pipeline comparison.
 */

export default function PlaygroundPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Playground</h1>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded" />
          Enable A/B comparison
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Variant A</h2>
          <div className="h-64 rounded bg-gray-50 p-3 text-sm text-gray-500">
            Chat messages will appear here.
          </div>
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Variant B</h2>
          <div className="h-64 rounded bg-gray-50 p-3 text-sm text-gray-500">
            Chat messages will appear here.
          </div>
        </section>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ask a question..."
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}

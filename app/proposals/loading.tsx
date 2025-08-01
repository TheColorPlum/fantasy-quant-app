export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-6 w-6 bg-[#2a2a2a] rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-[#2a2a2a] rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-[#2a2a2a] rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded animate-pulse"></div>
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-32 bg-[#2a2a2a] rounded animate-pulse"></div>
                  <div className="h-5 w-20 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 items-center">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-[#2a2a2a] rounded animate-pulse"></div>
                  <div className="h-16 bg-[#0f0f0f] border border-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div className="text-center">
                  <div className="h-8 w-8 bg-[#2a2a2a] rounded mx-auto animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse"></div>
                  <div className="h-16 bg-[#0f0f0f] border border-[#2a2a2a] rounded animate-pulse"></div>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-32 bg-[#2a2a2a] rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div className="h-20 bg-[#0f0f0f] border border-[#2a2a2a] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

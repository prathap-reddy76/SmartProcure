import Link from "next/link";

export function FarmerDashboardAICard() {
  return (
    <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-5 shadow-sm text-white flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="text-xl">🤖</span> SmartProcure AI Assistant
        </h2>
        <p className="text-green-100 text-sm mt-1 max-w-sm">
          Ask about your crops, weather, market prices, and procurement in simple chat.
        </p>
      </div>
      <Link 
        href="/farmer/assistant" 
        className="bg-white text-green-900 hover:bg-green-50 font-bold px-4 py-2 rounded-lg text-sm shadow-sm transition-colors whitespace-nowrap ml-4"
      >
        Ask AI &rarr;
      </Link>
    </div>
  );
}

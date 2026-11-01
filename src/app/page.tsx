import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex justify-between items-center p-6 bg-white shadow-sm">
        <Link href="/" className="text-2xl font-bold text-green-700">SmartProcure</Link>
        <nav className="flex gap-4 items-center">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700">
            Home
          </Link>
          <Link href="/market-prices" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700">
            Market Prices
          </Link>
          <a href="http://delivery.localhost:3000" className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800">
            Delivery Partner
          </a>
          <a href="http://officer.localhost:3000" className="px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
            Procurement Officer
          </a>
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700">
            Login
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
            Register
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-6">
          Farmer-Friendly Agriculture Ecosystem
        </h1>
        <p className="max-w-2xl text-xl text-gray-500 mb-10">
          SmartProcure connects farmers with agricultural product shops, machinery services, and government procurement centres seamlessly.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="px-6 py-3 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
            Get Started
          </Link>
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-gray-500 bg-white border-t">
        &copy; {new Date().getFullYear()} SmartProcure. All rights reserved.
      </footer>
    </div>
  );
}

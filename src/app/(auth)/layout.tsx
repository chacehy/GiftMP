import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream/40 via-white to-orange-50/30 flex flex-col">
      {/* Minimal header — just the logo */}
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-lg font-[Outfit]">G</span>
          </div>
          <span className="text-xl font-bold text-gray-900 font-[Outfit]">
            Gift<span className="text-brand">MP</span>
          </span>
        </Link>
      </header>

      {/* Form content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} GiftMP. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

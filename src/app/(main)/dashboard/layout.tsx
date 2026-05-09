import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, Package, ShoppingBag, BarChart3, Settings, Menu } from "lucide-react";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/shop", label: "Shop Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?callbackUrl=/dashboard");

  const userRole = (session.user as any)?.role;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <div className="flex items-center gap-2 mb-6">
              <Store className="w-5 h-5 text-brand" />
              <span className="font-bold text-gray-900 font-[Outfit]">Dashboard</span>
            </div>
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-brand hover:bg-brand-cream/50 transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 px-2 py-1.5">
          <div className="flex justify-around">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-brand transition-colors"
              >
                <link.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-0">{children}</div>
      </div>
    </div>
  );
}

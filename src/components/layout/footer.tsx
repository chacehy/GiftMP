import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base font-[Outfit]">G</span>
              </div>
              <span className="text-lg font-bold text-white font-[Outfit]">
                Gift<span className="text-brand-light">MP</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your marketplace for unique handmade gifts and vintage treasures from talented Algerian artisans.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/products" className="text-sm hover:text-brand-light transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=jewelry-accessories" className="text-sm hover:text-brand-light transition-colors">
                  Jewelry
                </Link>
              </li>
              <li>
                <Link href="/products?category=home-living" className="text-sm hover:text-brand-light transition-colors">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link href="/products?category=art-collectibles" className="text-sm hover:text-brand-light transition-colors">
                  Art
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Sell
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/dashboard/shop/create" className="text-sm hover:text-brand-light transition-colors">
                  Open a Shop
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm hover:text-brand-light transition-colors">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/products" className="text-sm hover:text-brand-light transition-colors">
                  Manage Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Help
            </h3>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-gray-400">Contact Support</span>
              </li>
              <li>
                <span className="text-sm text-gray-400">Shipping Info</span>
              </li>
              <li>
                <span className="text-sm text-gray-400">Returns & Refunds</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} GiftMP. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Powered by</span>
            <span className="text-xs font-medium text-brand-light">Chargily Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Store,
  LogOut,
  Package,
  Heart,
  ChevronDown,
  Sparkles,
} from "lucide-react";

const categories = [
  { name: "Jewelry & Accessories", slug: "jewelry-accessories" },
  { name: "Clothing & Shoes", slug: "clothing-shoes" },
  { name: "Home & Living", slug: "home-living" },
  { name: "Art & Collectibles", slug: "art-collectibles" },
  { name: "Craft Supplies", slug: "craft-supplies" },
  { name: "Gifts & Gift Cards", slug: "gifts" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const user = session?.user;
  const userRole = (user as any)?.role;

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      {/* Top banner */}
      <div className="bg-brand text-white text-center text-xs py-1.5 font-medium tracking-wide flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> Free shipping on orders over 5,000 DZD — Shop unique handmade gifts
      </div>

      {/* Main nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-lg font-[Outfit]">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900 font-[Outfit] hidden sm:block">
              Gift<span className="text-brand">MP</span>
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl hidden md:block">
            <form action="/products" method="GET" className="relative">
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for handmade gifts..."
                className="w-full h-10 pl-4 pr-12 rounded-full bg-gray-50 border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-dark transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Categories dropdown (desktop) */}
            <div className="hidden lg:block relative group">
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand transition-colors rounded-lg hover:bg-gray-50">
                Categories
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 animate-slide-down">
                <div className="p-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/products?category=${cat.slug}`}
                      className="block px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-brand-cream hover:text-brand-dark transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-gray-600 hover:text-brand hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-cream text-brand-dark flex items-center justify-center text-xs font-semibold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                    {user.name || "User"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-scale-in">
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Package className="w-4 h-4 text-gray-400" />
                          My Orders
                        </Link>
                        {(userRole === "SELLER" || userRole === "ADMIN") && (
                          <Link
                            href="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Store className="w-4 h-4 text-gray-400" />
                            Seller Dashboard
                          </Link>
                        )}
                        {userRole === "BUYER" && (
                          <Link
                            href="/dashboard/shop/create"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-brand rounded-lg hover:bg-brand-cream transition-colors font-medium"
                          >
                            <Store className="w-4 h-4" />
                            Open a Shop
                          </Link>
                        )}
                      </div>
                      <div className="p-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            signOut();
                            setUserMenuOpen(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand transition-colors hidden sm:block"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-full hover:bg-brand-dark transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-50 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="pb-3 md:hidden">
          <form action="/products" method="GET" className="relative">
            <input
              type="text"
              name="q"
              placeholder="Search for handmade gifts..."
              className="w-full h-10 pl-4 pr-12 rounded-full bg-gray-50 border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pb-2">
              Categories
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-brand-cream hover:text-brand-dark transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

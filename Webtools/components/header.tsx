"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Menu, X, MoreHorizontal } from "lucide-react"

const mainTools = [
  { name: "COMPRESS IMAGE", href: "/compress-image" },
  { name: "RESIZE IMAGE", href: "/resize-image" },
  { name: "CROP IMAGE", href: "/crop-image" },
  { name: "CONVERT TO JPG", href: "/convert-to-jpg" },
  { name: "PHOTO EDITOR", href: "/photo-editor" },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">I</span>
              <Heart className="h-6 w-6 text-blue-500 fill-blue-500 mx-1" />
              <span className="text-2xl font-bold text-gray-900">TOOLS</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            {mainTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {tool.name}
              </Link>
            ))}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">MORE TOOLS</span>
              <MoreHorizontal className="h-4 w-4 text-gray-700" />
            </div>
          </nav>

          <div className="hidden lg:flex items-center space-x-3">
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
              Login
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6">Sign up</Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-4">
              <nav className="space-y-2">
                {mainTools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {tool.name}
                  </Link>
                ))}
              </nav>
              <div className="flex space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  Login
                </Button>
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

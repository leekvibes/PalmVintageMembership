import type { Metadata } from "next";
import "./globals.css";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6945c9d4553e0371a41552a1/3d0f6a813_Untitleddesign.png";

export const metadata: Metadata = {
  title: "Membership — Palm Vintage Philadelphia",
  description:
    "Exclusive chauffeur membership and special event experiences at Palm Vintage, inside the Ritz-Carlton Philadelphia.",
};

const NAV_LINKS = [
  { label: "HOME", href: "#" },
  { label: "ABOUT", href: "#" },
  { label: "MENU", href: "#" },
  { label: "GALLERY", href: "#" },
  { label: "MEMBERSHIP", href: "/", active: true },
  { label: "CONTACT", href: "#" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cream">
        {/* Nav */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-navy/10">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[72px]">
            <a href="/" className="flex-shrink-0">
              <img
                src={LOGO_URL}
                alt="Palm Vintage"
                className="h-12 w-12 rounded-full object-contain"
              />
            </a>

            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-[13px] tracking-[0.12em] font-sans transition-colors ${
                    link.active
                      ? "text-gold-dark font-medium"
                      : "text-navy/70 hover:text-navy cursor-default"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="text-[13px] tracking-[0.08em] text-navy bg-navy/5 hover:bg-navy/10 px-4 py-2 rounded-full transition-colors font-sans font-medium"
              >
                LOG IN
              </a>
            </div>
          </div>
        </header>

        {children}

        {/* Footer */}
        <footer className="bg-navy-darkest text-cream/60 py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12 mb-12">
              <div>
                <img
                  src={LOGO_URL}
                  alt="Palm Vintage"
                  className="h-16 w-16 rounded-full object-contain mb-4 opacity-80"
                />
                <p className="font-body text-sm leading-relaxed">
                  A unique fusion of café culture, artisan sushi, and craft
                  cocktails. Where every moment becomes an experience.
                </p>
              </div>
              <div>
                <h4 className="font-serif text-cream/80 text-sm mb-4 tracking-wide">
                  LOCATION
                </h4>
                <p className="font-body text-sm leading-relaxed">
                  1414 South Penn Square
                  <br />
                  Philadelphia, PA
                  <br />
                  Inside The Ritz-Carlton
                </p>
              </div>
              <div>
                <h4 className="font-serif text-cream/80 text-sm mb-4 tracking-wide">
                  HOURS
                </h4>
                <p className="font-body text-sm leading-relaxed">
                  Open Daily
                  <br />
                  7:00 AM – 12:00 AM
                </p>
                <a
                  href="mailto:Palmvintagephl@gmail.com"
                  className="text-gold/70 hover:text-gold text-sm font-body mt-3 inline-block transition-colors"
                >
                  Palmvintagephl@gmail.com
                </a>
              </div>
            </div>
            <div className="border-t border-cream/10 pt-6 text-center text-xs text-cream/30 font-sans">
              &copy; {new Date().getFullYear()} Palm Vintage Philadelphia. All
              rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black gradient-text">UrTurn</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
        </nav>

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25 hover:-translate-y-px transition-all duration-150"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="font-black text-base gradient-text">UrTurn</span>
        <p>© {new Date().getFullYear()} UrTurn. Built for players, by players.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}

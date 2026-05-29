export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Auth form panel */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        {children}
      </div>

      {/* Right: Brand panel (hidden on mobile) */}
      <div
        className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.55 0.22 260) 0%, oklch(0.45 0.22 280) 50%, oklch(0.55 0.18 145) 100%)",
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Content */}
        <div className="relative z-10 text-center text-white px-12 max-w-md">
          <div className="text-6xl mb-6">🎾</div>
          <h2 className="text-4xl font-black mb-4 tracking-tight">
            Your session, organized.
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Fair matches. Live scores. Real-time standings.
            <br />
            All automated, all in one link.
          </p>

          {/* Social proof */}
          <div className="mt-10 flex flex-col gap-3">
            {[
              "🏸 Badminton & Padel sessions",
              "⚡ Americano round-robin in seconds",
              "📱 Share with a 6-character code",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl bg-card/10 px-4 py-3 text-sm text-left"
              >
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

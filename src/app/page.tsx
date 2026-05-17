import { Hero } from "@/components/lexguard/hero";

export default function Home() {
  return (
    <main className="risk-grid relative z-10 min-h-screen overflow-hidden px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.025),transparent_34rem)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <Hero />
      </section>
    </main>
  );
}

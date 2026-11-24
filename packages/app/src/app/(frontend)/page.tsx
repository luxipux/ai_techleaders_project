import Link from "next/link";

const pillars = [
  {
    title: "Guided learning paths",
    body: "Structured tracks that take you from fundamentals to production-grade engineering.",
  },
  {
    title: "Mentor feedback",
    body: "Code reviews and pairing sessions with experienced engineers who have been there.",
  },
  {
    title: "Real projects",
    body: "Practice on realistic codebases and build a portfolio that shows how you work.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
        <p className="mb-4 text-sm font-medium tracking-widest text-emerald-400 uppercase">
          Grow faster as a developer
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Your personal path from coder to engineer.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-slate-400">
          DevMentor pairs structured learning with real mentorship, so you build the skills that
          matter on real teams.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="#pillars"
            className="rounded-md bg-emerald-500 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            Learn more
          </Link>
        </div>
      </section>

      <section id="pillars" className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{pillar.body}</p>
          </article>
        ))}
      </section>
    </>
  );
}

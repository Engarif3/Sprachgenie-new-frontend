const UserManagementSummary = ({ badge, title, currentFilterLabel, cards }) => {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="border-b border-slate-200 bg-slate-900 px-6 py-6 text-white md:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
          {badge}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Current Filter
            </p>
            <p className="mt-1.5 text-base font-semibold text-white">
              {currentFilterLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-6 py-5 md:grid-cols-3 md:px-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-[24px] border p-5 ${card.borderClass}`}
          >
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${card.labelClass}`}
            >
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UserManagementSummary;

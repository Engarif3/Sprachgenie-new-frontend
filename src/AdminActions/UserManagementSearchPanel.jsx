const UserManagementSearchPanel = ({ searchTerm, onSearchChange, onClear }) => {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60 md:p-5">
      <div className="mt-1 px-4">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Search Users
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Find by user name, email, or ID.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl">
            <input
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search by name, email, or ID"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserManagementSearchPanel;

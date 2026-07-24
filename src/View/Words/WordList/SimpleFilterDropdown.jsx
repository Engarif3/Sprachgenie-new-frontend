// Moved to src/components/UI/FilterDropdown.jsx so the dashboard's dropdowns
// (Error Logs, User Management, Stories, Word/Topic forms) can share the same
// "All Types" visual language instead of each hand-rolling their own
// Tailwind classes on a native <select>. Re-exported here so nothing that
// already imports from this path needs to change.
export { default } from "../../../components/UI/FilterDropdown";

// GET /user is paginated (server-side default limit 10), so a single
// request only returns the most recent page. Callers that need the full
// user list (admin tables matching/editing every user) must walk every
// page — this is the one place that logic lives.
export const fetchAllUsers = async (api, { pageSize = 100 } = {}) => {
  const allUsers = [];
  let page = 1;

  while (true) {
    const res = await api.get("/user", { params: { page, limit: pageSize } });
    const pageUsers = res.data.data;
    allUsers.push(...pageUsers);

    const total = res.data.meta?.total ?? allUsers.length;
    if (allUsers.length >= total || pageUsers.length === 0) {
      break;
    }
    page += 1;
  }

  return allUsers;
};

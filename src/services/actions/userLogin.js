export const userLogin = async (loginData) => {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
      // cache: "no-store",
      credentials: "include",
    }
  );
  const loggedInInfo = await res.json();
  return loggedInInfo;
};

export const registerUser = async (formDataToServer) => {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_API_URL}/user/register-basicUser`,
    {
      method: "POST",
      body: formDataToServer,
      cache: "no-store",
    }
  );
  const userInfo = await res.json();
  return userInfo;
};

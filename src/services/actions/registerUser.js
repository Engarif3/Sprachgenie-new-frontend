import { publicApi } from "../../axios";

export const registerUser = async (formDataToServer) => {
  return publicApi.post("/user/register-basicUser", formDataToServer);
};

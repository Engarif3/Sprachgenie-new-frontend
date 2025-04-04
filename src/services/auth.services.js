import {
  setToLocalStorage,
  removeFromLocalStorage,
  getFromLocalStorage,
} from "../utils/local-storage";
import { decodedToken } from "../utils/jwt-decode";
import { authKey } from "../constants/authkey";
import { instance as axiosInstance } from "../helpers/axios/axiosInstance";
import api from "../axios";

export const storeUserInfo = ({ accessToken }) => {
  return setToLocalStorage(authKey, accessToken);
};

export const getUserInfo = () => {
  const authToken = getFromLocalStorage(authKey);
  if (authToken) {
    const decodedData = decodedToken(authToken);
    return {
      ...decodedData,
      role: decodedData?.role.toLowerCase(),
    };
  }
};

export const isLoggedIn = () => {
  const authToken = getFromLocalStorage(authKey);
  if (authToken) {
    return !!authToken;
  }
};

export const removeUser = () => {
  return removeFromLocalStorage(authKey);
};

export const getNewAccessToken = async () => {
  return await axiosInstance({
    // url: api + "/auth/refresh-token",
    // url: "https://sprcahgenie-new-backend.vercel.app/api/v1/auth/refresh-token",
    url: "http://localhost:5000/api/v1/auth/refresh-token",
    // url: `${api}/auth/refresh-token`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
};

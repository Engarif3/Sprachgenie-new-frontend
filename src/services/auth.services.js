import {
  setToLocalStorage,
  removeFromLocalStorage,
  getFromLocalStorage,
} from "../utils/local-storage";
import { decodedToken } from "../utils/jwt-decode";
import { authKey } from "../constants/authkey";

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

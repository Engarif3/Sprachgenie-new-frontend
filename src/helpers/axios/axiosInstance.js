import axios from "axios";
import { getFromLocalStorage } from "../../utils/local-storage";
import { authKey } from "../../constants/authkey";

const instance = axios.create();

instance.defaults.headers.post["Content-Type"] = "application/json";

instance.defaults.headers["Accept"] = "application/json";
instance.defaults.timeout = 60000;
export { instance };

// Add a request interceptor
instance.interceptors.request.use(
  function (config) {
    // Do something before request is sent

    const accessToken = getFromLocalStorage(authKey);
    if (accessToken) {
      config.headers.Authorization = accessToken;
    }
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    const responseObject = {
      data: response?.data?.data,
      meta: response?.data?.meta,
    };
    return responseObject;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    const responseObject = {
      statusCode: error?.response?.data?.statusCode || 500,
      message: error?.response?.data?.message || "Something went wrong !!!",
      errorMessages: error?.response?.data?.message,
    };
    // return Promise.reject(error);
    return responseObject;
  }
);

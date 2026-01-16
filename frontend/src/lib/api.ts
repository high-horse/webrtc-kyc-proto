import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, //"http://localhost:8080/api",
  withCredentials: true, // important to send cookies
});

export default api;

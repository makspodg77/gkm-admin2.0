export const API_BASE_URL = "http://localhost:3000/api";

export const ROUTES = {
  STOPS: {
    GET_ONE: (groupId) => `${API_BASE_URL}/stops/group/${groupId}`,
    GET_ALL: `${API_BASE_URL}/stops/groups`,
    GET_ALL_STOPS: `${API_BASE_URL}/stops/all`,
    CREATE: `${API_BASE_URL}/stops`,
    UPDATE: (groupId) => `${API_BASE_URL}/stops/group/${groupId}`,
  },
  LINE_TYPES: {
    GET_ALL: `${API_BASE_URL}/line-types`,
    CREATE: `${API_BASE_URL}/line-types`,
    UPDATE: (id) => `${API_BASE_URL}/line-types/${id}`,
    GET_ONE: (id) => `${API_BASE_URL}/line-types/${id}`,
  },
  LINES: {
    GET_ALL: `${API_BASE_URL}/lines`,
    GET_ONE: (id) => `${API_BASE_URL}/lines/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/lines/${id}`,
    CREATE: `${API_BASE_URL}/lines`,
  },
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },
};

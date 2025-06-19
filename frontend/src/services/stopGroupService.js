import { fetchWithAuth } from "./authService";
import { ROUTES } from "./config";

export const StopGroupService = {
  getAllStopGroups: async () => {
    try {
      const response = await fetchWithAuth(ROUTES.STOPS.GET_ALL);
      return await response.json();
    } catch (error) {
      console.error("Error fetching stop groups:", error);
      throw error;
    }
  },

  getAllStops: async () => {
    try {
      const response = await fetchWithAuth(ROUTES.STOPS.GET_ALL_STOPS);
      return await response.json();
    } catch (error) {
      console.error("Error fetching stops:", error);
      throw error;
    }
  },

  getOneStopGroup: async (groupId) => {
    try {
      const response = await fetchWithAuth(ROUTES.STOPS.GET_ONE(groupId));
      return await response.json();
    } catch (error) {
      console.error(`Error fetching stop group ${groupId}:`, error);
      throw error;
    }
  },

  updateStopGroup: async (groupId, updates) => {
    try {
      const response = await fetchWithAuth(ROUTES.STOPS.UPDATE(groupId), {
        method: "PUT",
        body: JSON.stringify({
          groupId,
          ...updates,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error(`Error updating stop group ${groupId}:`, error);
      throw error;
    }
  },

  createStopGroup: async (newGroup) => {
    try {
      const response = await fetchWithAuth(ROUTES.STOPS.CREATE, {
        method: "POST",
        body: JSON.stringify(newGroup),
      });

      return await response.json();
    } catch (error) {
      console.error("Error creating stop group:", error);
      throw error;
    }
  },
};

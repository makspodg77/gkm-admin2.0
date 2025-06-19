import { fetchWithAuth } from "./authService";
import { ROUTES } from "./config";

export const LineTypeService = {
  getAllLineTypes: async () => {
    try {
      const response = await fetchWithAuth(ROUTES.LINE_TYPES.GET_ALL);
      return await response.json();
    } catch (error) {
      console.error("Error fetching line types:", error);
      throw error;
    }
  },

  getOneLineType: async (id) => {
    try {
      const response = await fetchWithAuth(ROUTES.LINE_TYPES.GET_ONE(id));
      return await response.json();
    } catch (error) {
      console.error(`Error fetching line type ${id}:`, error);
      throw error;
    }
  },

  updateLineType: async (id, updates) => {
    try {
      const response = await fetchWithAuth(ROUTES.LINE_TYPES.UPDATE(id), {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return await response.json();
    } catch (error) {
      console.error(`Error updating line type ${id}:`, error);
      throw error;
    }
  },

  createLineType: async (newLineType) => {
    try {
      const response = await fetchWithAuth(ROUTES.LINE_TYPES.CREATE, {
        method: "POST",
        body: JSON.stringify(newLineType),
      });
      return await response.json();
    } catch (error) {
      console.error("Error creating line type:", error);
      throw error;
    }
  },

  deleteLineType: async (id) => {
    try {
      const response = await fetchWithAuth(ROUTES.LINE_TYPES.DELETE(id), {
        method: "DELETE",
      });
      return await response.json();
    } catch (error) {
      console.error(`Error deleting line type ${id}:`, error);
      throw error;
    }
  },
};

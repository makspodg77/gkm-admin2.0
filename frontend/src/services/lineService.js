import { fetchWithAuth } from "./authService";
import { ROUTES } from "./config";

export const LineService = {
  getAllLines: async () => {
    try {
      const response = await fetchWithAuth(ROUTES.LINES.GET_ALL);
      return await response.json();
    } catch (error) {
      console.error("Error fetching lines:", error);
      throw error;
    }
  },

  getOneLine: async (id) => {
    try {
      const response = await fetchWithAuth(ROUTES.LINES.GET_ONE(id));
      return await response.json();
    } catch (error) {
      console.error(`Error fetching line ${id}:`, error);
      throw error;
    }
  },

  updateLine: async (id, updates) => {
    try {
      const response = await fetchWithAuth(ROUTES.LINES.UPDATE(id), {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      return await response.json();
    } catch (error) {
      console.error(`Error updating line ${id}:`, error);
      throw error;
    }
  },

  createLine: async (newLine) => {
    try {
      const response = await fetchWithAuth(ROUTES.LINES.CREATE, {
        method: "POST",
        body: JSON.stringify(newLine),
      });
      return await response.json();
    } catch (error) {
      console.error("Error creating line:", error);
      throw error;
    }
  },

  deleteLine: async (lineId) => {
    try {
      const response = await fetch(`/api/lines/${lineId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error deleting line");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting line:", error);
      throw error;
    }
  },
};

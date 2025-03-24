import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const fetchAllQueries = async () => {
  try {
    const response = await axios.get(`${API}/api/queries`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data && Array.isArray(response.data.queries)) {
      // Puedes guardar en sessionStorage si lo deseas
      sessionStorage.setItem("queries", JSON.stringify(response.data.queries));
      return response.data.queries;
    } else {
      throw new Error("La respuesta no tiene la estructura esperada");
    }
  } catch (error) {
    console.error("Error al obtener las queries:", error);
    throw error;
  }
};

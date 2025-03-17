import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000"; // Usa una URL predeterminada si VITE_API_URL no está definida

export const fetchData = async (variable: string) => {
  try {
    const response = await axios.get(`${API}/api/fetch-data`, {
      params: {
        q: variable,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data) {
      // Guardar los datos en sessionStorage
      sessionStorage.setItem("fetchData", JSON.stringify(response.data));
      return response.data;
    } else {
      throw new Error("La respuesta no tiene la estructura esperada");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

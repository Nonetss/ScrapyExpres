import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const fetchScrapy = async (variable1: string, variable2: string) => {
  try {
    const response = await axios.get(`${API}/api/scrapy/${variable1}`, {
      params: {
        q: variable2,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

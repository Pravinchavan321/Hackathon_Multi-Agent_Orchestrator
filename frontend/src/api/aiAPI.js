export const checkHealth = async () => {
  const baseUrl = import.meta.env.VITE_API_URL;
  try {
    const response = await fetch(`${baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Health check failed:", error);
    return null;
  }
};

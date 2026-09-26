export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      return null;
    }

    const response = await fetch(
      "http://localhost:5000/api/auth/refresh-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      return null;
    }

    localStorage.setItem("token", data.token);

    return data.token;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
};
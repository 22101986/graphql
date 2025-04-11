window.auth = {
  // API endpoint for authentication
  API_DOMAIN: 'https://zone01normandie.org/api/auth/signin',

  // Login method using Basic Auth and returns a JWT
  async login(usernameOrEmail, password) {
    try {
      // Encode credentials in Base64
      const authHeader = btoa(`${usernameOrEmail}:${password}`);
      const response = await fetch(`${this.API_DOMAIN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      });

      // Get response as plain text
      const textData = await response.text();

      // Throw error if response is not successful
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${textData}`);
      }

      let token;
      try {
        // Try to parse JSON and extract token
        const jsonData = JSON.parse(textData);
        token = jsonData.token || jsonData.jwt || textData;
      } catch {
        // Fallback if it's not JSON
        token = textData;
      }

      // Validate if token looks like a JWT
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        console.error("Invalid token received:", token);
        throw new Error("Received token is not a valid JWT");
      }

      // Store token in localStorage
      localStorage.setItem('jwt', token.trim());
      return token;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout method: remove token and reload page
  logout() {
    localStorage.removeItem('jwt');
    window.location.reload();
  },

  // Check if user is authenticated (JWT exists)
  isAuthenticated() {
    return !!localStorage.getItem('jwt');
  },

  // Get JWT from localStorage
  getJWT() {
    const token = localStorage.getItem('jwt');
    return token ? token.trim().replace(/['"]+/g, '') : null;
  },

  // Decode JWT payload (base64 middle part)
  decodeJWT(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}

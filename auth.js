window.auth = {
  API_DOMAIN: 'https://zone01normandie.org/api/auth/signin', 

  async login(usernameOrEmail, password) {
    try {
      const authHeader = btoa(`${usernameOrEmail}:${password}`);
      const response = await fetch(`${this.API_DOMAIN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      });
  
      const textData = await response.text();
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${textData}`);
      }
  
      let token;
      try {
        const jsonData = JSON.parse(textData);
        token = jsonData.token || jsonData.jwt || textData;
      } catch {
        token = textData;
      }
  
      if (typeof token !== 'string' || token.split('.').length !== 3) {
        console.error("Token invalide reçu:", token);
        throw new Error("Le token reçu n'est pas un JWT valide");
      }
  
      localStorage.setItem('jwt', token.trim());
      return token;
    } catch (error) {
      console.error('Erreur de login:', error);
      throw error;
    }
  },


  logout() {
    localStorage.removeItem('jwt');
    window.location.reload();
  },

  isAuthenticated() {
    return !!localStorage.getItem('jwt');
  },

  getJWT() {
    const token = localStorage.getItem('jwt');
    return token ? token.trim().replace(/['"]+/g, '') : null;
  },

  decodeJWT(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
  
}

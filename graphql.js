window.graphql = {
  API_ENDPOINT: 'https://zone01normandie.org/api/graphql-engine/v1/graphql',

  async fetchGraphQL(query, variables = {}) {
    const jwt = auth.getJWT();
    if (!jwt) throw new Error('Not authenticated');
  
    const cleanToken = jwt.trim().replace(/['"]+/g, '');
  
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      },
      body: JSON.stringify({ query, variables })
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.message || `HTTP ${response.status}`);
    }
  
    return response.json();
  },


};

window.graphql = {
  // Define the GraphQL API endpoint
  API_ENDPOINT: 'https://zone01normandie.org/api/graphql-engine/v1/graphql',

  // Function to perform a GraphQL request
  async fetchGraphQL(query, variables = {}) {
    // Get the JWT token from the auth object
    const jwt = auth.getJWT();
    if (!jwt) throw new Error('Not authenticated');

    // Clean the token by removing any quotes and whitespace
    const cleanToken = jwt.trim().replace(/['"]+/g, '');

    // Send a POST request to the GraphQL endpoint
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}` // Include JWT in the Authorization header
      },
      body: JSON.stringify({ query, variables }) // Send the query and variables in the request body
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Throw the first error message from the response or a generic HTTP error
      throw new Error(errorData.errors?.[0]?.message || `HTTP ${response.status}`);
    }

    // Return the parsed JSON response
    return response.json();
  },
};

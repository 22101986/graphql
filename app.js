document.addEventListener('DOMContentLoaded', async function() {
  try {
    const token = localStorage.getItem('jwt');
    if (token && token.split('.').length !== 3) {
      localStorage.removeItem('jwt');
    }
  } catch (e) {
    console.error("Cleanup error:", e);
  }
  
  const app = document.getElementById('app');
  
  if (!auth.isAuthenticated()) {
    renderLoginPage(app);
  } else {
    await loadProfileData(app);
  }
});

function renderLoginPage(container) {
  container.innerHTML = `
    <div class="login-form card">
      <h2>Login</h2>
      <form id="loginForm">
        <div class="form-group">
          <label for="username">Username or Email</label>
          <input type="text" id="username" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" required>
        </div>
        <button type="submit" class="btn">Login</button>
        <div id="loginError" class="error" style="display: none;"></div>
      </form>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const errorElement = document.getElementById('loginError');
    errorElement.style.display = 'none';
    
    try {
      await auth.login(
        document.getElementById('username').value,
        document.getElementById('password').value
      );
      window.location.reload();
    } catch (error) {
      errorElement.textContent = error.message;
      errorElement.style.display = 'block';
    }
  });
}

async function loadProfileData(container) {
  try {
    const token = auth.getJWT();
    if (!token) {
      auth.logout();
      return renderLoginPage(container);
    }

    const result = await graphql.fetchGraphQL(`
      query GetFullProfile {
        user {
          login
          email
          firstName
          lastName
          createdAt
        }
        transactions: transaction(
          where: {type: {_eq: "xp"}},
          order_by: {createdAt: asc}
        ) {
          amount
          createdAt
          path
          campus
        }
        up: transaction_aggregate(
          where: {type: {_eq: "up"}}
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
        down: transaction_aggregate(
          where: {type: {_eq: "down"}}
        ) {
          aggregate {
            sum {
              amount
            }
          }
        }
        
      }
    `);

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    console.log(result.data)
    const user = result.data.user[0];
    const xpData = result.data.transactions;
    const upAmount = result.data.up.aggregate.sum.amount || 0;
    const downAmount = result.data.down.aggregate.sum.amount || 0;
    const totalXp = xpData.reduce((sum, t) => sum + t.amount, 0);
    let cursus = 0;
    let go = 0;
    let js = 0;
    let campus = "";
    let subjects = [];
    xpData.forEach((xp) => { 
      console.log(xp)
      if (xp.campus != campus) campus = xp.campus;
      subjects.push(`<strong>${xp.path.match(/\/([^\/]+)$/)[1]}:</strong> +${xp.amount}xp  ${new Date(xp.createdAt).toLocaleDateString()}`)
      if(xp.path.includes("/piscine-go")){
        go += xp.amount;
      } else if(xp.path.includes("/piscine-js/")) {
        js += xp.amount;
      } else {
        cursus += xp.amount;
      }
    })
    renderProfilePage(container, user, xpData, upAmount, downAmount,go , js, cursus, totalXp, campus, subjects.reverse());

  } catch (error) {
    console.error("Erreur détaillée:", error);
    container.innerHTML = `
      <div class="error">
        <h2>ERREUR</h2>
        <p>${error.message}</p>
        <button onclick="auth.logout()">Déconnexion</button>
      </div>
    `;
  }
}

function renderProfilePage(container, user, xpData, upAmount, downAmount, goXp, jsXp, cursusXp, totalXp, campus, subjects) {
  console.log(subjects)
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  container.innerHTML = `
    <header>
      <div class="container">
        <h1>${user.firstName || user.login}'s Profile</h1>
        <button onclick="auth.logout()" class="btn btn-danger">Logout</button>
      </div>
    </header>
    
    <main class="container">
      <div class="profile-grid">
        <div class="card">
          <h2>User Information</h2>
          <p><strong>Firstname:</strong> ${user.firstName}</p>
          <p><strong>Lastname:</strong> ${user.lastName}</p>
          <p><strong>Login:</strong> ${user.login}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Member since:</strong> ${new Date(user.createdAt).toLocaleString("en-EN", options)}</p>
          <p><strong>Campus: </strong> ${campus.charAt(0).toUpperCase() + campus.slice(1)}</p>
        </div>
        
        <div class="card">
          <h2>XP Summary</h2>
          <p><strong>Piscine-go:</strong> ${goXp < 1000 ? goXp : (goXp / 1000).toFixed() + "kB"}</p>
          <p><strong>Piscine-js:</strong> ${jsXp < 1000 ? jsXp : (jsXp / 1000).toFixed() + "kB"}</p>
          <p><strong>Cursus:</strong> ${cursusXp < 1000 ? cursusXp : (cursusXp / 1000).toFixed() + "kB"}</p>
          <p><strong>Total XP:</strong> ${totalXp >= 1000000 ? (totalXp / 1000000).toFixed(2) + "MB" : totalXp  < 1000 ? totalXp : (totalXp / 1000).toFixed() + "kB"}</p>
          <p><strong>Audit ratio:</strong> ${downAmount > 0 ? (upAmount / downAmount).toFixed(1) : 'N/A'}</p>
        </div>

        <div class="card">
          <h2>XP by project</h2>
          <ul id="xpProjects"></ul>
          <button id="btnProjects" class="btn" style="margin-top: 15px;">See more...</button>
         </div>
      </div>

      <div class="charts-container">
        <div class="card">
          <h2>Piscine Go Progress</h2>
          <div id="goChart" class="chart-container"></div>
        </div>
        
        <div class="card">
          <h2>Piscine JS Progress</h2>
          <div id="jsChart" class="chart-container"></div>
        </div>
        
        <div class="card">
          <h2>Cursus Progress</h2>
          <div id="cursusChart" class="chart-container"></div>
        </div>
      </div>
      
      <div class="card">
        <h2>Audit Ratio</h2>
        <div id="auditRatioChart" class="chart-container"></div>
      </div>

      <div class="projectsList">
          <button class="close-btn">&times;</button>
          <div class="projectsList-container">
              <div class="projectsList-header">
                  <h2>All XP Projects</h2>
              </div>
              <div class="projectsList-body">
                  <ul id="projectsList"></ul>
                  <div id="loadingIndicator" class="loading-indicator" style="display: none;">Loading more projects...</div>
              </div>
          </div>
      </div>

    </main>
  `;

  const projects = document.getElementById("xpProjects");
  
  for(let i = 0; i <= 3; i++) {
    projects.innerHTML += `<li style="list-style: none;">${subjects[i]}</li>`;
  }
  
  
  const goData = xpData.filter(xp => xp.path.includes("/piscine-go"));
  const jsData = xpData.filter(xp => xp.path.includes("/piscine-js/"));
  const cursusData = xpData.filter(xp => !xp.path.includes("/piscine-go") && !xp.path.includes("/piscine-js/"));

  if (goData.length > 0) {
    charts.createSingleXpLineChart(goData, 'goChart', '#4285F4');
  } else {
    document.getElementById('goChart').innerHTML = '<p>No Piscine Go data available</p>';
  }

  if (jsData.length > 0) {
    charts.createSingleXpLineChart(jsData, 'jsChart', '#FBBC05');
  } else {
    document.getElementById('jsChart').innerHTML = '<p>No Piscine JS data available</p>';
  }

  if (cursusData.length > 0) {
    charts.createSingleXpLineChart(cursusData, 'cursusChart', '#34A853');
  } else {
    document.getElementById('cursusChart').innerHTML = '<p>No Cursus data available</p>';
  }

  if (upAmount > 0 || downAmount > 0) {
    charts.createAuditRatioPieChart(upAmount, downAmount, 'auditRatioChart');
  } else {
    document.getElementById('auditRatioChart').innerHTML = '<p>No audit data available</p>';
  }
  const btnProjects = document.getElementById('btnProjects');
  const projectsList = document.querySelector('.projectsList');
  const projectsListUl = document.getElementById('projectsList');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const projectsListBody = document.querySelector('.projectsList-body');

  let currentIndex = 0;
  const batchSize = 20;
  let isLoading = false;

  function loadMoreProjects() {
      if (isLoading || currentIndex >= subjects.length) return;
      
      isLoading = true;
      loadingIndicator.style.display = 'block';
      
      setTimeout(() => {
          const fragment = document.createDocumentFragment();
          const endIndex = Math.min(currentIndex + batchSize, subjects.length);
          
          for (let i = currentIndex; i < endIndex; i++) {
              const li = document.createElement('li');
              li.innerHTML = subjects[i];
              fragment.appendChild(li);
          }
          
          projectsListUl.appendChild(fragment);
          currentIndex = endIndex;
          
          loadingIndicator.style.display = 'none';
          isLoading = false;
          
          if (currentIndex >= subjects.length) {
              const allLoaded = document.createElement('div');
              allLoaded.className = 'loading-indicator';
              allLoaded.textContent = 'All projects loaded!';
              projectsListUl.appendChild(allLoaded);
          }
      }, 300);
  }

  btnProjects.addEventListener('click', () => {
      projectsList.classList.add('active');
      projectsListUl.innerHTML = '';
      currentIndex = 0;
      loadMoreProjects();
  });

  projectsListBody.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = projectsListBody;
      const threshold = 100;
      
      if (scrollHeight - (scrollTop + clientHeight) < threshold) {
          loadMoreProjects();
      }
  });

  document.querySelector('.close-btn').addEventListener('click', () => {
      projectsList.classList.remove('active');
  });

  projectsList.addEventListener('click', (e) => {
      if (e.target === projectsList) {
          projectsList.classList.remove('active');
      }
  });
  }

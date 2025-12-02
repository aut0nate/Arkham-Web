(function () {
  const authSection = document.getElementById('auth-section');
  if (!authSection) return;

  const loginButton = document.getElementById('btn-login');
  const logoutButton = document.getElementById('btn-logout');
  const statusLabel = document.getElementById('auth-status');
  const profilePanel = document.getElementById('profile-panel');
  const claimsList = document.getElementById('profile-claims');
  const loadingState = document.getElementById('profile-loading');
  const errorState = document.getElementById('profile-error');

  const redirectKey = 'arkham-auth-return-to';
  let auth0Client;
  let authConfig;

  function sanitize(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.includes('${') ? '' : trimmed;
  }

  function parseInlineConfig() {
    const inlineConfig = document.getElementById('auth-config');
    if (!inlineConfig || !inlineConfig.textContent) return {};

    try {
      return JSON.parse(inlineConfig.textContent);
    } catch (err) {
      console.warn('Unable to parse inline Auth0 configuration', err);
      return {};
    }
  }

  async function fetchConfigFromApi() {
    try {
      const response = await fetch('/api/auth/config', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!response.ok) return {};
      return response.json();
    } catch (err) {
      console.warn('Unable to load Auth0 configuration from API', err);
      return {};
    }
  }

  async function loadAuthConfig() {
    const [inlineConfig, apiConfig] = await Promise.all([
      Promise.resolve(parseInlineConfig()),
      fetchConfigFromApi()
    ]);

    const merged = {
      ...inlineConfig,
      ...apiConfig
    };

    merged.domain = sanitize(merged.domain);
    merged.clientId = sanitize(merged.clientId);
    merged.audience = sanitize(merged.audience);

    if (!merged.domain || !merged.clientId) {
      throw new Error('Auth0 configuration is missing. Please set AUTH0_DOMAIN and AUTH0_CLIENT_ID.');
    }

    return merged;
  }

  function setButtonsEnabled(enabled) {
    loginButton.disabled = !enabled;
    logoutButton.disabled = !enabled;
  }

  function setStatus(message) {
    statusLabel.textContent = message;
  }

  function showLoading(message) {
    loadingState.hidden = false;
    loadingState.textContent = message || 'Loading...';
    errorState.hidden = true;
    profilePanel.hidden = true;
  }

  function showError(message) {
    errorState.hidden = false;
    errorState.textContent = message;
    loadingState.hidden = true;
    profilePanel.hidden = true;
    setButtonsEnabled(false);
    setStatus('Unable to sign in');
  }

  function normalizeClaim(value) {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const cleaned = value.filter(Boolean);
      return cleaned.length ? cleaned.join(', ') : undefined;
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function addClaim(label, value) {
    const normalized = normalizeClaim(value);
    if (!normalized) return;

    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    definition.textContent = normalized;

    claimsList.appendChild(term);
    claimsList.appendChild(definition);
  }

  function renderUser(user) {
    claimsList.innerHTML = '';

    if (!user) {
      setStatus('You are signed out.');
      profilePanel.hidden = true;
      loadingState.hidden = true;
      errorState.hidden = true;
      loginButton.disabled = false;
      logoutButton.disabled = true;
      return;
    }

    const tenantId =
      user['https://schemas.microsoft.com/identity/claims/tenantid'] ||
      user.tid ||
      user.tenantId;
    const roles =
      user['https://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      user.roles;
    const groups =
      user['https://schemas.microsoft.com/ws/2008/06/identity/claims/groups'] ||
      user.groups;

    addClaim('Subject', user.sub);
    addClaim('Name', user.name || user.given_name);
    addClaim('Email', user.email);
    addClaim('Tenant ID', tenantId);
    addClaim('Roles', roles);
    addClaim('Groups', groups);

    setStatus('You are signed in.');
    profilePanel.hidden = false;
    loadingState.hidden = true;
    errorState.hidden = true;
    loginButton.disabled = true;
    logoutButton.disabled = false;
  }

  async function handleRedirectCallback() {
    const query = window.location.search;
    const hash = window.location.hash;

    if (
      (query && (query.includes('code=') || query.includes('error='))) ||
      (hash && (hash.includes('code=') || hash.includes('error=')))
    ) {
      const urlToHandle = query && query.includes('code=') ? query : `?${hash.replace(/^#/, '')}`;

      try {
        await auth0Client.handleRedirectCallback(urlToHandle);
      } catch (err) {
        console.error('Error handling Auth0 redirect', err);
        throw err;
      }

      const target = sessionStorage.getItem(redirectKey) || window.location.pathname;
      window.history.replaceState({}, document.title, target);
      sessionStorage.removeItem(redirectKey);
    }
  }

  async function refreshSession() {
    const isAuthenticated = await auth0Client.isAuthenticated();

    if (!isAuthenticated) {
      renderUser(null);
      return;
    }

    const user = await auth0Client.getUser();
    renderUser(user);
  }

  async function startAuth() {
    showLoading('Loading authentication...');

    try {
      authConfig = await loadAuthConfig();

      if (typeof createAuth0Client !== 'function') {
        throw new Error('Auth0 SPA SDK is unavailable.');
      }

      auth0Client = await createAuth0Client({
        domain: authConfig.domain,
        clientId: authConfig.clientId,
        authorizationParams: {
          audience: authConfig.audience || undefined,
          redirect_uri: `${window.location.origin}${window.location.pathname}`
        },
        useRefreshTokens: true,
        cacheLocation: 'localstorage'
      });

      await handleRedirectCallback();
      await refreshSession();
      setButtonsEnabled(true);
    } catch (err) {
      console.error('Authentication initialisation failed', err);
      showError(err.message || 'Authentication failed.');
    }
  }

  loginButton.addEventListener('click', async () => {
    if (!auth0Client) return;

    try {
      setStatus('Redirecting to sign in...');
      sessionStorage.setItem(redirectKey, `${window.location.pathname}${window.location.search}`);
      await auth0Client.loginWithRedirect({
        authorizationParams: {
          audience: authConfig.audience || undefined,
          redirect_uri: `${window.location.origin}${window.location.pathname}`
        }
      });
    } catch (err) {
      console.error('Login failed', err);
      showError('Unable to start sign in.');
    }
  });

  logoutButton.addEventListener('click', async () => {
    if (!auth0Client) return;

    try {
      setStatus('Signing out...');
      await auth0Client.logout({
        logoutParams: {
          returnTo: `${window.location.origin}${window.location.pathname}`
        }
      });
      renderUser(null);
    } catch (err) {
      console.error('Logout failed', err);
      showError('Unable to sign out.');
    }
  });

  startAuth();
})();

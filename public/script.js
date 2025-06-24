let token = null;

async function register() {
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.message || data.error);
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = '/chatbot.html';
  }
  console.log(data);
}

async function getAgentInfo() {
  const res = await fetch('/auth/agent-info', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  document.getElementById('agentOutput').textContent = JSON.stringify(data, null, 2);
}

function logout() {
  token = null;
  document.getElementById('agentInfo').classList.add('hidden');
  document.getElementById('register').classList.remove('hidden');
  document.getElementById('login').classList.remove('hidden');
}

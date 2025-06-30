const api = location.origin + '/api/auth';
const form = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-btn');
const title = document.getElementById('form-title');
const msg = document.getElementById('msg');

let isLogin = false;

const saveAndRedirect = (data) => {
  localStorage.setItem('token', data.token);
  window.location.href = 'chat.html';
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  try {
    const res = await fetch(api + (isLogin ? '/login' : '/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    if (isLogin) {
      saveAndRedirect(data);
    } else {
      msg.style.color = 'green';
      msg.textContent = 'Registered! You can now log in.';
      toggleMode();
    }
  } catch (err) {
    msg.style.color = 'crimson';
    msg.textContent = err.message;
  }
});

const toggleMode = () => {
  isLogin = !isLogin;

  document.getElementById('name').style.display = isLogin ? 'none' : 'block';
  title.textContent = isLogin ? 'Welcome back' : 'Create account';
  document.getElementById('submit-btn').textContent = isLogin ? 'Log in' : 'Register';
  toggleBtn.textContent = isLogin ? 'Create one' : 'Log in';
  msg.textContent = '';
};

toggleBtn.addEventListener('click', (e) => {
  e.preventDefault();
  toggleMode();
});

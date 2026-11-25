// Shared theme (existing logic, now used on every page).
if (localStorage.getItem('hf_dark') === '1') document.body.classList.add('dark-mode');
document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
  btn.onclick = () => {
    const dark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('hf_dark', dark ? '1' : '0');
  };
});
const byId = id => document.getElementById(id);
const showErr = t => { const msg = byId('authMsg'); msg.className = 'alert alert-error'; msg.textContent = t; };
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const dashboard = role => role.toLowerCase() + '-dashboard.html';
if (byId('loginForm')) {
  const savedAcc = JSON.parse(localStorage.getItem('hf_account') || 'null');
  const activeSess = sessionStorage.getItem('hf_session');
  if (activeSess) byId('storageStatus').textContent = 'Session: ' + activeSess;
  else if (savedAcc) byId('storageStatus').textContent = 'Saved: ' + savedAcc.name + ' (' + savedAcc.role + ')';
  byId('loginForm').onsubmit = e => {
    e.preventDefault();
    if (!emailOk(byId('loginEmail').value)) return showErr('Enter a valid email address.');
    if (byId('loginPass').value.length < 6) return showErr('Password must be at least 6 characters.');
    const email = byId('loginEmail').value.trim();
    sessionStorage.setItem('hf_session', email);
    location.href = dashboard(savedAcc && savedAcc.email === email ? savedAcc.role : 'Patient');
  };
  byId('signupForm').onsubmit = e => e.preventDefault();
  document.querySelectorAll('#signupForm [data-role]').forEach(btn => {
    btn.onclick = () => {
      if (byId('regName').value.trim().length < 2) return showErr('Enter your full name.');
      if (!emailOk(byId('regEmail').value)) return showErr('Enter a valid email address.');
      if (byId('regPhone').value.trim().length < 7) return showErr('Enter a valid phone number.');
      if (byId('regPass').value.length < 6) return showErr('Password must be at least 6 characters.');
      const acc = {name: byId('regName').value.trim(), email: byId('regEmail').value.trim(), role: btn.dataset.role};
      if (acc.role !== 'Patient') {
        sessionStorage.setItem('hf_pending', JSON.stringify(acc));
        location.href = acc.role.toLowerCase() + '-signup.html';
        return;
      }
      localStorage.setItem('hf_account', JSON.stringify(acc));
      sessionStorage.setItem('hf_session', acc.email + ' (' + acc.role + ')');
      location.href = dashboard(acc.role);
    };
  });
}
// Additional registration details required for the two new pages.
if (byId('detailsForm')) {
  const form = byId('detailsForm');
  const acc = JSON.parse(sessionStorage.getItem('hf_pending') || 'null');
  if (!acc || acc.role !== form.dataset.role) location.replace('index.html');
  else form.onsubmit = e => {
    e.preventDefault();
    const inputs = [...form.querySelectorAll('input')];
    if (inputs.some(i => !i.value.trim())) return showErr('Please complete all account details.');
    if (byId('fee') && Number(byId('fee').value) < 0) return showErr('Enter a valid consultation fee.');
    acc.details = Object.fromEntries(inputs.map(i => [i.id, i.value.trim()]));
    localStorage.setItem('hf_account', JSON.stringify(acc));
    sessionStorage.setItem('hf_session', acc.email + ' (' + acc.role + ')');
    sessionStorage.removeItem('hf_pending');
    location.href = dashboard(acc.role);
  };
}
if (byId('bookForm')) {
  const doc = byId('doc'), date = byId('date'), msgBox = byId('msgBox'), lastBookingInfo = byId('lastBookingInfo');
  const selectedDoctor = new URLSearchParams(location.search).get('doctor');
  if ([...doc.options].some(o => o.value === selectedDoctor)) doc.value = selectedDoctor;
  const last = sessionStorage.getItem('hakimflow_last_booking') || localStorage.getItem('hakimflow_last_booking');
  if (last) lastBookingInfo.textContent = 'Last booking: ' + last;
  let slot = '';
  document.querySelectorAll('.slot').forEach(b => b.onclick = () => {
    if (b.dataset.booked) { msgBox.className = 'alert alert-error'; msgBox.textContent = '10:00 AM is already booked.'; return; }
    msgBox.className = 'alert hidden';
    document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
    b.classList.add('selected'); slot = b.textContent;
  });
  byId('bookForm').onsubmit = e => {
    e.preventDefault();
    const error = t => { msgBox.className = 'alert alert-error'; msgBox.textContent = t; };
    if (!doc.value) return error('Please choose a doctor.');
    if (!date.value) return error('Please choose a date.');
    if (!slot) return error('Please choose an available time slot.');
    const summary = doc.selectedOptions[0].textContent.split('—')[0].trim() + ' on ' + date.value + ' at ' + slot;
    localStorage.setItem('hakimflow_last_booking', summary);
    sessionStorage.setItem('hakimflow_last_booking', summary);
    lastBookingInfo.textContent = 'Last booking: ' + summary;
    msgBox.className = 'alert alert-success'; msgBox.textContent = '✓ Booked: ' + summary;
  };
}

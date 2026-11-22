import assert from 'assert';

async function testReviewerState() {
  // Login as Debajit (official reviewer)
  const loginRes = await fetch('http://127.0.0.1:8787/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reviewer@demo.dharitrisentu.test', password: 'Demo123!' })
  });
  assert.strictEqual(loginRes.status, 200);
  const cookie = loginRes.headers.get('set-cookie');
  const loginData = await loginRes.json();

  console.log('Logged in as reviewer:', loginData.user.name);
  console.log('Listings in reviewer state:', loginData.state.listings.length);
  console.log('Discrepancies in reviewer state:', loginData.state.discrepancies.length);
  console.log('Cases in reviewer state:', loginData.state.cases.length);
  console.log('Audit events in reviewer state:', loginData.state.auditEvents.length);

  assert(loginData.state.listings.length > 0, 'Reviewer must see listings');
  assert(loginData.state.discrepancies.length > 0, 'Reviewer must see discrepancies');
  assert(loginData.state.cases.length > 0, 'Reviewer must see cases');
  assert(loginData.state.auditEvents.length > 0, 'Reviewer must see audit events');

  console.log('✓ All reviewer collections populated successfully!');
}

testReviewerState().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

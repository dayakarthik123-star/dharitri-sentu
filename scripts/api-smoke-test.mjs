import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const tmp=await mkdtemp(path.join(os.tmpdir(),'dharitri-api-test-'));
const port=18870+Math.floor(Math.random()*1000);
const serverPath=path.resolve('server/index.mjs');
const child=spawn(process.execPath,[serverPath],{env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DATA_DIR:tmp,DB_PATH:path.join(tmp,'test.sqlite'),NODE_ENV:'test',ENABLE_DEMO_ACCOUNTS:'true',CLAMSCAN_BIN:'',ALLOWED_ORIGINS:`http://127.0.0.1:${port}`},stdio:['ignore','pipe','pipe']});
let logs=''; child.stdout.on('data',x=>logs+=x.toString()); child.stderr.on('data',x=>logs+=x.toString());
const base=`http://127.0.0.1:${port}`;
async function waitForServer(){for(let i=0;i<80;i++){if(child.exitCode!==null)throw new Error(`Server exited early: ${logs}`);try{const r=await fetch(`${base}/api/health`);if(r.ok)return;}catch{} await new Promise(r=>setTimeout(r,125));}throw new Error(`Server did not start: ${logs}`)}
function cookieOf(res){return (res.headers.get('set-cookie')||'').split(';')[0]}
async function request(route,{cookie,method='GET',body,headers={}}={}){const h=new Headers(headers);if(cookie)h.set('Cookie',cookie);if(body!==undefined && !(body instanceof FormData) && !h.has('Content-Type'))h.set('Content-Type','application/json');return fetch(`${base}${route}`,{method,headers:h,body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body),redirect:'manual'});}
try {
  await waitForServer();
  const health=await request('/api/health'); assert.equal(health.status,200); const healthJson=await health.json(); assert.equal(healthJson.database,'sqlite');
  const bad=await request('/api/auth/login',{method:'POST',body:{email:'reviewer@demo.dharitrisentu.test',password:'WrongPassword!'}}); assert.equal(bad.status,401,'wrong password must be rejected');
  const login=await request('/api/auth/login',{method:'POST',body:{email:'seller@demo.dharitrisentu.test',password:'Demo123!'}}); assert.equal(login.status,200); const cookie=cookieOf(login); assert.ok(cookie.startsWith('ds_session='));
  const me=await request('/api/auth/me',{cookie}); assert.equal(me.status,200); assert.equal((await me.json()).user.role,'seller');
  const fileData=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n','utf8');
  const form=new FormData(); form.set('file',new Blob([fileData],{type:'application/pdf'}),'sample.pdf'); form.set('title','Smoke test deed'); form.set('category','Sale Deed (Demo)'); form.set('parcelId','AS-SMOKE-001');
  const up=await request('/api/documents',{method:'POST',cookie,body:form}); assert.equal(up.status,201); const uploaded=await up.json(); assert.equal(uploaded.document.scanStatus,'Pending'); assert.equal(uploaded.document.sha256Hash,crypto.createHash('sha256').update(fileData).digest('hex'));
  const share=await request(`/api/documents/${uploaded.document.id}/share`,{method:'POST',cookie,body:{targetEmail:'buyer@demo.dharitrisentu.test',expiresInDays:14}}); assert.equal(share.status,423,'documents must not be shared while antivirus scan is pending');
  const content=await request(`/api/documents/${uploaded.document.id}/content`,{cookie}); assert.equal(content.status,423,'quarantined files must not be served');
  const unauth=await request(`/api/documents/${uploaded.document.id}/content`); assert.equal(unauth.status,401,'document content must require a session');
  const forbidden=await request(`/api/documents/${uploaded.document.id}/review`,{method:'POST',cookie,body:{outcome:'Approved'}}); assert.equal(forbidden.status,403,'seller cannot review documents');
  // A seller's land photograph must be encrypted at rest, hashed from bytes, and withheld while scanning is unavailable.
  const pngData=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222]);
  const photoForm=new FormData(); photoForm.set('file',new Blob([pngData],{type:'image/png'}),'plot.png');
  const photoUp=await request('/api/listing-media',{method:'POST',cookie,body:photoForm}); assert.equal(photoUp.status,201,`photo upload must be accepted: ${await photoUp.clone().text()}`);
  const photoJson=await photoUp.json(); assert.equal(photoJson.media.sha256Hash,crypto.createHash('sha256').update(pngData).digest('hex')); assert.equal(photoJson.media.scanStatus,'Pending');
  const encryptedPath=path.join(tmp,'quarantine',`${photoJson.media.fileId}.png.enc`); const encryptedBytes=await import('node:fs/promises').then(m=>m.readFile(encryptedPath));
  assert.equal(encryptedBytes.subarray(0,4).toString(),'DSE1','stored photo must use the authenticated-encryption envelope'); assert.notDeepEqual(encryptedBytes,pngData,'stored content must not be plaintext');
  const photoContent=await request(`/api/listing-media/${photoJson.media.fileId}/content`,{cookie}); assert.equal(photoContent.status,423,'quarantined photos must not be served');
  const photoRescan=await request(`/api/listing-media/${photoJson.media.fileId}/rescan`,{method:'POST',cookie}); assert.equal(photoRescan.status,503,'rescan must fail closed when ClamAV is not configured');
  const state=await request('/api/state',{cookie}); assert.equal(state.status,200); const stateJson=await state.json(); assert.ok(stateJson.state.listings.length>=1);
  const status=await request('/api/integrations/status'); assert.equal(status.status,200); const integrations=await status.json(); assert.equal(integrations.integrations.assamLandRecords.configured,false,'official land records must be marked disconnected without authorised credentials');

  // --- Buyer-Seller Chat Message Attribution Live API Integration Tests ---
  const buyerLogin = await request('/api/auth/login', { method: 'POST', body: { email: 'buyer@demo.dharitrisentu.test', password: 'Demo123!' } });
  assert.equal(buyerLogin.status, 200, 'buyer login must succeed');
  const buyerCookie = cookieOf(buyerLogin);

  // 1. Buyer initiates inquiry: senderId must be usr-buyer-1 and senderRole must be buyer
  const inqRes = await request('/api/inquiries', { method: 'POST', cookie: buyerCookie, body: { listingId: 'lst-1', content: 'Smoke test buyer inquiry' } });
  assert.equal(inqRes.status, 201, 'inquiry creation must succeed');
  const inqJson = await inqRes.json();
  assert.equal(inqJson.message.senderRole, 'buyer', 'inquiry senderRole must be buyer');
  assert.equal(inqJson.message.senderId, 'usr-buyer-1', 'inquiry senderId must be usr-buyer-1');

  // 2. Seller reads conversation: authorized access
  const convRes = await request(`/api/conversations/${inqJson.conversationId}/messages`, { cookie });
  assert.equal(convRes.status, 200, 'seller must be authorized to read conversation');
  const convJson = await convRes.json();
  assert.ok(convJson.messages.some(m => m.senderRole === 'buyer' && m.content === 'Smoke test buyer inquiry'));

  // 3. Seller replies: senderId must be usr-seller-1 and senderRole must be seller
  const replyRes = await request(`/api/conversations/${inqJson.conversationId}/messages`, { method: 'POST', cookie, body: { content: 'Smoke test seller reply' } });
  assert.equal(replyRes.status, 201, 'seller reply must succeed');
  const replyJson = await replyRes.json();
  assert.equal(replyJson.message.senderRole, 'seller', 'reply senderRole must be seller');
  assert.equal(replyJson.message.senderId, 'usr-seller-1', 'reply senderId must be usr-seller-1');

  // 4. Anti-spoofing verification: client cannot spoof senderRole or senderId
  const spoofRes = await request('/api/inquiries', { method: 'POST', cookie: buyerCookie, body: { listingId: 'lst-1', content: 'Spoof test', senderRole: 'seller', senderId: 'usr-seller-1' } });
  assert.equal(spoofRes.status, 201);
  const spoofJson = await spoofRes.json();
  assert.equal(spoofJson.message.senderRole, 'buyer', 'backend must strictly reject client-supplied senderRole');
  assert.equal(spoofJson.message.senderId, 'usr-buyer-1', 'backend must strictly reject client-supplied senderId');

  // 5. Canonical Map Listings API verification
  const mapListingsRes = await request('/api/map/listings', { cookie });
  assert.equal(mapListingsRes.status, 200, 'map listings endpoint must return HTTP 200');
  const mapListingsJson = await mapListingsRes.json();
  assert.ok(Array.isArray(mapListingsJson.listings), 'map listings must be an array');
  assert.ok(mapListingsJson.listings.length >= 1, 'must contain eligible listings');
  const sampleMapListing = mapListingsJson.listings[0];
  assert.ok(sampleMapListing.id, 'must include listing id');
  assert.ok(sampleMapListing.title, 'must include title');
  assert.ok(sampleMapListing.district, 'must include district');
  assert.ok(sampleMapListing.village, 'must include village');
  assert.ok(sampleMapListing.askingPriceINR > 0, 'must include valid price');
  assert.ok(sampleMapListing.areaBigha > 0, 'must include valid area');
  assert.ok(sampleMapListing.status, 'must include status');
  assert.ok(typeof sampleMapListing.hasCoordinates === 'boolean', 'must include coordinate flag');

  console.log('API smoke tests passed: health, password rejection, session auth, document and photo byte hashes, AES-256-GCM storage, quarantine enforcement, private content, role checks, state access, integration status, buyer-seller chat message attribution, and canonical map listings API.');
} catch(err) { console.error(err); console.error(logs); process.exitCode=1; }
finally {
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    const finish = () => { clearTimeout(timer); resolve(); };
    child.once('exit', finish);
    const timer = setTimeout(() => { child.kill('SIGKILL'); finish(); }, 2000);
  });
  await rm(tmp,{recursive:true,force:true});
}

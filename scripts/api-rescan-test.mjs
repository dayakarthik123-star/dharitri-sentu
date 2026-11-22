import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, chmod, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

if (process.platform === 'win32') {
  console.log('Skipping scanner rescan integration test on Windows (the test scanner uses a POSIX executable script).');
  process.exit(0);
}
const tmp = await mkdtemp(path.join(os.tmpdir(), 'dharitri-rescan-test-'));
const port = 19870 + Math.floor(Math.random() * 500);
const passFlag = path.join(tmp, 'scanner-pass');
const scanner = path.join(tmp, 'fake-clamscan.sh');
await writeFile(scanner, `#!/bin/sh\nif [ -f '${passFlag.replaceAll("'", "'\\''")}' ]; then exit 0; fi\nexit 2\n`, { mode: 0o700 });
await chmod(scanner, 0o700);
const child = spawn(process.execPath, [path.resolve('server/index.mjs')], {
  env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', DATA_DIR: tmp, DB_PATH: path.join(tmp, 'test.sqlite'), NODE_ENV: 'test', ENABLE_DEMO_ACCOUNTS: 'true', CLAMSCAN_BIN: scanner, ALLOWED_ORIGINS: `http://127.0.0.1:${port}` },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = ''; child.stdout.on('data', x => logs += x.toString()); child.stderr.on('data', x => logs += x.toString());
const base = `http://127.0.0.1:${port}`;
const pause = ms => new Promise(r => setTimeout(r, ms));
async function waitForServer() { for (let i=0;i<80;i++) { if(child.exitCode!==null) throw new Error(`Server exited early: ${logs}`); try { const r=await fetch(`${base}/api/health`); if(r.ok)return; } catch {} await pause(125); } throw new Error(`Server did not start: ${logs}`); }
const cookieOf = res => (res.headers.get('set-cookie') || '').split(';')[0];
async function request(route, { cookie, method='GET', body, headers={} }={}) {
  const h = new Headers(headers); if(cookie)h.set('Cookie',cookie);
  if(body!==undefined && !(body instanceof FormData) && !h.has('Content-Type'))h.set('Content-Type','application/json');
  return fetch(`${base}${route}`, { method, headers:h, body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body), redirect:'manual' });
}
async function login(email) { const r=await request('/api/auth/login',{method:'POST',body:{email,password:'Demo123!'}}); assert.equal(r.status,200,`login failed: ${await r.clone().text()}`); return cookieOf(r); }
try {
  await waitForServer();
  const sellerCookie = await login('seller@demo.dharitrisentu.test');
  const buyerCookie = await login('buyer@demo.dharitrisentu.test');
  const reviewerCookie = await login('reviewer@demo.dharitrisentu.test');

  const pdf = Buffer.from('%PDF-1.7\n% rescan integration test\n%%EOF\n');
  const docForm = new FormData(); docForm.set('file', new Blob([pdf], {type:'application/pdf'}), 'rescan.pdf'); docForm.set('title','Rescan integration'); docForm.set('category','Sale Deed (Demo)'); docForm.set('parcelId','AS-RESCAN-TEST-001');
  const docUpload = await request('/api/documents',{method:'POST',cookie:sellerCookie,body:docForm}); assert.equal(docUpload.status,201,await docUpload.clone().text());
  const doc = (await docUpload.json()).document; assert.equal(doc.scanStatus,'Scan Error');
  const encryptedDoc = await readFile(path.join(tmp,'quarantine',`${doc.fileId}.pdf.enc`)); assert.equal(encryptedDoc.subarray(0,4).toString(),'DSE1'); assert.notDeepEqual(encryptedDoc,pdf);
  await writeFile(passFlag,'pass');
  const docRescan = await request(`/api/documents/${doc.fileId}/rescan`,{method:'POST',cookie:sellerCookie}); assert.equal(docRescan.status,200,await docRescan.clone().text()); assert.equal((await docRescan.json()).document.scanStatus,'Passed');
  const docContent = await request(`/api/documents/${doc.fileId}/content`,{cookie:sellerCookie}); assert.equal(docContent.status,200); assert.deepEqual(Buffer.from(await docContent.arrayBuffer()),pdf);
  const grant = await request(`/api/documents/${doc.fileId}/share`,{method:'POST',cookie:sellerCookie,body:{targetEmail:'buyer@demo.dharitrisentu.test',expiresInDays:2}}); assert.equal(grant.status,200,await grant.clone().text());
  const sharedContent = await request(`/api/documents/${doc.fileId}/content`,{cookie:buyerCookie}); assert.equal(sharedContent.status,200);
  const revoke = await request(`/api/documents/${doc.fileId}/shares`,{method:'DELETE',cookie:sellerCookie}); assert.equal(revoke.status,200);
  const revokedContent = await request(`/api/documents/${doc.fileId}/content`,{cookie:buyerCookie}); assert.equal(revokedContent.status,403,'revoked share must deny future content requests');

  await rm(passFlag,{force:true});
  const png = Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222]);
  const photoForm = new FormData(); photoForm.set('file',new Blob([png],{type:'image/png'}),'parcel.png');
  const photoUpload = await request('/api/listing-media',{method:'POST',cookie:sellerCookie,body:photoForm}); assert.equal(photoUpload.status,201,await photoUpload.clone().text());
  const photo = (await photoUpload.json()).media; assert.equal(photo.scanStatus,'Scan Error');
  const sellerStateRes = await request('/api/state',{cookie:sellerCookie}); const sellerState = (await sellerStateRes.json()).state;
  const reviewerMe = await request('/api/auth/me',{cookie:reviewerCookie}); const reviewerUser = (await reviewerMe.json()).user;
  const baseListing = sellerState.listings[0];
  const newListing = { ...baseListing, id:'lst-rescan-integration', title:'Rescan Test Parcel', parcelId:'AS-RESCAN-TEST-001', sellerEmail:'seller@demo.dharitrisentu.test', sellerName:'Demo Seller', sellerDeclarationAccepted:true, assignedReviewerId:reviewerUser.id, status:'Awaiting Review', media:[{...photo,isCover:true,caption:'Rescan test parcel image'}] };
  const createState = {...sellerState, listings:[newListing,...sellerState.listings]};
  const createdRes = await request('/api/state',{method:'PUT',cookie:sellerCookie,body:{state:createState}}); assert.equal(createdRes.status,200,await createdRes.clone().text());
  // Trusted fixture assignment: seller-submitted payloads cannot assign themselves to reviewers.
  const testDb = new DatabaseSync(path.join(tmp,'test.sqlite')); const persisted = JSON.parse(testDb.prepare('SELECT state_json FROM app_state WHERE id=1').get().state_json);
  const storedListing = persisted.listings.find(x=>x.id===newListing.id); storedListing.assignedReviewerId = reviewerUser.id;
  testDb.prepare('UPDATE app_state SET state_json=? WHERE id=1').run(JSON.stringify(persisted)); testDb.close();
  const reviewerStateRes = await request('/api/state',{cookie:reviewerCookie}); const reviewerState = (await reviewerStateRes.json()).state;
  const pendingListing = reviewerState.listings.find(x=>x.id===newListing.id); assert.ok(pendingListing,'listing should be stored server-side'); pendingListing.status='Approved for Listing';
  const blockedRes = await request('/api/state',{method:'PUT',cookie:reviewerCookie,body:{state:reviewerState}}); assert.equal(blockedRes.status,200); const blockedState=(await blockedRes.json()).state; assert.equal(blockedState.listings.find(x=>x.id===newListing.id).status,'Under Review','publication gate must block unscanned imagery');
  await writeFile(passFlag,'pass');
  const photoRescan = await request(`/api/listing-media/${photo.fileId}/rescan`,{method:'POST',cookie:sellerCookie}); assert.equal(photoRescan.status,200,await photoRescan.clone().text());
  const reviewerBeforeDocApprovalRes = await request('/api/state',{cookie:reviewerCookie}); const reviewerBeforeDocApproval=(await reviewerBeforeDocApprovalRes.json()).state; reviewerBeforeDocApproval.listings.find(x=>x.id===newListing.id).status='Approved for Listing';
  const noDocApprovalRes = await request('/api/state',{method:'PUT',cookie:reviewerCookie,body:{state:reviewerBeforeDocApproval}}); assert.equal(noDocApprovalRes.status,200); const noDocApprovalState=(await noDocApprovalRes.json()).state; const stillUnderReview=noDocApprovalState.listings.find(x=>x.id===newListing.id); assert.equal(stillUnderReview.status,'Under Review','publication must remain blocked until a same-parcel document is reviewer-approved'); assert.match(stillUnderReview.rejectionReason,/document for this exact parcel/i);
  const reviewerShare = await request(`/api/documents/${doc.fileId}/share`,{method:'POST',cookie:sellerCookie,body:{targetEmail:'reviewer@demo.dharitrisentu.test',expiresInDays:2}}); assert.equal(reviewerShare.status,200,await reviewerShare.clone().text());
  const docReview = await request(`/api/documents/${doc.fileId}/review`,{method:'POST',cookie:reviewerCookie,body:{outcome:'Approved',note:'Smoke-test reviewer approval after scanning.'}}); assert.equal(docReview.status,200,await docReview.clone().text());
  const reviewerFreshRes = await request('/api/state',{cookie:reviewerCookie}); const reviewerFresh=(await reviewerFreshRes.json()).state; reviewerFresh.listings.find(x=>x.id===newListing.id).status='Approved for Listing';
  const publishedRes = await request('/api/state',{method:'PUT',cookie:reviewerCookie,body:{state:reviewerFresh}}); assert.equal(publishedRes.status,200); const published=(await publishedRes.json()).state; assert.equal(published.listings.find(x=>x.id===newListing.id).status,'Approved for Listing','publication allowed only after both photo scan and same-parcel document review pass');
  const publicPhoto = await request(`/api/listing-media/${photo.fileId}/content`); assert.equal(publicPhoto.status,200,'a clean photo may be public only after its listing is published'); assert.deepEqual(Buffer.from(await publicPhoto.arrayBuffer()),png);
  console.log('Rescan integration tests passed: quarantined document/photo rescans, encrypted-at-rest storage, content after clean scan, server-enforced share/revoke and scan+review publication gates.');
} catch (err) { console.error(err); console.error(logs); process.exitCode=1; }
finally {
  child.kill('SIGTERM'); await new Promise(resolve=>{ if(child.exitCode!==null)return resolve(); const done=()=>{clearTimeout(timer);resolve();}; child.once('exit',done); const timer=setTimeout(()=>{child.kill('SIGKILL');done();},2000); }); await rm(tmp,{recursive:true,force:true});
}

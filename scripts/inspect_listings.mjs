import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('server/storage/dharitri.sqlite');
const stateRow = db.prepare('SELECT state_json FROM app_state WHERE id=1').get();
if (stateRow) {
  const state = JSON.parse(stateRow.state_json);
  console.log('Total listings in state:', state.listings ? state.listings.length : 0);
  (state.listings || []).forEach(l => {
    console.log(`- ID: ${l.id} | Title: "${l.title}" | Status: "${l.status}" | Seller: "${l.sellerEmail}" | AssignedReviewer: "${l.assignedReviewerId}" / "${l.assignedReviewerEmail}"`);
  });
}

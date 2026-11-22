import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('server/storage/dharitri.sqlite');
const row = db.prepare('SELECT state_json FROM app_state WHERE id = 1').get();

if (row && row.state_json) {
  const state = JSON.parse(row.state_json);
  let changed = false;

  (state.enquiries || []).forEach((e) => {
    const isChabua = e.listingTitle?.toLowerCase().includes('tea') || e.parcelId === 'AS-DBR-008' || e.listingId === 'lst-3';
    const defaultSeller = isChabua ? 'Monideepa Gogoi' : 'Pranabjyoti Kalita';
    const defaultSellerEmail = isChabua ? 'monideepa@dharitrisentu.in' : 'pranabjyoti@dharitrisentu.in';

    (e.replies || []).forEach((r) => {
      if (r.senderRole === 'seller') {
        if (!r.senderName || r.senderName.toLowerCase().includes('ananya')) {
          console.log(`Fixing seller reply "${r.message}" from "${r.senderName}" to "${defaultSeller}"`);
          r.senderName = defaultSeller;
          r.senderEmail = defaultSellerEmail;
          changed = true;
        }
      } else if (r.senderRole === 'buyer') {
        if (!r.senderName || r.senderName.toLowerCase().includes('kalita') || r.senderName.toLowerCase().includes('gogoi')) {
          console.log(`Fixing buyer reply "${r.message}" from "${r.senderName}" to "Ananya Baruah"`);
          r.senderName = 'Ananya Baruah';
          r.senderEmail = 'ananya@dharitrisentu.in';
          changed = true;
        }
      }
    });
  });

  if (changed) {
    db.prepare('UPDATE app_state SET state_json = ?, updated_at = ? WHERE id = 1').run(JSON.stringify(state), new Date().toISOString());
    console.log('Database successfully updated with clean sender names!');
  } else {
    console.log('No corrupted sender names in database.');
  }
} else {
  console.log('No state_json found.');
}

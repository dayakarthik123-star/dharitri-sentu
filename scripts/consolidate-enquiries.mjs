import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('server/storage/dharitri.sqlite');
const row = db.prepare('SELECT state_json FROM app_state WHERE id = 1').get();

if (row && row.state_json) {
  const state = JSON.parse(row.state_json);
  const enquiries = state.enquiries || [];
  
  const unifiedMap = new Map();

  for (const enq of enquiries) {
    const propKey = (enq.listingId || enq.parcelId || 'lst-1').toLowerCase();
    if (!unifiedMap.has(propKey)) {
      unifiedMap.set(propKey, {
        ...enq,
        replies: [...(enq.replies || [])]
      });
    } else {
      const target = unifiedMap.get(propKey);
      // Prefer ENQ-001 or ENQ-002 as the canonical ID
      if (enq.id.startsWith('ENQ-00') && !target.id.startsWith('ENQ-00')) {
        target.id = enq.id;
      }
      // If this enquiry had an original message different from target, merge it
      if (enq.message && enq.message.trim() !== target.message?.trim()) {
        const alreadyHas = target.replies.some((r) => r.message?.trim() === enq.message?.trim());
        if (!alreadyHas) {
          target.replies.push({
            id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderEmail: enq.buyerEmail || 'ananya@dharitrisentu.in',
            senderName: enq.buyerName || 'Ananya Baruah',
            senderRole: 'buyer',
            message: enq.message,
            timestamp: enq.createdAt || new Date().toISOString()
          });
        }
      }
      // Merge replies
      for (const r of (enq.replies || [])) {
        const alreadyHas = target.replies.some((tr) => tr.message?.trim() === r.message?.trim() && tr.senderRole === r.senderRole);
        if (!alreadyHas) {
          target.replies.push(r);
        }
      }
    }
  }

  const consolidated = Array.from(unifiedMap.values());
  state.enquiries = consolidated;
  db.prepare('UPDATE app_state SET state_json = ?, updated_at = ? WHERE id = 1').run(JSON.stringify(state), new Date().toISOString());
  console.log(`Consolidated ${enquiries.length} enquiries down to ${consolidated.length} unique threads!`);
  consolidated.forEach((c) => console.log('Thread:', c.id, c.listingTitle, 'replies:', (c.replies || []).length));
} else {
  console.log('No state row found');
}

const fs = require('fs');
const path = require('path');

const filePath = path.resolve('server/index.mjs');
let code = fs.readFileSync(filePath, 'utf8');

const askMarker = "if (method === 'POST' && pathname === '/api/ai/ask') {";
const mediaMarker = "if (method === 'POST' && pathname === '/api/listing-media') {";

const askIdx = code.indexOf(askMarker);
const mediaIdx = code.indexOf(mediaMarker);

if (askIdx === -1 || mediaIdx === -1) {
  console.error('Could not locate markers:', { askIdx, mediaIdx });
  process.exit(1);
}

const replacement = `if (method === 'POST' && pathname === '/api/ai/ask') {
    const b = await jsonBody(req);
    const message = String(b.message || '').trim().slice(0, 2500);
    const language = ['en', 'as', 'hi'].includes(b.language) ? b.language : 'en';
    const context = String(b.context || '').slice(0, 500);

    if (message.length < 2) return fail(res, 400, 'Enter a question with at least two characters.', 'VALIDATION');

    const ip = String(req.socket.remoteAddress || 'unknown');
    const rateCheck = checkAiRateLimit(ip, 15);
    if (!rateCheck.allowed) {
      return fail(res, 429, 'AI request limit reached. Please wait a minute before asking again.', 'AI_RATE_LIMIT');
    }

    try {
      const result = await askOpenRouter({
        message,
        language,
        context,
      });

      const user = getUserFromRequest(req);
      if (user) {
        const state = getStateRow();
        appendAudit(state, user, 'AI_QUESTION_ASKED', 'ask-dharitri', \`Asked Ask Dharitri in \${language} (Model: \${result.model}).\`);
        saveState(state);
      }

      return json(res, 200, {
        ok: true,
        answer: result.answer,
        model: result.model,
        language: result.language,
        sourceStatus: result.sourceStatus,
        isFallback: result.isFallback || false,
        generatedAt: now(),
      });
    } catch (error) {
      const status = error.status || 502;
      const code = error.code || 'OPENROUTER_REQUEST_FAILED';
      return fail(res, status, error.message || 'OpenRouter could not complete the request.', code);
    }
  }

  if (method === 'POST' && pathname === '/api/ai/analyze-document') {
    const user = requireUser(req, res);
    if (!user) return;
    const b = await jsonBody(req);
    if (b.consentToExternalProcessing !== true) {
      return fail(res, 400, 'Explicit consent is required before sending a document to the configured AI provider.', 'AI_DOCUMENT_CONSENT_REQUIRED');
    }

    const documentId = String(b.documentId || '').trim();
    if (!documentId || documentId.length > 120) return fail(res, 400, 'A valid document ID is required.', 'VALIDATION');
    const dbRow = db.prepare('SELECT * FROM document_files WHERE id=?').get(documentId);
    if (!dbRow) return fail(res, 404, 'Only an actual uploaded document can be analysed. Sample metadata has no file bytes.', 'DOCUMENT_FILE_REQUIRED');
    const shared = activeShareFor(documentId, user.id);
    const owner = dbRow.owner_user_id === user.id;
    if (!owner && !shared && user.role !== 'reviewer') {
      return fail(res, 403, 'You are not authorised to access this document.', 'DOCUMENT_ACCESS_DENIED');
    }
    if (dbRow.scan_status !== 'clean') {
      return fail(res, 423, 'The file must pass the configured antivirus scan before AI analysis.', 'FILE_QUARANTINED');
    }
    if (!DOCUMENT_ENCRYPTION_KEY || !fs.existsSync(dbRow.stored_path)) {
      return fail(res, 503, 'Secure document storage is unavailable.', 'DOCUMENT_STORAGE_UNAVAILABLE');
    }

    let bytes;
    try {
      bytes = decryptDocumentBytes(fs.readFileSync(dbRow.stored_path));
    } catch {
      return fail(res, 500, 'The stored document could not be decrypted.', 'DOCUMENT_DECRYPTION_FAILED');
    }
    if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) {
      return fail(res, 413, 'AI extraction supports files up to 10 MB.', 'FILE_TOO_LARGE');
    }

    const language = ['en', 'as', 'hi'].includes(b.language) ? b.language : 'en';
    const doc = JSON.parse(dbRow.document_json);

    try {
      const extractedText = doc.ocrText || doc.extractedText || bytes.toString('utf8', 0, Math.min(bytes.length, 12000));
      const analysisResult = await analyzeDocumentWithOpenRouter({
        extractedText,
        documentTitle: doc.title || 'Untitled Land Document',
        category: doc.category || 'General',
        language,
      });

      doc.aiAnalysis = {
        createdAt: now(),
        model: analysisResult.aiAnalysis?.model || 'OpenRouter AI',
        language,
        consentToExternalProcessing: true,
        source: 'OpenRouter AI extraction',
        verificationStatus: 'Unverified AI extraction',
        analysis: analysisResult.aiAnalysis?.extractedFields || {},
      };
      doc.previewSummary = 'AI extracted fields are available for review. They are unverified and do not establish document authenticity or land ownership.';
      db.prepare('UPDATE document_files SET document_json=? WHERE id=?').run(JSON.stringify(doc), documentId);

      const state = getStateRow();
      pushStateDocument(state, safeDocumentMetadata(doc));
      appendAudit(state, user, 'AI_DOCUMENT_ANALYSED', documentId, 'Document bytes analysed via OpenRouter after user consent; output remains unverified.');
      saveState(state);

      return json(res, 200, {
        ok: true,
        document: safeDocumentMetadata(doc),
        analysis: doc.aiAnalysis.analysis,
        disclaimer: 'AI-extracted information is unverified. It does not establish authenticity, ownership or legal title.',
      });
    } catch (error) {
      console.error('[openrouter] document analysis error:', error instanceof Error ? error.message : 'unknown error');
      return fail(res, 502, 'OpenRouter could not complete document analysis. No verification state was changed.', 'AI_DOCUMENT_FAILED');
    }
  }

  `;

code = code.slice(0, askIdx) + replacement + code.slice(mediaIdx);
fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated server/index.mjs with OpenRouter AI endpoints!');

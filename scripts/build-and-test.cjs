#!/usr/bin/env node
/**
 * Dharitri Sentu — Compiler, Acceptance Test Runner & Single-File Bundle Builder
 * Uses system @babel/core (/usr/share/nodejs) to transpile TypeScript + React,
 * execute the automated acceptance suite in tests/app.test.tsx, and build
 * dharitri-sentu-prototype.html.
 */
const fs = require('fs');
const path = require('path');

// Resolve system Babel packages
module.paths.push('/usr/share/nodejs');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = '/working_dir/c_6feab5422cdf50f3/artifacts/file_generation/ttl=63d/output';

const MODULE_ORDER = [
  'src/types/index.ts',
  'src/types/cadastral.ts',
  'src/services/cadastralService.ts',
  'src/utils/landUnitsAndBadges.tsx',
  'src/i18n/translations.ts',
  'src/data/seedData.ts',
  'src/services/govIntegrationBoundary.ts',
  'src/services/storageService.ts',
  'src/app/AppContext.tsx',
  'src/components/AmbientLeaves.tsx',
  'src/components/CinematicIntro.tsx',
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/features/parcel-map/InteractiveParcelMap.tsx',
  'src/features/marketplace/HomePage.tsx',
  'src/features/marketplace/ExplorePage.tsx',
  'src/features/marketplace/ListingDetailPage.tsx',
  'src/features/marketplace/CreateListingPage.tsx',
  'src/features/trust-passport/TrustPassportPage.tsx',
  'src/features/discrepancies/DiscrepanciesPage.tsx',
  'src/features/due-diligence/DueDiligencePage.tsx',
  'src/features/landlocker/LandLockerPage.tsx',
  'src/features/voice-assistant/VoiceAssistantPage.tsx',
  'src/components/AskDharitriChatbot.tsx',
  'src/features/virtual-tours/VirtualTourPage.tsx',
  'src/features/price-projections/PriceExplorerPage.tsx',
  'src/features/auth/AuthPages.tsx',
  'src/features/admin/DashboardsAndAdmin.tsx',
  'src/features/marketplace/InfoPages.tsx',
  'src/App.tsx',
];

function stripImportsAndExports(source, relPath) {
  let code = source;

  // Inline JSON locale imports for src/i18n/translations.ts
  if (relPath === 'src/i18n/translations.ts') {
    const enJson = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.json'), 'utf8');
    const asJson = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/as.json'), 'utf8');
    const hiJson = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/hi.json'), 'utf8');
    code = `
const enJson = ${enJson};
const asJson = ${asJson};
const hiJson = ${hiJson};
export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: enJson,
  as: asJson,
  hi: hiJson,
};
`;
  }

  // Remove ES import statements (single-line and multi-line)
  code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  code = code.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '');

  // Convert `export default function` -> `function`
  code = code.replace(/^\s*export\s+default\s+function\s+/gm, 'function ');
  // Convert `export const/function/interface/type` -> `const/function/interface/type`
  code = code.replace(/^\s*export\s+(const|let|var|function|interface|type|class)\s+/gm, '$1 ');

  // Replace import.meta.env references safely for browser/node evaluation
  code = code.replace(/typeof\s+import\.meta\s*!==\s*['"]undefined['"]/g, "true");
  code = code.replace(
    /import\.meta\.env/g,
    '((typeof window !== "undefined" && window.__ENV__) || {})'
  );

  return code;
}

function replaceAssetsAfterBabel(jsCode) {
  let code = jsCode;
  code = code.replace(
    /url\('(\/assets\/[^']+)'\)/g,
    "url('${__ASSET_MAP['$1']}')"
  );
  code = code.replace(
    /(['"])(\/assets\/(?:tea-garden-bg\.jpg|parcel-agricultural\.jpg|parcel-homestead\.jpg|satellite-map-bg\.jpg|logo\.svg|leaf\.svg))\1/g,
    "__ASSET_MAP['$2']"
  );
  return code;
}

function transpileFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const cleaned = stripImportsAndExports(raw, relPath);

  const result = babel.transformSync(cleaned, {
    filename: relPath,
    presets: [
      ['/usr/share/nodejs/@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ['/usr/share/nodejs/@babel/preset-react', { runtime: 'classic' }],
    ],
    retainLines: false,
    comments: false,
  });

  const finalJs = replaceAssetsAfterBabel(result.code);
  return `// --- MODULE: ${relPath} ---\n\n${finalJs}\n`;
}

console.log('1. Transpiling all TypeScript + React modules...');
const compiledModules = [];
for (const modPath of MODULE_ORDER) {
  try {
    const out = transpileFile(modPath);
    compiledModules.push(out);
    console.log(`   ✓ Compiled ${modPath}`);
  } catch (err) {
    console.error(`   ✗ Failed compiling ${modPath}:`, err.message);
    process.exit(1);
  }
}

console.log('\n2. Running Automated Acceptance Test Suite (tests/app.test.tsx)...');
const testRaw = fs.readFileSync(path.join(ROOT, 'tests/app.test.tsx'), 'utf8');
const testCleaned = stripImportsAndExports(testRaw, 'tests/app.test.tsx');
const testCompiled = babel.transformSync(testCleaned, {
  filename: 'tests/app.test.tsx',
  presets: [
    ['/usr/share/nodejs/@babel/preset-typescript', { isTSX: true, allExtensions: true }],
    ['/usr/share/nodejs/@babel/preset-react', { runtime: 'classic' }],
  ],
}).code;

// Lightweight Vitest-compatible harness for Node execution
const harnessPrefix = `
const React = {
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
  useMemo: (fn) => fn(),
  useContext: () => ({}),
  createContext: (v) => ({ Provider: () => null, _defaultValue: v }),
  useCallback: (fn) => fn,
  useRef: (v) => ({ current: v }),
  createElement: () => ({}),
  Fragment: 'Fragment',
  Children: { toArray: (c) => Array.isArray(c) ? c : [c] },
};
const { useState, useEffect, useMemo, useContext, createContext, useCallback, useRef } = React;
const window = {
  localStorage: {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
  },
  location: { hash: '#/' },
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
};
const __ASSET_MAP = {
  '/assets/tea-garden-bg.jpg': '/assets/tea-garden-bg.jpg',
  '/assets/parcel-agricultural.jpg': '/assets/parcel-agricultural.jpg',
  '/assets/parcel-homestead.jpg': '/assets/parcel-homestead.jpg',
  '/assets/satellite-map-bg.jpg': '/assets/satellite-map-bg.jpg',
  '/assets/logo.svg': '/assets/logo.svg',
  '/assets/leaf.svg': '/assets/leaf.svg',
};
const LeafletNamespace = {};
function useNavigate() { return () => {}; }
function useLocation() { return { pathname: '/', search: '' }; }
function useParams() { return {}; }
const Link = () => null;
const Navigate = () => null;
const Route = () => null;
const Routes = () => null;
const BrowserRouter = () => null;

let __passed = 0;
let __failed = 0;
function describe(suiteName, fn) {
  console.log('   Suite: ' + suiteName);
  fn();
}
function it(testName, fn) {
  try {
    fn();
    __passed++;
    console.log('     ✓ ' + testName);
  } catch (e) {
    __failed++;
    console.error('     ✗ ' + testName + '\\n       ' + (e && e.stack ? e.stack : e));
  }
}
function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
    },
    toContain(sub) {
      if (Array.isArray(actual)) {
        if (!actual.includes(sub)) throw new Error('Expected array ' + JSON.stringify(actual) + ' to contain ' + JSON.stringify(sub));
      } else if (typeof actual === 'string') {
        if (!actual.includes(sub)) throw new Error('Expected "' + actual + '" to contain "' + sub + '"');
      } else {
        throw new Error('toContain called on unsupported value');
      }
    },
    toBeGreaterThanOrEqual(num) {
      if (!(actual >= num)) throw new Error('Expected ' + actual + ' >= ' + num);
    },
    toBeCloseTo(num, digits = 2) {
      const diff = Math.abs(actual - num);
      const tol = Math.pow(10, -digits) / 2;
      if (diff > tol) throw new Error('Expected ' + actual + ' to be close to ' + num);
    },
    toBeDefined() {
      if (actual === undefined) throw new Error('Expected value to be defined');
    },
    toBeUndefined() {
      if (actual !== undefined) throw new Error('Expected value to be undefined, got ' + JSON.stringify(actual));
    },
    toHaveLength(len) {
      if (!actual || actual.length !== len) throw new Error('Expected length ' + len + ', got ' + (actual ? actual.length : 'null'));
    },
    not: {
      toContain(sub) {
        if (typeof actual === 'string' && actual.includes(sub)) {
          throw new Error('Expected "' + actual + '" NOT to contain "' + sub + '"');
        }
      }
    }
  };
}
`;

const fullTestScript =
  harnessPrefix +
  '\n' +
  compiledModules.join('\n') +
  '\n' +
  testCompiled +
  '\nif (__failed > 0) { process.exit(1); }\nconsole.log(`   All ${__passed} acceptance tests passed!`);\n';

const vm = require('vm');
try {
  vm.runInNewContext(fullTestScript, { console, process, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Set, Map, Error, URLSearchParams, encodeURIComponent, decodeURIComponent, unescape, setTimeout, clearTimeout });
} catch (err) {
  console.error('Test execution error:', err);
  process.exit(1);
}

console.log('\n3. Building Single-File Production Bundle (dharitri-sentu-prototype.html)...');
const existingHtml = fs.readFileSync(path.join(ROOT, 'dharitri-sentu-prototype.html'), 'utf8');
const splitMarker = '// --- MODULE: src/types/index.ts ---';
const markerIdx = existingHtml.indexOf(splitMarker);
if (markerIdx === -1) {
  console.error('Could not locate module split marker in dharitri-sentu-prototype.html');
  process.exit(1);
}

// Inject `Navigate` component into the router shim right before `const Route =`
let htmlHeader = existingHtml.slice(0, markerIdx);
if (!htmlHeader.includes('const Navigate =')) {
  const navigateShim = `
const Navigate = ({ to }) => {
  const { navigate } = React.useContext(RouterContext);
  React.useEffect(() => {
    navigate(to);
  }, [to, navigate]);
  return null;
};
`;
  htmlHeader = htmlHeader.replace('const Route =', navigateShim + '\nconst Route =');
}

const htmlFooter = `
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(/*#__PURE__*/React.createElement(App, null));
}

  </script>
</body>
</html>
`;

const finalHtml = htmlHeader + compiledModules.join('\n') + htmlFooter;
fs.writeFileSync(path.join(ROOT, 'dharitri-sentu-prototype.html'), finalHtml, 'utf8');
if (fs.existsSync(OUTPUT_DIR)) {
  fs.writeFileSync(path.join(OUTPUT_DIR, 'dharitri-sentu-prototype.html'), finalHtml, 'utf8');
}
console.log(`   ✓ Wrote dharitri-sentu-prototype.html (${(finalHtml.length / 1024).toFixed(1)} KB)`);

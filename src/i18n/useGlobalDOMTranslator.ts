import { useEffect } from 'react';
import { UI_DICTIONARY } from './dictionary';

const originalTextMap = new WeakMap<Node, string>();
const originalPlaceholderMap = new WeakMap<Element, string>();

// Build two-way reverse dictionary to recover English text from Assamese/Hindi
const REVERSE_DICTIONARY: Record<string, string> = {};
for (const langKey of ['as', 'hi']) {
  const dict = UI_DICTIONARY[langKey] || {};
  for (const [english, translated] of Object.entries(dict)) {
    if (translated && english && !REVERSE_DICTIONARY[translated]) {
      REVERSE_DICTIONARY[translated] = english;
    }
  }
}

export function useGlobalDOMTranslator(lang: string) {
  useEffect(() => {
    let isCancelled = false;

    async function translateSingleText(text: string, targetLang: string): Promise<string> {
      const trimmed = text.trim();
      if (!trimmed || /^[\d\s\W₹%+.,:/()-]+$/.test(trimmed)) return text;

      // 1. Check instant static dictionary first (exact & case-insensitive match)
      const dict = UI_DICTIONARY[targetLang] || {};
      if (dict[trimmed]) {
        return text.replace(trimmed, dict[trimmed]);
      }
      const matchedKey = Object.keys(dict).find(
        (k) => k.toLowerCase() === trimmed.toLowerCase()
      );
      if (matchedKey && dict[matchedKey]) {
        return text.replace(trimmed, dict[matchedKey]);
      }

      // 2. Check sessionStorage cache
      const cacheKey = `dharitri_tr_${targetLang}_${trimmed}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          return text.replace(trimmed, cached);
        }
      } catch {}

      // 3. Fallback online translation service for unindexed dynamic strings
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url);
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const translated = data[0].map((item: any) => item[0]).join('');
        if (translated) {
          try {
            sessionStorage.setItem(cacheKey, translated);
          } catch {}
          return text.replace(trimmed, translated);
        }
      } catch {
        // Fallback silently if offline
      }
      return text;
    }

    async function scanAndTranslateDOM() {
      if (isCancelled || typeof document === 'undefined') return;

      // A. Translate all visible text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName;
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            return (node.nodeValue || '').trim().length > 0
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          }
        }
      );

      const textNodes: Node[] = [];
      let currentNode = walker.nextNode();
      while (currentNode) {
        textNodes.push(currentNode);
        currentNode = walker.nextNode();
      }

      for (const node of textNodes) {
        const rawNodeVal = node.nodeValue || '';
        if (!originalTextMap.has(node)) {
          // If node already has Assamese or Hindi from initial render, recover English via reverse dictionary
          const trimmedRaw = rawNodeVal.trim();
          const recoveredEnglish = REVERSE_DICTIONARY[trimmedRaw];
          if (recoveredEnglish) {
            originalTextMap.set(node, rawNodeVal.replace(trimmedRaw, recoveredEnglish));
          } else {
            originalTextMap.set(node, rawNodeVal);
          }
        }
        const sourceEnglish = originalTextMap.get(node) || '';

        if (lang === 'en') {
          if (node.nodeValue !== sourceEnglish) {
            node.nodeValue = sourceEnglish;
          }
        } else {
          const translatedVal = await translateSingleText(sourceEnglish, lang);
          if (!isCancelled && node.nodeValue !== translatedVal) {
            node.nodeValue = translatedVal;
          }
        }
      }

      // B. Translate all input and textarea placeholders
      const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      for (const input of Array.from(inputs)) {
        const rawPh = input.getAttribute('placeholder') || '';
        if (!originalPlaceholderMap.has(input)) {
          const trimmedPh = rawPh.trim();
          const recoveredEnglish = REVERSE_DICTIONARY[trimmedPh];
          if (recoveredEnglish) {
            originalPlaceholderMap.set(input, rawPh.replace(trimmedPh, recoveredEnglish));
          } else {
            originalPlaceholderMap.set(input, rawPh);
          }
        }
        const sourcePlaceholder = originalPlaceholderMap.get(input) || '';
        if (lang === 'en') {
          if (input.getAttribute('placeholder') !== sourcePlaceholder) {
            input.setAttribute('placeholder', sourcePlaceholder);
          }
        } else {
          const translatedPh = await translateSingleText(sourcePlaceholder, lang);
          if (!isCancelled && input.getAttribute('placeholder') !== translatedPh) {
            input.setAttribute('placeholder', translatedPh);
          }
        }
      }
    }

    scanAndTranslateDOM();

    // Re-run automatically whenever React renders new components, modals, or route changes
    let debounceTimer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scanAndTranslateDOM();
      }, 120);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [lang]);
}

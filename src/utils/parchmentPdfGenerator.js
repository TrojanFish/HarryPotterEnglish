/**
 * Parchment PDF & Printable Study Materials Generator
 * Adapted from anthropics/skills/pdf & theme-factory specifications.
 * 
 * Generates pure vector, high-contrast, printable A4 cut-out flashcards (6 per sheet, 2x3 grid)
 * with IPA phonetics, bolded context sentences, definitions, and Ebbinghaus 5-step review check-boxes.
 * 100% offline, client-side, zero heavy binary dependencies.
 */

/**
 * Escape HTML characters to protect against XSS in printable HTML
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Highlight and bold the target vocabulary word inside the original context sentence
 */
export function highlightWordInContext(context, word) {
  if (!context || typeof context !== 'string') return '';
  if (!word || typeof word !== 'string') return escapeHtml(context);

  // Match whole word case-insensitively, handling hyphenated or multi-word targets
  const escapedWord = word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b(${escapedWord})\\b`, 'gi');

  const parts = context.split(regex);
  return parts.map(part => {
    if (part.toLowerCase() === word.trim().toLowerCase()) {
      return `<span class="highlighted-word">${escapeHtml(part)}</span>`;
    }
    return escapeHtml(part);
  }).join('');
}

/**
 * Generate full standalone HTML document for A4 Vector Print / PDF export
 * @param {Array} vocabList Array of vocabulary objects
 * @param {Object} options Configuration options
 * @returns {string} Standalone printable HTML
 */
export function generatePrintableParchmentHTML(vocabList, options = {}) {
  const safeList = Array.isArray(vocabList) ? vocabList : [];
  const title = options.title || '霍格沃茨魔法精听生词闪卡 · Hogwarts Study Flashcards';
  const subtitle = options.subtitle || 'A4 双列便携剪裁卡 · 艾宾浩斯记忆追踪版';

  if (safeList.length === 0) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #fbf9f4; color: #1e1610; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .empty-card { background: white; border: 1.5px solid #e8ddd0; border-radius: 16px; padding: 32px; text-align: center; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h2 { color: #78350f; margin-top: 0; }
  </style>
</head>
<body>
  <div class="empty-card">
    <h2>生词本中尚无单词</h2>
    <p>请先在霍格沃茨精听教室中点词查词，并将其收藏至生词本后，再打印单词卡。</p>
  </div>
</body>
</html>`;
  }

  // Chunk vocabulary into pages of 6 cards each (2 columns x 3 rows)
  const CARDS_PER_PAGE = 6;
  const pages = [];
  for (let i = 0; i < safeList.length; i += CARDS_PER_PAGE) {
    pages.push(safeList.slice(i, i + CARDS_PER_PAGE));
  }

  const generatedDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* ── A4 Page & Vector Print Rules ────────────────────────── */
    @page {
      size: A4 portrait;
      margin: 10mm 10mm 10mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #f3efe6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e1610;
    }

    /* Screen toolbar (hidden in print) */
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1e1610;
      color: white;
      padding: 10px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .toolbar-title {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .screen-toolbar button {
      background: #f59e0b;
      color: #1e1610;
      border: none;
      padding: 8px 16px;
      min-height: 44px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.15s ease;
      touch-action: manipulation;
    }

    .screen-toolbar button:hover {
      background: #d97706;
      color: white;
    }

    .screen-toolbar .secondary-btn {
      background: #382c23;
      color: #e8ddd0;
      min-height: 44px;
      padding: 8px 14px;
    }

    .screen-toolbar .secondary-btn:hover {
      background: #4a3b30;
      color: white;
    }

    /* ── Mobile Notice Bar ───────────────────────────────────── */
    .mobile-tip-bar {
      display: none;
      background: #fef3c7;
      border-bottom: 1px solid #fde68a;
      color: #92400e;
      padding: 8px 16px;
      font-size: 12px;
      text-align: center;
      line-height: 1.4;
    }

    /* ── Desktop Default A4 Page Container ───────────────────── */
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      padding: 10mm;
      background: #fbf9f4;
      border: 1px solid #d4c4a8;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      box-sizing: border-box;
    }

    /* ── Responsive Screen Rules for Mobile Viewports ────────── */
    @media screen and (max-width: 820px) {
      body {
        background-color: #fbf9f4;
        padding-bottom: 24px;
      }
      .mobile-tip-bar {
        display: block;
      }
      .screen-toolbar {
        padding: 8px 12px;
      }
      .toolbar-title {
        font-size: 13px;
      }
      .a4-page {
        width: calc(100% - 20px) !important;
        max-width: 640px !important;
        height: auto !important;
        min-height: auto !important;
        margin: 12px auto !important;
        padding: 12px !important;
        border-radius: 14px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
      }
      .card-grid {
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
      }
      .parchment-card {
        width: 100% !important;
        min-height: 140px !important;
      }
      .ebbinghaus-track {
        flex-wrap: wrap !important;
        gap: 6px !important;
      }
      .page-footer {
        flex-direction: column !important;
        gap: 4px !important;
        align-items: flex-start !important;
      }
    }

    @media print {
      body {
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .screen-toolbar, .mobile-tip-bar {
        display: none !important;
      }
      .a4-page {
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 277mm !important;
        padding: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      .card-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        grid-template-rows: repeat(3, 1fr) !important;
        gap: 7mm !important;
        height: 100% !important;
      }
    }

    /* Page Header */
    .page-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      border-bottom: 2px solid #b45309;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 16px;
      font-family: Georgia, serif;
      font-weight: bold;
      color: #78350f;
      letter-spacing: 0.5px;
    }

    .page-header .meta {
      font-size: 11px;
      color: #8b7b6b;
      font-family: monospace;
    }

    /* Card Grid: 2 columns x 3 rows */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 7mm;
      flex: 1;
      margin-bottom: 6px;
    }

    /* Single Flashcard Unit */
    .parchment-card {
      border: 1.5px dashed #d97706; /* Cut-out scissor border */
      border-radius: 12px;
      padding: 4px;
      background: #fffdf9;
      display: flex;
      flex-direction: column;
      break-inside: avoid;
      page-break-inside: avoid;
      position: relative;
    }

    .card-inner {
      border: 1.5px solid #d4c4a8;
      border-radius: 8px;
      padding: 10px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      position: relative;
    }

    /* Card Top: Word & Phonetic */
    .card-top {
      border-bottom: 1px dashed #e8ddd0;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .word-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 6px;
    }

    .target-word {
      font-family: Georgia, serif;
      font-size: 21px;
      font-weight: bold;
      color: #1e1610;
      margin: 0;
      line-height: 1.1;
    }

    .phonetic-badge {
      font-family: "Lucida Sans Unicode", "Segoe UI", sans-serif;
      font-size: 12px;
      color: #b45309;
      font-weight: 500;
    }

    .tags-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }

    .pos-pill {
      display: inline-block;
      font-size: 10px;
      font-weight: bold;
      background: #fef3c7;
      color: #92400e;
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid #fde68a;
    }

    .source-pill {
      font-size: 10px;
      color: #78716c;
      font-family: monospace;
      truncate;
    }

    /* Card Middle: Context & Translation */
    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }

    .context-sentence {
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 12px;
      line-height: 1.5;
      color: #292524;
      margin: 0;
    }

    .highlighted-word {
      font-weight: bold;
      font-style: normal;
      background: #fef08a;
      color: #78350f;
      padding: 0 3px;
      border-radius: 3px;
      border-bottom: 1.5px solid #d97706;
    }

    .translation-text {
      font-size: 12px;
      font-weight: bold;
      color: #78350f;
      margin: 0;
      line-height: 1.4;
    }

    /* Card Bottom: Ebbinghaus Checklist */
    .ebbinghaus-track {
      background: #fdfaf4;
      border: 1px solid #f3ebe0;
      border-radius: 6px;
      padding: 4px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #57534e;
      font-weight: 600;
    }

    .eb-box {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-family: monospace;
    }

    .checkbox-square {
      width: 10px;
      height: 10px;
      border: 1px solid #a8a29e;
      border-radius: 2px;
      display: inline-block;
      background: white;
    }

    /* Page Footer */
    .page-footer {
      border-top: 1px solid #e8ddd0;
      padding-top: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: #a8a29e;
      font-family: monospace;
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar for Direct Print & PDF Save -->
  <div class="screen-toolbar">
    <div class="toolbar-title">
      <strong>${escapeHtml(title)}</strong>
      <span style="font-size: 11px; color: #d4c4a8;">共 ${safeList.length} 词 · ${pages.length} 页 A4</span>
    </div>
    <div class="toolbar-actions">
      <button onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        立即打印 / 存为 PDF
      </button>
      <button class="secondary-btn" onclick="window.close()">关闭窗口</button>
    </div>
  </div>

  <div class="mobile-tip-bar">
    提示：当前为手机端生词卡自适应预览。点击上方【立即打印 / 存为 PDF】即可自动生成标准 A4 双列剪裁版。
  </div>

  <!-- A4 Sheets -->
  ${pages.map((pageItems, pageIdx) => `
    <div class="a4-page">
      <div class="page-header">
        <h1>Hogwarts Magic Vocabulary · ${escapeHtml(subtitle)}</h1>
        <div class="meta">第 ${pageIdx + 1} / ${pages.length} 页 · 生成于 ${generatedDate}</div>
      </div>

      <div class="card-grid">
        ${pageItems.map((item) => {
          const word = item.word || '';
          const phonetic = item.phonetic || item.ipa || '';
          const pos = item.pos || '';
          const translation = item.definition || item.translation || item.meaning || '';
          const context = item.contextQuote || item.context || '';
          const source = item.bookTitle || item.chapterTitle
            ? `${item.bookTitle ? item.bookTitle : ''} ${item.chapterTitle ? '· ' + item.chapterTitle : ''}`
            : 'Hogwarts Original Audio';

          return `
            <div class="parchment-card">
              <div class="card-inner">
                <div class="card-top">
                  <div class="word-row">
                    <span class="target-word">${escapeHtml(word)}</span>
                    ${phonetic ? `<span class="phonetic-badge">${escapeHtml(phonetic)}</span>` : ''}
                  </div>
                  <div class="tags-row">
                    ${pos ? `<span class="pos-pill">${escapeHtml(pos)}</span>` : ''}
                    <span class="source-pill">${escapeHtml(source)}</span>
                  </div>
                </div>

                <div class="card-body">
                  ${context ? `<p class="context-sentence">${highlightWordInContext(context, word)}</p>` : ''}
                  <p class="translation-text">${escapeHtml(translation)}</p>
                </div>

                <div class="ebbinghaus-track">
                  <span>艾宾浩斯复习:</span>
                  <span class="eb-box"><span class="checkbox-square"></span> 1天</span>
                  <span class="eb-box"><span class="checkbox-square"></span> 3天</span>
                  <span class="eb-box"><span class="checkbox-square"></span> 7天</span>
                  <span class="eb-box"><span class="checkbox-square"></span> 15天</span>
                  <span class="eb-box"><span class="checkbox-square"></span> 30天</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="page-footer">
        <span>霍格沃茨魔法英语听说平台 · 学术研究与非商业学习专用</span>
        <span>沿虚线剪下即为双面便携背诵卡</span>
      </div>
    </div>
  `).join('')}

</body>
</html>`;
}

/**
 * Trigger Print & PDF Generation Window
 * Opens printable parchment view and invokes native browser print preview (Save as PDF)
 */
export function printParchmentCards(vocabList, options = {}) {
  const html = generatePrintableParchmentHTML(vocabList, options);

  // Open temporary print window
  const printWindow = window.open('', '_blank', 'width=900,height=950,menubar=no,toolbar=no');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Auto trigger print when loaded
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Ignored if user cancels or print blocked
        }
      }, 350);
    };
  } else {
    // Fallback: create hidden iframe if popup was blocked
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } finally {
          setTimeout(() => document.body.removeChild(iframe), 60000);
        }
      }, 350);
    };
  }
}

/**
 * Hogwarts Audio English Learning Platform
 * O.W.L.s (Ordinary Wizarding Level) A4 Parchment Certificate Export Utility
 *
 * Generates an authentic, single-page A4 printable parchment diploma
 * conforming to Ministry of Magic Examination Authority specifications
 * and the European CEFR language proficiency framework.
 *
 * Zero Unicode emojis. Apple HIG print & touch ergonomics.
 */

function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(timestamp) {
  try {
    const d = timestamp ? new Date(timestamp) : new Date()
    if (isNaN(d.getTime())) {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    }
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
}

function clamp(val, min = 0, max = 100) {
  const n = typeof val === 'number' && !isNaN(val) ? val : min
  return Math.min(max, Math.max(min, Math.round(n)))
}

function getOwlGrade(score) {
  const s = clamp(score)
  if (s >= 85) return { grade: 'Outstanding (O) 卓越', rank: 'O', color: '#15803d' }
  if (s >= 70) return { grade: 'Exceeds Expectations (E) 良好', rank: 'E', color: '#b45309' }
  if (s >= 55) return { grade: 'Acceptable (A) 及格', rank: 'A', color: '#4338ca' }
  return { grade: 'Poor (P) 待提高', rank: 'P', color: '#b91c1c' }
}

/**
 * Generates an SVG 5-axis radar chart for the certificate
 * @param {object} dims Dimensions object with auditory, vocabDepth, comprehension, shadowing, production
 * @returns {string} SVG markup string
 */
function generateRadarSVG(dims) {
  const cx = 150
  const cy = 130
  const r = 78

  const axes = [
    { key: 'auditory', label: '听音推断', en: 'Auditory' },
    { key: 'vocabDepth', label: '词汇掌握', en: 'Vocab' },
    { key: 'comprehension', label: '语境理解', en: 'Context' },
    { key: 'shadowing', label: '跟读流利', en: 'Shadowing' },
    { key: 'production', label: '拼写产出', en: 'Spelling' }
  ]

  // Concentric background pentagons (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]
  const gridPolygons = gridLevels.map(lvl => {
    const pts = axes.map((_, i) => {
      const angleDeg = -90 + i * 72
      const rad = (angleDeg * Math.PI) / 180
      const px = (cx + r * lvl * Math.cos(rad)).toFixed(1)
      const py = (cy + r * lvl * Math.sin(rad)).toFixed(1)
      return `${px},${py}`
    }).join(' ')
    return `<polygon points="${pts}" fill="none" stroke="#decbb8" stroke-width="0.8" stroke-dasharray="${lvl === 1 ? 'none' : '2,2'}" />`
  }).join('\n')

  // Radial spoke lines
  const spokes = axes.map((_, i) => {
    const angleDeg = -90 + i * 72
    const rad = (angleDeg * Math.PI) / 180
    const px = (cx + r * Math.cos(rad)).toFixed(1)
    const py = (cy + r * Math.sin(rad)).toFixed(1)
    return `<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#decbb8" stroke-width="0.8" />`
  }).join('\n')

  // Student score polygon points
  const dataPoints = axes.map((axis, i) => {
    const rawScore = dims[axis.key] ?? 60
    const score = clamp(rawScore)
    const angleDeg = -90 + i * 72
    const rad = (angleDeg * Math.PI) / 180
    const dist = r * (score / 100)
    const px = Number((cx + dist * Math.cos(rad)).toFixed(1))
    const py = Number((cy + dist * Math.sin(rad)).toFixed(1))
    return { px, py, score }
  })

  const polygonPointsStr = dataPoints.map(p => `${p.px},${p.py}`).join(' ')

  // Vertex dots and score badges
  const dotsAndLabels = dataPoints.map((p, i) => {
    const axis = axes[i]
    const angleDeg = -90 + i * 72
    const rad = (angleDeg * Math.PI) / 180
    const labelDist = r + 18
    const lx = (cx + labelDist * Math.cos(rad)).toFixed(1)
    const ly = (cy + labelDist * Math.sin(rad) + 4).toFixed(1)
    return `
      <circle cx="${p.px}" cy="${p.py}" r="3" fill="#92400e" stroke="#ffffff" stroke-width="1.2" />
      <text x="${lx}" y="${ly}" text-anchor="middle" font-family="Georgia, serif" font-size="10" font-weight="bold" fill="#573a08">${axis.label}</text>
      <text x="${lx}" y="${Number(ly) + 11}" text-anchor="middle" font-family="'Courier New', monospace" font-size="9" fill="#854d0e">${p.score}分</text>
    `
  }).join('\n')

  return `
    <svg viewBox="0 0 300 270" class="radar-svg" style="width: 100%; max-width: 250px; height: auto; display: block; margin: 0 auto;">
      ${gridPolygons}
      ${spokes}
      <polygon points="${polygonPointsStr}" fill="rgba(180, 83, 9, 0.28)" stroke="#92400e" stroke-width="2" />
      ${dotsAndLabels}
    </svg>
  `
}

/**
 * Produces standalone printable A4 HTML document string for O.W.L.s certificate
 * @param {object} examData Exam results and dimensions
 * @param {object} studentProfile Candidate identity details
 * @returns {string} Standalone HTML document
 */
export function generateOwlsCertificateHTML(examData = {}, studentProfile = {}) {
  const safeData = examData || {}
  const safeStudent = studentProfile || {}

  const cefrResult = safeData.cefrResult || 'B1'
  const titles = {
    A2: '魔法学徒',
    B1: '魔法探索者',
    B2: '魔法进阶者',
    C1: '傲罗精通'
  }
  const title = safeData.title || titles[cefrResult] || '魔法探索者'
  const compositeScore = typeof safeData.compositeScore === 'number' && !isNaN(safeData.compositeScore)
    ? safeData.compositeScore
    : 85
  const timestamp = safeData.timestamp || Date.now()
  const examDateStr = formatDate(timestamp)
  const candidateName = safeStudent.name || safeStudent.candidateName || 'Hogwarts Candidate'
  const candidateId = safeStudent.candidateId || safeData.id || `OWL-${new Date(timestamp).getFullYear()}-7701`
  const feedback = safeData.mentorFeedback || '在听辨推断与口语复述展现了出色的魔法专注力，已具备深入探索原著经典与进阶魔法学术文献的扎实话语能力。'

  const dims = safeData.dimensions && typeof safeData.dimensions === 'object'
    ? {
        auditory: clamp(safeData.dimensions.auditory ?? 80),
        vocabDepth: clamp(safeData.dimensions.vocabDepth ?? 80),
        comprehension: clamp(safeData.dimensions.comprehension ?? 80),
        shadowing: clamp(safeData.dimensions.shadowing ?? 80),
        production: clamp(safeData.dimensions.production ?? 80)
      }
    : { auditory: 80, vocabDepth: 80, comprehension: 80, shadowing: 80, production: 80 }

  const subjects = [
    {
      nameZh: '听音推断与细节',
      nameEn: 'Listening Comprehension & Acoustic Clues',
      score: dims.auditory,
      gradeObj: getOwlGrade(dims.auditory)
    },
    {
      nameZh: '核心词汇拼写产出',
      nameEn: 'Production Spelling & Active Recall (L4)',
      score: dims.production,
      gradeObj: getOwlGrade(dims.production)
    },
    {
      nameZh: '名篇跟读语音流利',
      nameEn: 'Oral Shadowing & Accent Fluency',
      score: dims.shadowing,
      gradeObj: getOwlGrade(dims.shadowing)
    },
    {
      nameZh: '语境理解与综合推理',
      nameEn: 'Contextual Reasoning & Narrative Comprehension',
      score: dims.comprehension,
      gradeObj: getOwlGrade(dims.comprehension)
    },
    {
      nameZh: '词汇广度与认知深度',
      nameEn: 'Vocabulary Mastery & Deep Acquisition',
      score: dims.vocabDepth,
      gradeObj: getOwlGrade(dims.vocabDepth)
    }
  ]

  const radarSvg = generateRadarSVG(dims)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>O.W.L.s 魔法学业等级认定报告 · ${escapeHtml(candidateName)}</title>
  <style>
    /* ================= A4 PARCHMENT DIPLOMA STYLES ================= */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #f3ece2;
      color: #1e1610;
      font-family: Georgia, "Nimbus Roman No9 L", "Songti SC", "SimSun", serif;
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 24px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Print toolbar (hidden during print) */
    .print-toolbar {
      position: sticky;
      top: 12px;
      z-index: 100;
      display: flex;
      gap: 12px;
      background: #ffffff;
      padding: 10px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border: 1px solid #e8ddd0;
      margin-bottom: 20px;
    }

    .toolbar-btn {
      appearance: none;
      border: none;
      background: #92400e;
      color: #ffffff;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s ease;
      touch-action: manipulation;
      min-height: 44px;
      min-w: 44px;
    }

    .toolbar-btn:hover {
      background: #78350f;
    }

    .toolbar-btn.secondary {
      background: #fbf9f5;
      color: #44403c;
      border: 1px solid #d5cbbf;
    }

    .toolbar-btn.secondary:hover {
      background: #ede3d5;
    }

    /* Single Page A4 Containment Container */
    .cert-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      background-color: #fbf9f5;
      background-image:
        radial-gradient(#e8ddd0 0.8px, transparent 0.8px),
        linear-gradient(to bottom, #fbf9f5 0%, #f7f1e6 100%);
      background-size: 24px 24px, 100% 100%;
      border: 1px solid #d5cbbf;
      box-shadow: 0 10px 30px rgba(78, 52, 33, 0.15);
      position: relative;
      overflow: hidden;
      padding: 12mm 14mm 10mm 14mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
    }

    /* Parchment Ornate Double Borders */
    .cert-frame-outer {
      position: absolute;
      top: 6mm;
      left: 6mm;
      right: 6mm;
      bottom: 6mm;
      border: 2px solid #854d0e;
      pointer-events: none;
    }

    .cert-frame-inner {
      position: absolute;
      top: 8mm;
      left: 8mm;
      right: 8mm;
      bottom: 8mm;
      border: 1px solid #b45309;
      pointer-events: none;
    }

    .cert-corner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid #854d0e;
    }
    .cert-corner.top-left { top: 9mm; left: 9mm; border-right: none; border-bottom: none; }
    .cert-corner.top-right { top: 9mm; right: 9mm; border-left: none; border-bottom: none; }
    .cert-corner.bottom-left { bottom: 9mm; left: 9mm; border-right: none; border-top: none; }
    .cert-corner.bottom-right { bottom: 9mm; right: 9mm; border-left: none; border-top: none; }

    /* Header Section */
    .cert-header {
      text-align: center;
      border-bottom: 2px solid #decbb8;
      padding-bottom: 7px;
      position: relative;
      z-index: 1;
    }

    .ministry-en {
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #854d0e;
      margin-bottom: 2px;
    }

    .ministry-zh {
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #3f2e1e;
      margin-bottom: 6px;
    }

    .cert-main-title {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1.5px;
      color: #1e1610;
      margin: 4px 0 2px 0;
    }

    .cert-sub-title {
      font-size: 11px;
      color: #574c43;
      letter-spacing: 0.8px;
    }

    /* Candidate Identity Banner */
    .candidate-grid {
      display: grid;
      grid-template-columns: 1.6fr 1.2fr 1.2fr;
      gap: 8px;
      background: #f4ede1;
      border: 1px solid #e1d3c1;
      border-radius: 6px;
      padding: 7px 12px;
      margin-top: 8px;
      position: relative;
      z-index: 1;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .info-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #854d0e;
      font-weight: 600;
    }

    .info-value {
      font-size: 12px;
      font-weight: bold;
      color: #1c1917;
      font-family: Georgia, serif;
    }

    /* CEFR Distinction Banner */
    .cert-rank-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(90deg, #f7efe4 0%, #faedd9 50%, #f7efe4 100%);
      border: 1.5px solid #d4af37;
      border-radius: 8px;
      padding: 8px 16px;
      margin-top: 8px;
      position: relative;
      z-index: 1;
    }

    .rank-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cefr-badge {
      display: inline-block;
      background: #92400e;
      color: #fef3c7;
      font-size: 14px;
      font-weight: bold;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 1px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .rank-title {
      font-size: 15px;
      font-weight: bold;
      color: #292524;
    }

    .composite-score-wrap {
      text-align: right;
    }

    .score-num {
      font-size: 20px;
      font-weight: bold;
      color: #854d0e;
      font-family: 'Courier New', monospace;
    }

    .score-label {
      font-size: 9px;
      color: #78716c;
      text-transform: uppercase;
    }

    /* Middle Layout: Radar Chart & Subject Table */
    .middle-section {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 14px;
      align-items: center;
      margin-top: 8px;
      position: relative;
      z-index: 1;
    }

    .radar-wrapper {
      background: #fdfbf7;
      border: 1px solid #e5d8c8;
      border-radius: 8px;
      padding: 6px;
      text-align: center;
    }

    .radar-caption {
      font-size: 10px;
      font-weight: bold;
      color: #854d0e;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }

    /* Subject Breakdown Table */
    .subject-table-wrap {
      flex: 1;
    }

    .subject-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      background: #ffffff;
      border: 1px solid #decbb8;
      border-radius: 6px;
      overflow: hidden;
    }

    .subject-table th {
      background: #f2e7d8;
      color: #451a03;
      font-weight: bold;
      text-align: left;
      padding: 5px 8px;
      border-bottom: 1.5px solid #decbb8;
      font-size: 10px;
      letter-spacing: 0.5px;
    }

    .subject-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #efe4d6;
      color: #292524;
    }

    .subject-table tr:last-child td {
      border-bottom: none;
    }

    .sub-zh {
      font-weight: bold;
      color: #1e1610;
    }

    .sub-en {
      font-size: 8.5px;
      color: #78716c;
      display: block;
      line-height: 1.1;
    }

    .sub-grade {
      font-weight: bold;
      font-size: 10px;
    }

    /* Diagnostic Mentor Feedback */
    .mentor-section {
      background: #f5ece0;
      border: 1px solid #dfcfbe;
      border-left: 4px solid #b45309;
      border-radius: 6px;
      padding: 7px 12px;
      margin-top: 8px;
      position: relative;
      z-index: 1;
    }

    .mentor-heading {
      font-size: 10px;
      font-weight: bold;
      color: #854d0e;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }

    .mentor-text {
      font-size: 10.5px;
      line-height: 1.45;
      color: #2c251f;
      font-style: italic;
    }

    /* Footer: Seals & Signatures */
    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 8px;
      border-top: 1px solid #decbb8;
      margin-top: 6px;
      position: relative;
      z-index: 1;
    }

    .seal-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Ornate Ministry Seal SVG / Badge */
    .ministry-seal {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      border: 2px dashed #92400e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4px;
      background: #faf3e8;
      transform: rotate(-6deg);
      box-shadow: 0 2px 6px rgba(146, 64, 14, 0.15);
    }

    .seal-ring-inner {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 1px solid #92400e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .seal-text-top {
      font-size: 6px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #92400e;
      line-height: 1;
    }

    .seal-text-mid {
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #78350f;
      margin: 1px 0;
      line-height: 1;
    }

    .seal-text-bot {
      font-size: 5.5px;
      color: #92400e;
      font-weight: 600;
      line-height: 1;
    }

    .seal-caption {
      font-size: 9px;
      color: #78716c;
      line-height: 1.3;
    }

    .signatures-block {
      display: flex;
      gap: 24px;
    }

    .signature-item {
      text-align: center;
      min-width: 110px;
    }

    .sig-line {
      font-family: "Brush Script MT", "Segoe Script", cursive, Georgia;
      font-size: 14px;
      color: #3c2415;
      border-bottom: 1px solid #854d0e;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }

    .sig-role {
      font-size: 8.5px;
      color: #78716c;
    }

    /* ================= PRINT MEDIA SPECIFICATION ================= */
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }

      html, body {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #fbf9f5 !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .print-toolbar {
        display: none !important;
      }

      .cert-page {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 12mm 14mm 10mm 14mm !important;
        page-break-before: avoid !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar for Printing -->
  <header class="print-toolbar">
    <button type="button" class="toolbar-btn" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      <span>打印 / 存为 PDF</span>
    </button>
    <button type="button" class="toolbar-btn secondary" onclick="window.close()">
      <span>关闭预览</span>
    </button>
  </header>

  <!-- Parchment Diploma Page (Strict Single-page A4) -->
  <main class="cert-page">
    <!-- Double Ornate Frame Lines & Corners -->
    <div class="cert-frame-outer"></div>
    <div class="cert-frame-inner"></div>
    <div class="cert-corner top-left"></div>
    <div class="cert-corner top-right"></div>
    <div class="cert-corner bottom-left"></div>
    <div class="cert-corner bottom-right"></div>

    <!-- Top Header: Ministry of Magic Authority -->
    <section class="cert-header">
      <div class="ministry-en">MINISTRY OF MAGIC — ORDINARY WIZARDING LEVEL EXAMINATION AUTHORITY</div>
      <div class="ministry-zh">魔法部巫术能力评定委员会 · 学业测验司</div>
      <h1 class="cert-main-title">O.W.L.s 魔法英语综合能力学业测验认证</h1>
      <p class="cert-sub-title">Based on CEFR European Framework & Hogwarts Academic Standards</p>

      <!-- Candidate Identity Banner -->
      <div class="candidate-grid">
        <div class="info-item">
          <span class="info-label">Candidate Name / 考生姓名</span>
          <span class="info-value">${escapeHtml(candidateName)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Candidate ID / 准考编号</span>
          <span class="info-value font-mono">${escapeHtml(candidateId)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date of Exam / 考核日期</span>
          <span class="info-value font-mono">${escapeHtml(examDateStr)}</span>
        </div>
      </div>
    </section>

    <!-- Certified CEFR Level & Wizard Title Banner -->
    <section class="cert-rank-banner">
      <div class="rank-left">
        <div class="cefr-badge">CEFR ${escapeHtml(cefrResult)}</div>
        <div>
          <div class="rank-title">${escapeHtml(title)}</div>
          <div style="font-size: 9.5px; color: #78716c; margin-top: 1px;">官方认证魔法英语资质阶位</div>
        </div>
      </div>
      <div class="composite-score-wrap">
        <div class="score-num">${compositeScore} <span style="font-size: 11px; color: #a8a29e;">/ 100</span></div>
        <div class="score-label">Composite Overall Score</div>
      </div>
    </section>

    <!-- Radar Chart & Five Core Subject Breakdown Table -->
    <section class="middle-section">
      <div class="radar-wrapper">
        ${radarSvg}
        <div class="radar-caption">五维核心魔法言语图谱</div>
      </div>

      <div class="subject-table-wrap">
        <table class="subject-table">
          <thead>
            <tr>
              <th style="width: 48%;">科目领域 (Subject)</th>
              <th style="width: 20%; text-align: center;">考评得分</th>
              <th style="width: 32%; text-align: right;">巫师等第 (Grade)</th>
            </tr>
          </thead>
          <tbody>
            ${subjects.map(s => `
              <tr>
                <td>
                  <span class="sub-zh">${escapeHtml(s.nameZh)}</span>
                  <span class="sub-en">${escapeHtml(s.nameEn)}</span>
                </td>
                <td style="text-align: center; font-family: 'Courier New', monospace; font-weight: bold; color: #854d0e;">
                  ${s.score}
                </td>
                <td style="text-align: right;">
                  <span class="sub-grade" style="color: ${s.gradeObj.color};">${escapeHtml(s.gradeObj.grade)}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Mentor Diagnostic Feedback -->
    <section class="mentor-section">
      <div class="mentor-heading">魔法导师鉴定评语及进阶指引 (Mentor Diagnostic &amp; Progression Advice)</div>
      <p class="mentor-text">
        "${escapeHtml(feedback)}"
      </p>
    </section>

    <!-- Footer: Official Ministry Seal & Signatures -->
    <footer class="cert-footer">
      <div class="seal-wrap">
        <div class="ministry-seal" title="OFFICIAL SEAL — MINISTRY OF MAGIC EXAM BOARD">
          <div class="seal-ring-inner">
            <span class="seal-text-top">MINISTRY</span>
            <span class="seal-text-mid">OFFICIAL SEAL</span>
            <span class="seal-text-bot">EXAM BOARD</span>
          </div>
        </div>
        <div class="seal-caption">
          <strong>MINISTRY OF MAGIC EXAM BOARD</strong><br>
          Official Seal &amp; Certified Authentication
        </div>
      </div>

      <div class="signatures-block">
        <div class="signature-item">
          <div class="sig-line">Griselda Marchbanks</div>
          <div class="sig-role">Chief Examiner (格丝尔达·玛奇班 主考官)</div>
        </div>
        <div class="signature-item">
          <div class="sig-line">Albus Dumbledore</div>
          <div class="sig-role">Hogwarts Headmaster (阿不思·邓布利多 校长)</div>
        </div>
      </div>
    </footer>
  </main>

</body>
</html>
`
}

/**
 * Triggers printing of the O.W.L.s certificate in a clean print window or iframe
 * @param {object} examData
 * @param {object} studentProfile
 */
export function printOwlsCertificate(examData, studentProfile) {
  if (typeof window === 'undefined') return
  const html = generateOwlsCertificateHTML(examData, studentProfile)

  // Use hidden iframe for seamless printing without pop-up blocker issues
  try {
    let iframe = document.getElementById('owls-cert-print-frame')
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'owls-cert-print-frame'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
    }

    const frameDoc = iframe.contentWindow || iframe.contentDocument
    const doc = frameDoc.document || frameDoc

    doc.open()
    doc.write(html)
    doc.close()

    setTimeout(() => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      } catch (err) {
        console.warn('[OwlsCertificate] Iframe print failed, falling back to window.open:', err)
        const printWin = window.open('', '_blank')
        if (printWin) {
          printWin.document.write(html)
          printWin.document.close()
          printWin.focus()
          printWin.print()
        }
      }
    }, 250)
  } catch (e) {
    console.error('[OwlsCertificate] Print error:', e)
  }
}

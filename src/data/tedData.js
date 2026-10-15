/**
 * TED Talks data repository and URL resolvers
 */

export const TALKS = [
  {
    id: 'ted-simon-sinek-2009',
    title: 'How Great Leaders Inspire Action',
    titleCn: '伟大领袖如何激励行动',
    speaker: 'Simon Sinek',
    year: 2009,
    durationSeconds: 1088,
    cefrLevel: 'B1',
    wpm: 142,
    topicTags: ['leadership', 'motivation', 'business'],
    videoKey: 'ted/simon-sinek-2009/video.mp4',
    vttKey: 'ted/simon-sinek-2009/subtitle.vtt',
    thumbnailKey: 'ted/simon-sinek-2009/thumb.jpg',
    vocabSet: [
      {
        word: 'inspire',
        ipa: '/ɪnˈspaɪər/',
        pos: 'v.',
        cefrLevel: 'B1',
        definitionCn: '激励；鼓舞',
        exampleSentence: 'Great leaders inspire people to take action.',
        audioKey: 'ted/simon-sinek-2009/vocab/inspire.mp3',
        examTag: '高考重点'
      },
      {
        word: 'innovative',
        ipa: '/ˈɪnəveɪtɪv/',
        pos: 'adj.',
        cefrLevel: 'B2',
        definitionCn: '创新的；革新的',
        exampleSentence: 'Why is Apple so much more innovative than all their competitors?',
        audioKey: 'ted/simon-sinek-2009/vocab/innovative.mp3',
        examTag: '四六级'
      },
      {
        word: 'distinguish',
        ipa: '/dɪˈstɪŋɡwɪʃ/',
        pos: 'v.',
        cefrLevel: 'B2',
        definitionCn: '区分；辨别',
        exampleSentence: 'How do you distinguish a leader from someone who leads?',
        audioKey: 'ted/simon-sinek-2009/vocab/distinguish.mp3',
        examTag: '高考重点'
      },
      {
        word: 'biology',
        ipa: '/baɪˈɒlədʒi/',
        pos: 'n.',
        cefrLevel: 'B1',
        definitionCn: '生物学',
        exampleSentence: 'This is not opinion; this is grounded in the tenets of biology.',
        audioKey: 'ted/simon-sinek-2009/vocab/biology.mp3',
        examTag: '中考'
      },
      {
        word: 'gut',
        ipa: '/ɡʌt/',
        pos: 'n.',
        cefrLevel: 'B2',
        definitionCn: '直觉；本能；内脏',
        exampleSentence: 'We make gut decisions based on what feels right.',
        audioKey: 'ted/simon-sinek-2009/vocab/gut.mp3',
        examTag: '雅思'
      },
      {
        word: 'loyalty',
        ipa: '/ˈlɔɪəlti/',
        pos: 'n.',
        cefrLevel: 'B1',
        definitionCn: '忠诚；忠实',
        exampleSentence: 'The goal is not just to sell, but to inspire customer loyalty.',
        audioKey: 'ted/simon-sinek-2009/vocab/loyalty.mp3',
        examTag: '高考重点'
      },
      {
        word: 'believer',
        ipa: '/bɪˈliːvər/',
        pos: 'n.',
        cefrLevel: 'B1',
        definitionCn: '信徒；信仰者',
        exampleSentence: 'Early adopters are believers who want what you believe.',
        audioKey: 'ted/simon-sinek-2009/vocab/believer.mp3',
        examTag: '高中'
      },
      {
        word: 'remarkable',
        ipa: '/rɪˈmɑːkəbl/',
        pos: 'adj.',
        cefrLevel: 'B2',
        definitionCn: '非凡的；显著的',
        exampleSentence: 'They achieved a remarkable breakthrough in human history.',
        audioKey: 'ted/simon-sinek-2009/vocab/remarkable.mp3',
        examTag: '四六级'
      }
    ],
    tasks: {
      cloze: [
        {
          id: 'cloze-1',
          sentenceWithBlanks: "People don't buy what you do, they buy ___.",
          blanks: ['why you do it'],
          fullSentence: "People don't buy what you do, they buy why you do it.",
          startSeconds: 240
        },
        {
          id: 'cloze-2',
          sentenceWithBlanks: "If you hire people just because they can do a job, they’ll work for your ___.",
          blanks: ['money'],
          fullSentence: "If you hire people just because they can do a job, they’ll work for your money.",
          startSeconds: 410
        },
        {
          id: 'cloze-3',
          sentenceWithBlanks: "The goal is not just to do business with people who need what you have, but people who ___ what you believe.",
          blanks: ['believe'],
          fullSentence: "The goal is not just to do business with people who need what you have, but people who believe what you believe.",
          startSeconds: 480
        },
        {
          id: 'cloze-4',
          sentenceWithBlanks: 'Leaders hold a position of power, but those who lead ___ us.',
          blanks: ['inspire'],
          fullSentence: 'Leaders hold a position of power, but those who lead inspire us.',
          startSeconds: 960
        },
        {
          id: 'cloze-5',
          sentenceWithBlanks: 'We follow those who lead, not because we have to, but because we ___ to.',
          blanks: ['want'],
          fullSentence: 'We follow those who lead, not because we have to, but because we want to.',
          startSeconds: 1020
        }
      ],
      matching: [
        {
          id: 'match-1',
          summaryText: 'The Golden Circle: Why, How, What',
          timestampSeconds: 180,
          formattedTime: '03:00'
        },
        {
          id: 'match-2',
          summaryText: 'The Biology of Human Decision-Making',
          timestampSeconds: 520,
          formattedTime: '08:40'
        },
        {
          id: 'match-3',
          summaryText: 'The Law of Diffusion of Innovation',
          timestampSeconds: 670,
          formattedTime: '11:10'
        }
      ]
    },
    shadowingSegments: [
      {
        id: 'seg-1',
        startSeconds: 60,
        endSeconds: 90,
        transcript: "How do you explain when things don't go as we assume? Or better, how do you explain when others are able to achieve things that seem to defy all of the assumptions?",
        transcriptCn: '当事情不如我们所料时，你该如何解释？或者说，当其他人能够取得似乎违背所有假设的成就时，你该如何解释？'
      },
      {
        id: 'seg-2',
        startSeconds: 240,
        endSeconds: 270,
        transcript: "People don't buy what you do; they buy why you do it. If you talk about what you believe, you will attract those who believe what you believe.",
        transcriptCn: '人们买的不是你做的事情，而是你为什么做这件事。如果你谈论你的信念，你就会吸引那些认同你信念的人。'
      }
    ]
  }
]

/**
 * Resolves the streaming video URL for an R2 key.
 * Hierarchy:
 * 1. Custom CDN domain (if supplied or via environment variable)
 * 2. Express/Vite streaming proxy (/api/stream/video/:key)
 *
 * @param {string} videoKey - e.g. "ted/simon-sinek-2009/video.mp4"
 * @param {string} [apiBase=''] - Optional base URL prefix
 * @param {string} [customCdnDomain] - Optional CDN domain
 * @returns {string} Resolved video URL
 */
export function resolveVideoStreamUrl(videoKey, apiBase = '', customCdnDomain = null) {
  if (!videoKey) return ''

  const cdn =
    customCdnDomain ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_R2_PUBLIC_DOMAIN) ||
    (typeof window !== 'undefined' && window.__HP_CDN_DOMAIN__) ||
    ''

  if (cdn) {
    const cleanDomain = cdn.replace(/\/+$/, '')
    const cleanKey = videoKey.replace(/^\/+/, '')
    const prefix = cleanDomain.startsWith('http') ? cleanDomain : `https://${cleanDomain}`
    return `${prefix}/${cleanKey}`
  }

  const cleanApiBase = apiBase ? apiBase.replace(/\/+$/, '') : ''
  const cleanKey = videoKey.replace(/^\/+/, '')
  return `${cleanApiBase}/api/stream/video/${cleanKey}`
}

/**
 * Resolves the WebVTT subtitle URL for a TED talk R2 key.
 *
 * @param {string} vttKey - e.g. "ted/simon-sinek-2009/subtitle.vtt"
 * @param {string} [apiBase=''] - Optional base URL prefix
 * @returns {string} Resolved VTT URL
 */
export function resolveTedSubtitleUrl(vttKey, apiBase = '') {
  if (!vttKey) return ''
  const cleanApiBase = apiBase ? apiBase.replace(/\/+$/, '') : ''
  const cleanKey = vttKey.replace(/^\/+/, '')
  return `${cleanApiBase}/api/subtitles/${cleanKey}`
}

/**
 * Parse a VTT timestamp string (HH:MM:SS.mmm or MM:SS.mmm) into seconds
 * @param {string} timeStr
 * @returns {number}
 */
function parseVttTime(timeStr) {
  if (!timeStr) return 0
  const parts = timeStr.trim().replace(',', '.').split(':')
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
  } else if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  }
  return 0
}

/**
 * Parse bilingual WebVTT subtitle text into synchronized enCues and zhCues.
 * Cues are paired by matching timestamps.
 *
 * @param {string} vttText
 * @returns {{ enCues: Array<{startTime: number, endTime: number, text: string}>, zhCues: Array<{startTime: number, endTime: number, text: string}> }}
 */
export function parseBilingualVtt(vttText) {
  if (!vttText || typeof vttText !== 'string') {
    return { enCues: [], zhCues: [] }
  }

  const normalized = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalized.split(/\n\s*\n/)
  const allCues = []

  const timeRegex = /((?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3}))\s*-->\s*((?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3}))/

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) continue
    if (lines[0].startsWith('WEBVTT') || lines[0].startsWith('NOTE')) continue

    let timeIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (timeRegex.test(lines[i])) {
        timeIndex = i
        break
      }
    }
    if (timeIndex === -1) continue

    const match = lines[timeIndex].match(timeRegex)
    const startTime = parseVttTime(match[1])
    const endTime = parseVttTime(match[6])
    const textLines = lines.slice(timeIndex + 1)
    const text = textLines.join(' ').replace(/<\/?[^>]+(>|$)/g, '').trim()
    if (text) {
      allCues.push({ startTime, endTime, text })
    }
  }

  const enCues = []
  const zhCues = []
  const chineseRegex = /[\u4e00-\u9fff]/

  let i = 0
  while (i < allCues.length) {
    const current = allCues[i]
    const next = allCues[i + 1]

    if (next && Math.abs(current.startTime - next.startTime) < 0.1 && Math.abs(current.endTime - next.endTime) < 0.1) {
      const currentIsZh = chineseRegex.test(current.text)
      const nextIsZh = chineseRegex.test(next.text)

      if (currentIsZh && !nextIsZh) {
        zhCues.push(current)
        enCues.push(next)
      } else if (!currentIsZh && nextIsZh) {
        enCues.push(current)
        zhCues.push(next)
      } else {
        enCues.push(current)
        zhCues.push(next)
      }
      i += 2
    } else {
      if (chineseRegex.test(current.text)) {
        zhCues.push(current)
      } else {
        enCues.push(current)
      }
      i += 1
    }
  }

  return { enCues, zhCues }
}

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
  },
  {
    id: '20260106-how-japan-saved-its-biggest-city-from-collapse-roman',
    title: '20260106 How Japan Saved Its Biggest City From Collapse Roman',
    titleCn: '江户启示录：日本如何拯救其最大城市免于崩溃',
    speaker: 'Roman',
    year: 2026,
    durationSeconds: 352,
    cefrLevel: 'B1',
    wpm: 123,
    topicTags: ['environment', 'history', 'sustainability'],
    videoKey: 'ted/20260106-how-japan-saved-its-biggest-city-from-collapse-roman/video.mp4',
    vttKey: 'ted/20260106-how-japan-saved-its-biggest-city-from-collapse-roman/subtitle.vtt',
    thumbnailKey: 'ted/20260106-how-japan-saved-its-biggest-city-from-collapse-roman/cover.jpg',
    vocabSet: [
      {
        word: 'ecological',
        ipa: '/ˌiːkəˈlɒdʒɪkl/',
        pos: 'adj.',
        cefrLevel: 'B2',
        definitionCn: '生态的；生态学的',
        exampleSentence: 'However, it was on the verge of ecological collapse.',
        examTag: '高考重点'
      },
      {
        word: 'deforestation',
        ipa: '/diːˌfɒrɪˈsteɪʃn/',
        pos: 'n.',
        cefrLevel: 'C1',
        definitionCn: '森林砍伐；滥伐森林',
        exampleSentence: 'Years of intense logging had led to massive deforestation.',
        examTag: '雅思'
      },
      {
        word: 'erosion',
        ipa: '/ɪˈrəʊʒn/',
        pos: 'n.',
        cefrLevel: 'B2',
        definitionCn: '侵蚀；水土流失',
        exampleSentence: 'The city now faced timber shortages and the impacts of severe erosion.',
        examTag: '四六级'
      },
      {
        word: 'sustainable',
        ipa: '/səˈsteɪnəbl/',
        pos: 'adj.',
        cefrLevel: 'B2',
        definitionCn: '可持续的；能长久维持的',
        exampleSentence: 'Edo will transform and become one of the most sustainable cities in history.',
        examTag: '高考重点'
      },
      {
        word: 'reforestation',
        ipa: '/riːˌfɒrɪˈsteɪʃn/',
        pos: 'n.',
        cefrLevel: 'C1',
        definitionCn: '重新造林；植树再造林',
        exampleSentence: 'The shoguns introduced limitations on logging and launched sprawling reforestation programs.',
        examTag: '雅思'
      },
      {
        word: 'rationing',
        ipa: '/ˈræʃənɪŋ/',
        pos: 'n.',
        cefrLevel: 'B2',
        definitionCn: '定量配给；配给制',
        exampleSentence: 'To curb demands for timber, strict rationing rules were introduced.',
        examTag: '四六级'
      },
      {
        word: 'byproduct',
        ipa: '/ˈbaɪprɒdʌkt/',
        pos: 'n.',
        cefrLevel: 'B2',
        definitionCn: '副产品',
        exampleSentence: 'Residents used agricultural byproducts, like rice straw, to make rope.',
        examTag: '四六级'
      },
      {
        word: 'repurpose',
        ipa: '/ˌriːˈpɜːpəs/',
        pos: 'v.',
        cefrLevel: 'B2',
        definitionCn: '改变用途；重新利用',
        exampleSentence: 'Families developed techniques to reuse or repurpose items, rather than discarding them.',
        examTag: '雅思'
      },
      {
        word: 'authoritarian',
        ipa: '/ɔːˌθɒrɪˈteəriən/',
        pos: 'adj.',
        cefrLevel: 'C1',
        definitionCn: '独裁主义的；专制的',
        exampleSentence: 'Strict laws and regulations were enforced by harsh authoritarian rule.',
        examTag: '雅思'
      },
      {
        word: 'circular',
        ipa: '/ˈsɜːkjələ(r)/',
        pos: 'adj.',
        cefrLevel: 'B2',
        definitionCn: '循环的；循环经济的',
        exampleSentence: 'Today, at a time when only 7% of the global economy is circular.',
        examTag: '高考重点'
      }
    ],
    tasks: {
      cloze: [
        {
          id: 'cloze-1',
          sentenceWithBlanks: 'However, it was on the verge of ___ collapse.',
          blanks: ['ecological'],
          fullSentence: 'However, it was on the verge of ecological collapse.',
          startSeconds: 19
        },
        {
          id: 'cloze-2',
          sentenceWithBlanks: 'Years of intense logging had led to massive ___.',
          blanks: ['deforestation'],
          fullSentence: 'Years of intense logging had led to massive deforestation.',
          startSeconds: 23
        },
        {
          id: 'cloze-3',
          sentenceWithBlanks: 'They drew upon the concept of motainai, which emphasized not ___ resources.',
          blanks: ['wasting'],
          fullSentence: 'They drew upon the concept of motainai, which emphasized not wasting resources.',
          startSeconds: 123
        },
        {
          id: 'cloze-4',
          sentenceWithBlanks: 'To curb demands for timber, strict ___ rules were introduced.',
          blanks: ['rationing'],
          fullSentence: 'To curb demands for timber, strict rationing rules were introduced.',
          startSeconds: 152
        },
        {
          id: 'cloze-5',
          sentenceWithBlanks: 'Edo reminds us that we can create economies driven not by ___ and waste.',
          blanks: ['consumption'],
          fullSentence: 'Edo reminds us that we can create economies driven not by consumption and waste.',
          startSeconds: 325
        }
      ],
      matching: [
        {
          id: 'match-1',
          summaryText: 'Ecological crisis: severe deforestation and timber shortages',
          timestampSeconds: 19,
          formattedTime: '00:19'
        },
        {
          id: 'match-2',
          summaryText: 'The Motainai philosophy: reforestation and zero-waste industries',
          timestampSeconds: 123,
          formattedTime: '02:03'
        },
        {
          id: 'match-3',
          summaryText: 'Kintsugi gold repair and boro patchwork traditions',
          timestampSeconds: 208,
          formattedTime: '03:28'
        }
      ]
    },
    shadowingSegments: [
      {
        id: 'seg-1',
        startSeconds: 123,
        endSeconds: 147,
        transcript: 'They drew upon the Buddhist concept of motainai, which emphasized not wasting resources and being satisfied with just enough. Realizing the extent of ecological destruction, the shoguns introduced limitations on logging and launched sprawling reforestation programs.',
        transcriptCn: '他们借鉴了佛教‘motainai’（物尽其用）的理念，强调不浪费资源，知足常乐。在意识到生态破坏的严重程度后，幕府将军实施了砍伐限制，并启动了大规模的重新造林计划。'
      },
      {
        id: 'seg-2',
        startSeconds: 306,
        endSeconds: 335,
        transcript: "Edo's transformation from a city teetering on ecological collapse to a thriving cultural epicenter shows us that what's broken can be repaired, and by doing so, we can create something even more beautiful.",
        transcriptCn: '江户从一座在生态崩溃边缘摇摇欲坠的城市转变为繁荣的文化中心，这告诉我们：破碎的事物可以被修复，而在修复的过程中，我们能够创造出更加美丽的事物。'
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

  const normalized = vttText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalized.split(/\n\s*\n/)

  const timeRegex = /((?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3}))\s*-->\s*((?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3}))/
  const chineseRegex = /[\u4e00-\u9fff]/

  const enCues = []
  const zhCues = []
  const singleLangCues = []

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
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
    const textLines = lines
      .slice(timeIndex + 1)
      .map((l) => l.replace(/<\/?[^>]+(>|$)/g, '').trim())
      .filter(Boolean)

    if (!textLines.length) continue

    const zhLines = textLines.filter((l) => chineseRegex.test(l))
    const enLines = textLines.filter((l) => !chineseRegex.test(l))

    // Case 1: The block itself contains BOTH English and Chinese lines (Standard TED / Whisper bilingual format)
    if (zhLines.length > 0 && enLines.length > 0) {
      const enText = enLines.join(' ')
      const zhText = zhLines.join(' ')
      enCues.push({ startTime, endTime, text: enText, zh: zhText })
      zhCues.push({ startTime, endTime, text: zhText })
    } else if (zhLines.length > 0) {
      singleLangCues.push({ startTime, endTime, text: zhLines.join(' '), isZh: true })
    } else {
      singleLangCues.push({ startTime, endTime, text: enLines.join(' '), isZh: false })
    }
  }

  // Case 2: Process separate consecutive single-language cues (Separate blocks with matching timestamps)
  let i = 0
  while (i < singleLangCues.length) {
    const current = singleLangCues[i]
    const next = singleLangCues[i + 1]

    if (next && Math.abs(current.startTime - next.startTime) < 0.2) {
      if (current.isZh && !next.isZh) {
        zhCues.push({ startTime: current.startTime, endTime: current.endTime, text: current.text })
        enCues.push({ startTime: next.startTime, endTime: next.endTime, text: next.text, zh: current.text })
      } else if (!current.isZh && next.isZh) {
        enCues.push({ startTime: current.startTime, endTime: current.endTime, text: current.text, zh: next.text })
        zhCues.push({ startTime: next.startTime, endTime: next.endTime, text: next.text })
      } else {
        if (current.isZh) zhCues.push(current)
        else enCues.push(current)
        if (next.isZh) zhCues.push(next)
        else enCues.push(next)
      }
      i += 2
    } else {
      if (current.isZh) {
        zhCues.push({ startTime: current.startTime, endTime: current.endTime, text: current.text })
      } else {
        enCues.push({ startTime: current.startTime, endTime: current.endTime, text: current.text })
      }
      i += 1
    }
  }

  return { enCues, zhCues }
}

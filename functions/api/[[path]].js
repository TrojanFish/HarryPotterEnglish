// Cloudflare Pages Functions native R2 Handler
// Bind your R2 bucket in Cloudflare Pages Dashboard (Settings > Functions > R2 bucket bindings)
// Variable name: "HP_AUDIO_BUCKET"

const KNOWN_TITLE_MAP = {
  'hp-book-1': { cnTitle: '哈利·波特与魔法石', code: 'HP1', color: '#740001' },
  'hp-book-2': { cnTitle: '哈利·波特与密室', code: 'HP2', color: '#1a472a' },
  'hp-book-3': { cnTitle: '哈利·波特与阿兹卡班的囚徒', code: 'HP3', color: '#0e1a40' },
  'hp-book-4': { cnTitle: '哈利·波特与火焰杯', code: 'HP4', color: '#740001' },
  'hp-book-5': { cnTitle: '哈利·波特与凤凰社', code: 'HP5', color: '#0e1a40' },
  'hp-book-6': { cnTitle: '哈利·波特与混血王子', code: 'HP6', color: '#1a472a' },
  'hp-book-7': { cnTitle: '哈利·波特与死亡圣器', code: 'HP7', color: '#740001' },
  'the-little-prince': { cnTitle: '小王子', code: 'TLP', color: '#b8860b' },
  'tiny-tales': { cnTitle: '经典童话故事', code: 'TALES', color: '#4a7c59' },
};

export async function onRequest(context) {
  const { request, env, params } = context;
  const pathParts = params.path || [];
  const action = pathParts[0]; // 'catalog', 'media', 'subtitles', 'raw', 'config'
  const objectKey = pathParts.slice(1).join('/');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const bucket = env.HP_AUDIO_BUCKET;

  // 1. Config status
  if (action === 'config') {
    return new Response(JSON.stringify({ status: 'ok', r2Bound: Boolean(bucket) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 2. Catalog endpoint
  if (action === 'catalog') {
    if (!bucket) {
      // Fallback response if R2 binding is pending
      return new Response(JSON.stringify({
        books: [
          {
            id: 'hp-book-1',
            title: "Harry Potter and the Philosopher's Stone",
            cnTitle: '哈利·波特与魔法石',
            code: 'HP1',
            cover: '',
            color: '#740001',
            chapters: [
              {
                id: 'hp-book-1_ep01',
                epId: 'ep01',
                number: 1,
                title: 'The Boy Who Lived',
                duration: '18:24',
                audioKey: 'podcasts/hp-book-1/episodes/ep01/audio.mp3',
                subtitleKey: 'podcasts/hp-book-1/episodes/ep01/subtitle.vtt'
              }
            ]
          }
        ],
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const AUDIO_REGEX = /\.(mp3|m4a|wav|aac|ogg|flac)$/i;
      const stripEmojis = (str) => (!str ? '' : str.replace(/\p{Extended_Pictographic}/gu, '').replace(/\s+/g, ' ').trim());

      const listed = await bucket.list({ prefix: 'podcasts/', delimiter: '' });
      const keys = listed.objects.map(o => o.key);
      const audioKeys = new Set(keys.filter(k => AUDIO_REGEX.test(k)));

      const showIds = [...new Set(keys.map(k => {
        const parts = k.split('/');
        return parts.length >= 2 ? parts[1] : null;
      }))].filter(id => id && !id.startsWith('.'));

      const books = (await Promise.all(showIds.map(async (showId) => {
        const showDir = `podcasts/${showId}`;

        // Strictly verify if this folder contains at least one audio file in R2
        const folderHasAudio = [...audioKeys].some(k => k.startsWith(`${showDir}/`));
        if (!folderHasAudio) {
          return null;
        }

        const showKey = `${showDir}/show.json`;
        let showInfo = {};
        try {
          const showObj = await bucket.get(showKey);
          if (showObj) {
            const text = await showObj.text();
            showInfo = JSON.parse(text);
          }
        } catch (e) {}

        const metaKeys = keys.filter(k => k.startsWith(`${showDir}/episodes/`) && k.endsWith('/meta.json'));
        let episodes = [];

        if (metaKeys.length > 0) {
          episodes = (await Promise.all(metaKeys.map(async (metaKey) => {
            const epDir = metaKey.replace('/meta.json', '');
            const epId = epDir.split('/').pop();

            const directAudioKey = `${epDir}/audio.mp3`;
            const actualAudioKey = audioKeys.has(directAudioKey)
              ? directAudioKey
              : [...audioKeys].find(k => k.startsWith(`${epDir}/`));

            if (!actualAudioKey) {
              return null;
            }

            let epMeta = {};
            try {
              const epObj = await bucket.get(metaKey);
              if (epObj) {
                const text = await epObj.text();
                epMeta = JSON.parse(text);
              }
            } catch (e) {}

            const epNum = parseInt(epMeta.episode || epId.replace('ep', ''), 10) || 1;
            return {
              id: `${showId}_${epId}`,
              epId,
              number: epNum,
              title: stripEmojis(epMeta.title) || `Chapter ${epNum}`,
              cnTitle: epMeta.cnTitle ? stripEmojis(epMeta.cnTitle) : '',
              description: epMeta.description || '',
              duration: epMeta.duration || '',
              durationSeconds: epMeta.durationSeconds || 0,
              audioKey: actualAudioKey,
              subtitleKey: `${epDir}/subtitle.vtt`,
              showId
            };
          }))).filter(Boolean);
        } else {
          const showAudioList = [...audioKeys].filter(k => k.startsWith(`${showDir}/`));
          episodes = showAudioList.map((aKey, idx) => {
            const filename = aKey.split('/').pop().replace(AUDIO_REGEX, '');
            const epNum = idx + 1;
            return {
              id: `${showId}_ep${String(epNum).padStart(2, '0')}`,
              epId: `ep${String(epNum).padStart(2, '0')}`,
              number: epNum,
              title: `Chapter ${epNum} (${filename})`,
              description: '',
              duration: '',
              durationSeconds: 0,
              audioKey: aKey,
              subtitleKey: aKey.replace(AUDIO_REGEX, '.vtt'),
              showId
            };
          });
        }

        episodes.sort((a, b) => a.number - b.number);

        if (episodes.length === 0) {
          return null;
        }

        const metaExtra = KNOWN_TITLE_MAP[showId] || { cnTitle: stripEmojis(showInfo.title) || showId, code: 'BOOK', color: '#cba358' };

        return {
          id: showId,
          title: stripEmojis(showInfo.title) || showId,
          cnTitle: stripEmojis(metaExtra.cnTitle),
          code: metaExtra.code || 'BOOK',
          cover: '',
          color: metaExtra.color,
          description: showInfo.description || '',
          coverPath: showInfo.coverPath || null,
          chapters: episodes
        };
      }))).filter(Boolean);

      return new Response(JSON.stringify({ books, cached: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  if (!bucket) {
    return new Response(
      JSON.stringify({ error: 'HP_AUDIO_BUCKET R2 binding not configured on Cloudflare Pages' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 3. Audio streaming with Range support
  if (action === 'media') {
    const key = objectKey.endsWith('.mp3') ? objectKey : `${objectKey}.mp3`;
    const rangeHeader = request.headers.get('range');
    const getOptions = {};
    if (rangeHeader) {
      getOptions.range = request.headers;
    }

    const object = await bucket.get(key, getOptions);
    if (!object) {
      return new Response('Audio file not found in R2', { status: 404, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=604800, immutable');

    const status = rangeHeader ? 206 : 200;
    return new Response(object.body, { headers, status });
  }

  // 4. Subtitles
  if (action === 'subtitles') {
    const key = objectKey.endsWith('.vtt') ? objectKey : `${objectKey}.vtt`;
    const object = await bucket.get(key);
    if (!object) {
      return new Response('Subtitle file not found in R2', { status: 404, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', 'text/vtt; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=86400');
    return new Response(object.body, { headers });
  }

  // 5. Raw media (covers, images, etc.)
  if (action === 'raw') {
    const object = await bucket.get(objectKey);
    if (!object) {
      return new Response('Media file not found in R2', { status: 404, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    if (objectKey.endsWith('.jpg') || objectKey.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
    else if (objectKey.endsWith('.png')) headers.set('Content-Type', 'image/png');
    else if (objectKey.endsWith('.json')) headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'public, max-age=604800, immutable');

    return new Response(object.body, { headers });
  }

  return new Response('Endpoint not found', { status: 404, headers: corsHeaders });
}

// Cloudflare Pages Functions native R2 Handler
// Bind your R2 bucket in Cloudflare Pages Dashboard (Settings > Functions > R2 bucket bindings)
// Variable name: "HP_AUDIO_BUCKET"

const KNOWN_TITLE_MAP = {
  'hp-book-1': { cnTitle: '哈利·波特与魔法石', cover: '🧙‍♂️', color: '#740001' },
  'hp-book-2': { cnTitle: '哈利·波特与密室', cover: '🐍', color: '#1a472a' },
  'hp-book-3': { cnTitle: '哈利·波特与阿兹卡班的囚徒', cover: '🐺', color: '#0e1a40' },
  'hp-book-4': { cnTitle: '哈利·波特与火焰杯', cover: '🏆', color: '#740001' },
  'hp-book-5': { cnTitle: '哈利·波特与凤凰社', cover: '🦅', color: '#0e1a40' },
  'hp-book-6': { cnTitle: '哈利·波特与混血王子', cover: '⚗️', color: '#1a472a' },
  'hp-book-7': { cnTitle: '哈利·波特与死亡圣器', cover: '⚔️', color: '#740001' },
  'the-little-prince': { cnTitle: '小王子', cover: '👑', color: '#b8860b' },
  'tiny-tales': { cnTitle: '经典童话故事', cover: '📖', color: '#4a7c59' },
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
            cover: '🧙‍♂️',
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
      const listed = await bucket.list({ prefix: 'podcasts/', delimiter: '' });
      const keys = listed.objects.map(o => o.key);
      const showJsonKeys = keys.filter(k => k.endsWith('/show.json'));

      const books = await Promise.all(showJsonKeys.map(async (showKey) => {
        const showDir = showKey.replace('/show.json', '');
        const showId = showDir.split('/').pop();

        let showInfo = {};
        try {
          const showObj = await bucket.get(showKey);
          if (showObj) {
            const text = await showObj.text();
            showInfo = JSON.parse(text);
          }
        } catch (e) {}

        const metaKeys = keys.filter(k => k.startsWith(`${showDir}/episodes/`) && k.endsWith('/meta.json'));
        const episodes = await Promise.all(metaKeys.map(async (metaKey) => {
          const epDir = metaKey.replace('/meta.json', '');
          const epId = epDir.split('/').pop();
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
            title: epMeta.title || `Chapter ${epNum}`,
            description: epMeta.description || '',
            duration: epMeta.duration || '',
            audioKey: `${epDir}/audio.mp3`,
            subtitleKey: `${epDir}/subtitle.vtt`,
            showId
          };
        }));

        episodes.sort((a, b) => a.number - b.number);
        const metaExtra = KNOWN_TITLE_MAP[showId] || { cnTitle: showInfo.title || showId, cover: '📖', color: '#cba358' };

        return {
          id: showId,
          title: showInfo.title || showId,
          cnTitle: metaExtra.cnTitle,
          cover: metaExtra.cover,
          color: metaExtra.color,
          description: showInfo.description || '',
          coverPath: showInfo.coverPath || null,
          chapters: episodes
        };
      }));

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

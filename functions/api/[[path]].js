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
    return new Response(JSON.stringify({ 
      status: 'ok', 
      r2Bound: Boolean(bucket),
      d1Bound: Boolean(env.DB)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // 1.5. Local-First Sync Endpoint (Cloudflare D1 SQLite)
  if (action === 'sync') {
    const db = env.DB;
    const isPairRequest = pathParts[1] === 'pair';

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const payload = await request.json();

      // Pair request
      if (isPairRequest) {
        if (!db) {
          return new Response(JSON.stringify({
            status: 'ok',
            targetUserId: payload.currentUserId,
            message: '离线模式：模拟配对成功',
            isOfflineFallback: true
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const cleanCode = (payload.targetSyncCode || '').trim().toUpperCase();
        const targetRow = await db.prepare(
          'SELECT user_id FROM user_devices WHERE sync_code = ? LIMIT 1'
        ).bind(cleanCode).first();

        if (!targetRow) {
          return new Response(JSON.stringify({
            status: 'error',
            message: '未找到该通行码对应的学习档案'
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const targetUserId = targetRow.user_id;
        if (payload.currentUserId && payload.currentUserId !== targetUserId) {
          await db.prepare(`
            INSERT INTO user_vocab (user_id, word, phonetic, pos, translation, definition, context_sentence, context_audio_key, srs_box, next_review_at, review_count, correct_count, is_deleted, updated_at, created_at)
            SELECT ?, word, phonetic, pos, translation, definition, context_sentence, context_audio_key, srs_box, next_review_at, review_count, correct_count, is_deleted, updated_at, created_at
            FROM user_vocab WHERE user_id = ?
            ON CONFLICT(user_id, word) DO UPDATE SET
              srs_box = CASE WHEN excluded.updated_at > user_vocab.updated_at THEN excluded.srs_box ELSE user_vocab.srs_box END,
              updated_at = MAX(excluded.updated_at, user_vocab.updated_at)
          `).bind(targetUserId, payload.currentUserId).run();
        }

        return new Response(JSON.stringify({
          status: 'ok',
          targetUserId,
          syncCode: cleanCode,
          message: `配对成功！已连接至档案 [${cleanCode}]`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Normal Sync Request
      const serverTime = Date.now();
      const safeUserId = payload.userId || 'usr_guest';
      const safeDeviceId = payload.deviceId || 'dev_unknown';
      const lastSyncedAt = payload.lastSyncedAt || 0;

      // Fallback if D1 is not bound yet in Pages dashboard
      if (!db) {
        return new Response(JSON.stringify({
          status: 'ok',
          serverTime,
          userId: safeUserId,
          syncCode: 'HP-DEMO',
          syncedCount: { vocabPushed: 0, vocabPulled: 0, analyticsPushed: 0, analyticsPulled: 0 },
          serverChanges: { vocab: [], analytics: [] },
          isOfflineFallback: true
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 1. Device registration / lookup
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let hash = 0;
      for (let i = 0; i < safeUserId.length; i++) hash = (hash * 31 + safeUserId.charCodeAt(i)) >>> 0;
      let genCode = 'HP-';
      for (let i = 0; i < 4; i++) genCode += chars[(hash + i * 7) % chars.length];

      await db.prepare(`
        INSERT INTO user_devices (device_id, user_id, sync_code, last_synced_at, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(device_id) DO UPDATE SET
          last_synced_at = excluded.last_synced_at
      `).bind(safeDeviceId, safeUserId, genCode, serverTime, serverTime).run();

      // 2. Upsert vocab changes (LWW)
      let vocabPushed = 0;
      if (Array.isArray(payload.changes?.vocab)) {
        for (const v of payload.changes.vocab) {
          if (!v || !v.word) continue;
          await db.prepare(`
            INSERT INTO user_vocab (
              user_id, word, phonetic, pos, translation, definition,
              context_sentence, context_audio_key, srs_box, next_review_at,
              review_count, correct_count, is_deleted, updated_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, word) DO UPDATE SET
              srs_box = excluded.srs_box,
              next_review_at = excluded.next_review_at,
              review_count = excluded.review_count,
              correct_count = excluded.correct_count,
              is_deleted = excluded.is_deleted,
              updated_at = excluded.updated_at
            WHERE excluded.updated_at > user_vocab.updated_at
          `).bind(
            safeUserId, v.word.trim().toLowerCase(), v.phonetic || '', v.pos || '',
            v.translation || '', v.definition || '', v.contextSentence || '',
            v.contextAudioKey || '', v.srsBox !== undefined ? v.srsBox : 1,
            v.nextReviewAt || 0, v.reviewCount || 0, v.correctCount || 0,
            v.isDeleted ? 1 : 0, v.updatedAt || serverTime, v.createdAt || serverTime
          ).run();
          vocabPushed++;
        }
      }

      // 3. Upsert analytics changes (LWW)
      let analyticsPushed = 0;
      if (Array.isArray(payload.changes?.analytics)) {
        for (const a of payload.changes.analytics) {
          if (!a || !a.dateStr) continue;
          await db.prepare(`
            INSERT INTO user_analytics (
              user_id, date_str, listening_seconds, completed_goal,
              streak_days, time_turners, day_summary_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, date_str) DO UPDATE SET
              listening_seconds = excluded.listening_seconds,
              completed_goal = excluded.completed_goal,
              streak_days = excluded.streak_days,
              time_turners = excluded.time_turners,
              day_summary_json = excluded.day_summary_json,
              updated_at = excluded.updated_at
            WHERE excluded.updated_at > user_analytics.updated_at
          `).bind(
            safeUserId, a.dateStr, a.listeningSeconds || 0,
            a.completedGoal ? 1 : 0, a.streakDays || 0,
            a.timeTurners !== undefined ? a.timeTurners : 1,
            a.daySummaryJson || '', a.updatedAt || serverTime
          ).run();
          analyticsPushed++;
        }
      }

      // 4. Query newer changes from server for client
      const { results: serverVocab } = await db.prepare(
        'SELECT * FROM user_vocab WHERE user_id = ? AND updated_at > ?'
      ).bind(safeUserId, lastSyncedAt).all();

      const { results: serverAnalytics } = await db.prepare(
        'SELECT * FROM user_analytics WHERE user_id = ? AND updated_at > ?'
      ).bind(safeUserId, lastSyncedAt).all();

      return new Response(JSON.stringify({
        status: 'ok',
        serverTime,
        userId: safeUserId,
        syncCode: genCode,
        syncedCount: {
          vocabPushed,
          vocabPulled: serverVocab ? serverVocab.length : 0,
          analyticsPushed,
          analyticsPulled: serverAnalytics ? serverAnalytics.length : 0
        },
        serverChanges: {
          vocab: (serverVocab || []).map(r => ({
            word: r.word,
            phonetic: r.phonetic,
            pos: r.pos,
            translation: r.translation,
            definition: r.definition,
            contextSentence: r.context_sentence,
            contextAudioKey: r.context_audio_key,
            srsBox: r.srs_box,
            nextReviewAt: r.next_review_at,
            reviewCount: r.review_count,
            correctCount: r.correct_count,
            isDeleted: r.is_deleted === 1,
            updatedAt: r.updated_at,
            createdAt: r.created_at
          })),
          analytics: (serverAnalytics || []).map(r => ({
            dateStr: r.date_str,
            listeningSeconds: r.listening_seconds,
            completedGoal: r.completed_goal === 1,
            streakDays: r.streak_days,
            timeTurners: r.time_turners,
            daySummaryJson: r.day_summary_json,
            updatedAt: r.updated_at
          }))
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ status: 'error', message: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
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

  // 3. Audio streaming with Range support (support both /media/* and /stream/audio/*)
  if (action === 'media' || action === 'stream') {
    let cleanKey = objectKey;
    if (action === 'stream' && cleanKey.startsWith('audio/')) {
      cleanKey = cleanKey.replace(/^audio\//, '');
    }
    const key = cleanKey.endsWith('.mp3') ? cleanKey : `${cleanKey}.mp3`;
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
    headers.set('Cache-Control', 'public, max-age=2592000, immutable');

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

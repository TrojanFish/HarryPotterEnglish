/**
 * Mock Network utilities for testing offline download, progress events, and streaming.
 */

export function createSampleVTT(chapterTitle = 'Chapter 1') {
  return `WEBVTT - ${chapterTitle}

00:00:01.000 --> 00:00:04.500
Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal.

00:00:05.000 --> 00:00:09.200
They were the last people you'd expect to be involved in anything strange or mysterious.

00:00:10.000 --> 00:00:14.000
Mr. Dursley was the director of a firm called Grunnings, which made drills.
`;
}

export function createSampleAudioBlob(sizeInBytes = 1024) {
  const buffer = new Uint8Array(sizeInBytes);
  // Fill with dummy audio frame marker bytes
  for (let i = 0; i < sizeInBytes; i++) {
    buffer[i] = i % 256;
  }
  return new Blob([buffer], { type: 'audio/mpeg' });
}

/**
 * Creates a mock fetch function that serves audio and vtt responses,
 * with ReadableStream simulation for onProgress verification.
 */
export function createMockFetch({ audioBlob, vttText, streamChunks = 4 } = {}) {
  const audio = audioBlob || createSampleAudioBlob(4096);
  const vtt = vttText || createSampleVTT();

  return async function mockFetch(url, options = {}) {
    const urlStr = String(url);

    if (urlStr.endsWith('.vtt') || urlStr.includes('subtitles') || urlStr.includes('vtt')) {
      return new Response(vtt, {
        status: 200,
        headers: {
          'Content-Type': 'text/vtt',
          'Content-Length': String(Buffer.byteLength(vtt))
        }
      });
    }

    if (urlStr.endsWith('.mp3') || urlStr.includes('audio') || urlStr.includes('mp3')) {
      const arrayBuffer = await audio.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const totalLength = uint8.length;
      const chunkSize = Math.ceil(totalLength / streamChunks);

      // Create a ReadableStream simulating chunked network transfer
      let offset = 0;
      const stream = new ReadableStream({
        start(controller) {
          function pushChunk() {
            if (offset >= totalLength) {
              controller.close();
              return;
            }
            const nextOffset = Math.min(offset + chunkSize, totalLength);
            controller.enqueue(uint8.slice(offset, nextOffset));
            offset = nextOffset;
            pushChunk();
          }
          pushChunk();
        }
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(totalLength)
        }
      });
    }

    // Default 404
    return new Response('Not found', { status: 404 });
  };
}

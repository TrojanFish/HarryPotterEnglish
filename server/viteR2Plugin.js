import dotenv from 'dotenv'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { DEFAULT_CATALOG } from '../src/data/catalogData.js'

dotenv.config()

const AUDIO_REGEX = /\.(mp3|m4a|wav|aac|ogg|flac)$/i

export function r2DevPlugin() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucketName = process.env.R2_BUCKET_NAME || 'fluentfox-podcast'

  let s3Client = null
  if (accountId && accessKeyId && secretAccessKey) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    })
  }

  return {
    name: 'vite-plugin-r2-stream',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''

        // 1. Catalog Endpoint
        if (url === '/api/catalog' || url.startsWith('/api/catalog?')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ books: DEFAULT_CATALOG.books, cached: true }))
          return
        }

        // 2. Subtitle VTT Endpoint
        if (url.startsWith('/api/subtitles/')) {
          if (!s3Client) return next()
          let key = decodeURIComponent(url.replace('/api/subtitles/', '').split('?')[0])
          if (!key.endsWith('.vtt')) key = `${key}.vtt`
          key = key.replace(/^\/+/, '')

          try {
            const command = new GetObjectCommand({ Bucket: bucketName, Key: key })
            const response = await s3Client.send(command)
            const text = await response.Body.transformToString()
            res.setHeader('Content-Type', 'text/vtt; charset=utf-8')
            res.setHeader('Cache-Control', 'public, max-age=86400')
            res.end(text)
            return
          } catch (err) {
            console.warn('[Vite R2 Dev] Subtitle not found in R2:', key)
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Subtitle not found', key }))
            return
          }
        }

        // 3. Audio Streaming Endpoint with Range support
        if (url.startsWith('/api/stream/audio/')) {
          if (!s3Client) return next()
          let key = decodeURIComponent(url.replace('/api/stream/audio/', '').split('?')[0])
          if (!AUDIO_REGEX.test(key)) {
            key = `${key}.mp3`
          }
          key = key.replace(/^\/+/, '')

          try {
            const range = req.headers.range
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
              Range: range
            })

            const response = await s3Client.send(command)

            res.setHeader('Content-Type', 'audio/mpeg')
            res.setHeader('Content-Disposition', 'inline; filename="stream.dat"')
            res.setHeader('X-Content-Type-Options', 'nosniff')
            res.setHeader('Accept-Ranges', 'bytes')
            if (response.ContentLength) {
              res.setHeader('Content-Length', response.ContentLength)
            }
            if (response.ContentRange) {
              res.setHeader('Content-Range', response.ContentRange)
            }
            res.setHeader('Cache-Control', 'public, max-age=2592000, immutable')

            res.statusCode = range ? 206 : 200

            const stream = response.Body
            stream.pipe(res)
            res.on('close', () => {
              if (stream.destroy) stream.destroy()
            })
            return
          } catch (err) {
            console.warn('[Vite R2 Dev] Audio stream error for key:', key, err.message)
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Audio not found in R2', key }))
            return
          }
        }

        next()
      })
    }
  }
}

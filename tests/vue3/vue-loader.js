import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.vue')) {
    let candidate
    if (specifier.startsWith('file:')) {
      candidate = fileURLToPath(specifier)
    } else {
      const fromParent = context.parentURL ? path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier) : null
      const fromCwdDirect = path.resolve(process.cwd(), specifier)
      const fromCwdStripped = path.resolve(process.cwd(), specifier.replace(/^\.\.\//, ''))
      if (fromParent && fs.existsSync(fromParent)) {
        candidate = fromParent
      } else if (fs.existsSync(fromCwdDirect)) {
        candidate = fromCwdDirect
      } else if (fs.existsSync(fromCwdStripped)) {
        candidate = fromCwdStripped
      } else {
        candidate = fromParent || fromCwdDirect
      }
    }

    if (!fs.existsSync(candidate)) {
      const err = new Error(`Cannot find module '${specifier}'`)
      err.code = 'ERR_MODULE_NOT_FOUND'
      throw err
    }
    return {
      url: pathToFileURL(candidate).href,
      shortCircuit: true
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.vue')) {
    const filePath = fileURLToPath(url)
    const source = fs.readFileSync(filePath, 'utf-8')
    const name = path.basename(filePath, '.vue')
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        export default {
          name: ${JSON.stringify(name)},
          __file: ${JSON.stringify(filePath)},
          __source: ${JSON.stringify(source)}
        }
      `
    }
  }
  return nextLoad(url, context)
}

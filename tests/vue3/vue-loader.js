import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.vue')) {
    // If it's a relative path like ../src/... or ../../src/...
    const candidate = specifier.includes('MobileTopBarVue.vue')
      ? path.resolve(process.cwd(), 'src/components/navigation/MobileTopBarVue.vue')
      : (specifier.startsWith('file:') ? fileURLToPath(specifier) : path.resolve(path.dirname(fileURLToPath(context.parentURL || import.meta.url)), specifier))

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
    return {
      format: 'module',
      shortCircuit: true,
      source: `
        export default {
          name: 'MobileTopBarVue',
          __file: ${JSON.stringify(filePath)},
          __source: ${JSON.stringify(source)}
        }
      `
    }
  }
  return nextLoad(url, context)
}

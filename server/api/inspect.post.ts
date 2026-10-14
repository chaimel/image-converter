import { inspectImage } from '../utils/converter.mjs'
import { readImage, imageError } from '../utils/request'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    return await inspectImage(await readImage(event))
  } catch (error) {
    imageError(error)
  }
})

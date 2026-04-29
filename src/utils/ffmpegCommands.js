import { fetchFile } from '@ffmpeg/util'

export function buildVideoToGifArgs({
  inputName, paletteName, outputName, fps, width, startTime, endTime, dither = true,
}) {
  const trimArgs = []
  if (startTime != null && startTime > 0) trimArgs.push('-ss', String(startTime.toFixed(3)))
  if (endTime != null) trimArgs.push('-to', String(endTime.toFixed(3)))

  const scale = width === 'original' ? 'scale=iw:-1:flags=lanczos' : `scale=${width}:-1:flags=lanczos`
  const vfBase = `fps=${fps},${scale}`
  const ditherMode = dither ? 'sierra2_4a' : 'none'

  const pass1 = [
    ...trimArgs, '-i', inputName,
    '-vf', `${vfBase},palettegen=stats_mode=diff`,
    '-y', paletteName,
  ]
  const pass2 = [
    ...trimArgs, '-i', inputName, '-i', paletteName,
    '-lavfi', `${vfBase} [x]; [x][1:v] paletteuse=dither=${ditherMode}`,
    '-y', outputName,
  ]
  return { pass1, pass2 }
}

export function buildImageSequenceArgs({
  fileListName, paletteName, outputName, fps, width, dither = true,
}) {
  const scale = width === 'original' ? 'scale=iw:-1:flags=lanczos' : `scale=${width}:-1:flags=lanczos`
  const vfBase = `fps=${fps},${scale}`
  const ditherMode = dither ? 'sierra2_4a' : 'none'

  const pass1 = [
    '-f', 'concat', '-safe', '0', '-i', fileListName,
    '-lavfi', `${vfBase},palettegen=stats_mode=diff`,
    '-y', paletteName,
  ]
  const pass2 = [
    '-f', 'concat', '-safe', '0', '-i', fileListName, '-i', paletteName,
    '-lavfi', `${vfBase} [x]; [x][1:v] paletteuse=dither=${ditherMode}`,
    '-y', outputName,
  ]
  return { pass1, pass2 }
}

export function buildWebPArgs({ inputName, outputName, fps, width, startTime, endTime }) {
  const trimArgs = []
  if (startTime != null && startTime > 0) trimArgs.push('-ss', String(startTime.toFixed(3)))
  if (endTime != null) trimArgs.push('-to', String(endTime.toFixed(3)))
  const scaleVal = width === 'original' ? 'iw' : width
  return [
    ...trimArgs, '-i', inputName,
    '-vf', `fps=${fps},scale=${scaleVal}:-1:flags=lanczos`,
    '-vcodec', 'libwebp', '-lossless', '0', '-compression_level', '4',
    '-loop', '0', '-preset', 'picture', '-an', '-y', outputName,
  ]
}

export function buildMP4Args({ inputName, outputName, width, startTime, endTime }) {
  const trimArgs = []
  if (startTime != null && startTime > 0) trimArgs.push('-ss', String(startTime.toFixed(3)))
  if (endTime != null) trimArgs.push('-to', String(endTime.toFixed(3)))
  const scaleVal = width === 'original' ? 'iw' : width
  return [
    ...trimArgs, '-i', inputName,
    '-vf', `scale=${scaleVal}:-1:flags=lanczos`,
    '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-an', '-y', outputName,
  ]
}

export async function runTwoPassGif({ ff, inputs, pass1Args, pass2Args, paletteName, outputName }) {
  for (const { name, data } of inputs) {
    await ff.writeFile(name, await fetchFile(data))
  }
  await ff.exec(pass1Args)
  await ff.exec(pass2Args)
  const result = await ff.readFile(outputName)
  for (const { name } of inputs) await ff.deleteFile(name).catch(() => {})
  await ff.deleteFile(paletteName).catch(() => {})
  await ff.deleteFile(outputName).catch(() => {})
  return result
}

export async function runSinglePass({ ff, inputs, args, outputName }) {
  for (const { name, data } of inputs) {
    await ff.writeFile(name, await fetchFile(data))
  }
  await ff.exec(args)
  const result = await ff.readFile(outputName)
  for (const { name } of inputs) await ff.deleteFile(name).catch(() => {})
  await ff.deleteFile(outputName).catch(() => {})
  return result
}

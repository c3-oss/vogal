export const chunkText = (text: string, chunkSize: number, overlap: number): string[] => {
  const chunks: string[] = []
  const safeOverlap = Math.min(overlap, chunkSize - 1)

  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))

    const nextStart = end - safeOverlap
    if (nextStart <= start) {
      break
    }
    start = nextStart
  }

  return chunks
}

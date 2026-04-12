const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadFile(file, folder = 'universe-wiki') {
  const isAudio = file.type.startsWith('audio/')
  const resourceType = isAudio ? 'video' : 'image'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error('Erro ao fazer upload')
  const data = await res.json()
  return data.secure_url
}

export function validateImage(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) return 'Apenas JPG, PNG ou WEBP'
  if (file.size > 2 * 1024 * 1024) return 'Imagem deve ter no máximo 2MB'
  return null
}

export function validateAudio(file) {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg']
  if (!validTypes.includes(file.type)) return 'Apenas MP3, WAV ou OGG'
  if (file.size > 10 * 1024 * 1024) return 'Áudio deve ter no máximo 10MB'
  return null
}
import { compressImage } from './compressImage'
import imageCompression from 'browser-image-compression'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file) => file),
}))

const file = (name, type) => new File(['content'], name, { type })

describe('compressImage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('leaves vectors and animations alone', async () => {
    const svg = file('logo.svg', 'image/svg+xml')
    const gif = file('party.gif', 'image/gif')

    expect(await compressImage(svg)).toBe(svg)
    expect(await compressImage(gif)).toBe(gif)
    expect(imageCompression).not.toHaveBeenCalled()
  })

  it('compresses photos with the shared limits', async () => {
    const photo = file('camera-roll.jpg', 'image/jpeg')

    const result = await compressImage(photo, { maxWidthOrHeight: 1600 })

    expect(result).toBe(photo)
    expect(imageCompression).toHaveBeenCalledWith(photo, {
      maxWidthOrHeight: 1600,
      maxSizeMB: 6,
      useWebWorker: true,
    })
  })

  it('uses a2048px /6MB default so uploads stay well under the ceiling', async () => {
    const photo = file('camera-roll.jpg', 'image/jpeg')

    await compressImage(photo)

    expect(imageCompression).toHaveBeenCalledWith(photo, {
      maxWidthOrHeight: 2048,
      maxSizeMB: 6,
      useWebWorker: true,
    })
  })

  it('falls back to the original file when compression blows up', async () => {
    imageCompression.mockRejectedValueOnce(new Error('worker unavailable'))

    const photo = file('camera-roll.jpg', 'image/jpeg')

    expect(await compressImage(photo)).toBe(photo)
  })

  it('names the wrapped blob when compression returns one', async () => {
    imageCompression.mockResolvedValueOnce(new Blob(['x'], { type: 'image/jpeg' }))

    const result = await compressImage(file('sunset.heic', 'image/heic'))

    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('sunset.jpg')
    expect(result.type).toBe('image/jpeg')
  })
})

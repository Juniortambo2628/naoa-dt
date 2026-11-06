import api, {
  guestService,
  scheduleService,
  giftService,
  tableService,
  galleryService,
  contentService,
  settingService,
  invitationService,
  twoFactorService,
  notificationService,
  songRequestService,
  guestbookService,
  faqService,
  polaroidService,
  enquiryService,
  analyticsService,
  checkinService,
  testLabService,
} from './api'

describe('api services', () => {
  it('exports all expected services', () => {
    expect(guestService).toBeDefined()
    expect(scheduleService).toBeDefined()
    expect(giftService).toBeDefined()
    expect(tableService).toBeDefined()
    expect(galleryService).toBeDefined()
    expect(contentService).toBeDefined()
    expect(settingService).toBeDefined()
    expect(invitationService).toBeDefined()
    expect(twoFactorService).toBeDefined()
    expect(notificationService).toBeDefined()
    expect(songRequestService).toBeDefined()
    expect(guestbookService).toBeDefined()
    expect(faqService).toBeDefined()
    expect(polaroidService).toBeDefined()
    expect(enquiryService).toBeDefined()
    expect(analyticsService).toBeDefined()
    expect(checkinService).toBeDefined()
    expect(testLabService).toBeDefined()
    expect(typeof testLabService.simulateSongRequest).toBe('function')
    expect(typeof testLabService.songRequestChecks).toBe('function')
  })

  it('axios instance has correct base URL', () => {
    expect(api.defaults.baseURL).toContain('/api')
  })

  it('song request Test Lab calls hit the admin test endpoints', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} })

    await testLabService.simulateSongRequest({ song_title: 'Perfect' })
    expect(post).toHaveBeenCalledWith('/test/simulate/song-request', { song_title: 'Perfect' })

    await testLabService.songRequestChecks()
    expect(post).toHaveBeenCalledWith('/test/song-requests/checks')

    await testLabService.songRequestLimitChecks()
    expect(post).toHaveBeenCalledWith('/test/song-requests/limit-checks')

    post.mockRestore()
  })

  it('story and reaction calls hit the polaroid endpoints', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { stories: [] } })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: {} })

    await polaroidService.stories('ABC1234')
    expect(get).toHaveBeenCalledWith('/polaroid-images/stories', { params: { guest_code: 'ABC1234' } })

    await polaroidService.stories(null)
    expect(get).toHaveBeenLastCalledWith('/polaroid-images/stories', { params: {} })

    const form = new FormData()
    await polaroidService.batchUpload(form)
    expect(post.mock.calls[0][0]).toBe('/polaroid-images/batch')
    expect(post.mock.calls[0][1]).toBe(form)
    expect(post.mock.calls[0][2]).toEqual(
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    )

    await polaroidService.addReaction(7, { emoji: '❤️', guest_code: 'ABC1234' })
    expect(post).toHaveBeenLastCalledWith('/polaroid-images/7/reactions', {
      emoji: '❤️',
      guest_code: 'ABC1234',
    })

    await polaroidService.removeReaction(7, { guest_code: 'ABC1234' })
    expect(del).toHaveBeenCalledWith('/polaroid-images/7/reactions', {
      data: { guest_code: 'ABC1234' },
    })

    vi.restoreAllMocks()
  })
})

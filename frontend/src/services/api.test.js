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

    post.mockRestore()
  })
})

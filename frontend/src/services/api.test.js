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
  })

  it('axios instance has correct base URL', () => {
    expect(api.defaults.baseURL).toContain('/api')
  })
})

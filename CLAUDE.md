# naoa-dt

naoa-dt is the single-wedding app Naoa grew from, serving one live wedding (guest
site, invitation, programme, check-in, polaroids, M-Pesa gifts). Laravel 12 API in
`backend/`, React 19 app in `frontend/`.

## The OKJT kit, and Naoa

Naoa (multi-wedding) moved its dashboard into the OKJT kit (`@okjt/ui`,
`@okjt/site`, `@okjt/dashboard`, `okjt/laravel-kit`, in `packages/` of
Juniortambo2628/OKJT). naoa-dt still has its own copies of those pieces.

The decision (2026-11-15): after the wedding date, this wedding is rebuilt
as a Naoa wedding and naoa-dt is archived. Until then:

- **Don't put the live wedding at risk.** From the kit, take only security and
  bug fixes (security headers, reload after a deploy). Don't move the
  dashboard onto the kit here.
- **Wedding features built here should also exist in Naoa.** Check-in by QR, the
  usher role, Pay Bill cash gifts, programme live updates and the guest tour
  aren't in Naoa yet. When you build or change one, add a line to the pull
  request: `Naoa candidate: <what>`.
- **Kit candidates.** When you fix or build something that isn't about
  weddings (an upload, a dialog, a security header), add
  `Kit candidate: <what>` to the pull request, so it reaches the other projects.

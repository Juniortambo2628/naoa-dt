# Visual Regression Testing

This directory contains Playwright visual regression tests for the admin dashboard.

## Setup

1. Install dependencies:
   ```bash
   npm install
   npx playwright install chromium
   ```

2. Ensure the backend API is running on port 8005

## Running Tests

### Capture Baseline Screenshots
```bash
npm run test:visual:update
```

### Run Visual Tests
```bash
npm run test:visual
```

### View Test Report
```bash
npm run test:visual:report
```

## Test Structure

- `admin-visual-regression.spec.js` - Full page screenshots for all admin pages
- `layout-consistency.spec.js` - Layout structure and spacing consistency checks
- `component-visual.spec.js` - Individual component visual tests

## What's Tested

### Visual Regression
- Full page screenshots for all 19 admin pages
- Viewport screenshots (above the fold)
- Mobile and tablet responsive views
- Login page screenshots

### Layout Consistency
- AdminPageLayout presence on all pages
- AdminPageHero with correct titles
- Breadcrumb navigation
- Floating toolbar presence
- Search toolbar presence
- Spacing metrics consistency
- Hero section styling consistency

### Component Visual
- AdminPageHero states
- AdminToolbar states
- AdminFloatingToolbar states
- AdminCard states
- AdminSummaryCards
- ToggleButton states
- Color scheme consistency

## Configuration

- `playwright.config.js` - Playwright configuration
- Threshold: 2% pixel difference allowed
- Animations: Disabled for consistent screenshots
- Browser: Chromium (headless)

## Updating Baselines

When intentional UI changes are made:
1. Run `npm run test:visual:update`
2. Review the new screenshots
3. Commit the updated baselines

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Visual Tests
  run: |
    npm ci
    npx playwright install chromium
    npm run test:visual
```

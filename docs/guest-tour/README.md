# Guest tour video

A 30-second, seamlessly looping tour of the guest invitation, made for phones (1080×1920, 9:16). The iPhone stays still; only its screen moves.

- `guest-tour.mp4`: the finished video (H.264 + AAC, 30 fps, loops cleanly).
- `index.html`: the interactive version, built with Three.js. Tap for sound, jump between chapters, drag to spin the phone.
- `screens/`: real phone screens of the invitation (iPhone 13 viewport), captured from the app with demo data.
- `music.wav`: original background music, 96 BPM, 12 bars = exactly 30 s, so it loops without a gap.
- `tools/`: scripts that captured the screens, made the music and rendered the video.

## Script

Each chapter is one bar of music (2.5 s), so every cut lands on a downbeat.

| Time | Chapter | On screen (words) | Phone shows |
|---|---|---|---|
| 0:00 | Welcome | *Dinah & Tze Ren* · **Your Digital Invite Guide** | T&D monogram (2D) |
| 0:02.5 | Opening | *Made for you* · **It opens just for you** | Envelope opens, "Dear Grace Muthoni" card rises |
| 0:05 | Details | *All the details* · **When, where & good to know** | Scroll through welcome, When / Where, Good to know |
| 0:07.5 | RSVP | *RSVP* · **Reply in a few taps** | Tap "Joyfully accept", then the song and dietary steps |
| 0:10 | Entry pass | *Entry pass* · **Your QR, ready at the door** | Tap Pass in the bottom bar, QR sheet slides up, scan line |
| 0:12.5 | Programme | *Live programme* · **Follow the day as it happens** | Programme timeline scrolls, a wedding update notification drops in |
| 0:15 | Moments | *Snap & stories* · **Snap polaroids, share stories** | Snap Studio shutter and flash, Captured Moments tray, a story opens |
| 0:17.5 | Gifts | *Gifts* · **Send a gift with M-Pesa** | Pay Bill card with numbered steps (placeholder numbers), tap "I've sent my gift", choose KES 2,000, thank you |
| 0:20 | And more | *Find your way* · **Directions, dress code & so much more** | Map and weather, then the dress code palette, then the where-are-you zones |
| 0:22.5 | Home screen | *One tap away* · **Add it to your home screen** | Tap "Add to Home Screen", the T&D icon pops onto the home screen |
| 0:25 | Finale | *Your invitation* · **Everything for the day, in your pocket** | "Hi Grace Muthoni, You're Invited!" |
| 0:28.2 | Finale | **See you there** · 14 November 2026 | Monogram returns to the opening pose, so the loop restarts invisibly |

## Regenerating

The screens come from the real app with demo data: the backend on SQLite (`php artisan migrate --seed`, then `SettingsSeeder`), a guest with code `GRACE26`, a few polaroids from `frontend/public/DnT-photoshoot` and live updates, and the frontend dev server on port 5180.

`tools/capture.cjs` writes every screen into `screens/` (585×1185 JPEGs: an iPhone screen below its status bar, which the tour draws) and `screens/taps.json`, where each tapped button sits. It feeds a photo to the camera as a fake webcam (`cam.y4m`, made with ffmpeg) so Snap Studio shows a live view. For the Gifts scene, set placeholder Pay Bill numbers in the local settings (the video shows 123456 / 0000000000) and clear `mpesa_payments` first, since each M-Pesa code is recorded once.

The music and the video render from `tools/`:

```bash
cd docs/guest-tour/tools
```

```bash
npm i --no-save three@0.160.0 && pip install numpy scipy
```

```bash
python3 music.py && ffmpeg -y -i music44.wav -ar 32000 ../music.wav
```

```bash
node render.cjs full   # 900 frames into frames/, about 15 minutes with software WebGL
```

```bash
ffmpeg -framerate 30 -i frames/f%04d.jpg -i ../music.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest -movflags +faststart ../guest-tour.mp4
```

`node render.cjs preview 1,6,14` renders single frames at the times you give, which is quicker for checking a change.

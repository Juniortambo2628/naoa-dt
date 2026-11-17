# Thank-you guest guide

A 30-second, seamlessly looping tour of what guests can do after the wedding, made for phones (1080×1920, 9:16). It uses the same player, iPhone, music and tools as [the invitation tour](../guest-tour/README.md). The iPhone stays still; only its screen moves.

- `thank-you-tour.mp4`: the finished video (H.264 + AAC, 30 fps, loops cleanly).
- `index.html`: the interactive version. Tap for sound, jump between chapters.
- `screens/`: phone screens of the site in its after-the-wedding mode, and `taps.json` (where each tapped button sits).

## Script

| Time | Chapter | On screen (words) | Phone shows |
|---|---|---|---|
| 0:00 | Welcome | *Dinah & Tze Ren* · **Thank you for celebrating with us** | T&D monogram |
| 0:02.5 | Thank you | *Your invitation* · **Now a thank-you, just for you** | The invite's Africa thank-you card, "Hi Grace Muthoni, Thank you!" |
| 0:05 | Your note | *A personal note* · **Words written just for you** | The couple's signed note to that guest, then the photos card |
| 0:07.5 | Photos | *The photos* · **Relive the day, Ayie to wedding** | Tap "Open the gallery", scroll the Ayie and The Wedding albums |
| 0:10 | Save | *Photo viewer* · **Swipe through, save your favourites** | Open a photo, swipe to the next, tap "Save photo" |
| 0:12.5 | Share | *Share yours* · **Add your photos to the albums** | "Add your photos from this day", pick The Wedding, two photos, "Share 2 photos", thank you |
| 0:15 | Stories | *Stories* · **Watch the stories from the day** | Captured Moments tray, a story opens |
| 0:17.5 | Message | *Well wishes* · **Leave the couple a message** | Write a message, then the messages from loved ones |
| 0:20 | Gifts | *Gifts* · **Still want to give? Send it with M-Pesa** | Pay Bill card with numbered steps (placeholder numbers) |
| 0:22.5 | One tap | *One tap away* · **Photos, gifts, messages & stories** | Taps along the bottom bar: Photos, Gift, Message, Stories |
| 0:25 | Finale | *Our home page* · **Every memory, in one place** | Home page photo slideshow with the thank-you card |
| 0:28.2 | Finale | **With love** · Dinah & Tze Ren | Monogram returns to the opening pose, so the loop restarts invisibly |

## Regenerating

Set up the app as for the invitation tour, then put the site in its after-the-wedding mode:
- any date after the wedding, or Settings › After the Wedding › Now;
- photos in the Ayie and The Wedding albums (the video uses the couple's own photos: ten from the Ayie and six from the wedding day, with the same photos as stories on the programme page);
- Gallery and Guestbook switched on in Modules;
- a personal message on the demo guest (GRACE26);
- placeholder Pay Bill numbers in the local settings.

```bash
cd docs/guest-tour/tools
```

```bash
node capture-thankyou.cjs   # writes ../../thank-you-tour/screens and taps.json; uploads two photos locally
```

`BASE=http://localhost:5173` points it at another dev server, and `SHARE_PHOTOS=a.jpg,b.jpg` picks the two photos the share step uploads. The guestbook and home page screens show no photos, so they can be kept from an earlier capture.

```bash
TOUR=thank-you-tour node render.cjs full
```

```bash
ffmpeg -framerate 30 -i frames/f%04d.jpg -i ../music.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest -movflags +faststart ../../thank-you-tour/thank-you-tour.mp4
```

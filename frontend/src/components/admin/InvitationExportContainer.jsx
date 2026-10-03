import { useRef, useEffect, useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import InvitationCanvas from './InvitationCanvas';
import { normalizePages } from '../../utils/invitationPages';

export default function InvitationExportContainer({ design, guest, weddingSettings, onReady }) {
    const exportRef = useRef(null);
    const [fontBase64, setFontBase64] = useState({ cursive: '', sans: '', serif: '' });

    // Flatten the theme into one flat design per page (backward compatible with
    // legacy single-page themes).
    const pages = useMemo(() => normalizePages(design), [design]);
    const [renderIndex, setRenderIndex] = useState(0);

    const isLandscape = (design?.orientation) === 'landscape';
    const CANVAS_WIDTH = isLandscape ? 625 : 500;
    const CANVAS_HEIGHT = isLandscape ? 500 : 625;

    useEffect(() => {
        const fetchAsBase64 = async (url) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn(`Failed to fetch font from ${url}`, e);
                return '';
            }
        };

        const loadFonts = async () => {
            // Use LOCAL fonts from public/fonts to guarantee CORS success
            const [cursive, sans, serif] = await Promise.all([
                fetchAsBase64("/fonts/great-vibes.ttf"),
                fetchAsBase64("/fonts/montserrat.ttf"),
                fetchAsBase64("/fonts/cormorant-garamond.ttf")
            ]);
            setFontBase64({ cursive, sans, serif });
        };
        loadFonts();
    }, []);

    // Swap the hidden canvas to a specific page and wait for React to commit it.
    const renderPage = async (index) => {
        setRenderIndex(index);
        // Wait two animation frames so the DOM reflects the new page, plus a
        // small settle buffer for layout.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await new Promise(resolve => setTimeout(resolve, 150));
    };

    // Capture whatever page is currently mounted in the hidden container.
    const captureCurrent = async () => {
        if (!exportRef.current) return null;

        // Wait for active images to load
        const images = exportRef.current.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
            });
        });
        await Promise.all(promises);

        // Final delay for layout stabilization
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // Build the font CSS with Base64 data
            const fontCSSData = `
                @font-face {
                  font-family: 'Great Vibes';
                  src: url(${fontBase64.cursive}) format('truetype');
                }
                @font-face {
                  font-family: 'Montserrat';
                  src: url(${fontBase64.sans}) format('truetype');
                }
                @font-face {
                  font-family: 'Cormorant Garamond';
                  src: url(${fontBase64.serif}) format('truetype');
                }
                h1, .cursive-font { font-family: 'Great Vibes', cursive !important; }
                .serif-font { font-family: 'Cormorant Garamond', serif !important; }
                .sans-font { font-family: 'Montserrat', sans-serif !important; }
            `;

            const dataUrl = await toPng(exportRef.current, {
                quality: 1.0,
                pixelRatio: 2.0, // Reduced from 2.5 for better stability
                cacheBust: true,
                backgroundColor: null,
                includeStyles: true,
                fontEmbedCSS: fontCSSData,
                skipFonts: true,
                // CRITICAL: Filter out external stylesheets that trigger SecurityError
                filter: (node) => {
                    if (node.tagName === 'LINK' && node.rel === 'stylesheet' && node.href?.includes('googleapis')) {
                        return false;
                    }
                    if (node.tagName === 'STYLE' && node.innerHTML?.includes('@import')) {
                        return false;
                    }
                    return true;
                }
            });

            return dataUrl;
        } catch (error) {
            console.error('html-to-image capture failed', error);
            return null;
        }
    };

    // Generate a PNG for a single page (defaults to the first/primary page, used
    // for the email attachment and PNG exports).
    const generateImage = async (pageIndex = 0) => {
        await renderPage(Math.max(0, Math.min(pageIndex, pages.length - 1)));
        const dataUrl = await captureCurrent();
        // Reset back to the first page for subsequent single captures.
        setRenderIndex(0);
        return dataUrl;
    };

    const generatePdf = async () => {
        // Ensure fonts are actually available before starting
        if (!fontBase64.cursive && !fontBase64.sans && !fontBase64.serif) {
            console.warn("Fonts not fully loaded yet, attempting anyway...");
            await new Promise(r => setTimeout(r, 1000));
        }

        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: isLandscape ? [185, 148] : [148, 185]
        });

        // A5-ish page sized to our 4:5 / 5:4 aspect ratio.
        const imgWidth = isLandscape ? 185 : 148;
        const imgHeight = isLandscape ? 148 : 185;

        for (let i = 0; i < pages.length; i++) {
            await renderPage(i);
            const dataUrl = await captureCurrent();
            if (!dataUrl) continue;

            if (i > 0) {
                pdf.addPage(isLandscape ? [185, 148] : [148, 185], isLandscape ? 'landscape' : 'portrait');
            }
            pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);

            // Add clickable calendar links for this page.
            const pageDesign = pages[i];
            if (pageDesign?.items) {
                const currentLang = pageDesign.editorLang || 'en';
                const content = pageDesign.content?.[currentLang] || {};

                pageDesign.items.forEach(item => {
                    if (item.type === 'calendar_link') {
                        const x = (item.x / CANVAS_WIDTH) * imgWidth;
                        const y = (item.y / CANVAS_HEIGHT) * imgHeight;
                        const w = (item.width / CANVAS_WIDTH) * imgWidth;
                        const h = (item.height / CANVAS_HEIGHT) * imgHeight;

                        const title = encodeURIComponent(content.title || "Our Wedding");
                        const location = encodeURIComponent(weddingSettings?.venue_name || "Wedding Venue");
                        const dateStr = weddingSettings?.wedding_date || "2026-11-14";
                        const baseUrl = weddingSettings?.public_url || window.location.origin;
                        const calendarUrl = `${baseUrl}/calendar?date=${dateStr}&venue=${location}&title=${title}`;

                        pdf.link(x, y, w, h, { url: calendarUrl });
                    }
                });
            }
        }

        // Reset back to the first page.
        setRenderIndex(0);

        return pdf.output('blob');
    };

    // Expose capture methods to the parent after each commit (never during
    // render) so the latest closures — fonts, pages, render index — are used.
    useEffect(() => {
        if (onReady) {
            onReady({ generateImage, generatePdf });
        }
    });

    const currentPageDesign = pages[Math.min(renderIndex, pages.length - 1)] || pages[0];

    return (
        <div style={{
            position: 'fixed',
            left: '0px',
            top: '0px',
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            overflow: 'hidden',
            zIndex: -100,
            opacity: 0,
            pointerEvents: 'none',
            margin: 0,
            padding: 0,
            backgroundColor: 'transparent'
        }}>
            <div
                ref={exportRef}
                style={{
                    width: `${CANVAS_WIDTH}px`,
                    height: `${CANVAS_HEIGHT}px`,
                    background: 'transparent',
                    position: 'relative',
                    display: 'block',
                    margin: 0,
                    padding: 0
                }}
            >
                <InvitationCanvas
                    design={currentPageDesign}
                    mode="preview"
                    guest={guest}
                    isExport={true}
                    weddingSettings={weddingSettings}
                />
            </div>
        </div>
    );
}

import { useRef, useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import InvitationCanvas from './InvitationCanvas';

export default function InvitationExportContainer({ design, guest, weddingSettings, onReady }) {
    const exportRef = useRef(null);
    const [fontBase64, setFontBase64] = useState({ cursive: '', sans: '', serif: '' });

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

    const generateImage = async () => {
        if (!exportRef.current) return null;
        
        // Wait active images to load
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
                backgroundColor: '#ffffff',
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

    const generatePdf = async () => {
        // Ensure fonts are actually available before starting
        if (!fontBase64.cursive && !fontBase64.sans && !fontBase64.serif) {
            console.warn("Fonts not fully loaded yet, attempting anyway...");
            // Small extra wait
            await new Promise(r => setTimeout(r, 1000));
        }

        const dataUrl = await generateImage();
        if (!dataUrl) return null;

        const isLandscape = design.orientation === 'landscape';
        
        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: isLandscape ? [185, 148] : [148, 185]
        });

        // A5 dimensions: 148 x 210 mm
        // We need to fit our 4:5 or 5:4 aspect ratio into A5
        let imgWidth, imgHeight;
        if (isLandscape) {
            // Landscape A5 is 210 x 148
            // Our landscape is 625x500 (5:4)
            // 148 * (5/4) = 185mm. So width 185, height 148 fits.
            imgWidth = 185;
            imgHeight = 148;
        } else {
            // Portrait A5 is 148 x 210
            // Our portrait is 500x625 (4:5)
            // 148 * (5/4) = 185mm. So width 148, height 185 fits.
            imgWidth = 148;
            imgHeight = 185; 
        }
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);

        // Add clickable links to the PDF for calendar items
        if (design.items) {
            const currentLang = design.editorLang || 'en';
            const content = design.content?.[currentLang] || {};

            design.items.forEach(item => {
                if (item.type === 'calendar_link') {
                    const x = (item.x / CANVAS_WIDTH) * imgWidth;
                    const y = (item.y / CANVAS_HEIGHT) * imgHeight;
                    const w = (item.width / CANVAS_WIDTH) * imgWidth;
                    const h = (item.height / CANVAS_HEIGHT) * imgHeight;

                    const title = encodeURIComponent(content.title || "Our Wedding");
                    const location = encodeURIComponent(weddingSettings?.venue_name || "Wedding Venue");
                    const dateStr = weddingSettings?.wedding_date || "2026-11-14";
                    
                    // Construct robust public URL
                    // Use configured public_url from settings, with fallback to current origin
                    const baseUrl = weddingSettings?.public_url || window.location.origin;
                    
                    // Point to the new selection landing page instead of direct ICS
                    const calendarUrl = `${baseUrl}/calendar?date=${dateStr}&venue=${location}&title=${title}`;

                    pdf.link(x, y, w, h, { url: calendarUrl });
                }
            });
        }

        return pdf.output('blob');
    };

    if (onReady) {
        onReady({ generateImage, generatePdf });
    }

    const isLandscape = design.orientation === 'landscape';
    const CANVAS_WIDTH = isLandscape ? 625 : 500;
    const CANVAS_HEIGHT = isLandscape ? 500 : 625;

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
            backgroundColor: '#ffffff'
        }}>
            <div 
                ref={exportRef} 
                style={{ 
                    width: `${CANVAS_WIDTH}px`, 
                    height: `${CANVAS_HEIGHT}px`, 
                    background: 'white', 
                    position: 'relative', 
                    display: 'block',
                    margin: 0,
                    padding: 0
                }}
            >
                <InvitationCanvas 
                    design={design} 
                    mode="preview" 
                    guest={guest}
                    isExport={true}
                    weddingSettings={weddingSettings}
                />
            </div>
        </div>
    );
}

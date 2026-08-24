import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, KeepTogether
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 750, "JIYA MUSIC — FULL STACK ARCHITECTURE DOCUMENTATION")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
        
        # Footer (all pages)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "Confidential & Proprietary — Jiya Music Project")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    c_primary = colors.HexColor("#0F172A")    # Slate 900
    c_accent = colors.HexColor("#2563EB")     # Blue 600
    c_secondary = colors.HexColor("#475569")  # Slate 600
    c_dark_bg = colors.HexColor("#1E293B")    # Slate 800
    c_light_bg = colors.HexColor("#F8FAFC")   # Slate 50
    c_border = colors.HexColor("#CBD5E1")     # Slate 300

    # Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=c_primary,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_accent,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_accent,
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1E293B")
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=c_primary
    )

    story = []

    # Title & Header Banner
    story.append(Paragraph("Jiya Music App — Full Stack Specification", title_style))
    story.append(Paragraph("Comprehensive Technical Architecture, Infrastructure, APIs & Android Native Engine Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=c_accent, spaceBefore=0, spaceAfter=15))

    # Executive Overview Box
    overview_text = """<b>Project Overview:</b> Jiya Music is a high-performance, progressive full-stack music streaming platform built with Next.js 14, TypeScript, Prisma ORM, and SQLite. It integrates a 4-in-1 Universal Music Search & Streaming Engine (JioSaavn 320kbps, YouTube/Invidious, iTunes, Spotify) and features a standalone native Android application compiled in Android Studio with a Java <code>MediaPlayer</code> foreground service for 100% background and screen-off playback."""
    
    overview_table = Table([[Paragraph(overview_text, body_style)]], colWidths=[504])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_light_bg),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 15))

    # Section 1: Executive Metadata & Live Links
    story.append(Paragraph("1. System Deployment & Metadata", h1_style))
    
    meta_data = [
        [Paragraph("Property", table_header_style), Paragraph("Specification / Resource Value", table_header_style)],
        [Paragraph("Application Name", table_cell_bold), Paragraph("Jiya Music (The Music App)", table_cell_style)],
        [Paragraph("Live Production URL", table_cell_bold), Paragraph("https://jiya-kappa.vercel.app/", table_cell_style)],
        [Paragraph("GitHub Code Repository", table_cell_bold), Paragraph("https://github.com/NirmalyaCh005/JIYA--The-Music-App.git", table_cell_style)],
        [Paragraph("Web Hosting Platform", table_cell_bold), Paragraph("Vercel Serverless Edge Platform (Global CDN)", table_cell_style)],
        [Paragraph("Android App Workspace", table_cell_bold), Paragraph("Standalone Native Project Directory (/android-app)", table_cell_style)],
        [Paragraph("Compiled Android Package", table_cell_bold), Paragraph("Jiya-Music.apk (6.64 MB Standalone APK)", table_cell_style)]
    ]
    meta_table = Table(meta_data, colWidths=[150, 354])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg])
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    # Section 2: Full Stack Technology Spectrum
    story.append(Paragraph("2. Full-Stack Technology Spectrum", h1_style))

    stack_data = [
        [Paragraph("Architecture Layer", table_header_style), Paragraph("Technology Stack", table_header_style), Paragraph("Role & Implementation Details", table_header_style)],
        [Paragraph("Frontend Framework", table_cell_bold), Paragraph("Next.js 14.2 (App Router)", table_cell_style), Paragraph("Server Side Rendering (SSR), Client Components, React 18 Concurrent Features", table_cell_style)],
        [Paragraph("Language & Typing", table_cell_bold), Paragraph("TypeScript 5.x", table_cell_style), Paragraph("Strict end-to-end type safety across API routes, data models, and player state", table_cell_style)],
        [Paragraph("Styling System", table_cell_bold), Paragraph("Tailwind CSS 3.4", table_cell_style), Paragraph("Custom dark-theme design tokens, glassmorphism, responsive UI layouts", table_cell_style)],
        [Paragraph("UI Components & Icons", table_cell_bold), Paragraph("Lucide React Icons", table_cell_style), Paragraph("Vector UI icons for play, pause, volume, search, drawer, and upload modal", table_cell_style)],
        [Paragraph("State Management", table_cell_bold), Paragraph("Zustand 4.5", table_cell_style), Paragraph("Global store managing current track, playlist queue, volume, active engine", table_cell_style)],
        [Paragraph("Backend Runtime", table_cell_bold), Paragraph("Node.js Serverless", table_cell_style), Paragraph("Vercel Serverless Functions handling search, resolution, and audio proxies", table_cell_style)],
        [Paragraph("Database ORM", table_cell_bold), Paragraph("Prisma ORM 5.x", table_cell_style), Paragraph("Type-safe database client and migration manager for relational schemas", table_cell_style)],
        [Paragraph("Relational Database", table_cell_bold), Paragraph("SQLite Database", table_cell_style), Paragraph("File-based relational database storing Users, Tracks, Playlists, and Liked Tracks", table_cell_style)],
        [Paragraph("Native Mobile OS", table_cell_bold), Paragraph("Android SDK 34 (Java 17)", table_cell_style), Paragraph("Native Android Studio project container using WebView, Java, and Gradle 8.13", table_cell_style)]
    ]
    stack_table = Table(stack_data, colWidths=[120, 140, 244])
    stack_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg])
    ]))
    story.append(stack_table)
    story.append(Spacer(1, 15))

    # Section 3: Universal Music Search & Streaming Engine
    story.append(Paragraph("3. Universal Music Search & Streaming Engines", h1_style))
    story.append(Paragraph("Jiya Music integrates four specialized music discovery and audio streaming data providers:", body_style))

    story.append(Paragraph("• <b>JioSaavn HQ API Engine:</b> Fetches direct high-quality 320kbps MP3 audio stream URLs for Indian, Bollywood, Regional, and International catalog tracks.", bullet_style))
    story.append(Paragraph("• <b>YouTube & Invidious Audio Engine:</b> Acts as a universal fallback streamer for any track, live performance, or cover video available on YouTube.", bullet_style))
    story.append(Paragraph("• <b>Apple iTunes Search API:</b> Retrieves high-resolution cover art (600x600), release year, album metadata, and official preview snippets.", bullet_style))
    story.append(Paragraph("• <b>Spotify API Engine:</b> Provides global charts, trending music lists, and artist metadata.", bullet_style))
    story.append(Paragraph("• <b>Stream Proxy Pipeline (/api/stream):</b> Bypasses cross-origin (CORS) restrictions and stream header blocks to deliver seamless continuous playback.", bullet_style))
    story.append(Spacer(1, 15))

    # Section 4: Database Schema (Prisma & SQLite)
    story.append(Paragraph("4. Relational Database Architecture (SQLite / Prisma)", h1_style))
    
    db_data = [
        [Paragraph("Data Model", table_header_style), Paragraph("Key Fields", table_header_style), Paragraph("Description & Relationships", table_header_style)],
        [Paragraph("User", table_cell_bold), Paragraph("id, email, phone, name, avatarUrl, isPro", table_cell_style), Paragraph("Represents registered app users; holds 1-to-many relationship with Playlists and Tracks", table_cell_style)],
        [Paragraph("Track", table_cell_bold), Paragraph("id, title, artist, album, genre, duration, audioUrl, coverUrl, playCount", table_cell_style), Paragraph("Stores custom user uploaded tracks and cached search tracks; linked to Playlists", table_cell_style)],
        [Paragraph("Playlist", table_cell_bold), Paragraph("id, title, description, coverUrl, isPublic, userId", table_cell_style), Paragraph("User-created music playlists containing custom track collections", table_cell_style)],
        [Paragraph("PlaylistTrack", table_cell_bold), Paragraph("id, playlistId, trackId, position, addedAt", table_cell_style), Paragraph("Junction table linking tracks to playlists with position ordering", table_cell_style)],
        [Paragraph("LikedTrack", table_cell_bold), Paragraph("id, userId, trackId, createdAt", table_cell_style), Paragraph("Stores favorite/liked songs for quick user library access", table_cell_style)]
    ]
    db_table = Table(db_data, colWidths=[90, 180, 234])
    db_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg])
    ]))
    story.append(db_table)
    story.append(Spacer(1, 15))

    story.append(PageBreak())

    # Section 5: Native Android Mobile Architecture (/android-app)
    story.append(Paragraph("5. Native Android Mobile Architecture (/android-app)", h1_style))
    story.append(Paragraph("To deliver a native mobile experience on Android devices without relying on web browser limitations, a standalone Android Studio project container was built inside <code>/android-app</code>:", body_style))

    android_data = [
        [Paragraph("Android Component", table_header_style), Paragraph("Java / System Class", table_header_style), Paragraph("Functionality & Purpose", table_header_style)],
        [Paragraph("Main Container Activity", table_cell_bold), Paragraph("MainActivity.java", table_cell_style), Paragraph("Hosts WebKit WebView container with JavaScript enabled, DOM storage, and custom WebViewClient", table_cell_style)],
        [Paragraph("Native Audio Engine", table_cell_bold), Paragraph("MediaPlayer & AudioAttributes", table_cell_style), Paragraph("Native C++/Java audio player executing outside browser DOM to bypass WebView focus pause", table_cell_style)],
        [Paragraph("Background Service", table_cell_bold), Paragraph("AudioService.java", table_cell_style), Paragraph("Foreground Service with ongoing system notification to prevent Android OS process death", table_cell_style)],
        [Paragraph("CPU WakeLock", table_cell_bold), Paragraph("PARTIAL_WAKE_LOCK", table_cell_style), Paragraph("Maintains active CPU decoding state when phone screen is turned off or locked", table_cell_style)],
        [Paragraph("JS-Native Bridge", table_cell_bold), Paragraph("@JavascriptInterface (AndroidNativePlayer)", table_cell_style), Paragraph("Bridges web click events to native Java <code>playNativeAudio(url, title, artist)</code>", table_cell_style)],
        [Paragraph("Native File Chooser", table_cell_bold), Paragraph("onShowFileChooser", table_cell_style), Paragraph("Overridden <code>WebChromeClient</code> handler enabling native Android file picker for track uploads", table_cell_style)]
    ]
    android_table = Table(android_data, colWidths=[120, 150, 234])
    android_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_light_bg])
    ]))
    story.append(android_table)
    story.append(Spacer(1, 15))

    # Section 6: Key Features & Engineering Highlights
    story.append(Paragraph("6. Key Features & Engineering Highlights", h1_style))
    story.append(Paragraph("• <b>Uninterrupted Screen-Off Playback:</b> Native Android Foreground Service and `PARTIAL_WAKE_LOCK` ensure music plays continuously when switching apps or locking the screen.", bullet_style))
    story.append(Paragraph("• <b>Lockscreen & Notification Media Controls:</b> Integrated `navigator.mediaSession` API showing song title, artist name, cover art, play/pause, and skip controls on Android lock screens.", bullet_style))
    story.append(Paragraph("• <b>Track Upload Studio:</b> Built-in modal allowing users to upload custom `.mp3`, `.wav`, and `.flac` files along with cover artwork directly to the server.", bullet_style))
    story.append(Paragraph("• <b>Instant Web Update Sync:</b> Any web app code or design update pushed to GitHub automatically syncs to all installed Android APK apps without requiring users to reinstall.", bullet_style))
    story.append(Paragraph("• <b>Dynamic Watchdog Fallback:</b> 1.5-second stalled playback watchdog automatically resolves alternative audio stream links if a stream fails or stalls at 0:00.", bullet_style))
    story.append(Spacer(1, 15))

    # Sign-off Footer
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=10, spaceAfter=10))
    story.append(Paragraph("<b>Report Generated:</b> Jiya Music Engineering Team • Full Stack & Mobile Documentation", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_path = os.path.join(os.getcwd(), "Jiya_Music_Full_Stack_Documentation.pdf")
    build_pdf(out_path)

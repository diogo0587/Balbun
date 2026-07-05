import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Search on balbums.st via server proxy
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ 
      error: "Missing or empty query parameter 'q'",
      success: false,
      results: []
    });
  }

  const cleanQuery = query.trim();
  
  try {
    // Attempt to fetch from balbums.st - usando novo formato de busca
    const searchUrl = `https://balbums.st/?search=${encodeURIComponent(cleanQuery)}&mode=broad&per=20`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://balbums.st/",
        "Cache-Control": "no-cache"
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.length === 0) {
      throw new Error("Empty response body");
    }
    
    // Check if Cloudflare block is present
    if (html.includes("cf-challenge") || html.includes("Cloudflare") || html.includes("Just a moment...")) {
      console.warn("[Proxy Search] Cloudflare challenge detected on balbums.st");
      return res.json({
        success: false,
        error: "cloudflare_detected",
        message: "O site balbums.st está protegido por Cloudflare. Usando catálogo local inteligente para sua busca!",
        results: []
      });
    }

    // Parse balbums.st search results - Nova estrutura
    const results: any[] = [];
    const seenUrls = new Set<string>();

    // Padrão encontrado em balbums.st/bunkr.cr:
    // <a href="https://bunkr.cr/a/..." class="card ...">
    //   <div>...
    //     <img ... alt="TÍTULO DO ÁLBUM" class="thumb-img..." src="...">
    //   </div>
    // </a>
    
    const cardRegex = /<a\s+href="([^"]+)"[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    
    while ((match = cardRegex.exec(html)) !== null && results.length < 20) {
      const href = match[1];
      const cardContent = match[2];
      
      if (seenUrls.has(href)) continue;
      
      // Extrair título do atributo alt da imagem (mais confiável)
      const imgMatch = cardContent.match(/<img[^>]+alt="([^"]+)"[^>]*class="[^"]*thumb-img[^"]*"[^>]*(?:src="([^"]+)")?/i);
      
      if (!imgMatch) continue; // Pular se não encontrar imagem com alt
      
      let title = imgMatch[1].trim();
      const cover = imgMatch[2] || null;
      
      if (!title || title.length < 3) continue; // Pular títulos muito curtos
      
      seenUrls.add(href);
      title = decodeHtmlEntities(title);
      
      results.push({
        title,
        url: href,
        cover,
        excerpt: "Clique para explorar faixas e links de download."
      });
    }

    return res.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error("[Proxy Search] Error fetching from balbums.st:", error.message);
    return res.json({
      success: false,
      error: "network_error",
      message: "Não foi possível conectar ao balbums.st. Apresentando catálogo offline de alta qualidade!",
      results: []
    });
  }
});

// API: Get single album detail from balbums.st via server proxy
app.get("/api/album", async (req, res) => {
  const albumUrl = req.query.url as string;
  if (!albumUrl || albumUrl.trim().length === 0) {
    return res.status(400).json({ 
      error: "Missing or empty 'url' parameter",
      success: false 
    });
  }

  // Security check: only allow proxying balbums.st or bunkr.cr urls
  const cleanUrl = albumUrl.trim();
  if (!cleanUrl.startsWith("https://balbums.st/") && 
      !cleanUrl.startsWith("http://balbums.st/") &&
      !cleanUrl.startsWith("https://bunkr.cr/") &&
      !cleanUrl.startsWith("http://bunkr.cr/") &&
      !cleanUrl.startsWith("https://bunkr.su/") &&
      !cleanUrl.startsWith("http://bunkr.su/")) {
    return res.status(400).json({ 
      error: "Invalid domain. Only balbums/bunkr domains are supported.",
      success: false 
    });
  }

  console.log(`[Proxy Album] Fetching detail for: ${cleanUrl}`);

  try {
    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://balbums.st/"
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    if (html.includes("cf-challenge") || html.includes("Cloudflare")) {
      return res.json({
        success: false,
        error: "cloudflare_detected",
        message: "O site balbums.st está protegido por Cloudflare. Exibindo uma simulação de faixas do álbum!"
      });
    }

    // Parse Open Graph metadata for reliable details
    let title = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)?.[1] || "";
    title = decodeHtmlEntities(title).replace(" | Balbums", "").replace(" - Balbums", "");
    
    const cover = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1] || 
                  html.match(/<img[^>]+src="([^"]+)"/i)?.[1] || null;
    
    const description = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)?.[1] || "";

    // Extract download links
    const downloadLinks: { label: string; url: string }[] = [];
    
    // We search for anchors with known hosting services or containing download keywords
    const anchorRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let anchorMatch;
    const seenLinks = new Set<string>();

    while ((anchorMatch = anchorRegex.exec(html)) !== null) {
      const href = anchorMatch[1];
      const anchorText = anchorMatch[2].replace(/<[^>]+>/g, "").trim();
      const textLower = anchorText.toLowerCase();
      const hrefLower = href.toLowerCase();

      // Check if it's a known storage provider or contains file download markers
      const isDownloadHost = hrefLower.includes("mega.nz") || 
                             hrefLower.includes("mediafire.com") || 
                             hrefLower.includes("zippyshare.com") || 
                             hrefLower.includes("drive.google.com") || 
                             hrefLower.includes("rapidgator") || 
                             hrefLower.includes("turbobit") || 
                             hrefLower.includes("uploaded.net") || 
                             hrefLower.includes("dropapk") ||
                             textLower.includes("download") ||
                             textLower.includes("baixar") ||
                             textLower.includes("mega") ||
                             textLower.includes("mediafire") ||
                             textLower.includes("link");

      // Filter out internal WordPress/Balbums links or admin paths
      if (
        isDownloadHost && 
        !hrefLower.includes("balbums.st") && 
        !hrefLower.includes("wp-content") &&
        !hrefLower.includes("category") &&
        !hrefLower.includes("tag") &&
        !seenLinks.has(href)
      ) {
        seenLinks.add(href);
        downloadLinks.push({
          label: anchorText ? decodeHtmlEntities(anchorText) : getDomainLabel(href),
          url: href
        });
      }
    }

    // Tracklist extraction: Look for lines with number prefixes (e.g. 01. Song, 1 - Song)
    const tracks: string[] = [];
    const contentText = html.replace(/<br\s*\/?>/gi, "\n")
                            .replace(/<\/p>/gi, "\n")
                            .replace(/<[^>]+>/g, "");
    
    const lines = contentText.split("\n");
    const trackPattern = /^\s*(\d{1,3})\s*[-.)]\s*(.+)$/;

    for (const line of lines) {
      const cleanLine = line.trim();
      if (trackPattern.test(cleanLine)) {
        tracks.push(decodeHtmlEntities(cleanLine));
      }
    }

    // Fallback tracks if we couldn't parse structured ones
    if (tracks.length === 0) {
      // Find list items
      const liRegex = /<li>([^<]+)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(html)) !== null) {
        const cleanLi = liMatch[1].trim();
        if (cleanLi.length > 2 && !cleanLi.includes("Home") && !cleanLi.includes("Contact")) {
          tracks.push(decodeHtmlEntities(cleanLi));
        }
      }
    }

    // Deduplicate tracks
    const uniqueTracks = Array.from(new Set(tracks));

    return res.json({
      success: true,
      album: {
        title: title || "Unknown Album",
        cover,
        description: decodeHtmlEntities(description),
        downloadLinks,
        tracks: uniqueTracks.length > 0 ? uniqueTracks : ["01. Faixa de Demonstração 1", "02. Faixa de Demonstração 2", "03. Faixa de Demonstração 3"],
        genre: inferGenre(title + " " + description),
        year: inferYear(title + " " + description)
      }
    });

  } catch (error: any) {
    console.error("[Proxy Album] Error fetching album details:", error.message);
    return res.json({
      success: false,
      error: "network_error",
      message: "Falha ao carregar detalhes do álbum."
    });
  }
});

// Helper: Decode basic HTML entities
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, "-")
    .replace(/&mdash;/g, "—")
    .replace(/&#8211;/g, "-")
    .replace(/&#8212;/g, "—")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"');
}

// Helper: Infer provider label from URL
function getDomainLabel(url: string): string {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    if (domain.includes("mega.nz")) return "MEGA";
    if (domain.includes("mediafire")) return "Mediafire";
    if (domain.includes("google")) return "Google Drive";
    if (domain.includes("rapidgator")) return "Rapidgator";
    return domain.split(".")[0].toUpperCase() || "Download";
  } catch {
    return "Download Direct";
  }
}

// Helper: Infer genre from text
function inferGenre(text: string): string {
  const textLower = text.toLowerCase();
  if (textLower.includes("heavy metal") || textLower.includes("thrash") || textLower.includes("death metal") || textLower.includes("black metal")) return "Heavy Metal";
  if (textLower.includes("power metal") || textLower.includes("symphonic")) return "Power/Symphonic Metal";
  if (textLower.includes("hard rock") || textLower.includes("grunge") || textLower.includes("punk")) return "Rock / Grunge";
  if (textLower.includes("alternative rock") || textLower.includes("indie")) return "Alternative / Indie";
  if (textLower.includes("mpb") || textLower.includes("bossa nova") || textLower.includes("samba") || textLower.includes("nacional")) return "Música Brasileira";
  if (textLower.includes("pop") || textLower.includes("dance") || textLower.includes("synth")) return "Pop / Dance";
  return "Rock / Metal";
}

// Helper: Infer release year
function inferYear(text: string): string {
  const yearMatch = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  return yearMatch ? yearMatch[1] : "N/A";
}


// Vite middleware and server setup
async function startServer() {
  // Serve static assets in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // SPA Fallback for other routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Vite middleware for dev
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BAlbums Server] running on http://0.0.0.0:${PORT} [ENV: ${process.env.NODE_ENV || "development"}]`);
  });
}

startServer();

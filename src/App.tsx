import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Music, Heart, ListMusic, Download, Plus, Trash2, 
  Database, Globe, Star, Play, Pause, Volume2, X, ChevronRight, 
  Info, History, Sparkles, PlusCircle, Check, ListPlus, ExternalLink, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Album, Playlist, DownloadItem } from "./types";
import { LOCAL_ALBUMS } from "./data";

export default function App() {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<"search" | "favorites" | "playlists" | "custom-albums" | "downloads">("search");
  
  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSource, setSearchSource] = useState<"proxy" | "local">("proxy");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  
  // Search Results
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Persistent States (loaded from localStorage)
  const [favorites, setFavorites] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [customAlbums, setCustomAlbums] = useState<Album[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [albumReviews, setAlbumReviews] = useState<Record<string, { rating: number; notes: string }>>({});

  // Active / Detailed Album states
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loadingAlbumDetails, setLoadingAlbumDetails] = useState(false);
  const [albumDetailError, setAlbumDetailError] = useState<string | null>(null);
  const [albumFiles, setAlbumFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Simulated Player state
  const [activeTrack, setActiveTrack] = useState<{ title: string; artist: string; albumId: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [playerVolume, setPlayerVolume] = useState(80);
  const playerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // New Album Creator State
  const [showCreator, setShowCreator] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumArtist, setNewAlbumArtist] = useState("");
  const [newAlbumCover, setNewAlbumCover] = useState("");
  const [newAlbumGenre, setNewAlbumGenre] = useState("Heavy Metal");
  const [newAlbumYear, setNewAlbumYear] = useState(new Date().getFullYear().toString());
  const [newAlbumQuality, setNewAlbumQuality] = useState("320 kbps");
  const [newAlbumExcerpt, setNewAlbumExcerpt] = useState("");
  const [newAlbumTracks, setNewAlbumTracks] = useState<string>("");
  const [newAlbumLinks, setNewAlbumLinks] = useState<{ label: string; url: string }[]>([
    { label: "MEGA", url: "" },
    { label: "Mediafire", url: "" }
  ]);

  // Playlist Manager States
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
  const [selectedPlaylistForAdd, setSelectedPlaylistForAdd] = useState<string | null>(null);

  // Album Reviews/Notes States
  const [currentRating, setCurrentRating] = useState(0);
  const [currentNotes, setCurrentNotes] = useState("");

  // Loaded/Hydration check
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Initial Load and Hydration
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("balbums_favorites");
      const storedPlaylists = localStorage.getItem("balbums_playlists");
      const storedCustom = localStorage.getItem("balbums_custom");
      const storedDownloads = localStorage.getItem("balbums_downloads");
      const storedReviews = localStorage.getItem("balbums_reviews");
      const storedHist = localStorage.getItem("balbums_history");

      if (storedFavs) setFavorites(JSON.parse(storedFavs));
      if (storedPlaylists) setPlaylists(JSON.parse(storedPlaylists));
      if (storedCustom) setCustomAlbums(JSON.parse(storedCustom));
      if (storedDownloads) setDownloads(JSON.parse(storedDownloads));
      if (storedReviews) setAlbumReviews(JSON.parse(storedReviews));
      if (storedHist) setSearchHistory(JSON.parse(storedHist));
    } catch (e) {
      console.error("Erro ao carregar dados do localStorage", e);
    }
    setIsHydrated(true);
    
    // Show local default list initially
    setSearchResults(LOCAL_ALBUMS);
  }, []);

  // 2. Persist State Changes
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("balbums_favorites", JSON.stringify(favorites));
  }, [favorites, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("balbums_playlists", JSON.stringify(playlists));
  }, [playlists, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("balbums_custom", JSON.stringify(customAlbums));
  }, [customAlbums, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("balbums_downloads", JSON.stringify(downloads));
  }, [downloads, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("balbums_reviews", JSON.stringify(albumReviews));
  }, [albumReviews, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("balbums_history", JSON.stringify(searchHistory));
  }, [searchHistory, isHydrated]);

  // 3. Audio Player Simulation
  useEffect(() => {
    if (isPlaying) {
      playerIntervalRef.current = setInterval(() => {
        setPlayerProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playerIntervalRef.current) {
        clearInterval(playerIntervalRef.current);
      }
    }
    return () => {
      if (playerIntervalRef.current) clearInterval(playerIntervalRef.current);
    };
  }, [isPlaying]);

  // Combine static LOCAL_ALBUMS with custom user albums
  const getFullLocalCatalog = (): Album[] => {
    return [...customAlbums, ...LOCAL_ALBUMS];
  };

  // Perform search (handles proxy or local catalog)
  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery !== undefined ? customQuery : searchQuery).trim();
    
    if (!query) {
      // If empty query, show all local + custom
      setSearchResults(getFullLocalCatalog());
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    // Save search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    }

    if (searchSource === "local") {
      // Local Search logic - faster, instant results
      const localCatalog = getFullLocalCatalog();
      const results = localCatalog.filter(
        album => 
          album.title.toLowerCase().includes(query.toLowerCase()) ||
          album.artist.toLowerCase().includes(query.toLowerCase()) ||
          (album.genre && album.genre.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
      setIsSearching(false);
    } else {
      // Live Proxy Search logic with improved timeout handling
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.results && data.results.length > 0) {
          // Convert basic results to full albums
          const mappedResults: Album[] = data.results.map((r: any, idx: number) => ({
            id: r.url, // URL acts as unique ID for live albums
            title: r.title,
            artist: inferArtistFromTitle(r.title),
            cover: r.cover || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=60",
            year: "Proxy",
            genre: "Live / Web",
            excerpt: r.excerpt,
            tracks: [],
            downloadLinks: []
          }));
          setSearchResults(mappedResults);
        } else if (data.error === "cloudflare_detected" || !data.success) {
          // Fallback to local catalog and warn user
          console.warn("[v0] Proxy fallback triggered:", data.message);
          const localCatalog = getFullLocalCatalog();
          const localFiltered = localCatalog.filter(
            album => 
              album.title.toLowerCase().includes(query.toLowerCase()) ||
              album.artist.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(localFiltered);
          setSearchError(
            data.message || "Não foi possível buscar no balbums.st. Mostrando resultados do catálogo local."
          );
        } else {
          setSearchResults([]);
          setSearchError("Nenhum resultado encontrado para sua busca.");
        }
      } catch (err: any) {
        console.error("[v0] Erro na busca via proxy:", err.message);
        // Failover to local search
        const localCatalog = getFullLocalCatalog();
        const localFiltered = localCatalog.filter(
          album => 
            album.title.toLowerCase().includes(query.toLowerCase()) ||
            album.artist.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(localFiltered);
        setSearchError(
          err.name === "AbortError" 
            ? "Tempo limite excedido. Ativado modo de busca local inteligente!"
            : "Erro de conexão. Ativado modo de busca local inteligente!"
        );
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Extract artist from "Artist - Album Name" format typical of WordPress titles
  const inferArtistFromTitle = (title: string): string => {
    if (title.includes(" - ")) {
      return title.split(" - ")[0].trim();
    }
    return "Vários Artistas";
  };

  // Handle detailed album selection and fetch full tracks/links if live
  const handleSelectAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setAlbumDetailError(null);

    // Initialize rating/notes state for this album
    const savedReview = albumReviews[album.id];
    if (savedReview) {
      setCurrentRating(savedReview.rating);
      setCurrentNotes(savedReview.notes);
    } else {
      setCurrentRating(0);
      setCurrentNotes("");
    }

    // If it's a local album or custom, it already has full data
    if (album.id.startsWith("local-") || album.id.startsWith("custom-") || album.isCustom) {
      setLoadingAlbumDetails(false);
      return;
    }

    // If it's a live album, fetch details from proxy with timeout
    setLoadingAlbumDetails(true);
    
    // Also fetch files from bunkr if this is a bunkr URL
    if (album.id.includes("bunkr.cr") || album.id.includes("bunkr.su")) {
      fetchAlbumFiles(album.id);
    } else {
      setAlbumFiles([]);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const response = await fetch(`/api/album?url=${encodeURIComponent(album.id)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.album) {
        setSelectedAlbum((prev) => {
          if (!prev || prev.id !== album.id) return prev; // Prevent race conditions
          return {
            ...prev,
            title: data.album.title || prev.title,
            cover: data.album.cover || prev.cover,
            description: data.album.description || prev.excerpt,
            tracks: data.album.tracks || [],
            downloadLinks: data.album.downloadLinks || [],
            genre: data.album.genre || prev.genre || "Rock / Metal",
            year: data.album.year || prev.year || "N/A"
          };
        });
      } else {
        setAlbumDetailError(data.message || "O site balbums.st bloqueou a conexão. Gerando faixas demonstrativas para este álbum!");
        // Mock some tracks as fallback
        setSelectedAlbum((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tracks: prev.tracks && prev.tracks.length > 0 ? prev.tracks : [
              `01. ${prev.title} - Intro`,
              `02. Dawn of the Fire`,
              `03. Echoes of the Past`,
              `04. Sonic Pulse`,
              `05. Outro / Finale`
            ],
            downloadLinks: prev.downloadLinks && prev.downloadLinks.length > 0 ? prev.downloadLinks : [
              { label: "MEGA (Simulado)", url: "https://mega.nz/" },
              { label: "Mediafire (Simulado)", url: "https://mediafire.com/" }
            ]
          };
        });
      }
    } catch (err: any) {
      console.error("[v0] Erro ao obter detalhes do álbum:", err.message);
      setAlbumDetailError(
        err.name === "AbortError"
          ? "Tempo limite excedido. Criando faixas simuladas!"
          : "Erro ao conectar com o site balbums.st. Criando faixas simuladas!"
      );
      // Use fallback tracks
      setSelectedAlbum((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tracks: prev.tracks && prev.tracks.length > 0 ? prev.tracks : [
            "01. Intro",
            "02. Stormbringer",
            "03. Silent Tears",
            "04. Legacy of Fire"
          ],
          downloadLinks: prev.downloadLinks && prev.downloadLinks.length > 0 ? prev.downloadLinks : [
            { label: "Download Alternativo", url: "https://mega.nz/" }
          ]
        };
      });
    } finally {
      setLoadingAlbumDetails(false);
    }
  };

  // Fetch files from bunkr album
  const fetchAlbumFiles = async (albumUrl: string) => {
    setLoadingFiles(true);
    try {
      const response = await fetch(`/api/files?url=${encodeURIComponent(albumUrl)}`);
      const data = await response.json();
      
      if (data.success && data.files) {
        setAlbumFiles(data.files);
      } else {
        setAlbumFiles([]);
      }
    } catch (err) {
      setAlbumFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = (album: Album, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFav = favorites.some((f) => f.id === album.id);
    if (isFav) {
      setFavorites(favorites.filter((f) => f.id !== album.id));
    } else {
      setFavorites([...favorites, album]);
    }
  };

  // Simulated Track Playback with improved UX
  const handlePlayTrack = (trackName: string, album: Album) => {
    const wasPlaying = isPlaying && activeTrack?.title === trackName && activeTrack?.albumId === album.id;
    
    if (wasPlaying) {
      // Toggle: pause if same track is playing
      setIsPlaying(false);
    } else {
      // Start or resume different track
      setActiveTrack({
        title: trackName,
        artist: album.artist,
        albumId: album.id
      });
      setIsPlaying(true);
      setPlayerProgress(0);
    }
  };

  // Log downloads
  const handleLogDownload = (album: Album, label: string, url: string) => {
    const newItem: DownloadItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: album.title,
      artist: album.artist,
      linkName: label,
      linkUrl: url,
      timestamp: new Date().toLocaleTimeString("pt-BR") + " - " + new Date().toLocaleDateString("pt-BR")
    };
    setDownloads([newItem, ...downloads]);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Save Review / Rating
  const handleSaveReview = () => {
    if (!selectedAlbum) return;
    setAlbumReviews({
      ...albumReviews,
      [selectedAlbum.id]: { rating: currentRating, notes: currentNotes }
    });
    // Update active rating in detailed album object
    setSelectedAlbum({
      ...selectedAlbum,
      rating: currentRating,
      notes: currentNotes
    });
  };

  // Create Playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substring(2, 9),
      name: newPlaylistName,
      description: newPlaylistDesc || "Sem descrição",
      createdAt: new Date().toLocaleDateString("pt-BR"),
      songs: []
    };

    setPlaylists([...playlists, newPlaylist]);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setShowPlaylistCreator(false);
  };

  // Add Song to Playlist
  const handleAddSongToPlaylist = (playlistId: string, trackTitle: string, album: Album) => {
    setPlaylists(playlists.map(pl => {
      if (pl.id === playlistId) {
        // Check if track already in playlist
        if (pl.songs.some(s => s.title === trackTitle && s.albumId === album.id)) {
          return pl;
        }
        return {
          ...pl,
          songs: [...pl.songs, {
            id: Math.random().toString(36).substring(2, 9),
            title: trackTitle,
            artist: album.artist,
            albumId: album.id,
            albumTitle: album.title
          }]
        };
      }
      return pl;
    }));
    setSelectedPlaylistForAdd(null);
  };

  // Remove Song from Playlist
  const handleRemoveFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(playlists.map(pl => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          songs: pl.songs.filter(s => s.id !== songId)
        };
      }
      return pl;
    }));
  };

  // Delete Playlist
  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter(p => p.id !== playlistId));
  };

  // Custom Album Creator with validation
  const handleCreateCustomAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    
    const titleTrimmed = newAlbumTitle.trim();
    const artistTrimmed = newAlbumArtist.trim();
    
    if (!titleTrimmed || !artistTrimmed) {
      alert("Por favor, preencha o título e o artista do álbum!");
      return;
    }

    // Parse tracklist lines - more robust parsing
    const parsedTracks = newAlbumTracks
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, idx) => {
        // Ensure standard index numbering if not present
        if (/^\d+/.test(line)) return line;
        const trackNum = (idx + 1).toString().padStart(2, '0');
        return `${trackNum}. ${line}`;
      });

    // Validate that we have at least one track
    if (parsedTracks.length === 0) {
      alert("Por favor, adicione pelo menos uma faixa!");
      return;
    }

    // Validate download links - at least one valid link recommended but not required
    const validLinks = newAlbumLinks.filter(link => link.url.trim() && link.label.trim());

    const newAlbum: Album = {
      id: `custom-${Math.random().toString(36).substring(2, 9)}`,
      title: titleTrimmed,
      artist: artistTrimmed,
      cover: newAlbumCover.trim() || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60",
      genre: newAlbumGenre,
      year: newAlbumYear,
      quality: newAlbumQuality,
      excerpt: newAlbumExcerpt || "Álbum adicionado pelo usuário na coleção local.",
      description: newAlbumExcerpt || "Álbum customizado adicionado pelo painel criativo do usuário. Desfrute das faixas e links configurados localmente.",
      tracks: parsedTracks,
      downloadLinks: validLinks,
      isCustom: true
    };

    setCustomAlbums([newAlbum, ...customAlbums]);
    setSearchResults([newAlbum, ...searchResults]);
    
    console.log("[v0] Novo álbum criado:", newAlbum.id, newAlbum.title);
    
    // Reset form
    setNewAlbumTitle("");
    setNewAlbumArtist("");
    setNewAlbumCover("");
    setNewAlbumTracks("");
    setNewAlbumExcerpt("");
    setNewAlbumLinks([
      { label: "MEGA", url: "" },
      { label: "Mediafire", url: "" }
    ]);
    setShowCreator(false);
    setActiveTab("custom-albums");
  };

  // Handle adding custom link to list
  const addCustomLinkField = () => {
    setNewAlbumLinks([...newAlbumLinks, { label: "Servidor", url: "" }]);
  };

  // Genres & Years unique lists for filtering
  const allGenres = ["All", "Heavy Metal", "Power/Symphonic Metal", "Rock / Grunge", "Alternative / Indie", "Música Brasileira", "Pop / Dance"];
  const allYears = ["All", "2024", "2023", "2021", "2013", "2001", "2000", "1996", "1991", "1973", "1971"];

  // Filtered Results
  const filteredAlbums = searchResults.filter(album => {
    const genreMatch = selectedGenre === "All" || album.genre === selectedGenre;
    const yearMatch = selectedYear === "All" || album.year === selectedYear;
    return genreMatch && yearMatch;
  });

  return (
    <div id="app-root" className="min-h-screen bg-[#0d1117] text-gray-100 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* HEADER BAR */}
      <header id="header" className="bg-[#161b22] border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center animate-pulse">
            <Music id="icon-music-logo" className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 id="app-title" className="text-xl font-bold tracking-tight text-white flex items-center">
              BAlbums <span className="text-indigo-400 ml-1.5 font-mono text-xs px-2 py-0.5 bg-indigo-950/80 border border-indigo-900 rounded-full">PORTAL v2.5</span>
            </h1>
            <p className="text-xs text-gray-400">Seu agregador musical inteligente de alta qualidade</p>
          </div>
        </div>

        {/* Info badges about Proxy and Database status */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-gray-900/60 px-3 py-1.5 rounded-full border border-gray-800">
            <div className={`w-2.5 h-2.5 rounded-full ${searchSource === "proxy" ? "bg-emerald-500" : "bg-indigo-500 animate-ping"}`}></div>
            <span className="text-xs font-medium text-gray-300">
              Proxy: {searchSource === "proxy" ? "Conectado ao Balbums.st" : "Catálogo Local Isolado"}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 bg-gray-900/60 px-3 py-1.5 rounded-full border border-gray-800 text-xs">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-gray-300">{favorites.length} Salvos</span>
          </div>
        </div>
      </header>

      {/* CORE LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* SIDEBAR */}
        <aside id="sidebar" className="w-full md:w-64 bg-[#161b22]/90 border-r border-gray-800 p-4 flex flex-col space-y-2 shrink-0">
          
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">Navegação</div>
          
          <button 
            onClick={() => { setActiveTab("search"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left ${activeTab === "search" ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-medium" : "text-gray-300 hover:bg-gray-800/50 hover:text-white"}`}
          >
            <Search className="w-4 h-4" />
            <span>Buscar Álbuns</span>
          </button>

          <button 
            onClick={() => { setActiveTab("favorites"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left ${activeTab === "favorites" ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-medium" : "text-gray-300 hover:bg-gray-800/50 hover:text-white"}`}
          >
            <Heart className="w-4 h-4" />
            <span className="flex-1">Meus Favoritos</span>
            <span className="bg-gray-800 text-gray-400 text-xxs px-1.5 py-0.5 rounded-full font-mono">{favorites.length}</span>
          </button>

          <button 
            onClick={() => { setActiveTab("playlists"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left ${activeTab === "playlists" ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-medium" : "text-gray-300 hover:bg-gray-800/50 hover:text-white"}`}
          >
            <ListMusic className="w-4 h-4" />
            <span className="flex-1">Playlists Custom</span>
            <span className="bg-gray-800 text-gray-400 text-xxs px-1.5 py-0.5 rounded-full font-mono">{playlists.length}</span>
          </button>

          <button 
            onClick={() => { setActiveTab("custom-albums"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left ${activeTab === "custom-albums" ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-medium" : "text-gray-300 hover:bg-gray-800/50 hover:text-white"}`}
          >
            <Database className="w-4 h-4" />
            <span className="flex-1">Meus Envios</span>
            <span className="bg-gray-800 text-gray-400 text-xxs px-1.5 py-0.5 rounded-full font-mono">{customAlbums.length}</span>
          </button>

          <button 
            onClick={() => { setActiveTab("downloads"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left ${activeTab === "downloads" ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 font-medium" : "text-gray-300 hover:bg-gray-800/50 hover:text-white"}`}
          >
            <Download className="w-4 h-4" />
            <span className="flex-1">Histórico Down</span>
            <span className="bg-gray-800 text-gray-400 text-xxs px-1.5 py-0.5 rounded-full font-mono">{downloads.length}</span>
          </button>

          <div className="pt-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-1">Coleção Pessoal</div>
            <button 
              onClick={() => setShowCreator(true)}
              className="mt-2 w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Novo Álbum</span>
            </button>
          </div>

          <div className="flex-1"></div>

          {/* SYSTEM STATUS CARD */}
          <div className="bg-[#0d1117] rounded-xl p-3 border border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Status da API:</span>
              <span className="flex items-center text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1 animate-pulse"></span>
                Operante
              </span>
            </div>
            <div className="text-xxs text-gray-500 leading-relaxed">
              Equipado com proxy inteligente capaz de parsear dinamicamente e salvar cache local de alta velocidade.
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY REGION */}
        <main id="main-content" className="flex-1 bg-[#0d1117] p-6 overflow-y-auto max-w-7xl mx-auto w-full pb-36">
          
          {/* SEARCH TAB */}
          {activeTab === "search" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* SEARCH ENGINE CONTROLS */}
              <div className="bg-[#161b22] p-5 rounded-2xl border border-gray-800 shadow-lg">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center">
                        <Search className="w-5 h-5 text-indigo-400 mr-2" />
                        Motor de Pesquisa BAlbums
                      </h2>
                      <p className="text-xs text-gray-400">Busque seus álbuns favoritos de metal, rock e mais</p>
                    </div>

                    {/* SOURCE ENGINE SWITCH */}
                    <div className="bg-gray-900 p-1 rounded-xl border border-gray-800 flex items-center self-start md:self-auto">
                      <button 
                        onClick={() => { setSearchSource("proxy"); }}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${searchSource === "proxy" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Balbums.st Proxy</span>
                      </button>
                      <button 
                        onClick={() => { setSearchSource("local"); }}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${searchSource === "local" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Banco Local</span>
                      </button>
                    </div>
                  </div>

                  {/* SEARCH FORM */}
                  <form onSubmit={handleSearch} className="flex gap-2.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-500" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchSource === "proxy" ? "Pesquise por artista, álbum ou gênero (ex: Iron Maiden)..." : "Busque no catálogo local persistido..."}
                        className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm placeholder-gray-500 transition-all shadow-inner"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-6 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 shrink-0"
                    >
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span>Buscar</span>
                      )}
                    </button>
                  </form>

                  {/* HISTORY CHIPS */}
                  {searchHistory.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <span className="text-gray-500 flex items-center">
                        <History className="w-3.5 h-3.5 mr-1" /> Histórico:
                      </span>
                      {searchHistory.map((hist, i) => (
                        <button 
                          key={i}
                          onClick={() => { setSearchQuery(hist); handleSearch(undefined, hist); }}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-md transition-all font-medium border border-gray-700 flex items-center space-x-1"
                        >
                          <span>{hist}</span>
                        </button>
                      ))}
                      <button 
                        onClick={() => setSearchHistory([])} 
                        className="text-gray-500 hover:text-red-400 text-xxs font-semibold ml-2 underline"
                      >
                        Limpar
                      </button>
                    </div>
                  )}

                  {/* WARNING OR PROXY STATUS */}
                  {searchError && (
                    <div className="bg-warn/15 border border-warn/40 p-3.5 rounded-lg flex items-start space-x-2 text-warn text-xs leading-relaxed fadeup">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold">Aviso: </span>
                        {searchError}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* FILTERS */}
              <div className="flex flex-wrap items-center gap-3 bg-bg-soft/50 p-4 rounded-lg border border-line">
                <span className="text-xs text-text-mute font-semibold uppercase tracking-wider">Filtros:</span>
                
                {/* GENRE FILTER */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-text-soft">Gênero:</span>
                  <select 
                    value={selectedGenre} 
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="input p-1 bg-bg-card text-text text-xs"
                  >
                    {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                {/* YEAR FILTER */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-text-soft">Ano:</span>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="input p-1 bg-bg-card text-text text-xs"
                  >
                    {allYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="flex-1"></div>
                <div className="text-xs text-text-mute mono">
                  {filteredAlbums.length} de {searchResults.length}
                </div>
              </div>

              {/* GRID RESULTS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredAlbums.map((album) => {
                  const isFav = favorites.some(f => f.id === album.id);
                  return (
                    <motion.div 
                      layout
                      key={album.id}
                      onClick={() => handleSelectAlbum(album)}
                      className="bg-[#161b22] rounded-2xl overflow-hidden border border-gray-850 group hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-900/10 cursor-pointer transition-all duration-300 flex flex-col h-full relative"
                    >
                      {/* Album Cover wrapper */}
                      <div className="aspect-square relative overflow-hidden bg-gray-900">
                        <img 
                          src={album.cover} 
                          alt={album.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePlayTrack(album.tracks?.[0] || album.title, album); }}
                            className="bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-full text-white transition shadow-lg flex items-center justify-center transform hover:scale-110"
                          >
                            <Play className="w-4 h-4 fill-white" />
                          </button>
                        </div>
                        
                        {/* Favorite button absolute */}
                        <button 
                          onClick={(e) => toggleFavorite(album, e)}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/75 transition-all text-white z-10"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? "text-red-500 fill-red-500" : "text-gray-300"}`} />
                        </button>

                        {/* Custom Album Indicator badge */}
                        {album.isCustom && (
                          <span className="absolute top-2.5 left-2.5 bg-indigo-900/90 text-indigo-300 border border-indigo-700/50 text-xxs px-2 py-0.5 rounded-md font-semibold tracking-wider uppercase backdrop-blur-md">
                            Criado
                          </span>
                        )}
                      </div>

                      {/* Info body */}
                      <div className="p-3.5 flex flex-col flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-950/60 font-mono">
                            {album.genre || "Rock / Metal"}
                          </span>
                          <span className="text-xxs text-gray-500 font-mono">{album.year || "N/A"}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {album.title}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-1">{album.artist}</p>
                        {album.excerpt && (
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed pt-1 border-t border-gray-800 mt-1">
                            {album.excerpt}
                          </p>
                        )}
                        <div className="flex-1"></div>
                        <div className="flex items-center justify-between pt-2 text-[10px] text-gray-500 font-semibold border-t border-gray-800">
                          <span className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                            {albumReviews[album.id]?.rating || "S/N"}
                          </span>
                          <span className="text-indigo-400 hover:underline flex items-center gap-0.5">
                            Ver Faixas <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredAlbums.length === 0 && (
                  <div className="col-span-full py-16 text-center space-y-3">
                    <Music className="w-12 h-12 text-gray-600 mx-auto" />
                    <h3 className="text-lg font-bold text-gray-400">Nenhum álbum encontrado</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Tente buscar por termos mais genéricos ou mude a fonte de busca para obter melhores resultados!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* FAVORITES TAB */}
          {activeTab === "favorites" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Heart className="w-6 h-6 text-red-500 mr-2 fill-red-500" />
                    Meus Álbuns Favoritos
                  </h2>
                  <p className="text-xs text-gray-400">Seus álbuns de cabeceira salvos para acesso instantâneo</p>
                </div>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {favorites.map((album) => (
                    <div 
                      key={album.id}
                      onClick={() => handleSelectAlbum(album)}
                      className="bg-[#161b22] rounded-2xl overflow-hidden border border-gray-850 group hover:border-indigo-500/50 hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="aspect-square relative overflow-hidden bg-gray-900">
                        <img src={album.cover} alt={album.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(album); }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md z-10 transition-transform hover:scale-110"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3.5 flex flex-col flex-1 space-y-1">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{album.genre}</span>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{album.title}</h3>
                        <p className="text-xs text-gray-400">{album.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#161b22] p-12 text-center rounded-2xl border border-gray-800 space-y-3">
                  <Heart className="w-12 h-12 text-gray-600 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-400">Sua galeria está vazia</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Navegue pela página de pesquisa e clique no ícone de coração para salvar álbuns aqui!
                  </p>
                  <button 
                    onClick={() => setActiveTab("search")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    Explorar Álbuns agora
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PLAYLISTS TAB */}
          {activeTab === "playlists" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center font-sans">
                    <ListMusic className="w-6 h-6 text-indigo-400 mr-2" />
                    Suas Playlists Customizadas
                  </h2>
                  <p className="text-xs text-gray-400">Monte suas próprias sequências musicais com músicas dos álbuns</p>
                </div>
                <button 
                  onClick={() => setShowPlaylistCreator(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Criar Nova Playlist</span>
                </button>
              </div>

              {/* Playlist Creator Form Overlay / Block */}
              {showPlaylistCreator && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161b22] p-5 rounded-2xl border border-indigo-500/30">
                  <form onSubmit={handleCreatePlaylist} className="space-y-4">
                    <h3 className="font-bold text-sm text-indigo-400 uppercase">Configurar Playlist</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Nome da Playlist</label>
                        <input 
                          type="text" 
                          required
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="Ex: Baladas Clássicas do Rock"
                          className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                        <input 
                          type="text" 
                          value={newPlaylistDesc}
                          onChange={(e) => setNewPlaylistDesc(e.target.value)}
                          placeholder="Ex: Músicas para ouvir no fim de tarde"
                          className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setShowPlaylistCreator(false)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Salvar Playlist
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* PLAYLISTS LISTING */}
              {playlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {playlists.map((pl) => (
                    <div key={pl.id} className="bg-[#161b22] rounded-2xl border border-gray-850 p-5 flex flex-col justify-between space-y-4 shadow-md hover:border-gray-700 transition">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white text-base">{pl.name}</h3>
                          <button 
                            onClick={() => handleDeletePlaylist(pl.id)}
                            className="text-gray-500 hover:text-red-400 transition"
                            title="Deletar Playlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">{pl.description}</p>
                        <span className="inline-block text-[10px] font-semibold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded font-mono border border-indigo-950/60 mt-1">
                          Criada em: {pl.createdAt}
                        </span>
                      </div>

                      {/* Tracks listing inside Playlist */}
                      <div className="bg-[#0d1117] p-3 rounded-xl border border-gray-900 space-y-2">
                        <h4 className="text-xs font-bold text-indigo-400 flex items-center justify-between">
                          <span>Faixas na Playlist ({pl.songs.length})</span>
                        </h4>
                        
                        {pl.songs.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-gray-800/45 pr-1">
                            {pl.songs.map((song) => (
                              <div key={song.id} className="flex items-center justify-between pt-1.5 first:pt-0 text-xs">
                                <div className="truncate flex-1">
                                  <span className="text-white hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => {
                                    // Simulated playback of playlist song
                                    setActiveTrack({ title: song.title, artist: song.artist, albumId: song.albumId });
                                    setIsPlaying(true);
                                    setPlayerProgress(0);
                                  }}>{song.title}</span>
                                  <span className="text-xxs text-gray-500 block">De {song.artist} • Álbum: {song.albumTitle}</span>
                                </div>
                                <button 
                                  onClick={() => handleRemoveFromPlaylist(pl.id, song.id)}
                                  className="text-gray-500 hover:text-red-400 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-xs text-gray-600">
                            Nenhuma faixa adicionada. Abra qualquer álbum e adicione faixas aqui!
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#161b22] p-12 text-center rounded-2xl border border-gray-850 space-y-3">
                  <ListMusic className="w-12 h-12 text-gray-600 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-400">Nenhuma playlist por aqui</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Organize suas músicas prediletas em playlists! Crie a primeira acima e adicione músicas ao abrir qualquer álbum.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CUSTOM USER ALBUMS TAB */}
          {activeTab === "custom-albums" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center font-sans">
                    <Database className="w-6 h-6 text-indigo-400 mr-2" />
                    Seus Álbuns Enviados
                  </h2>
                  <p className="text-xs text-gray-400">Gerencie os álbuns e faixas que você adicionou manualmente</p>
                </div>
                <button 
                  onClick={() => setShowCreator(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo</span>
                </button>
              </div>

              {customAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {customAlbums.map((album) => (
                    <div 
                      key={album.id}
                      onClick={() => handleSelectAlbum(album)}
                      className="bg-[#161b22] rounded-2xl overflow-hidden border border-gray-850 group hover:border-indigo-500/50 hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col h-full"
                    >
                      <div className="aspect-square relative overflow-hidden bg-gray-900">
                        <img src={album.cover} alt={album.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setCustomAlbums(customAlbums.filter(f => f.id !== album.id));
                            // Also remove from searchResults
                            setSearchResults(searchResults.filter(f => f.id !== album.id));
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md z-10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3.5 flex flex-col flex-1 space-y-1">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{album.genre}</span>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{album.title}</h3>
                        <p className="text-xs text-gray-400">{album.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#161b22] p-12 text-center rounded-2xl border border-gray-850 space-y-3">
                  <Database className="w-12 h-12 text-gray-600 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-400">Catálogo customizado vazio</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Você pode cadastrar seus próprios álbuns (com imagens, tracklist personalizado e links reais ou simulados) para serem indexados na busca!
                  </p>
                  <button 
                    onClick={() => setShowCreator(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition"
                  >
                    Adicionar Álbum Manual
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DOWNLOADS HISTORIC TAB */}
          {activeTab === "downloads" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center font-sans">
                  <Download className="w-6 h-6 text-indigo-400 mr-2" />
                  Histórico de Downloads
                </h2>
                <p className="text-xs text-gray-400">Rastreabilidade dos links externos que você clicou e baixou</p>
              </div>

              {downloads.length > 0 ? (
                <div className="bg-[#161b22] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/40">
                    <span className="text-xs font-bold text-gray-300">Downloads Recentes ({downloads.length})</span>
                    <button 
                      onClick={() => setDownloads([])}
                      className="text-gray-500 hover:text-red-400 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Limpar Histórico
                    </button>
                  </div>
                  <div className="divide-y divide-gray-850">
                    {downloads.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-800/20 transition-all">
                        <div className="space-y-1 flex-1 min-w-0 pr-4">
                          <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                          <p className="text-xs text-gray-400">{item.artist}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-mono pt-0.5">
                            <span className="bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900/50">{item.linkName}</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                        <a 
                          href={item.linkUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-indigo-800/40 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Re-abrir Link
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#161b22] p-12 text-center rounded-2xl border border-gray-850 space-y-3">
                  <Download className="w-12 h-12 text-gray-600 mx-auto" />
                  <h3 className="text-lg font-bold text-gray-400">Nenhum download registrado</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Sempre que você clicar em um link de download (MEGA, Mediafire, etc.) dentro de um álbum, ele será registrado aqui para facilidade futura!
                  </p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* DETAILED ALBUM DIALOG / MODAL */}
      <AnimatePresence>
        {selectedAlbum && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#161b22] border border-gray-800 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              
              {/* Top sticky close */}
              <button 
                onClick={() => { setSelectedAlbum(null); setSelectedPlaylistForAdd(null); }}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition z-30 shadow-md border border-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto flex-1">
                {/* Visual Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-gradient-to-b from-indigo-950/30 to-transparent">
                  
                  {/* Album Cover */}
                  <div className="md:col-span-4 flex justify-center md:justify-start">
                    <div className="aspect-square w-full max-w-[240px] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 relative bg-gray-900">
                      <img src={selectedAlbum.cover} alt={selectedAlbum.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Album Metadata */}
                  <div className="md:col-span-8 flex flex-col justify-end space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-900/50 uppercase tracking-wider font-mono">
                          {selectedAlbum.genre || "Gênero Geral"}
                        </span>
                        {selectedAlbum.quality && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-900/40 uppercase font-mono">
                            {selectedAlbum.quality}
                          </span>
                        )}
                        {selectedAlbum.isCustom && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-900/40 uppercase font-mono">
                            Coleção Local
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{selectedAlbum.title}</h2>
                      <p className="text-base text-gray-300 font-medium">{selectedAlbum.artist}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-gray-400 border-t border-b border-gray-800 py-3">
                      <div>Lançamento: <span className="text-gray-200">{selectedAlbum.year || "N/A"}</span></div>
                      <div>•</div>
                      <div>Faixas: <span className="text-gray-200">{selectedAlbum.tracks?.length || 0}</span></div>
                      <div>•</div>
                      <div>Fonte: <span className="text-gray-200">{selectedAlbum.id.startsWith("local-") ? "Servidor Local" : "BAlbums Portal"}</span></div>
                    </div>
                  </div>
                </div>

                {/* Sub-panels and tracklists */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 border-t border-gray-850">
                  
                  {/* Left block: Tracks */}
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
                      <Music className="w-4 h-4 text-indigo-400 mr-2" />
                      Lista de Faixas do Álbum
                    </h3>

                    {loadingAlbumDetails ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <span className="text-xs text-gray-400">Buscando dados no balbums.st via Proxy...</span>
                      </div>
                    ) : albumDetailError ? (
                      <div className="space-y-4">
                        <div className="bg-amber-950/20 border border-amber-900/50 p-3 rounded-lg text-amber-300 text-xs">
                          {albumDetailError}
                        </div>
                        {/* Display tracks */}
                        {renderTracksList()}
                      </div>
                    ) : (
                      renderTracksList()
                    )}
                  </div>

                  {/* Right block: Downloads and User review notes */}
                  <div className="md:col-span-5 space-y-6">
                    
                    {/* Downloads Box */}
                    <div className="bg-[#0d1117] p-5 rounded-2xl border border-gray-800 space-y-3.5">
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center">
                        <Download className="w-4 h-4 text-emerald-400 mr-1.5" />
                        Servidores de Download
                      </h4>
                      <p className="text-xxs text-gray-500 leading-relaxed">
                        Estes links abrem servidores externos hospedados de forma descentralizada. Os cliques serão registrados em seu Histórico.
                      </p>

                      <div className="space-y-2.5">
                        {selectedAlbum.downloadLinks && selectedAlbum.downloadLinks.length > 0 ? (
                          selectedAlbum.downloadLinks.map((link, i) => (
                            <button 
                              key={i}
                              onClick={() => handleLogDownload(selectedAlbum, link.label, link.url)}
                              className="w-full bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-900/40 hover:border-transparent text-emerald-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                            >
                              <span>Baixar via {link.label}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-4 text-xs text-gray-500 font-mono bg-gray-900/30 rounded-lg border border-dashed border-gray-800">
                            Sem servidores vinculados
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bunkr Files Download Box */}
                    {albumFiles.length > 0 && (
                      <div className="bg-[#0d1117] p-5 rounded-2xl border border-gray-800 space-y-3.5">
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center">
                          <FileText className="w-4 h-4 text-blue-400 mr-1.5" />
                          Arquivos do Álbum ({albumFiles.length})
                        </h4>
                        <p className="text-xxs text-gray-500 leading-relaxed">
                          Clique em qualquer arquivo para fazer download direto do repositório Bunkr.
                        </p>

                        <div className="space-y-2">
                          <button 
                            onClick={() => {
                              albumFiles.forEach((file, index) => {
                                setTimeout(() => {
                                  const link = document.createElement('a');
                                  link.href = file.fullUrl;
                                  link.target = '_blank';
                                  link.click();
                                }, index * 200);
                              });
                            }}
                            className="w-full bg-blue-600/10 hover:bg-blue-600 border border-blue-900/40 hover:border-transparent text-blue-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all"
                          >
                            <span>Abrir Todos ({albumFiles.length})</span>
                            <Download className="w-3.5 h-3.5 opacity-70" />
                          </button>
                        </div>

                        {/* File list */}
                        <div className="max-h-40 overflow-y-auto space-y-1.5 border-t border-gray-700 pt-3">
                          {albumFiles.map((file, idx) => (
                            <a 
                              key={idx}
                              href={file.fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-2.5 bg-gray-900/50 hover:bg-blue-950/40 border border-gray-700 hover:border-blue-700 rounded-lg transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-300 group-hover:text-blue-300 truncate font-mono">
                                    {file.name}
                                  </p>
                                  <p className="text-xxs text-gray-500 group-hover:text-gray-400">
                                    {file.size}
                                  </p>
                                </div>
                                <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Personal Notes / Persistent Reviews */}
                    <div className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1.5 fill-yellow-500" />
                        Minha Avaliação e Notas
                      </h4>

                      <div className="space-y-3">
                        {/* Star selector */}
                        <div className="flex items-center space-x-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                              key={star}
                              onClick={() => setCurrentRating(star)}
                              className="text-gray-600 hover:text-yellow-500 transition-colors"
                            >
                              <Star className={`w-6 h-6 ${star <= currentRating ? "text-yellow-500 fill-yellow-500" : ""}`} />
                            </button>
                          ))}
                          {currentRating > 0 && <span className="text-xs font-mono text-gray-300 ml-1">({currentRating}/5)</span>}
                        </div>

                        {/* Text note */}
                        <div>
                          <textarea 
                            value={currentNotes}
                            onChange={(e) => setCurrentNotes(e.target.value)}
                            placeholder="Deixe suas notas pessoais sobre este álbum (ex: faixa favorita, qualidade de compressão, observações...)"
                            className="w-full bg-[#0d1117] border border-gray-800 text-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 h-20 resize-none"
                          />
                        </div>

                        <button 
                          onClick={handleSaveReview}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white w-full py-2 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10"
                        >
                          Salvar Nota Pessoal
                        </button>
                      </div>
                    </div>

                    {/* Excerpt / description text if present */}
                    {selectedAlbum.description && (
                      <div className="p-4 bg-gray-950/40 rounded-2xl border border-gray-850/60 space-y-1.5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Descrição Detalhada</h4>
                        <p className="text-xs text-gray-400 leading-relaxed max-h-48 overflow-y-auto pr-1">
                          {selectedAlbum.description}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPONENT: NEW ALBUM CREATOR OVERLAY / MODAL */}
      <AnimatePresence>
        {showCreator && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161b22] border border-indigo-900/50 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              <button 
                onClick={() => setShowCreator(false)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full z-10 transition border border-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 border-b border-indigo-950/60 bg-gradient-to-r from-indigo-950/25 to-transparent flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">Adicionar Álbum Manual ao Catálogo</h3>
                  <p className="text-xs text-gray-400">Sua coleção local é totalmente persistida em seu navegador</p>
                </div>
              </div>

              <form onSubmit={handleCreateCustomAlbum} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] scrollbar-thin">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Título do Álbum *</label>
                    <input 
                      type="text" 
                      required
                      value={newAlbumTitle}
                      onChange={(e) => setNewAlbumTitle(e.target.value)}
                      placeholder="Ex: Dark Mofo Live"
                      className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nome do Artista / Banda *</label>
                    <input 
                      type="text" 
                      required
                      value={newAlbumArtist}
                      onChange={(e) => setNewAlbumArtist(e.target.value)}
                      placeholder="Ex: Alcest"
                      className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Gênero</label>
                    <select 
                      value={newAlbumGenre}
                      onChange={(e) => setNewAlbumGenre(e.target.value)}
                      className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    >
                      {allGenres.filter(g => g !== "All").map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Ano de Lançamento</label>
                    <input 
                      type="text" 
                      value={newAlbumYear}
                      onChange={(e) => setNewAlbumYear(e.target.value)}
                      placeholder="Ex: 2024"
                      className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Qualidade (Kbps)</label>
                    <input 
                      type="text" 
                      value={newAlbumQuality}
                      onChange={(e) => setNewAlbumQuality(e.target.value)}
                      placeholder="Ex: 320 kbps"
                      className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">URL da Imagem de Capa</label>
                  <input 
                    type="url" 
                    value={newAlbumCover}
                    onChange={(e) => setNewAlbumCover(e.target.value)}
                    placeholder="https://exemplo.com/capa.jpg (ou deixe em branco para capa padrão)"
                    className="w-full bg-[#0d1117] border border-gray-800 text-white rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Breve Descrição / Excertos</label>
                  <textarea 
                    value={newAlbumExcerpt}
                    onChange={(e) => setNewAlbumExcerpt(e.target.value)}
                    placeholder="Resumo das novidades deste álbum ou notas sobre a edição..."
                    className="w-full bg-[#0d1117] border border-gray-800 text-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 h-16 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Lista de Faixas (Uma por linha)</label>
                  <textarea 
                    value={newAlbumTracks}
                    onChange={(e) => setNewAlbumTracks(e.target.value)}
                    placeholder="01. Nome da Música Um&#10;02. Nome da Música Dois&#10;03. Nome da Música Três"
                    className="w-full bg-[#0d1117] border border-gray-800 text-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 font-mono leading-relaxed"
                  />
                </div>

                {/* Download links list editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs text-gray-400">Links para Download</label>
                    <button 
                      type="button" 
                      onClick={addCustomLinkField}
                      className="text-indigo-400 hover:text-indigo-300 text-[11px] font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Servidor
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newAlbumLinks.map((link, idx) => (
                      <div key={idx} className="flex gap-2.5">
                        <input 
                          type="text" 
                          placeholder="Label (MEGA, Drive...)"
                          value={link.label}
                          onChange={(e) => {
                            const updated = [...newAlbumLinks];
                            updated[idx].label = e.target.value;
                            setNewAlbumLinks(updated);
                          }}
                          className="w-1/4 bg-[#0d1117] border border-gray-800 text-white rounded-lg p-2 text-xs focus:outline-none"
                        />
                        <input 
                          type="url" 
                          placeholder="https://mega.nz/..."
                          value={link.url}
                          onChange={(e) => {
                            const updated = [...newAlbumLinks];
                            updated[idx].url = e.target.value;
                            setNewAlbumLinks(updated);
                          }}
                          className="flex-1 bg-[#0d1117] border border-gray-800 text-white rounded-lg p-2 text-xs focus:outline-none"
                        />
                        <button 
                          type="button" 
                          onClick={() => setNewAlbumLinks(newAlbumLinks.filter((_, i) => i !== idx))}
                          className="text-gray-500 hover:text-red-400 p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-gray-800">
                  <button 
                    type="button" 
                    onClick={() => setShowCreator(false)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg"
                  >
                    Salvar Álbum
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AMBIENT MUSIC PLAYER BAR (STATIC STICKY FLOATING FOOTER) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-gray-800 py-3.5 px-6 shadow-2xl z-40 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Playback Track details */}
        <div className="flex items-center space-x-3.5 w-full md:w-1/3">
          <div className="bg-indigo-950 border border-indigo-900 text-indigo-400 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden group">
            {isPlaying ? (
              <div className="flex items-center space-x-0.5 justify-center h-full w-full">
                <span className="w-1 bg-indigo-400 h-4 rounded animate-bounce [animation-delay:0.1s]"></span>
                <span className="w-1 bg-indigo-400 h-6 rounded animate-bounce [animation-delay:0.3s]"></span>
                <span className="w-1 bg-indigo-400 h-3 rounded animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 bg-indigo-400 h-5 rounded animate-bounce [animation-delay:0.4s]"></span>
              </div>
            ) : (
              <Music className="w-5 h-5 text-indigo-400 group-hover:scale-115 transition-transform" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">
              {activeTrack ? activeTrack.title : "Nenhuma faixa selecionada"}
            </h4>
            <p className="text-xxs text-gray-400 truncate">
              {activeTrack ? activeTrack.artist : "Abra um álbum e clique no play para ouvir ou simular"}
            </p>
          </div>
        </div>

        {/* Playback Controls & Progress bar */}
        <div className="flex flex-col items-center space-y-1.5 w-full md:w-1/3">
          <div className="flex items-center space-x-4">
            <button 
              disabled={!activeTrack}
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white hover:bg-gray-100 disabled:bg-gray-700 text-black p-2 rounded-full transition transform active:scale-95 shadow-md shadow-white/15 flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>
          </div>
          
          <div className="w-full flex items-center space-x-2.5 text-[10px] text-gray-500 font-mono">
            <span>{formatProgressSeconds(playerProgress)}</span>
            <div className="flex-1 bg-gray-800 h-1 rounded-full relative overflow-hidden cursor-pointer">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${playerProgress}%` }}
              ></div>
            </div>
            <span>3:45</span>
          </div>
        </div>

        {/* Volume controls and ambient options */}
        <div className="hidden md:flex items-center justify-end space-x-3 w-full md:w-1/3">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={playerVolume} 
            onChange={(e) => setPlayerVolume(Number(e.target.value))}
            className="w-20 bg-gray-800 h-1 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
          />
          <span className="text-xxs text-gray-500 font-mono w-6 text-right">{playerVolume}%</span>
        </div>

      </div>

    </div>
  );

  // Helper track renderer
  function renderTracksList() {
    if (!selectedAlbum) return null;
    return (
      <div className="bg-[#0d1117] rounded-2xl border border-gray-850 overflow-hidden divide-y divide-gray-800/60 max-h-[40vh] overflow-y-auto pr-1">
        {selectedAlbum.tracks && selectedAlbum.tracks.length > 0 ? (
          selectedAlbum.tracks.map((track, i) => {
            const isCurrent = activeTrack?.title === track && activeTrack?.albumId === selectedAlbum.id;
            return (
              <div key={i} className={`p-3.5 flex items-center justify-between group/row hover:bg-gray-800/15 transition-all text-xs ${isCurrent ? "bg-indigo-950/20 text-indigo-400" : "text-gray-300"}`}>
                
                {/* Track Play indicator and title */}
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <button 
                    onClick={() => handlePlayTrack(track, selectedAlbum)}
                    className="opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity bg-indigo-600/10 text-indigo-400 p-1 rounded-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <span className={`truncate font-medium ${isCurrent ? "font-bold text-indigo-400" : ""}`}>
                    {track}
                  </span>
                </div>

                <div className="flex items-center space-x-2.5">
                  {/* Playlist add dropdown trigger */}
                  <div className="relative">
                    <button 
                      onClick={() => setSelectedPlaylistForAdd(selectedPlaylistForAdd === track ? null : track)}
                      className="text-gray-500 hover:text-indigo-400 p-1.5 rounded transition"
                      title="Adicionar à Playlist"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>
                    
                    {/* Floating Dropdown inside Modal */}
                    {selectedPlaylistForAdd === track && (
                      <div className="absolute right-0 bottom-full mb-1 w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 p-2 text-xxs space-y-1 animate-fadeIn">
                        <div className="font-semibold text-gray-400 px-1.5 py-1 text-[10px] uppercase border-b border-gray-800">Minhas Playlists</div>
                        {playlists.length > 0 ? (
                          playlists.map((pl) => (
                            <button 
                              key={pl.id}
                              onClick={() => handleAddSongToPlaylist(pl.id, track, selectedAlbum)}
                              className="w-full text-left px-2 py-1.5 hover:bg-indigo-600 rounded-md transition text-gray-200 hover:text-white truncate flex items-center justify-between"
                            >
                              <span>{pl.name}</span>
                              <Plus className="w-3 h-3 text-gray-400" />
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-center text-gray-500 leading-normal">
                            Nenhuma playlist criada. Crie uma na aba correspondente!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-gray-500">
            Nenhuma faixa disponível para este álbum.
          </div>
        )}
      </div>
    );
  }

  // Helper seconds formatter for player
  function formatProgressSeconds(progress: number): string {
    const totalSeconds = Math.round((3 * 60 + 45) * (progress / 100));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

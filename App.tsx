import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, Player, GameScenario } from './types';
import { generateGameScenario, prefetchScenario } from './services/geminiService';
import { playSound, toggleBackgroundMusic, tryResumeAudioContext, startFireAmbience, stopFireAmbience } from './services/audioService';
import { getRandomAvatar, getFallbackAvatar, fetchRealCharacters } from './services/avatarService';
import { Button } from './components/Button';
import { TransitionWrapper } from './components/TransitionWrapper';
import { 
  Users, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  Settings2,
  Skull,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Fingerprint,
  Minus,
  Plus,
  Target,
  Zap,
  Crown,
  VenetianMask,
  ShieldCheck,
  Play,
  Scan,
  RefreshCcw,
  ChevronUp,
  Volume2,
  VolumeX,
  Dices,
  ArrowDown,
  Download,
  Share,
  MoreVertical,
  X,
  RefreshCw,
  Clapperboard,
  Star
} from 'lucide-react';

const STORAGE_KEY = 'impostor_players_v1';

const App: React.FC = () => {
  // Game State
  const [phase, setPhase] = useState<GamePhase>(GamePhase.HOME);
  
  // Initial players (will be overwritten by cache if exists)
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Jugador 1', isImposter: false, avatar: getRandomAvatar() },
    { id: '2', name: 'Jugador 2', isImposter: false, avatar: getRandomAvatar() },
    { id: '3', name: 'Jugador 3', isImposter: false, avatar: getRandomAvatar() },
    { id: '4', name: 'Jugador 4', isImposter: false, avatar: getRandomAvatar() },
  ]);
  
  const [imposterCount, setImposterCount] = useState(1);
  const [scenario, setScenario] = useState<GameScenario | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameTime, setGameTime] = useState(300); // 5 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  
  // Voting & Suspense State
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [selectedSuspect, setSelectedSuspect] = useState<Player | null>(null); // New state for vote confirmation
  const [isSuspensePhase, setIsSuspensePhase] = useState(false);

  // Music State
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);

  // Reveal Drag State
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const startYRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const currentDragRef = useRef(0);

  // Roulette State
  const [rouletteWinner, setRouletteWinner] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Install Modal State
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);
  const playersEndRef = useRef<HTMLDivElement>(null);
  const isLoadedFromCache = useRef(false);

  // --- Handlers ---

  // PERSISTENCE: Load from Cache on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setPlayers(parsed);
                isLoadedFromCache.current = true;
            }
        } catch (e) {
            console.error("Failed to load players from cache", e);
        }
    }
  }, []);

  // PERSISTENCE: Save to Cache on Change
  useEffect(() => {
      if (players.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
      }
  }, [players]);

  const handleToggleMusic = () => {
      const newState = !isMusicEnabled;
      setIsMusicEnabled(newState);
      if (newState) {
          tryResumeAudioContext(); // Ensure we are running
          if (phase === GamePhase.PLAYING) {
             startFireAmbience();
          } else {
             toggleBackgroundMusic(true);
          }
      } else {
          toggleBackgroundMusic(false);
          stopFireAmbience();
      }
      playSound('click');
  };

  // Image Error Handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = getFallbackAvatar(); 
  };

  // Load Real Avatars from API on Mount
  useEffect(() => {
    const loadAvatars = async () => {
        // Fetch API to populate cache for NEW players, but be careful not to overwrite existing ones if we loaded from cache
        const realImages = await fetchRealCharacters();
        
        // If we didn't load from cache (fresh start), populate initial players with real images
        if (!isLoadedFromCache.current && realImages.length > 0) {
            setPlayers(current => current.map((p, i) => ({
                ...p,
                avatar: realImages[i % realImages.length]
            })));
        }
    };
    loadAvatars();
  }, []);

  // Start music on mount/interaction
  useEffect(() => {
    if (isMusicEnabled) {
      // Logic for background audio based on phase
      if (phase === GamePhase.HOME) {
        toggleBackgroundMusic(true);
      } else if (phase === GamePhase.PLAYING) {
         // Moved the trigger to handleFinishRoulette to ensure User Interaction
         // Only toggling off background music here
         toggleBackgroundMusic(false);
      } else {
        // Default behavior for other phases (e.g. SETUP) - ensure music is on if it should be
        stopFireAmbience();
        tryResumeAudioContext();
      }
      
      const unlockAudio = () => {
        tryResumeAudioContext();
        if (phase === GamePhase.HOME) toggleBackgroundMusic(true);
      };

      const events = ['click', 'touchstart', 'touchend', 'mousemove', 'keydown', 'scroll', 'resize'];
      events.forEach(e => window.addEventListener(e, unlockAudio, { passive: true }));
      
      return () => {
         events.forEach(e => window.removeEventListener(e, unlockAudio));
      }
    } else {
        stopFireAmbience();
        toggleBackgroundMusic(false);
    }
  }, [phase, isMusicEnabled]);

  const handleStartSetup = () => {
    playSound('click');
    toggleBackgroundMusic(false); // Fade out music
    
    // START PREFETCHING SCENARIO HERE
    // While user configures players, AI generates content in background
    prefetchScenario();
    
    setPhase(GamePhase.SETUP);
  };

  const handleRefreshAvatars = () => {
      playSound('click');
      setPlayers(prev => prev.map(p => ({
          ...p,
          avatar: getRandomAvatar()
      })));
  };

  const handleAddPlayerQuick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Auto-generate name if empty
    const nextNum = players.length + 1;
    const nameToAdd = newPlayerName.trim() || `Jugador ${nextNum}`;
    
    // Get new avatar (will use cache if API loaded, or fallback if not)
    const newAvatar = getRandomAvatar();
    
    playSound('success');
    setPlayers(prev => [
      ...prev, 
      { id: Date.now().toString(), name: nameToAdd, isImposter: false, avatar: newAvatar }
    ]);
    setNewPlayerName('');
    setTimeout(() => playersEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleRemovePlayer = (id: string) => {
    playSound('click');
    if (players.length > 3) {
      setPlayers(prev => prev.filter(p => p.id !== id));
      // Adjust imposter count to ensure it's valid with fewer players
      setImposterCount(prev => {
        const newMax = Math.floor((players.length - 1) / 2);
        return Math.min(prev, newMax || 1);
      });
    }
  };

  const handleUpdateName = (id: string, name: string) => {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }

  const incrementImpostors = () => {
    const max = Math.max(1, Math.floor(players.length / 2));
    if (imposterCount < max) {
        playSound('click');
        setImposterCount(p => p + 1);
    } else {
        playSound('alert');
    }
  }

  const decrementImpostors = () => {
      if (imposterCount > 1) {
          playSound('click');
          setImposterCount(p => p - 1);
      }
  }

  const handleStartGame = async () => {
    playSound('start');
    
    const filledPlayers = players.map((p, i) => ({
        ...p,
        name: p.name.trim() || `Jugador ${i + 1}`
    }));

    if (filledPlayers.length < 3) {
      alert("Se requieren mínimo 3 jugadores.");
      return;
    }
    
    setPhase(GamePhase.LOADING);

    const newScenario = await generateGameScenario();
    setScenario(newScenario);

    // --- ALGORITMO FISHER-YATES PARA ASIGNACIÓN DE ROLES ---
    // 1. Crear el mazo de roles (True = Impostor, False = Civil)
    const roleDeck = Array(filledPlayers.length).fill(false);
    for (let i = 0; i < imposterCount; i++) {
        roleDeck[i] = true;
    }

    // 2. Barajar el mazo de roles de forma totalmente aleatoria
    for (let i = roleDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roleDeck[i], roleDeck[j]] = [roleDeck[j], roleDeck[i]];
    }

    // 3. Asignar los roles barajados a los jugadores
    // Mantenemos el orden de 'filledPlayers' para que la ronda de "pasar el móvil"
    // siga el orden visual de la lista, pero el rol es impredecible.
    const playersWithRoles = filledPlayers.map((p, i) => ({
        ...p,
        isImposter: roleDeck[i],
        isDead: false
    }));

    setPlayers(playersWithRoles);
    setCurrentPlayerIndex(0);
    setPhase(GamePhase.DISTRIBUTE);
  };

  // --- REVEAL MECHANIC: DRAG TO REVEAL ---
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent scrolling or other touch actions to ensure clean drag
    e.preventDefault(); 
    
    setIsDragging(true);
    startYRef.current = e.clientY;
    currentDragRef.current = dragOffset; // Capture current state
    
    // Pointer capture ensures we keep receiving events even if pointer leaves element bounds
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const containerHeight = cardRef.current?.clientHeight || 420;
    const deltaY = startYRef.current - e.clientY;
    
    // Logic: 
    // If NOT revealed: Dragging UP (positive deltaY) increases offset towards Open (height).
    // If REVEALED: Dragging DOWN (negative deltaY) decreases offset from Open (height).
    
    let newOffset = 0;
    
    if (isRevealed) {
        // Starting from Open (offset = height)
        // deltaY is negative when dragging down
        newOffset = containerHeight + deltaY;
    } else {
        // Starting from Closed (offset = 0)
        // deltaY is positive when dragging up
        newOffset = deltaY;
    }

    // Clamp values
    const clamped = Math.max(0, Math.min(newOffset, containerHeight));
    setDragOffset(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const containerHeight = cardRef.current?.clientHeight || 420;
    
    // Calculate how much we moved from the starting state
    // If started closed: moved = dragOffset
    // If started open: moved = height - dragOffset
    const movedAmount = isRevealed ? (containerHeight - dragOffset) : dragOffset;

    // Detection for "Click/Tap" vs "Drag"
    // If movement is very small (< 10px), treat as tap
    const isTap = movedAmount < 10 && Math.abs(startYRef.current - e.clientY) < 10;
    const threshold = containerHeight * 0.25; // 25% drag to trigger snap

    if (isTap) {
        // Toggle on tap
        const newState = !isRevealed;
        setIsRevealed(newState);
        setDragOffset(newState ? containerHeight : 0);
        // Play sound only on CLOSE, remove sound on OPEN
        if (!newState) playSound('click');
        // if (newState) playSound('reveal'); // REMOVED PER REQUEST
    } else {
        // Drag Snap Logic
        if (!isRevealed) {
            // Opening
            if (movedAmount > threshold) {
                setIsRevealed(true);
                setDragOffset(containerHeight);
                // playSound('reveal'); // REMOVED PER REQUEST
            } else {
                setDragOffset(0); // Snap back closed
            }
        } else {
            // Closing
            if (movedAmount > threshold) {
                setIsRevealed(false);
                setDragOffset(0);
                playSound('click');
            } else {
                setDragOffset(containerHeight); // Snap back open
            }
        }
    }
  };

  const handleNextPlayer = () => {
    playSound('click');
    setDragOffset(0);
    setIsDragging(false);
    setIsRevealed(false); // Reset reveal state for next player
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      // Transition to Roulette instead of Playing directly
      setPhase(GamePhase.ROULETTE);
      setRouletteWinner(null);
      setIsSpinning(false);
    }
  };

  const handleStartRoulette = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setRouletteWinner(null);
    
    // Physics Constants
    let angle = 0;
    let velocity = Math.random() * 50 + 80; // Velocidad significativamente aumentada (era 30+50)
    const friction = 0.98; // Fricción ajustada para balancear la duración (era 0.985)
    
    const segmentAngle = 360 / players.length;
    let lastSegment = -1;

    const loop = () => {
      if (!wheelRef.current) return;
      
      // Apply Physics
      velocity *= friction;
      angle += velocity;
      
      // Apply transform directly to DOM for 60fps performance
      wheelRef.current.style.transform = `rotate(${angle}deg)`;

      // Calculate current segment (Needle is at top/0 degrees)
      // Since wheel rotates clockwise, indices pass under needle counter-clockwise
      const normalizedAngle = (360 - (angle % 360)) % 360;
      const currentSegment = Math.floor(normalizedAngle / segmentAngle);

      // Sound & Haptic Trigger on segment change
      if (currentSegment !== lastSegment) {
         lastSegment = currentSegment;
         if (velocity > 0.5) { // Only tick if moving fast enough
            playSound('tick');
            if (navigator.vibrate) navigator.vibrate(5);
         }
      }

      if (velocity > 0.1) {
        requestAnimationFrame(loop);
      } else {
        // Stop
        const finalWinnerIndex = lastSegment;
        setRouletteWinner(players[finalWinnerIndex].name);
        setIsSpinning(false);
        playSound('success');
        if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
      }
    };

    requestAnimationFrame(loop);
  };

  // Auto-start roulette when entering the phase
  useEffect(() => {
    if (phase === GamePhase.ROULETTE && !isSpinning && !rouletteWinner) {
      const timer = setTimeout(() => {
        handleStartRoulette();
      }, 500); // 500ms delay to ensure UI transition is done
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleFinishRoulette = () => {
    playSound('start');
    
    // START AUDIO HERE - DIRECT USER INTERACTION
    if (isMusicEnabled) {
      startFireAmbience();
    }
    
    // PREFETCH NEXT GAME SCENARIO
    // Optimization: Generate next word while playing current round so re-play is instant
    prefetchScenario();

    setPhase(GamePhase.PLAYING);
    setTimerActive(true);
  };

  const handleReset = () => {
    playSound('click');
    setPhase(GamePhase.HOME);
    setScenario(null);
    setCurrentPlayerIndex(0);
    setTimerActive(false);
    setGameTime(300);
    setDragOffset(0);
    setIsSuspensePhase(false);
    setRouletteWinner(null);
    setIsSpinning(false);
    setSelectedSuspect(null);
    stopFireAmbience();
    // Restart music if enabled
    if (isMusicEnabled) {
        // Small delay to allow phase transition
        setTimeout(() => toggleBackgroundMusic(true), 100);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleStartVoting = () => {
    playSound('alert');
    setTimerActive(false);
    setSelectedSuspect(null); // Reset selection
    setPhase(GamePhase.VOTING);
  };

  const handleVotePlayer = (player: Player) => {
    setEliminatedPlayer(player);
    setIsSuspensePhase(true); 
    setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, isDead: true } : p));
    playSound('tension');
    setPhase(GamePhase.ROUND_RESULT);
    
    setTimeout(() => {
      setIsSuspensePhase(false);
      if (player.isImposter) {
        playSound('eliminate_imposter');
      } else {
        playSound('eliminate_civil');
      }
    }, 3000);
  };

  const handleContinueGame = () => {
    playSound('start');
    setTimerActive(true);
    setPhase(GamePhase.PLAYING);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    if (timerActive && gameTime > 0) {
      timerRef.current = window.setInterval(() => {
        setGameTime(t => t - 1);
      }, 1000);
    } else if (gameTime === 0) {
      setTimerActive(false);
      playSound('alert');
      setPhase(GamePhase.VOTING);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, gameTime]);

  // --- Render Sections ---

  const renderInstallModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowInstallHelp(false)}>
          <div className="bg-ai-surface border border-ai-accent/30 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-4 text-ai-dim hover:text-white" onClick={() => setShowInstallHelp(false)}>
                  <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5 text-ai-secondary" /> Instalar App
              </h3>
              
              <div className="space-y-4 text-sm text-ai-dim">
                  <div className="bg-white/5 p-4 rounded-xl">
                      <p className="font-bold text-white mb-1 flex items-center gap-2">
                           <span className="text-xl">🍎</span> iOS (iPhone/iPad)
                      </p>
                      <ol className="list-decimal list-inside space-y-1 ml-1">
                          <li>Toca el botón <Share className="w-4 h-4 inline mx-1" /> <strong>Compartir</strong> en Safari.</li>
                          <li>Busca y selecciona <span className="text-white font-bold">"Agregar a Inicio"</span>.</li>
                      </ol>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-xl">
                      <p className="font-bold text-white mb-1 flex items-center gap-2">
                          <span className="text-xl">🤖</span> Android
                      </p>
                      <ol className="list-decimal list-inside space-y-1 ml-1">
                          <li>Toca el menú <MoreVertical className="w-4 h-4 inline mx-1" /> del navegador.</li>
                          <li>Selecciona <span className="text-white font-bold">"Instalar aplicación"</span> o "Agregar a la pantalla principal".</li>
                      </ol>
                  </div>
              </div>

              <div className="mt-6 text-center">
                  <Button fullWidth onClick={() => setShowInstallHelp(false)}>Entendido</Button>
              </div>
          </div>
      </div>
  );

  const renderHome = () => (
    <TransitionWrapper className="justify-center items-center text-center p-6 pt-12 pb-8">
      
      {/* Music Toggle */}
      <div className="absolute top-6 right-6 z-30">
          <button 
             onClick={(e) => { e.stopPropagation(); handleToggleMusic(); }}
             className={`p-3 rounded-full backdrop-blur-md border transition-all shadow-lg ${isMusicEnabled ? 'bg-ai-accent/20 border-ai-accent text-ai-accent' : 'bg-white/10 border-white/10 text-white/50'}`}
          >
             {isMusicEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
      </div>

      {/* MAIN TITLE BLOCK */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative">
        
        {/* Cinematic Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-ai-accent/20 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 animate-slide-up">
            <h1 className="font-sans font-black text-6xl sm:text-7xl text-white mb-0 tracking-tighter leading-[0.85] drop-shadow-2xl">
              EL<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-ai-accent to-purple-600 filter drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                IMPOSTOR
              </span>
            </h1>
            
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent my-4"></div>
            
            <p className="font-sans text-ai-secondary text-sm font-bold tracking-[0.2em] uppercase mb-8 text-shadow-glow">
              En un mundo de mentiras,<br/>confía en nadie.
            </p>

            <Button onClick={handleStartSetup} size="lg" fullWidth className="group relative z-10 text-lg py-5 shadow-neon border border-white/20">
              <Play className="w-5 h-5 fill-current mr-2" /> COMENZAR
            </Button>
            
            <div className="mt-4 flex justify-center">
                 <button 
                    onClick={() => { playSound('click'); setShowInstallHelp(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-ai-dim hover:bg-white/10 hover:text-white transition-all"
                 >
                     <Download className="w-3 h-3" /> Instalar App
                 </button>
            </div>
        </div>
      </div>
      
      {/* LATIN PHRASE FOOTER */}
      <div className="w-full max-w-sm animate-fade-in opacity-50 mt-auto">
         <div className="flex flex-col items-center gap-2">
            <VenetianMask className="w-4 h-4 text-ai-dim" />
            <p className="text-[10px] font-serif italic text-ai-dim tracking-[0.3em] uppercase">
               "Mundus vult decipi"
            </p>
         </div>
      </div>

      {showInstallHelp && renderInstallModal()}
    </TransitionWrapper>
  );

  const renderSetup = () => {
    const loyalCount = players.length - imposterCount;

    return (
    <TransitionWrapper className="p-0">
      <div className="sticky top-0 z-30 bg-ai-base/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
         <h2 className="font-sans font-bold text-xl text-white flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-ai-accent" /> AJUSTES
         </h2>
         <Button variant="icon" onClick={() => setPhase(GamePhase.HOME)}>
            <RotateCcw className="w-5 h-5" />
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-36">
        
        {/* THREAT LEVEL */}
        <section className="space-y-4">
            <div className="flex items-center gap-2 text-ai-accent uppercase text-xs font-bold tracking-widest mb-1 ml-1">
                <AlertTriangle className="w-4 h-4" /> Nivel de Amenaza
            </div>
            
            <div className="ai-card p-6 rounded-[2rem] bg-gradient-to-br from-ai-surface via-purple-950/50 to-ai-base border-ai-accent/30 shadow-neon relative overflow-hidden group">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-ai-accent/20 via-transparent to-transparent group-hover:opacity-30 transition-opacity duration-500"></div>

                <div className="flex items-center justify-between gap-4 relative z-10">
                    <button 
                        onClick={decrementImpostors} 
                        disabled={imposterCount <= 1}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-ai-base/60 border-2 border-white/5 flex items-center justify-center text-white transition-all duration-300 hover:bg-cyan-500 hover:border-cyan-400 hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-90 disabled:opacity-20 disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:bg-ai-base/60 disabled:hover:border-white/5 disabled:cursor-not-allowed group/btn-min"
                    >
                        <Minus className="w-8 h-8 stroke-[3] text-cyan-400 group-hover/btn-min:text-white transition-colors" />
                    </button>

                    <div className="flex-1 flex flex-col items-center justify-center py-2 relative">
                         <div className="absolute inset-0 bg-ai-accent/20 blur-3xl rounded-full scale-50"></div>
                        <span className="relative text-7xl sm:text-8xl font-black text-white leading-none tracking-tighter filter drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                            {imposterCount}
                        </span>
                        <span className="relative text-[10px] font-bold uppercase text-ai-accent tracking-[0.3em] mt-2 py-1 px-3 bg-ai-accent/10 rounded-full border border-ai-accent/20">
                            Impostores
                        </span>
                    </div>

                    <button 
                        onClick={incrementImpostors} 
                        disabled={imposterCount >= Math.floor(players.length / 2)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-ai-base/60 border-2 border-white/5 flex items-center justify-center text-white transition-all duration-300 hover:bg-rose-500 hover:border-rose-400 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.6)] hover:scale-105 active:scale-90 disabled:opacity-20 disabled:hover:scale-100 disabled:hover:shadow-none disabled:hover:bg-ai-base/60 disabled:hover:border-white/5 disabled:cursor-not-allowed group/btn-plus"
                    >
                        <Plus className="w-8 h-8 stroke-[3] text-rose-400 group-hover/btn-plus:text-white transition-colors" />
                    </button>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-12 relative z-10">
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 text-ai-dim">
                             <Users className="w-4 h-4 text-ai-secondary" />
                             <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Total</span>
                        </div>
                        <span className="text-2xl font-black text-white tabular-nums">{players.length}</span>
                    </div>
                    
                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                    <div className="flex flex-col items-center gap-1">
                         <div className="flex items-center gap-2 text-ai-dim">
                             <ShieldCheck className="w-4 h-4 text-ai-secondary" />
                             <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Civiles</span>
                         </div>
                         <span className="text-2xl font-black text-white tabular-nums">{loyalCount}</span>
                    </div>
                </div>
            </div>
        </section>

        {/* PLAYERS LIST */}
        <section className="space-y-4">
           <div className="flex items-center justify-between ml-1">
              <div className="flex items-center gap-2 text-ai-secondary uppercase text-xs font-bold tracking-widest">
                 <Users className="w-4 h-4" /> Lista de Agentes
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefreshAvatars}
                  className="p-1.5 rounded-lg bg-ai-surface border border-white/5 text-ai-dim hover:text-white hover:border-ai-accent transition-all active:rotate-180"
                  title="Cambiar imágenes"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold bg-ai-surface px-2 py-1 rounded-lg text-ai-dim border border-white/5">{players.length} Jugadores</span>
              </div>
           </div>

           <div className="space-y-3">
              {players.map((player, idx) => (
                 <div key={player.id} className="ai-input flex items-center p-3 pl-4 rounded-2xl animate-slide-up focus-within:bg-ai-surface focus-within:ring-1 ring-ai-accent group transition-all" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 mr-3 shrink-0 group-hover:border-ai-secondary transition-all shadow-lg bg-black/20">
                       <img 
                          src={player.avatar} 
                          alt="avatar" 
                          className="w-full h-full object-cover" 
                          onError={handleImageError}
                        />
                    </div>
                    <input 
                      className="bg-transparent border-none text-white font-bold text-lg focus:outline-none w-full placeholder:text-ai-dim/40"
                      value={player.name}
                      placeholder={`Agente ${idx + 1}...`}
                      onChange={(e) => handleUpdateName(player.id, e.target.value)}
                    />
                    {players.length > 3 && (
                       <button onClick={() => handleRemovePlayer(player.id)} className="text-ai-dim hover:text-ai-danger p-2 transition-colors hover:bg-ai-danger/10 rounded-xl">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    )}
                 </div>
              ))}
              <div ref={playersEndRef} />
              
              <form onSubmit={handleAddPlayerQuick} className="flex gap-2 pt-2">
                 <input 
                    type="text" 
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Añadir nombre..."
                    className="flex-1 bg-ai-surface/50 border border-ai-dim/20 rounded-2xl px-5 text-white focus:outline-none focus:border-ai-accent placeholder:text-ai-dim/30 font-medium"
                 />
                 <Button type="submit" variant="icon" className="bg-ai-secondary text-ai-base hover:bg-white w-14 rounded-2xl shadow-neon-blue">
                     <Plus className="w-6 h-6" />
                 </Button>
              </form>
           </div>
        </section>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ai-base via-ai-base/95 to-transparent z-20 pointer-events-none">
         <div className="pointer-events-auto">
             <Button 
                size="lg" 
                fullWidth 
                onClick={handleStartGame}
                disabled={players.length < 3}
                className="shadow-2xl shadow-ai-accent/30 py-5 text-lg"
             >
                COMENZAR MISIÓN
             </Button>
         </div>
      </div>
    </TransitionWrapper>
  );
  }

  const renderLoading = () => (
    <TransitionWrapper className="justify-center items-center text-center">
      <div className="relative mb-8">
         <div className="w-40 h-40 rounded-full border-4 border-ai-surface flex items-center justify-center relative bg-ai-surface/30">
            <div className="absolute inset-0 border-t-4 border-ai-accent rounded-full animate-spin"></div>
            <Zap className="w-16 h-16 text-ai-accent animate-pulse" />
         </div>
      </div>
      <h3 className="text-3xl font-black text-white mb-2 animate-pulse tracking-tight">GENERANDO CON IA</h3>
      <p className="text-ai-dim font-bold text-sm tracking-widest uppercase">Creando realidad...</p>
    </TransitionWrapper>
  );

  const renderDistribute = () => {
    const currentPlayer = players[currentPlayerIndex];

    return (
      <TransitionWrapper className="justify-center items-center p-6 text-center select-none touch-none">
        <div className="absolute top-6 left-0 w-full px-6 flex justify-between items-center text-[10px] font-bold text-ai-dim uppercase tracking-[0.2em]">
           <span>Agente {currentPlayerIndex + 1}/{players.length}</span>
           <span>Confidencial</span>
        </div>

        {/* CARD CONTAINER */}
        <div 
          ref={cardRef}
          className="relative w-full max-w-sm aspect-[3/4.5] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-black"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }} // Critical for dragging
        >
          
           {/* --- LAYER 1: SECRET INFO (BOTTOM) --- */}
           {/* This stays static or creates a parallax effect */}
           <div className="absolute inset-0 w-full h-full flex flex-col pointer-events-none">
              {currentPlayer.isImposter ? (
                <div className="h-full flex flex-col relative bg-ai-danger/10 z-0 animate-fade-in">
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                        <div className="w-24 h-24 bg-ai-danger/20 rounded-full flex items-center justify-center mb-6 animate-pop">
                            <VenetianMask className="w-12 h-12 text-ai-danger" />
                        </div>
                        <h3 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Impostor</h3>
                        <div className="w-16 h-1 bg-ai-danger/50 my-6 rounded-full"></div>
                        <p className="text-ai-dim text-xs uppercase font-bold mb-2">Tu Pista Secreta</p>
                        <p className="text-4xl text-ai-danger font-black drop-shadow-md">{scenario?.hint}</p>
                    </div>
                    {/* Warning Stripe */}
                    <div className="h-4 w-full bg-ai-danger repeating-linear-gradient-stripe"></div>
                </div>
              ) : (
                <div className="h-full flex flex-col relative bg-ai-secondary/10 z-0 animate-fade-in">
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
                        <div className="w-24 h-24 bg-ai-secondary/20 rounded-full flex items-center justify-center mb-6 animate-pop">
                            <ShieldCheck className="w-12 h-12 text-ai-secondary" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Civil</h3>
                        <div className="w-16 h-1 bg-ai-secondary/50 my-6 rounded-full"></div>
                        <p className="text-ai-dim text-xs uppercase font-bold mb-2">Palabra Clave</p>
                        <p className="text-4xl text-ai-secondary font-black drop-shadow-md">{scenario?.location}</p>
                    </div>
                </div>
              )}
           </div>

           {/* --- LAYER 2: COVER / CURTAIN (TOP) --- */}
           {/* This is what moves up */}
           <div 
             className="absolute inset-0 w-full h-full z-20 flex flex-col items-center justify-between p-8 bg-gradient-to-br from-ai-surface via-ai-base to-black border-b-4 border-ai-accent/50 shadow-2xl cursor-grab active:cursor-grabbing"
             style={{ 
                 transform: `translateY(-${dragOffset}px)`,
                 transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                 willChange: 'transform'
             }}
           >
              {/* Decorative Header */}
              <div className="w-full flex justify-between items-start opacity-50">
                   <Scan className="w-8 h-8 text-ai-accent" />
                   <div className="flex flex-col items-end">
                       <span className="text-[10px] uppercase font-mono text-ai-dim">Security Level</span>
                       <div className="flex gap-1 mt-1">
                           <div className="w-1 h-3 bg-ai-accent"></div>
                           <div className="w-1 h-3 bg-ai-accent"></div>
                           <div className="w-1 h-3 bg-ai-accent"></div>
                           <div className="w-1 h-3 bg-ai-dim/20"></div>
                       </div>
                   </div>
              </div>

              {/* Main Content on Cover */}
              <div className="flex flex-col items-center gap-4 flex-1 justify-center pointer-events-none">
                   <div className="w-52 h-52 rounded-full border-4 border-ai-dim/20 flex items-center justify-center relative bg-black overflow-hidden shadow-[0_0_30px_rgba(217,70,239,0.2)]">
                        <img 
                          src={currentPlayer.avatar} 
                          alt="avatar" 
                          className="w-full h-full object-cover object-top" 
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 border-t-2 border-ai-accent/50 rounded-full animate-spin duration-[3s]"></div>
                   </div>
                   <div className="text-center">
                        <h2 className="text-4xl font-black text-white tracking-tight mb-2">{currentPlayer.name}</h2>
                        <span className="px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase font-bold text-ai-dim tracking-widest bg-white/5">
                            Classified Access
                        </span>
                   </div>
              </div>

              {/* Drag Handle Area */}
              <div className="flex flex-col items-center gap-2 w-full animate-pulse">
                  <div className="flex flex-col items-center gap-1">
                      <ChevronUp className="w-6 h-6 text-ai-accent" />
                      <ChevronUp className="w-6 h-6 text-ai-accent/50 -mt-4" />
                  </div>
                  <p className="text-xs font-bold text-ai-accent uppercase tracking-[0.2em]">
                      {isRevealed ? "Toca para cerrar" : "Desliza o toca"}
                  </p>
                  
                  {/* Visual Handle Bar */}
                  <div className="w-16 h-1.5 bg-ai-accent/30 rounded-full mt-2"></div>
              </div>

              {/* Texture/Pattern Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px] pointer-events-none"></div>
           </div>

           {/* --- LAYER 3: SHADOW/DEPTH --- */}
           {/* Visual cue of the 'hole' when card lifts */}
           <div 
             className="absolute bottom-0 left-0 w-full h-8 bg-black z-10 pointer-events-none"
             style={{ 
                 opacity: dragOffset > 20 ? (dragOffset / 200) : 0,
                 boxShadow: 'inset 0 -10px 20px rgba(0,0,0,0.8)'
             }}
           ></div>

        </div>

        {/* Navigation Button */}
        <div className="w-full mt-8">
            <Button 
                fullWidth 
                size="lg"
                onClick={handleNextPlayer}
                className="shadow-neon py-5"
            >
                {currentPlayerIndex < players.length - 1 ? 'Siguiente Agente' : 'Comenzar Juego'} <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
        </div>
      </TransitionWrapper>
    );
  };

  const renderRoulette = () => {
    // Generate SVG Paths for the wheel
    const segmentAngle = 360 / players.length;
    const radius = 50; // SVG coordinate system 0-100
    const center = 50;

    const getSectorPath = (index: number) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        
        // Convert to radians (subtract 90 deg to align 0 with top/12 o'clock)
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        // SVG Path Command
        // M center center L x1 y1 A radius radius 0 largeArc sweep x2 y2 Z
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        
        return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    return (
        <TransitionWrapper className="justify-center items-center text-center p-6">
            <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">
                {rouletteWinner ? "Comienza:" : "¿Quién Inicia?"}
            </h2>

            <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-10">
                {/* Pointer (Needle) */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-8 h-10 filter drop-shadow-lg">
                     <ArrowDown className="w-full h-full text-white fill-white stroke-ai-base" strokeWidth={3} />
                </div>

                {/* Outer Glow Ring */}
                <div className="absolute -inset-4 rounded-full border-4 border-ai-surface bg-ai-base/50 shadow-[0_0_40px_rgba(217,70,239,0.3)]"></div>

                {/* The Wheel */}
                <div 
                    ref={wheelRef}
                    className="w-full h-full rounded-full relative shadow-2xl overflow-hidden border-8 border-ai-surface"
                    style={{ transform: 'rotate(0deg)' }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                            {players.map((p, i) => (
                                <clipPath id={`clip-${i}`} key={i}>
                                    <path d={getSectorPath(i)} />
                                </clipPath>
                            ))}
                        </defs>
                        {players.map((p, i) => (
                            <g key={p.id}>
                                {/* Image masked by the sector */}
                                <image 
                                    href={p.avatar} 
                                    x="0" y="0" width="100" height="100" 
                                    preserveAspectRatio="xMidYMid slice"
                                    clipPath={`url(#clip-${i})`}
                                />
                                {/* Overlay to fade the image for text readability */}
                                <path 
                                    d={getSectorPath(i)} 
                                    fill="black" 
                                    fillOpacity="0.6"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="0.5"
                                />
                            </g>
                        ))}
                    </svg>

                    {/* Names (HTML Overlay) */}
                    {players.map((p, i) => {
                        // Calculate position for text: center of segment
                        const angle = (i * segmentAngle) + (segmentAngle / 2);
                        return (
                            <div 
                                key={p.id}
                                className="absolute top-0 left-1/2 -ml-[1px] h-1/2 w-[2px] origin-bottom flex justify-start pt-4 pointer-events-none"
                                style={{ transform: `rotate(${angle}deg)` }}
                            >
                                <span 
                                    className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider drop-shadow-md whitespace-nowrap -ml-[50%] px-1"
                                    style={{ 
                                        transform: 'rotate(-90deg) translate(20px, 0px)',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                    }} 
                                >
                                    {p.name.length > 8 ? p.name.substring(0,8)+'..' : p.name}
                                </span>
                            </div>
                        )
                    })}
                    
                    {/* Center Hub */}
                    <div className="absolute inset-0 m-auto w-16 h-16 bg-ai-base rounded-full border-4 border-white/20 shadow-lg z-10 flex items-center justify-center">
                        <Dices className="w-8 h-8 text-ai-accent" />
                    </div>
                </div>
            </div>

            <div className="h-20 flex items-center justify-center w-full">
                {rouletteWinner ? (
                     <div className="animate-pop bg-white text-ai-base px-6 py-3 rounded-2xl font-black text-2xl shadow-neon transform rotate-[-2deg]">
                        {rouletteWinner}
                     </div>
                ) : (
                    <div className="text-ai-accent font-bold text-xl animate-pulse tracking-widest uppercase">
                        GIRANDO...
                    </div>
                )}
            </div>
            
            {rouletteWinner && (
                 <div className="mt-8 w-full animate-fade-in">
                    <Button onClick={handleFinishRoulette} variant="secondary" fullWidth>
                        Comenzar Cronómetro <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                 </div>
            )}

        </TransitionWrapper>
    );
  };

  const renderPlaying = () => {
    // Count alive impostors
    const aliveImpostors = players.filter(p => p.isImposter && !p.isDead).length;
    
    return (
    <TransitionWrapper className="p-6">
      <div className="flex justify-between items-center mb-8 pt-4">
        <div className="px-4 py-2 rounded-full bg-ai-danger/20 border border-ai-danger/30 flex items-center gap-2 shadow-neon-red">
           <div className="w-2 h-2 bg-ai-danger rounded-full animate-pulse"></div>
           <span className="text-[10px] font-bold text-ai-danger uppercase tracking-wide">Amenaza Activa</span>
        </div>
        <Button 
            variant="icon" 
            onClick={(e) => { e.stopPropagation(); handleToggleMusic(); }}
            className={`transition-all ${isMusicEnabled ? 'border-ai-accent text-ai-accent bg-ai-accent/10 shadow-neon' : 'text-ai-dim border-white/10'}`}
        >
             {isMusicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        {/* CAMPFIRE */}
        <div className="mb-20 relative animate-fade-in scale-125">
             <div className="fire-wrapper">
                <div className="fire-log left"></div>
                <div className="fire-log right"></div>
                <div className="fire-flame main"></div>
                <div className="fire-flame middle"></div>
                <div className="fire-flame inner"></div>
                <div className="fire-particle"></div>
                <div className="fire-particle"></div>
                <div className="fire-particle"></div>
                <div className="fire-particle"></div>
             </div>
             {/* Glow */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        </div>
        
        {/* TIMER */}
        <div className="relative mb-8 text-center">
            <span className="text-ai-dim font-bold uppercase tracking-[0.3em] text-xs block mb-4">Tiempo Restante</span>
            <div className={`text-8xl font-sans font-black tracking-tighter tabular-nums ${gameTime < 60 ? 'text-ai-danger animate-pulse' : 'text-white'}`}>
                {formatTime(gameTime)}
            </div>
        </div>

      </div>

      <div className="mb-6">
        <Button 
          size="lg" 
          fullWidth 
          variant="danger" 
          onClick={handleStartVoting}
          className="py-5 text-lg shadow-neon-red"
        >
          <AlertTriangle className="w-6 h-6 mr-2" /> VOTAR SOSPECHOSO
        </Button>
      </div>
    </TransitionWrapper>
  )};

  const renderVoting = () => {
    // Only show ALIVE players
    const alivePlayers = players.filter(p => !p.isDead);

    return (
    <TransitionWrapper className="p-6 pt-10">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-white mb-2">¿QUIÉN ES?</h2>
        <p className="text-ai-dim font-medium">Selecciona al sospechoso para eliminarlo</p>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 overflow-y-auto max-h-[55vh] pb-8 px-1">
        {alivePlayers.map(p => {
          const isSelected = selectedSuspect?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                 if (isSelected) {
                     setSelectedSuspect(null);
                     playSound('click');
                 } else {
                     setSelectedSuspect(p);
                     playSound('click');
                 }
              }}
              className={`relative ai-card p-4 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all group active:scale-[0.95] aspect-square shadow-lg overflow-hidden border-2 ${isSelected ? 'border-ai-danger bg-ai-danger/10 scale-105 shadow-neon-red' : 'border-transparent hover:bg-ai-surface hover:border-ai-dim/20'}`}
            >
              <div className="w-full h-full absolute inset-0 opacity-40 transition-opacity bg-gradient-to-t from-ai-base to-transparent z-10 pointer-events-none"></div>
              
              <div className={`w-full flex-1 rounded-2xl overflow-hidden border-2 transition-colors shadow-inner relative z-0 ${isSelected ? 'border-ai-danger' : 'border-white/5'}`}>
                <img 
                    src={p.avatar} 
                    alt={p.name} 
                    className="w-full h-full object-cover object-top transition-transform duration-500" 
                    onError={handleImageError}
                  />
              </div>

              <span className={`font-bold text-sm sm:text-base transition-colors text-center leading-tight break-words w-full relative z-20 drop-shadow-md pb-1 ${isSelected ? 'text-ai-danger' : 'text-white'}`}>
                {p.name}
              </span>
              
              {isSelected && (
                <div className="absolute top-3 right-3 z-20 animate-pop">
                  <Skull className="w-6 h-6 text-ai-danger drop-shadow-md" fill="currentColor" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ai-base via-ai-base/95 to-transparent z-20">
          <Button 
            fullWidth 
            size="lg" 
            variant="danger"
            disabled={!selectedSuspect}
            onClick={() => selectedSuspect && handleVotePlayer(selectedSuspect)}
            className="shadow-neon-red py-5"
          >
             CONFIRMAR ELIMINACIÓN <Skull className="w-5 h-5 ml-2" />
          </Button>
      </div>
    </TransitionWrapper>
  )};

  const renderRoundResult = () => {
    if (!eliminatedPlayer) return null;

    if (isSuspensePhase) {
      return (
        <TransitionWrapper className="justify-center items-center text-center p-6 bg-black z-50">
           <div className="relative">
              <div className="w-72 h-72 rounded-full border-2 border-ai-danger/30 animate-ping"></div>
              <div className="w-56 h-56 rounded-full border-2 border-ai-danger/50 animate-ping delay-75 absolute top-8 left-8"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-center">
                    <Fingerprint className="w-24 h-24 text-ai-danger mb-6 mx-auto animate-pulse" />
                    <h3 className="text-2xl font-mono font-bold text-white animate-pulse tracking-widest">VERIFICANDO...</h3>
                 </div>
              </div>
           </div>
        </TransitionWrapper>
      )
    }

    const isImposter = eliminatedPlayer.isImposter;
    
    // Calculate remaining game state
    const remainingPlayers = players.filter(p => !p.isDead);
    const remainingImpostors = remainingPlayers.filter(p => p.isImposter).length;
    const remainingLoyal = remainingPlayers.length - remainingImpostors;

    // Victory Conditions
    const allImpostorsCaught = remainingImpostors === 0;
    const impostorsWin = remainingImpostors >= remainingLoyal && remainingImpostors > 0;
    const isGameOver = allImpostorsCaught || impostorsWin;

    return (
      <TransitionWrapper className="justify-center items-center text-center p-6">
        <div className="mb-8 flex flex-col items-center w-full max-w-sm">
          
          <div className="relative mb-6">
            <div className={`w-48 h-48 rounded-full flex items-center justify-center relative shadow-2xl border-[6px] animate-pop overflow-hidden ${isImposter ? 'bg-ai-surface border-ai-accent shadow-neon' : 'bg-ai-surface border-ai-danger shadow-neon-red'}`}>
               <img 
                  src={eliminatedPlayer.avatar} 
                  alt="result" 
                  className="w-full h-full object-cover" 
                  onError={handleImageError}
               />
               <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  {isImposter ? <CheckCircle2 className="w-24 h-24 text-ai-accent drop-shadow-lg" /> : <XCircle className="w-24 h-24 text-ai-danger drop-shadow-lg" />}
               </div>
            </div>
          </div>

          <h2 className="text-5xl font-black text-white mb-4 leading-none">{eliminatedPlayer.name}</h2>
          
          <div className={`text-xl font-black uppercase tracking-[0.2em] mb-8 py-2 px-6 rounded-full border ${isImposter ? 'text-ai-accent border-ai-accent/30 bg-ai-accent/10' : 'text-ai-danger border-ai-danger/30 bg-ai-danger/10'}`}>
            {isImposter ? 'Era Impostor' : 'Era Civil'}
          </div>

          {!isGameOver && (
             <div className="ai-card w-full p-4 rounded-2xl flex items-center justify-center gap-3 border border-ai-danger/30 bg-ai-danger/5">
                 <AlertTriangle className="w-5 h-5 text-ai-danger" />
                 <span className="text-white font-bold uppercase tracking-wide">
                     {remainingImpostors === 1 ? 'Queda 1 Impostor' : `Quedan ${remainingImpostors} Impostores`}
                 </span>
             </div>
          )}

          {isGameOver && allImpostorsCaught && (
              <div className="mt-4">
                  <h3 className="text-3xl font-black text-ai-secondary animate-pulse uppercase">¡Misión Cumplida!</h3>
              </div>
          )}

           {isGameOver && impostorsWin && (
              <div className="mt-4">
                  <h3 className="text-3xl font-black text-ai-danger animate-pulse uppercase">¡Misión Fallida!</h3>
                  <p className="text-sm text-ai-dim mt-2">Los impostores han tomado el control</p>
              </div>
          )}
        </div>

        <div className="w-full space-y-4">
          {!isGameOver ? (
            <Button fullWidth size="lg" onClick={handleContinueGame} className="py-5 shadow-neon">
                Continuar Misión <RefreshCcw className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button fullWidth size="lg" onClick={() => setPhase(GamePhase.GAME_OVER)} variant="secondary" className="py-5">
                Ver Informe Final
            </Button>
          )}
        </div>
      </TransitionWrapper>
    );
  }

  const renderGameOver = () => (
    <TransitionWrapper className="justify-center items-center p-6 pt-12 text-center">
      <Crown className="w-16 h-16 text-yellow-400 mb-6 drop-shadow-lg" />
      <h2 className="text-4xl font-black text-white mb-10 tracking-tight">INFORME FINAL</h2>

      <div className="w-full flex-1 overflow-y-auto space-y-3 pr-2 mb-8">
        {players.map((p, i) => (
          <div 
            key={p.id} 
            className={`flex items-center justify-between p-4 rounded-2xl animate-slide-up ${
              p.isImposter 
                ? 'bg-ai-danger/10 border border-ai-danger/30 shadow-neon-red' 
                : p.isDead ? 'bg-black/40 border border-white/5 opacity-60' : 'bg-ai-surface border border-white/5'
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black/30">
                  <img 
                    src={p.avatar} 
                    alt="avatar" 
                    className="w-full h-full object-cover" 
                    onError={handleImageError}
                  />
               </div>
               <div className="flex flex-col items-start">
                   <span className={`font-bold text-lg ${p.isDead ? 'text-ai-dim line-through decoration-ai-danger/50' : 'text-white'}`}>{p.name}</span>
               </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                {p.isImposter ? (
                <span className="text-white text-[10px] font-bold uppercase bg-ai-danger px-3 py-1 rounded-full">Impostor</span>
                ) : (
                <span className="text-ai-dim text-[10px] font-bold uppercase tracking-wider">Civil</span>
                )}
                {p.isDead && <span className="text-[10px] text-ai-danger font-bold uppercase">Eliminado</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="ai-card w-full p-6 rounded-3xl text-left border-l-4 border-ai-secondary relative overflow-hidden mb-4">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-24 h-24 text-white" />
             </div>
             <span className="text-xs text-ai-secondary font-bold uppercase block mb-2 tracking-wider">Palabra Secreta</span>
             <span className="text-4xl text-white font-black">{scenario?.location}</span>
      </div>

      <Button fullWidth size="lg" onClick={handleReset} className="shadow-neon">
         Volver al Menú
      </Button>
    </TransitionWrapper>
  );

  return (
    <div className="min-h-screen font-sans selection:bg-ai-accent/30 selection:text-white pb-safe">
      {phase === GamePhase.HOME && renderHome()}
      {phase === GamePhase.SETUP && renderSetup()}
      {phase === GamePhase.LOADING && renderLoading()}
      {phase === GamePhase.DISTRIBUTE && renderDistribute()}
      {phase === GamePhase.ROULETTE && renderRoulette()}
      {phase === GamePhase.PLAYING && renderPlaying()}
      {phase === GamePhase.VOTING && renderVoting()}
      {phase === GamePhase.ROUND_RESULT && renderRoundResult()}
      {phase === GamePhase.GAME_OVER && renderGameOver()}
    </div>
  );
};

export default App;
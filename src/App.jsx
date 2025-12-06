import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap, Shield, Goal, XCircle, RefreshCw, BarChart3, Users, Home, Cpu, KeyRound, PlayCircle, AlertTriangle, ChevronLeft, ChevronRight, Trophy, Calendar, Shirt, Armchair, User, LogIn, Lock, Mail } from 'lucide-react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'; 

// --- DEBUGGING LOGS ---
console.log("App.jsx wird geladen...");

// --- API KONFIGURATION ---
// Erkennt automatisch, ob wir "live" auf dem Webspace sind
const IS_PRODUCTION = import.meta.env.PROD; 

// --- TANSTACK QUERY CLIENT ---
let queryClient;
try {
    queryClient = new QueryClient();
} catch (e) {
    console.error("Fehler beim Erstellen des QueryClients:", e);
}

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary hat einen Fehler gefangen:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center font-mono">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold mb-4 text-red-400">Kritischer Fehler</h1>
                <div className="bg-gray-800 p-4 rounded border border-red-900 w-full max-w-2xl text-left overflow-auto">
                    <p className="text-red-300 font-bold mb-2">Message:</p>
                    <pre className="text-sm mb-4 whitespace-pre-wrap">{this.state.error?.message || "Unbekannter Fehler"}</pre>
                    <button className="mt-6 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-sans w-full" onClick={() => window.location.reload()}>Seite neu laden</button>
                </div>
            </div>
        );
    }
    return this.props.children; 
  }
}

// --- HILFSFUNKTIONEN ---
const getPlayerImageUrl = (playerId) => {
    return `https://kickbase.b-cdn.net/pool/playersbig/${playerId}.png`;
};

// --- MOCK DATEN ---
const MOCK_MATCHDAYS = [
    { id: 6, name: "6. Spieltag", status: "live", date: "Aktuell", totalPoints: 1475 },
    { id: 5, name: "5. Spieltag", status: "finished", date: "23. Sep - 25. Sep", totalPoints: 980 },
    { id: 4, name: "4. Spieltag", status: "finished", date: "16. Sep - 18. Sep", totalPoints: 1450 },
    { id: 3, name: "3. Spieltag", status: "finished", date: "09. Sep - 11. Sep", totalPoints: 890 },
];

const MOCK_PLAYER_DATA = {
    playerName: "Jamal Musiala (Demo)",
    teamName: "FC Bayern München",
    totalPoints: 125,
    events: [
        { id: 10, time: 88, action: "Tor (Elfmeter)", points: 120, type: "Goal" },
        { id: 9, time: 75, action: "Großchance kreiert", points: 15, type: "Positive" },
        { id: 8, time: 60, action: "Pass vorderes Drittel", points: 2, type: "Positive" },
        { id: 7, time: 45, action: "Ballverlust", points: -1, type: "Negative" },
    ]
};

const MOCK_MANAGERS = [
    { id: 1, name: "Mein Team", points: 1475, place: 1 },
    { id: 2, name: "Max Mustermann", points: 1280, place: 2 },
    { id: 3, name: "Liga-Rival", points: 950, place: 3 },
];

const MOCK_SQUAD = [
    // STARTELF (inLineup: true)
    { id: '2576', name: "Jamal Musiala", team: "FCB", points: 125, status: "live", inLineup: true },
    { id: 'harry_kane_mock', name: "Harry Kane", team: "FCB", points: 80, status: "live", inLineup: true }, 
    { id: '188', name: "Manuel Neuer", team: "FCB", points: 50, status: "finished", inLineup: true },
    { id: '1903', name: "Joshua Kimmich", team: "FCB", points: 120, status: "live", inLineup: true },
    { id: '2585', name: "Alphonso Davies", team: "FCB", points: 95, status: "live", inLineup: true },
    { id: '2023', name: "Leroy Sané", team: "FCB", points: 40, status: "finished", inLineup: true },
    { id: '1378', name: "Serge Gnabry", team: "FCB", points: 15, status: "bench", inLineup: true }, 
    { id: '1910', name: "Granit Xhaka", team: "B04", points: 110, status: "live", inLineup: true },
    { id: '1996', name: "Jonathan Tah", team: "B04", points: 60, status: "finished", inLineup: true },
    { id: '2322', name: "Alejandro Grimaldo", team: "B04", points: 180, status: "live", inLineup: true },
    { id: '3270', name: "Jeremie Frimpong", team: "B04", points: 130, status: "live", inLineup: true },

    // BANK (inLineup: false)
    { id: '3330', name: "Florian Wirtz", team: "B04", points: 250, status: "live", inLineup: false }, 
    { id: '3829', name: "Mathys Tel", team: "FCB", points: 20, status: "live", inLineup: false },
    { id: '533', name: "Sven Ulreich", team: "FCB", points: 0, status: "bench", inLineup: false },
];

const MOCK_MATCHES = [
    { id: 1, t1: "FCB", t2: "BVB", s1: 3, s2: 1, min: "78'", live: true },
    { id: 2, t1: "RBL", t2: "B04", s1: 1, s2: 1, min: "HZ", live: false },
    { id: 3, t1: "VfB", t2: "SGE", s1: 2, s2: 0, min: "24'", live: true },
];

// --- TOKEN LOGIK ---
const getKickbaseToken = () => {
    try {
        const storedToken = localStorage.getItem('kb_auth_token');
        if (storedToken) return storedToken;
        const directToken = localStorage.getItem('token');
        if (directToken) return directToken.replace(/"/g, '');
    } catch (e) {}
    return null; 
};

// --- API HELPER (PROXY WEICHE) ---
const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
    let url;
    let options = {
        method: method,
        headers: { "Content-Type": "application/json" }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);

    if (IS_PRODUCTION) {
        // AUF WEBSPACE: Nutze proxy.php
        // Wir senden den Ziel-Endpunkt als Query-Parameter 'endpoint'
        url = `proxy.php?endpoint=${encodeURIComponent(endpoint)}`;
        // WICHTIG: Authorization Header muss über proxy.php geschleift werden (machen wir im PHP Skript)
    } else {
        // LOKAL: Direkter Versuch (könnte CORS Fehler werfen)
        url = `https://api.kickbase.com/v4${endpoint}`;
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Fehler ${response.status}: ${errorText}`);
    }
    
    return await response.json();
};

// --- API FUNKTIONEN ---
const fetchPlayerData = async (playerId, accessToken) => {
    if (accessToken === 'DEMO_MODE') { await new Promise(r => setTimeout(r, 600)); return MOCK_PLAYER_DATA; }
    if (!accessToken) throw new Error("Kein Token.");
    
    const rawData = await apiCall(`/players/${playerId}/events`, 'GET', null, accessToken);
    
    return { 
        playerName: rawData.n || rawData.name, 
        teamName: rawData.teamName || "Team", 
        totalPoints: rawData.t || rawData.points || 0, 
        events: rawData.events || [],
        image: getPlayerImageUrl(playerId)
    };
};

const useKickbasePlayerData = (playerId, manualToken) => {
    const token = manualToken || getKickbaseToken();
    return useQuery({
        queryKey: ['playerLiveEvents', playerId || '2576', token], 
        queryFn: () => fetchPlayerData(playerId || '2576', token),
        refetchInterval: 5000, 
        enabled: !!token, 
        retry: 1
    });
};

// --- KOMPONENTEN ---

const PlayerRow = ({ player, isBench, onSelect }) => {
    const [imgError, setImgError] = useState(false);
    const imageUrl = getPlayerImageUrl(player.id);

    return (
        <div 
            onClick={() => onSelect(player)}
            className={`p-3 rounded-lg flex justify-between items-center cursor-pointer border border-gray-700 transition-all ${isBench ? 'bg-gray-800/60 opacity-80 hover:bg-gray-800 hover:opacity-100' : 'bg-gray-800 hover:bg-gray-700 shadow-sm'}`}
        >
            <div className="flex items-center">
                <div className="relative mr-3">
                    {!imgError ? (
                        <img 
                            src={imageUrl} 
                            alt={player.name}
                            onError={() => setImgError(true)}
                            className={`w-10 h-10 rounded-full object-cover border-2 ${isBench ? 'border-gray-600 grayscale' : 'border-[#d63031]'}`}
                        />
                    ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${isBench ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-700 border-gray-500 text-white'}`}>
                            {player.team}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-gray-900 text-[8px] text-white px-1 rounded border border-gray-600">
                        {player.team}
                    </div>
                </div>

                <div>
                    <p className={`font-medium ${isBench ? 'text-gray-400' : 'text-white'}`}>{player.name}</p>
                    {player.status === 'live' && !isBench && <span className="text-green-400 text-[10px] font-bold uppercase tracking-wider flex items-center mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse"></span> Live</span>}
                    {player.status === 'live' && isBench && <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center mt-0.5">Live (Bank)</span>}
                </div>
            </div>
            <div className="text-right">
                <span className={`font-bold text-lg ${isBench ? 'text-gray-500' : (player.points >= 0 ? 'text-[#d63031]' : 'text-red-500')}`}>
                    {player.points}
                </span>
            </div>
        </div>
    );
};

const MatchDayListView = ({ onSelectMatchday }) => {
    return (
        <div className="w-full max-w-lg mx-auto mt-20 p-4">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Calendar className="mr-2 text-[#d63031]" /> Spieltage
            </h2>
            <div className="space-y-3">
                {MOCK_MATCHDAYS.map(day => (
                    <div 
                        key={day.id} 
                        onClick={() => onSelectMatchday(day)}
                        className={`p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all border ${day.status === 'live' ? 'bg-gray-800 border-[#d63031] shadow-[0_0_15px_rgba(214,48,49,0.2)]' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                    >
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="text-white font-bold text-lg">{day.name}</span>
                                {day.status === 'live' && (
                                    <span className="px-2 py-0.5 bg-[#d63031] text-white text-[10px] font-bold rounded-full animate-pulse">LIVE</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{day.date}</p>
                        </div>
                        <div className="flex items-center text-gray-400">
                            {day.status === 'finished' && <span className="mr-3 text-sm font-medium">{day.totalPoints} Pkt</span>}
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardView = ({ matchday, onSelectManager, onBack }) => {
    if (!matchday) return <div className="text-white p-4">Lade Spieltag...</div>;
    return (
        <div className="w-full max-w-lg mx-auto mt-20 p-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white mb-4 flex items-center text-sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Alle Spieltage
            </button>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{matchday.name}</h2>
                    <p className="text-sm text-gray-400">{matchday.date}</p>
                </div>
                {matchday.status === 'live' && <span className="text-[#d63031] font-bold text-sm flex items-center"><span className="w-2 h-2 bg-[#d63031] rounded-full mr-2 animate-pulse"></span>Live</span>}
            </div>
            {matchday.status === 'live' && (
                <div className="mb-8 p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Bundesliga Live Scores</h3>
                    <div className="space-y-2">
                        {MOCK_MATCHES.map(m => (
                            <div key={m.id} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-300 w-8">{m.t1}</span>
                                <span className={`px-2 py-1 rounded bg-gray-900 font-mono ${m.live ? 'text-green-400' : 'text-gray-500'}`}>{m.s1}-{m.s2}</span>
                                <span className="font-bold text-gray-300 w-8 text-right">{m.t2}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <h3 className="text-gray-300 font-bold mb-3 flex items-center"><BarChart3 className="w-4 h-4 mr-2"/> Manager Tabelle</h3>
            <div className="space-y-2">
                {MOCK_MANAGERS.map(manager => (
                    <div key={manager.id} onClick={() => onSelectManager(manager)} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 border border-gray-700">
                        <div className="flex items-center">
                            <span className="text-gray-500 font-bold w-6 text-center">{manager.place}.</span>
                            <div className="ml-3">
                                <p className="text-white font-semibold">{manager.name}</p>
                            </div>
                        </div>
                        <p className="text-[#d63031] font-bold text-lg">{manager.points}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ManagerView = ({ manager, onBack, onSelectPlayer }) => {
    if (!manager) return <div className="text-white p-4">Lade Manager...</div>;
    const lineupPlayers = MOCK_SQUAD.filter(p => p.inLineup);
    const benchPlayers = MOCK_SQUAD.filter(p => !p.inLineup);

    return (
        <div className="w-full max-w-lg mx-auto mt-20 p-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white mb-4 flex items-center text-sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Zurück zur Tabelle
            </button>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl mb-8 border border-gray-700 text-center shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-[#d63031]"></div>
                 <h2 className="text-xl font-bold text-white relative z-10">{manager.name}</h2>
                 <p className="text-5xl font-black text-[#d63031] mt-2 relative z-10 tracking-tighter drop-shadow-sm">{manager.points}</p>
                 <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1 relative z-10">Gesamtpunkte Live</p>
            </div>
            <div className="mb-8">
                <h3 className="text-white font-bold mb-3 flex items-center text-sm uppercase tracking-wider border-b border-gray-800 pb-2">
                    <Shirt className="w-4 h-4 mr-2 text-green-500"/> Aufstellung <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{lineupPlayers.length} Spieler</span>
                </h3>
                <div className="space-y-2">
                    {lineupPlayers.map(player => (
                        <PlayerRow key={player.id} player={player} isBench={false} onSelect={onSelectPlayer} />
                    ))}
                </div>
            </div>
            {benchPlayers.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-gray-500 font-bold mb-3 flex items-center text-sm uppercase tracking-wider border-b border-gray-800 pb-2">
                        <Armchair className="w-4 h-4 mr-2"/> Bank <span className="ml-auto text-xs font-normal normal-case">(Punkte zählen nicht)</span>
                    </h3>
                    <div className="space-y-2">
                        {benchPlayers.map(player => (
                            <PlayerRow key={player.id} player={player} isBench={true} onSelect={onSelectPlayer} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const LiveFeedView = ({ player, onBack, manualToken, setManualToken }) => {
    const { data, isLoading, error, refetch, isFetching } = useKickbasePlayerData(player ? player.id : '2576', manualToken);
    const [imgError, setImgError] = useState(false);

    if (!player) return <div className="text-white p-4">Lade Spieler...</div>;
    // Wenn kein Token da ist, aber auch kein Login-Screen (weil der in App.jsx gesteuert wird), redirect oder fehler
    // Hier gehen wir davon aus, dass token da ist, weil App.jsx das prüft.
    
    const displayData = data || { playerName: player.name, teamName: player.team, totalPoints: player.points, events: [] };
    const imageUrl = getPlayerImageUrl(player.id);

    return (
        <div className="w-full max-w-lg mx-auto mt-20 p-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white mb-4 flex items-center text-sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Zurück zum Kader
            </button>
            <div className="p-5 bg-[#d63031] text-white shadow-lg flex justify-between items-center rounded-t-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <div className="flex items-center relative z-10">
                    {!imgError ? (
                        <img 
                            src={imageUrl} 
                            alt={displayData.playerName}
                            onError={() => setImgError(true)}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white mr-4 shadow-md"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mr-4 border-2 border-white">
                            <User className="w-8 h-8 text-gray-400" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-extrabold leading-tight">{displayData.playerName}</h2>
                        <p className="text-sm opacity-90">{displayData.teamName}</p>
                    </div>
                </div>
                <div className="text-right relative z-10">
                    <div className="text-4xl font-black flex items-center justify-end">{displayData.totalPoints} <Zap className="w-6 h-6 ml-2 text-yellow-300 fill-yellow-300"/></div>
                </div>
            </div>
            <div className="bg-gray-800 rounded-b-xl border border-gray-700 overflow-hidden">
                {isLoading && !data ? <div className="p-8 text-center text-gray-400">Lade...</div> : (
                    <div className="max-h-[60vh] overflow-y-auto">
                        {displayData.events.length === 0 ? <div className="p-8 text-center text-gray-500">Keine Aktionen.</div> : 
                        displayData.events.map((ev, i) => (
                            <div key={i} className="flex items-center p-3 border-b border-gray-700 bg-gray-800 hover:bg-gray-750">
                                <span className="w-10 text-center text-gray-400 font-bold text-sm">{ev.time || ev.m}'</span>
                                <span className="flex-grow text-gray-200 text-sm px-2">{ev.action || ev.n}</span>
                                <span className={`font-bold w-12 text-right ${(ev.points || ev.p) > 0 ? 'text-green-400' : 'text-red-400'}`}>{(ev.points || ev.p) > 0 ? '+' : ''}{ev.points || ev.p}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-2 bg-gray-800 border-t border-gray-700 flex justify-between">
                     <button onClick={() => setManualToken(null)} className="text-xs text-gray-500">Logout (Token löschen)</button>
                     <button onClick={refetch} className="text-xs text-gray-400 flex items-center"><RefreshCw className={`w-3 h-3 mr-1 ${isFetching ? 'animate-spin' : ''}`}/> Aktualisieren</button>
                </div>
            </div>
        </div>
    );
};

// --- ECHTES LOGIN FORMULAR ---
const LoginScreen = ({ onSetToken }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const performLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // LOGIN CALL (nutzt nun die apiCall Helferfunktion für Proxy-Support)
            const data = await apiCall('/user/login', 'POST', { email, password });

            if (data && data.token) {
                // TOKEN ERHALTEN! Speichern im localStorage
                localStorage.setItem('kb_auth_token', data.token);
                onSetToken(data.token);
            } else {
                throw new Error("Kein Token empfangen.");
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes("Failed to fetch") && !IS_PRODUCTION) {
                setError("Netzwerkfehler (CORS) im Entwicklungsmodus. Bitte 'Demo Modus' nutzen.");
            } else if (IS_PRODUCTION) {
                setError("Fehler: " + err.message + ". Hast du 'proxy.php' hochgeladen?");
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-300 p-4 pt-32">
            <KeyRound className="w-12 h-12 text-[#d63031] mb-4" />
            <h2 className="text-xl font-bold mb-4">Kickbase Live Login</h2>
            
            {/* DEMO BUTTON */}
            <button className="bg-gray-700 hover:bg-gray-600 w-full max-w-xs py-3 rounded font-bold text-white mb-6 border border-gray-600 flex justify-center items-center shadow-lg" onClick={() => onSetToken('DEMO_MODE')}>
                <PlayCircle className="w-5 h-5 mr-2 text-green-500"/> Demo Modus testen
            </button>

            <div className="relative w-full max-w-xs mb-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-700"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-900 px-2 text-gray-500">oder mit Account</span></div>
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={performLogin} className="w-full max-w-xs space-y-3">
                <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input 
                        type="email"
                        className="bg-gray-800 border border-gray-600 p-2 pl-10 rounded w-full text-white text-sm focus:border-[#d63031] focus:outline-none" 
                        placeholder="E-Mail Adresse" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input 
                        type="password"
                        className="bg-gray-800 border border-gray-600 p-2 pl-10 rounded w-full text-white text-sm focus:border-[#d63031] focus:outline-none" 
                        placeholder="Passwort" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required
                    />
                </div>
                
                {error && <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded border border-red-900">{error}</div>}

                <button 
                    type="submit"
                    className="bg-[#d63031] hover:bg-red-700 w-full py-2 rounded font-bold text-white disabled:opacity-50 flex justify-center items-center transition-colors" 
                    disabled={isLoading}
                >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Einloggen"}
                </button>
            </form>
            <p className="text-[10px] text-gray-600 mt-4 text-center max-w-xs">Deine Daten werden nur lokal an die offizielle Kickbase-API gesendet. <br/>(Hinweis: Browser-Sicherheitsregeln/CORS könnten den direkten Login blockieren)</p>
        </div>
    );
};

// --- APP CONTENT ---
const AppInner = () => {
    console.log("AppInner startet...");
    // Token initial laden
    const [token, setToken] = useState(getKickbaseToken());
    const [view, setView] = useState('matchdays'); 
    const [selectedMatchday, setSelectedMatchday] = useState(null);
    const [selectedManager, setSelectedManager] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    // Wenn Token sich ändert (durch Login), neu laden
    const handleSetToken = (newToken) => {
        setToken(newToken);
        if (!newToken) {
            localStorage.removeItem('kb_auth_token');
            // Reset state
            setView('matchdays');
            setSelectedMatchday(null);
            setSelectedManager(null);
            setSelectedPlayer(null);
        }
    };

    // Navigation Logik
    const nav = {
        toMatchday: (md) => { console.log("Navigiere zu Spieltag:", md); setSelectedMatchday(md); setView('ranking'); },
        toManager: (mg) => { console.log("Navigiere zu Manager:", mg); setSelectedManager(mg); setView('manager'); },
        toPlayer: (pl) => { console.log("Navigiere zu Spieler:", pl); setSelectedPlayer(pl); setView('player'); },
        backToMatchdays: () => { setView('matchdays'); setSelectedMatchday(null); },
        backToRanking: () => { setView('ranking'); setSelectedManager(null); },
        backToManager: () => { setView('manager'); setSelectedPlayer(null); }
    };

    return (
        <div className="min-h-screen bg-gray-900 font-sans flex flex-col">
            <nav className="fixed top-0 left-0 w-full bg-gray-800 border-b border-gray-700 p-4 text-center text-white font-bold z-50 shadow-md">
                <span className="text-[#d63031] mr-1">KB</span> Live Client
            </nav>
            
            {/* LOGIN CHECK: Wenn kein Token da ist, zeige IMMER Login, egal welche View gewählt ist */}
            {!token ? (
                <LoginScreen onSetToken={handleSetToken} />
            ) : (
                <>
                    {view === 'matchdays' && <MatchDayListView onSelectMatchday={nav.toMatchday} />}
                    {view === 'ranking' && <DashboardView matchday={selectedMatchday} onSelectManager={nav.toManager} onBack={nav.backToMatchdays} />}
                    {view === 'manager' && <ManagerView manager={selectedManager} onSelectPlayer={nav.toPlayer} onBack={nav.backToRanking} />}
                    {view === 'player' && <LiveFeedView player={selectedPlayer} onBack={nav.backToManager} manualToken={token} setManualToken={handleSetToken} />}
                </>
            )}
        </div>
    );
}

// --- APP ROOT ---
const App = () => {
    console.log("App Root gerendert");
    if (!queryClient) {
        return <div className="text-white p-4 bg-red-800">Kritischer Fehler: QueryClient konnte nicht initialisiert werden. Bitte Abhängigkeiten prüfen (npm install).</div>
    }

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AppInner />
            </QueryClientProvider>
        </ErrorBoundary>
    );
};

export default App;
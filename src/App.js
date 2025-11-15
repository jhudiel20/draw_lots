import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, RotateCcw, Home, Users, Trophy, Gift, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import './App.css';

export default function GatsbyRaffleSystem() {
  const API_URL = 'http://localhost/draw_lots/backend/api';
  const [currentPage, setCurrentPage] = useState('home');
  const [participants, setParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [nameInput, setNameInput] = useState('');
  const [prizeNameInput, setPrizeNameInput] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [confetti, setConfetti] = useState([]);

  // ============ PARTICIPANTS FUNCTIONS ============
  
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${API_URL}/participants.php`);
      const data = await response.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const addParticipant = async () => {
    if (!nameInput.trim()) return;
    try {
      await fetch(`${API_URL}/participants.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() })
      });
      setNameInput('');
      await fetchParticipants();
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  const removeParticipant = async (id) => {
    try {
      await fetch(`${API_URL}/participants.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await fetchParticipants();
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const removeAllParticipants = async () => {
    try {
      await fetch(`${API_URL}/participants.php?action=deleteAll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      await fetchParticipants();
    } catch (error) {
      console.error('Error removing all participants:', error);
    }
  };

  // ============ OTHER FUNCTIONS ============

  const fetchPrizes = async () => {
    try {
      const response = await fetch(`${API_URL}/prizes.php`);
      const data = await response.json();
      setPrizes(Array.isArray(data) ? data.map((p, idx) => ({ ...p, rank: idx + 1 })) : []);
    } catch (error) {
      console.error('Error fetching prizes:', error);
    }
  };

  const fetchWinners = async () => {
    try {
      const response = await fetch(`${API_URL}/winners.php`);
      const data = await response.json();
      setWinners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching winners:', error);
    }
  };

  const savePrizeRanking = async (id, ranking) => {
    try {
      await fetch(`${API_URL}/prizes.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ranking })
      });
    } catch (error) {
      console.error('Error saving prize ranking:', error);
    }
  };

  const saveWinner = async (winner) => {
    try {
      await fetch(`${API_URL}/winners.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: winner.id,
          participant_name: winner.name,
          prize_name: winner.prize,
          prize_ranking: winner.rank
        })
      });
    } catch (error) {
      console.error('Error saving winner:', error);
    }
  };

  useEffect(() => {
    fetchParticipants();
    fetchPrizes();
    fetchWinners();
  }, []);

  const createConfetti = () => {
    const newConfetti = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2.5 + Math.random() * 1.5,
      size: Math.random() * 10 + 5,
      color: ['#FFD700', '#FFA500', '#FF69B4', '#00BFFF', '#9370DB', '#FF1493', '#FFB6C1', '#87CEEB'][Math.floor(Math.random() * 8)],
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 4000);
  };

  const addPrize = async () => {
    if (!prizeNameInput.trim()) return;
    try {
      await fetch(`${API_URL}/prizes.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: prizeNameInput.trim(), 
          ranking: prizes.length + 1 
        })
      });
      setPrizeNameInput('');
      await fetchPrizes();
    } catch (error) {
      console.error('Error adding prize:', error);
    }
  };

  const removePrize = async (id) => {
    try {
      await fetch(`${API_URL}/prizes.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      await fetchPrizes();
    } catch (error) {
      console.error('Error removing prize:', error);
    }
  };

  const movePrizeUp = async (id) => {
    const idx = prizes.findIndex(p => p.id === id);
    if (idx > 0) {
      const newPrizes = [...prizes];
      [newPrizes[idx], newPrizes[idx - 1]] = [newPrizes[idx - 1], newPrizes[idx]];
      newPrizes.forEach((p, i) => {
        p.rank = i + 1;
        savePrizeRanking(p.id, p.rank);
      });
      setPrizes(newPrizes);
    }
  };

  const movePrizeDown = async (id) => {
    const idx = prizes.findIndex(p => p.id === id);
    if (idx < prizes.length - 1) {
      const newPrizes = [...prizes];
      [newPrizes[idx], newPrizes[idx + 1]] = [newPrizes[idx + 1], newPrizes[idx]];
      newPrizes.forEach((p, i) => {
        p.rank = i + 1;
        savePrizeRanking(p.id, p.rank);
      });
      setPrizes(newPrizes);
    }
  };

  const drawWinner = async () => {
    if (participants.length === 0 || prizes.length === 0) return;
    
    // Check if all prizes are claimed
    const allPrizesClaimed = prizes.every(prize => 
      winners.some(winner => winner.prize === prize.name)
    );
    
    if (allPrizesClaimed) {
      alert('All prizes have been claimed! Reset the game to continue.');
      return;
    }

    setIsDrawing(true);
    setSelectedWinner(null);

    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 10 + i * 3));
      const randomIdx = Math.floor(Math.random() * participants.length);
      setSelectedWinner(participants[randomIdx]);
    }

    const winnerIdx = Math.floor(Math.random() * participants.length);
    const winner = participants[winnerIdx];
    const prizeIndex = prizes.length - 1 - (winners.length % prizes.length);
    const assignedPrize = prizes[prizeIndex];

    setSelectedWinner(winner);

    setTimeout(() => {
      const newWinner = { 
        id: Date.now(),
        name: winner.name, 
        prize: assignedPrize.name,
        rank: assignedPrize.rank,
        timestamp: new Date().toLocaleTimeString() 
      };
      
      saveWinner(newWinner);
      
      setWinners([...winners, newWinner]);
      setParticipants(participants.filter((_, idx) => idx !== winnerIdx));
      setIsDrawing(false);
      createConfetti();
      playCasinoWinSound();
    }, 500);
  };

  // Casino winning sound
  const playCasinoWinSound = () => {
    // Create a simple winning sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Quick ascending tone sequence (winning sound)
    const notes = [800, 1000, 1200, 1600];
    const noteLength = 0.1;
    let currentTime = audioContext.currentTime;
    
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + noteLength);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + noteLength);
      
      currentTime += noteLength * 0.8;
    });
  };
  

  const resetAll = async () => {
    try {
      // Delete all participants
      await fetch(`${API_URL}/participants.php?action=deleteAll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Delete all prizes
      await fetch(`${API_URL}/prizes.php?action=deleteAll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Delete all winners
      await fetch(`${API_URL}/winners.php?action=deleteAll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Clear local state
      setParticipants([]);
      setWinners([]);
      setPrizes([]);
      setSelectedWinner(null);
      setNameInput('');
      setPrizeNameInput('');
      setCurrentPage('home');
    } catch (error) {
      console.error('Error resetting all:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addParticipant();
  };

  const handlePrizeKeyPress = (e) => {
    if (e.key === 'Enter') addPrize();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confetti.map((piece) => (
          <div key={piece.id} className="fixed rounded-full" style={{
            left: `${piece.left}%`,
            top: '-10px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animation: `fall ${piece.duration}s linear ${piece.delay}s forwards`,
            boxShadow: `0 0 ${piece.size * 2}px ${piece.color}`,
          }} />
        ))}
      </div>

      <style>

      </style>

      <div className="relative z-10 p-6 md:p-8">
        {/* Navigation */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
            {[
              { id: 'home', label: 'Draw', icon: Home },
              { id: 'registration', label: 'Registration', icon: Users },
              { id: 'participants', label: 'Participants', icon: Users },
              { id: 'winners', label: 'Winners', icon: Trophy },
              { id: 'prizes', label: 'Prizes', icon: Gift },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentPage(id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold transition-all ${
                  currentPage === id
                    ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* HOME PAGE */}
        {/* {currentPage === 'home' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 text-amber-300 mb-4">
                  <Sparkles size={24} />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Lucky Draw</h2>
                  <Sparkles size={24} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2">🎭 THE WINNER IS 🎭</h1>
              </div>

              <div className="relative mb-12 min-h-48">
                {selectedWinner ? (
                  <div className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center">
                      <div className="inline-block bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 rounded-2xl px-8 py-6 transform">
                        <div className="text-6xl md:text-7xl font-black text-white" style={{ textShadow: '0 0 30px rgba(0,0,0,0.3)' }}>
                          {selectedWinner.name}
                        </div>
                      </div>
                    </div>

                    {winners.length > 0 && (
                      <div className="text-center">
                        <div className="inline-block bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl px-8 py-4 transform hover:scale-105 transition-transform">
                          <p className="text-white font-bold text-2xl">🎁 {winners[winners.length - 1].prize}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center gap-4 text-6xl">
                      <span style={{ animation: 'bounce 1s infinite' }}>🎉</span>
                      <span style={{ animation: 'bounce 1s infinite 0.2s' }}>🎊</span>
                      <span style={{ animation: 'bounce 1s infinite 0.4s' }}>🎁</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-9xl animate-bounce">🎲</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <button
                  onClick={drawWinner}
                  disabled={isDrawing || participants.length === 0 || prizes.length === 0}
                  className="col-span-2 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-black py-4 md:py-6 rounded-2xl text-lg md:text-xl transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
                >
                  <Play size={28} className="fill-current" />
                  <span>{isDrawing ? 'DRAWING...' : 'DRAW WINNER!'}</span>
                </button>

                <button
                  onClick={resetAll}
                  style={{ backgroundColor: 'red' }}
                  className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  <span>RESET ALL</span>
                </button>
              </div>

              {winners.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/20">
                  <h3 className="text-white/80 text-sm font-bold uppercase tracking-widest mb-4">Previous Winners</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {winners.slice().reverse().map((winner, idx) => (
                      <div key={winner.id} className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3 hover:bg-white/10 transition-colors">
                        <span className="text-white font-semibold">{winner.name}</span>
                        <span className="text-white/70">{winner.prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )} */}
        {currentPage === 'home' && (
          <div className="max-w-8xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 text-amber-300 mb-4">
                  <Sparkles size={24} />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Lucky Draw</h2>
                  <Sparkles size={24} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2">🎭 THE WINNER IS 🎭</h1>
              </div>

              <div className="relative mb-12 min-h-48 flex items-center justify-center">
                {!isDrawing && !selectedWinner ? (
                  // Show letter boxes before drawing
                  <div className="text-center">
                    <div className="mb-6 text-white/70 text-lg font-semibold">Ready to reveal the winner?</div>
                    <div className="inline-block bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 rounded-2xl p-6 transform hover:scale-105 transition-transform">
                      <div className="text-6xl md:text-7xl font-black text-white flex gap-3" style={{ textShadow: '0 0 30px rgba(0,0,0,0.3)' }}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                            .slice(0, window.innerWidth < 640 ? 3 : window.innerWidth < 1024 ? 5 : 11)
                            .map((idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '1.5em',
                              height: '1.5em',
                              border: '3px solid rgba(255,255,255,0.3)',
                              borderRadius: '0.2em',
                              backgroundColor: 'rgba(0,0,0,0.2)'
                            }}
                          >
                            <span style={{ fontSize: '0.8em', opacity: 0.6 }}>?</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isDrawing ? (
                  // Show rolling letters during drawing
                  <div className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center">
                      <div className="inline-block bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 rounded-2xl p-6 transform hover:scale-105 transition-transform">
                        <div className="text-6xl md:text-7xl font-black text-white flex gap-3" style={{ textShadow: '0 0 30px rgba(0,0,0,0.3)' }}>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                          .slice(0, window.innerWidth < 640 ? 3 : window.innerWidth < 1024 ? 5 : 11)
                          .map((idx) => (
                            <span
                              key={idx}
                              style={{
                                display: 'inline-block',
                                width: '1.5em',
                                height: '1.5em',
                                overflow: 'hidden',
                                position: 'relative',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderRadius: '0.2em'
                              }}
                            >
                              <span
                                style={{
                                  animation: `roll-alphabet 0.8s linear infinite`,
                                  animationDelay: `${idx * 0.1}s`,
                                  display: 'block'
                                }}
                              >
                                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
                                  <div key={letter} style={{ height: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {letter}
                                  </div>
                                ))}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* <div className="flex justify-center gap-4 text-6xl">
                      <span style={{ animation: 'bounce 1s infinite' }}>🎉</span>
                      <span style={{ animation: 'bounce 1s infinite 0.2s' }}>🎊</span>
                      <span style={{ animation: 'bounce 1s infinite 0.4s' }}>🎁</span>
                    </div> */}
                  </div>
                ) : selectedWinner ? (
                  // Show winner result
                  <div className="space-y-6 animate-in fade-in-50 duration-500 w-full">
                    <div className="text-center">
                      <div className="inline-block bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 rounded-2xl px-8 py-6 transform">
                        <div className="text-6xl md:text-7xl font-black text-white" style={{ textShadow: '0 0 30px rgba(0,0,0,0.3)' }}>
                          {selectedWinner.name}
                        </div>
                      </div>
                    </div>

                    {winners.length > 0 && (
                      <div className="text-center">
                        <div className="inline-block bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl px-8 py-4 transform hover:scale-105 transition-transform">
                          <p className="text-white font-bold text-2xl">🎁 {winners[winners.length - 1].prize}</p>
                        </div>
                      </div>
                    )}

                    {/* <div className="flex justify-center gap-4 text-6xl">
                      <span style={{ animation: 'bounce 1s infinite' }}>🎉</span>
                      <span style={{ animation: 'bounce 1s infinite 0.2s' }}>🎊</span>
                      <span style={{ animation: 'bounce 1s infinite 0.4s' }}>🎁</span>
                    </div> */}
                  </div>
                ) : null}
              </div>

              <style>{`
                @keyframes roll-alphabet {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(calc(-26 * 1.2em)); }
                }
              `}</style>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <button
                  onClick={drawWinner}
                  disabled={isDrawing || participants.length === 0 || prizes.length === 0}
                  className="col-span-2 bg-gradient-to-r from-amber-400 to-pink-500 hover:from-amber-500 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-black py-4 md:py-6 rounded-2xl text-lg md:text-xl transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
                >
                  <Play size={28} className="fill-current" />
                  <span>{isDrawing ? 'DRAWING...' : 'DRAW WINNER!'}</span>
                </button>

                <button
                  onClick={resetAll}
                  style={{ backgroundColor: 'red' }}
                  className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 md:py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  <span>RESET ALL</span>
                </button>
              </div>

              {winners.length > 0 && (
                <div className="mt-8 pt-8 border-t border-white/20">
                  <h3 className="text-white/80 text-sm font-bold uppercase tracking-widest mb-4">Previous Winners</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {winners.slice().reverse().map((winner, idx) => (
                      <div key={winner.id} className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3 hover:bg-white/10 transition-colors">
                        <span className="text-white font-semibold">{winner.name}</span>
                        <span className="text-white/70">{winner.prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REGISTRATION PAGE */}
        {/* {currentPage === 'registration' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-8 flex items-center gap-3">
                <Users size={32} /> Add Participants
              </h2>

              <div className="space-y-4 mb-8">
                <input
                  type="text"
                  placeholder="Enter participant name..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-6 py-4 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 text-lg font-semibold transition-all"
                />

                <button
                  onClick={addParticipant}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-gray-900 font-black py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg shadow-lg"
                >
                  <Plus size={24} /> Add to List
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white/80 mb-4">Recent Additions ({participants.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {participants.length === 0 ? (
                    <p className="text-white/50 text-center py-8">No participants yet</p>
                  ) : (
                    participants.slice().reverse().slice(0, 10).map((p) => (
                      <div key={p.id} className="flex justify-between items-center bg-white/10 rounded-lg px-4 py-3 hover:bg-white/20 transition-all group">
                        <span className="text-white font-semibold">{p.name}</span>
                        <button
                          onClick={() => removeParticipant(p.id)}
                          className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )} */}
        {currentPage === 'registration' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-8 flex items-center gap-3">
                <Users size={32} /> Add Participants
              </h2>

              <div className="space-y-4 mb-8">
                <input
                  type="text"
                  placeholder="Enter participant name..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-6 py-4 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 text-lg font-semibold transition-all"
                />

                <button
                  onClick={addParticipant}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-gray-900 font-black py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-lg shadow-lg"
                >
                  <Plus size={24} /> Add to List
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white/80">Recent Additions ({participants.length})</h3>
                  {participants.length > 0 && (
                    <button 
                      onClick={removeAllParticipants}
                      style={{ backgroundColor: '#dc2626' }}
                      className="px-4 py-2 hover:bg-red-800 text-white font-semibold rounded-lg transition-all flex items-center gap-2 text-sm shadow-lg"
                    >
                      <Trash2 size={18} /> Remove All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {participants.length === 0 ? (
                    <p className="text-white/50 text-center py-8">No participants yet</p>
                  ) : (
                    participants.slice().reverse().slice(0, 10).map((p) => (
                      <div key={p.id} className="flex justify-between items-center bg-white/10 rounded-lg px-4 py-3 hover:bg-white/20 transition-all">
                        <span className="text-white font-semibold">{p.name}</span>
                        <button
                          style={{ backgroundColor: '#dc2626' }}
                          onClick={() => removeParticipant(p.id)}
                          className="p-2 bg-red-500/60 hover:bg-red-600 text-white rounded-lg transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARTICIPANTS PAGE */}
        {currentPage === 'participants' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">All Participants</h2>
              <p className="text-white/60 mb-8">{participants.length} in pool</p>

              {participants.length === 0 ? (
                <p className="text-white/50 text-center py-16">No participants yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.map((p, idx) => (
                    <div key={p.id} className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl p-4 flex justify-between items-center group hover:from-blue-500/50 hover:to-purple-500/50 transition-all">
                      <div>
                        <div className="text-sm text-white/60 font-bold">#{idx + 1}</div>
                        <div className="text-lg font-bold text-white">{p.name}</div>
                      </div>
                      <button
                        onClick={() => removeParticipant(p.id)}
                        className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRIZES PAGE */}
        {currentPage === 'prizes' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                <Gift size={32} /> Add Prize
              </h2>
              <p className="text-white/60 mb-8">First winner gets the lowest rank prize</p>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter prize name..."
                  value={prizeNameInput}
                  onChange={(e) => setPrizeNameInput(e.target.value)}
                  onKeyPress={handlePrizeKeyPress}
                  className="w-full px-6 py-4 rounded-xl bg-white/10 border-2 border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 text-lg font-semibold"
                />

                <button
                  onClick={addPrize}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-gray-900 font-black py-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plus size={24} /> Add Prize
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">Prize Order</h3>
              {prizes.length === 0 ? (
                <p className="text-white/50 text-center py-12">No prizes added yet</p>
              ) : (
                <div className="space-y-3">
                  {prizes.map((prize, idx) => {
                    const claimedBy = winners.filter(w => w.prize === prize.name);
                    const isClaimed = claimedBy.length > 0;

                    return (
                      <div key={prize.id} className={`p-4 flex justify-between items-center rounded-lg transition-all ${
                        isClaimed
                          ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30'
                          : 'bg-purple-500/40 hover:bg-purple-500/50'
                      }`}>
                        <div className="flex-1">
                          <div className="text-xs text-white/70 font-bold uppercase tracking-wide">Rank #{prize.rank}</div>
                          <div className="text-2xl font-bold text-white mt-2">{prize.name}</div>
                          {isClaimed && <div className="text-sm text-green-300 font-semibold mt-2">✓ Claimed by {claimedBy[0].name}</div>}
                        </div>
                        <div className="flex gap-3 ml-4">
                          <button
                            onClick={() => movePrizeUp(prize.id)}
                            disabled={idx === 0}
                            className="p-3 bg-white/20 hover:bg-white/30 disabled:bg-gray-500/20 rounded-lg transition-all disabled:cursor-not-allowed text-white"
                            title="Move up"
                          >
                            <ChevronUp size={20} />
                          </button>
                          <button
                            onClick={() => movePrizeDown(prize.id)}
                            disabled={idx === prizes.length - 1}
                            className="p-3 bg-white/20 hover:bg-white/30 disabled:bg-gray-500/20 rounded-lg transition-all disabled:cursor-not-allowed text-white"
                            title="Move down"
                          >
                            <ChevronDown size={20} />
                          </button>
                          <button
                            style={{ backgroundColor: 'red' }}
                            onClick={() => removePrize(prize.id)}
                            className="p-3 bg-red-500/60 hover:bg-red-600 text-white rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WINNERS PAGE */}
        {currentPage === 'winners' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">🏆 Winners History</h2>
              <p className="text-white/60 mb-8">{winners.length} winner{winners.length !== 1 ? 's' : ''} crowned</p>

              {winners.length === 0 ? (
                <p className="text-white/50 text-center py-16">No winners yet. Start drawing!</p>
              ) : (
                <div className="space-y-4">
                  {winners.map((winner, idx) => (
                    <div key={winner.id} className="bg-gradient-to-r from-green-500/40 to-emerald-500/40 rounded-xl p-6 hover:from-green-500/60 hover:to-emerald-500/60 transition-all transform hover:scale-105">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center justify-center">
                          <div className="text-6xl font-black text-white">#{idx + 1}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-sm text-white/60 font-bold">Winner</div>
                          <div className="text-2xl font-black text-white">{winner.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-white/60 font-bold">Prize</div>
                          <div className="text-lg font-bold text-white">{winner.prize}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
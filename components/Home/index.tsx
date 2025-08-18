'use client'

import { useEffect, useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ethers } from 'ethers'
import { 
  faHome, faChartBar, faTrophy, faRocket, 
  faCrown, faCoins, faBolt, faFire, faUsers,
  faArrowRight, faChartLine, faGamepad, faPlay,
  faBullseye, faInfoCircle
} from '@fortawesome/free-solid-svg-icons'
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { incrementGamesPlayed } from '@/lib/game-counter';

import { FarcasterActions } from '@/components/Home/FarcasterActions'
import { User } from '@/components/Home/User'
import { WalletActions } from '@/components/Home/WalletActions'
import { NotificationActions } from './NotificationActions'
import { ThemeToggle } from '@/components/ThemeToggle'
import UserStats from '../UserStats'
import Leaderboard from '../Leaderboard'
import { useConnect, useAccount, useContractWrite, useWaitForTransactionReceipt } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

// Dynamically import StoneShooterGame to prevent SSR issues
const StoneShooterGame = dynamic(() => import('./StoneShooterGame'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-white text-xl">Loading game...</div>
    </div>
  )
})

export function Demo() {
  const [showGame, setShowGame] = useState(false)
  const [showStoneShooter, setShowStoneShooter] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { actions } = useMiniAppContext();
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'leaderboard'>('home')
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  const [tokenTxCount, setTokenTxCount] = useState<number | null>(null)
  const [isLoadingTxCount, setIsLoadingTxCount] = useState(false)
  
  const { connect, connectors } = useConnect()
  const { isConnected, address } = useAccount()
  
  // Blockchain contract write for starting WAGMI Blaster game
  const { writeContract: writeStartGame, data: startGameTx, isSuccess: startGameSuccess, isError: startGameContractError, error: startGameErrorObj, reset: resetStartGame } = useContractWrite();
  const { isLoading: isStartGameLoading, isSuccess: isStartGameSuccess } = useWaitForTransactionReceipt({ hash: startGameTx });
  
  // WAGMI Blaster game start state
  const [isStartingStoneShooter, setIsStartingStoneShooter] = useState(false);
  const [stoneShooterError, setStoneShooterError] = useState<string | null>(null);
  const [stoneShooterSuccess, setStoneShooterSuccess] = useState(false);
  const [hasActiveTransaction, setHasActiveTransaction] = useState(false);

  // Digital grid elements for modern blockchain aesthetic
  const gridElements = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => {
      const shapes = ['line-h', 'line-v', 'dot-grid', 'cube'];
      const colors = ['#00FFAA', '#0088FF', '#FFFFFF', '#00DDFF'];
      return {
        shape: shapes[i % shapes.length],
        color: colors[i % colors.length],
        size: Math.random() * 80 + 40,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        rotation: Math.random() * 45,
        duration: Math.random() * 25 + 20,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.15 + 0.05,
      };
    }),
    []
  );
  
  const dataStreamParticles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      size: Math.random() * 2 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
      length: Math.random() * 50 + 20,
      color: ['#00FFAA', '#0088FF', '#FFFFFF', '#00DDFF'][i % 4],
    })),
    []
  );

  // Star data for animated background
  const starData = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => {
      const size = Math.random() * 8 + 4;
      const starColor = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffff88' : '#88ccff';
      return {
        size,
        color: starColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.8 + 0.2,
        textShadow: `0 0 ${size/2}px ${starColor}`,
      };
    }),
    []
  );

  // Shooting star data for animated background
  const shootingStarData = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      animation: `shoot ${Math.random() * 15 + 10}s linear infinite`,
      animationDelay: `${Math.random() * 10}s`,
    })),
    []
  );

  // Check if user has seen the reward popup before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenRewardPopup = localStorage.getItem('hasSeenRewardnewPopup')
      if (!hasSeenRewardPopup) {
        // Show popup after a short delay for better UX
        const timer = setTimeout(() => {
          setShowRewardPopup(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleCloseRewardPopup = () => {
    setShowRewardPopup(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenRewardnewPopup', 'true')
    }
  }

  // Handle WAGMI Blaster game start with blockchain transaction
  const handleStartStoneShooter1 = async() => {
    setShowStoneShooter(true);
  }

  const handleStartStoneShooter = async () => {
    if (!address) {
      console.warn('No wallet address available for WAGMI Blaster');
      setStoneShooterError('Please connect your wallet first');
      return;
    }

    if (isStartingStoneShooter) {
      console.log('🔄 WAGMI Blaster transaction already in progress');
      return;
    }

    setIsStartingStoneShooter(true);
    setStoneShooterError(null);
    setStoneShooterSuccess(false);
    setHasActiveTransaction(true);

    try {
      // Reset any previous transaction state
      resetStartGame();
      
      // Call the startGame function on the blockchain
      const { CONTRACT_ADDRESSES, TOKEN_REWARD_ABI } = await import('@/lib/contracts');
      
      writeStartGame({
        address: CONTRACT_ADDRESSES.TOKEN_REWARD as `0x${string}`,
        abi: TOKEN_REWARD_ABI,
        functionName: 'startGame',
        args: []
      });

      console.log('✅ WAGMI Blaster blockchain transaction initiated');
      
      // The transaction is now pending, the useEffect will handle success/failure
      
    } catch (error: any) {
      console.error('Error starting WAGMI Blaster game:', error);
      setStoneShooterError(error.message || 'Failed to start WAGMI Blaster game');
      setIsStartingStoneShooter(false);
    }
  };

  useEffect(()=>{
    if(isConnected){
      actions?.addFrame()
    }
  },[isConnected])

  // Fetch token transaction count from blockchain
  const fetchTokenTransactionCount = async () => {
    try {
      setIsLoadingTxCount(true)
      const { CONTRACT_ADDRESSES } = await import('@/lib/contracts')
      
      // Use public RPC endpoint for Arbitrum
      const provider = new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc")
      
      // Get transaction count for the token contract
      const txCount = await provider.getTransactionCount(CONTRACT_ADDRESSES.TOKEN_REWARD)
      
      // Add a multiplier to represent "WAGMI Blasters hit" - each tx represents multiple coins
      const memeCoinsHit = txCount * 25 // Each transaction hits approximately 25 WAGMI Blasters
      
      setTokenTxCount(memeCoinsHit)
      setIsLoadingTxCount(false)
    } catch (error) {
      console.error("Error fetching token transaction count:", error)
      setIsLoadingTxCount(false)
    }
  }
  
  // Fetch transaction count on component mount
  useEffect(() => {
    fetchTokenTransactionCount()
    
    // Refresh transaction count every 60 seconds
    const intervalId = setInterval(fetchTokenTransactionCount, 60000)
    
    return () => clearInterval(intervalId)
  }, [])

  // Handle successful WAGMI Blaster blockchain transaction
  useEffect(() => {
    if (isStartGameSuccess && isStartingStoneShooter && startGameTx) {
      console.log('✅ WAGMI Blaster blockchain transaction confirmed');
      
      // Immediately start the game
      console.log('🚀 Launching WAGMI Blaster game...');
      incrementGamesPlayed();
      setShowStoneShooter(true);
      console.log('✅ WAGMI Blaster game state set to true');
      
      // Hide the loader and reset transaction state
      setIsStartingStoneShooter(false);
      setStoneShooterSuccess(false);
      setHasActiveTransaction(false);
    }
  }, [isStartGameSuccess, isStartingStoneShooter, startGameTx]);

  // Handle WAGMI Blaster blockchain transaction error
  useEffect(() => {
    if (startGameContractError && isStartingStoneShooter) {
      console.error('❌ WAGMI Blaster blockchain transaction failed:', startGameErrorObj);
      setStoneShooterError(startGameErrorObj?.message || 'Blockchain transaction failed');
      setIsStartingStoneShooter(false);
      setStoneShooterSuccess(false);
      setHasActiveTransaction(false);
    }
  }, [startGameContractError, startGameErrorObj, isStartingStoneShooter]);

  // Reset wagmi state when returning from WAGMI Blaster game
  useEffect(() => {
    // Only reset when we're on home page (not showing any game) and have a successful transaction
    // and we're not currently in an active transaction
    if (!showStoneShooter && !showGame && !showStats && !showLeaderboard && 
        (startGameSuccess || isStartGameSuccess) && !hasActiveTransaction) {
      console.log('🔄 Resetting WAGMI Blaster transaction state');
      resetStartGame();
    }
  }, [showStoneShooter, showGame, showStats, showLeaderboard, startGameSuccess, isStartGameSuccess, hasActiveTransaction, resetStartGame]);

  // Debug: Monitor showStoneShooter state
  useEffect(() => {
    console.log('🔍 showStoneShooter state changed:', showStoneShooter);
  }, [showStoneShooter]);

  // Sync activeTab with current view
  useEffect(() => {
    if (showStats) {
      setActiveTab('stats')
    } else if (showLeaderboard) {
      setActiveTab('leaderboard')
    } else {
      setActiveTab('home')
    }
  }, [showStats, showLeaderboard])



  if (showStoneShooter) {
    return (
      <div className="min-h-screen overflow-hidden">
        <StoneShooterGame onBack={() => {
          setShowStoneShooter(false)
          setActiveTab('home')
        }} />
      </div>
    )
  }

  if (showStats) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)' }}>
        {/* Animated Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Stars */}
          {starData.map((star, i) => (
            <div
              key={i}
              className="star absolute"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                color: star.color,
                fontSize: `${star.size}px`,
                lineHeight: '1',
                animation: star.animation,
                animationDelay: star.animationDelay,
                opacity: star.opacity,
                textShadow: star.textShadow,
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
          
          {/* Shooting Stars */}
          {shootingStarData.map((shoot, i) => (
            <div
              key={`shooting-${i}`}
              className="shooting-star absolute"
              style={{
                left: shoot.left,
                top: shoot.top,
                width: '12px',
                height: '12px',
                color: '#ffffff',
                fontSize: '12px',
                lineHeight: '1',
                animation: shoot.animation,
                animationDelay: shoot.animationDelay,
                opacity: 0.9,
                textShadow: '0 0 8px #ffffff',
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
        </div>
        
        <div className="px-4 pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <UserStats />
          </motion.div>
        </div>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
        
        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { 
              opacity: 0.2;
              transform: scale(1);
            }
            50% { 
              opacity: 1;
              transform: scale(1.2);
            }
          }
          @keyframes shoot {
            0% {
              transform: translateX(0) translateY(0);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateX(-100vw) translateY(100vh);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: '#000000' }}>
        {/* Animated Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Stars */}
          {starData.map((star, i) => (
            <div
              key={i}
              className="star absolute"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                color: star.color,
                fontSize: `${star.size}px`,
                lineHeight: '1',
                animation: star.animation,
                animationDelay: star.animationDelay,
                opacity: star.opacity,
                textShadow: star.textShadow,
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
          
          {/* Shooting Stars */}
          {shootingStarData.map((shoot, i) => (
            <div
              key={`shooting-${i}`}
              className="shooting-star absolute"
              style={{
                left: shoot.left,
                top: shoot.top,
                width: '12px',
                height: '12px',
                color: '#ffffff',
                fontSize: '12px',
                lineHeight: '1',
                animation: shoot.animation,
                animationDelay: shoot.animationDelay,
                opacity: 0.9,
                textShadow: '0 0 8px #ffffff',
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
        </div>
        
        <div className="px-4 pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Leaderboard />
          </motion.div>
        </div>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
        
        <style jsx>{`
          @keyframes twinkle {
            0%, 100% { 
              opacity: 0.2;
              transform: scale(1);
            }
            50% { 
              opacity: 1;
              transform: scale(1.2);
            }
          }
          @keyframes shoot {
            0% {
              transform: translateX(0) translateY(0);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translateX(-100vw) translateY(100vh);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ 
      background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)' 
    }}>
      {/* Blockchain Transaction Loader Overlay */}
      {isStartingStoneShooter && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center">
          <motion.div 
            className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-3xl p-10 max-w-sm mx-4 text-center backdrop-blur-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <motion.div 
              className="w-20 h-20 mx-auto mb-6 relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 border-4 border-transparent border-t-emerald-400 border-r-cyan-400 rounded-full"></div>
              <div className="absolute inset-2 border-2 border-transparent border-t-cyan-300 border-l-emerald-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </motion.div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">🎮 Launching Game</h3>
            <p className="text-white/80 mb-6 text-sm">
              Processing blockchain transaction...
            </p>
            <div className="flex items-center justify-center space-x-3 text-sm text-emerald-300">
              <motion.div className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }}></motion.div>
              <span>Waiting for confirmation</span>
              <motion.div className="w-2 h-2 bg-cyan-400 rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}></motion.div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Animated Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stars */}
        {starData.map((star, i) => (
          <div
            key={i}
            className="star absolute"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              color: star.color,
              fontSize: `${star.size}px`,
              lineHeight: '1',
              animation: star.animation,
              animationDelay: star.animationDelay,
              opacity: star.opacity,
              textShadow: star.textShadow,
              pointerEvents: 'none'
            }}
          >
            ★
          </div>
        ))}
        
        {/* Shooting Stars */}
        {shootingStarData.map((shoot, i) => (
          <div
            key={`shooting-${i}`}
            className="shooting-star absolute"
            style={{
              left: shoot.left,
              top: shoot.top,
              width: '12px',
              height: '12px',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: '1',
              animation: shoot.animation,
              animationDelay: shoot.animationDelay,
              opacity: 0.9,
              textShadow: '0 0 8px #ffffff',
              pointerEvents: 'none'
            }}
          >
            ★
          </div>
        ))}
      </div>

      {/* Modern Header Section */}
      <div className="relative z-10">
        {/* Header Content */}
        <div className="px-6 pt-12 pb-8">
          <motion.div 
            className="mb-12 flex flex-col items-start"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, type: "spring" }}
          >
            {/* App Logo with Game Icon */}
            <div className="flex items-center mb-8 w-full">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#0088FF] rounded-xl blur-lg opacity-40 animate-pulse"></div>
                <img 
                  src="/images/icon.jpg" 
                    alt="WAGMI Blaster" 
                    className="relative w-20 h-20 rounded-xl shadow-lg border-2 border-[#00FFAA]/30 object-cover"
                  />
                </div>
                </motion.div>
              <div className="ml-4 flex-grow">
                <div className="h-[1px] w-full bg-gradient-to-r from-[#00FFAA] to-transparent"></div>
              </div>
            </div>
            
            {/* Modern Typography */}
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold mb-4 text-white leading-tight">
                WAGMI <span className="text-[#00FFAA]">Blaster</span>
              </h1>
              <motion.p 
                className="text-xl text-white/70 font-light max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                The ultimate <span className="text-[#00FFAA] font-normal">WAGMI Blaster destruction</span> experience with epic rewards
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Game Button - Only show when wallet is connected */}
          {isConnected && (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.8, type: "spring" }}
            >
              <div className="max-w-full">
                {/* Game Button */}
                <motion.button
                  onClick={handleStartStoneShooter}
                  disabled={isStartingStoneShooter}
                  className={`relative group overflow-hidden bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-2 px-5 rounded-xl shadow-lg w-full ${isStartingStoneShooter ? 'opacity-50 cursor-not-allowed' : ''}`}
                  whileHover={isStartingStoneShooter ? {} : { 
                    scale: 1.03,
                    boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.4), 0 0 25px rgba(217, 70, 219, 0.2)"
                  }}
                  whileTap={isStartingStoneShooter ? {} : { scale: 0.97 }}
                  style={{ 
                    boxShadow: '0 8px 20px -5px rgba(168, 85, 247, 0.3), 0 0 15px rgba(217, 70, 219, 0.15)'
                  }}
                >
                  {/* Static background with game-style pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-50" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                    {isStartingStoneShooter ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span className="font-bold">LOADING...</span>
                        <span className="text-sm opacity-80">GAME STARTING</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faRocket} className="text-2xl" />
                        <span className="font-bold text-xl">PLAY NOW</span>
                        <span className="text-sm opacity-80">WAGMI Blaster</span>
                      </>
                    )}
                  </div>
                  
                  {/* Game button shine effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Protocol Error Display */}
          {stoneShooterError && (
            <motion.div 
              className="mb-8 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border border-red-500 bg-transparent px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-1 h-8 bg-red-500 mr-3"></div>
                    <div>
                      <div className="text-red-500 text-xs font-medium uppercase tracking-wider mb-1">ERROR</div>
                      <span className="text-sm font-light text-white">Something Went Wrong</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStoneShooterError(null)}
                    className="text-red-500 hover:text-red-400 ml-4 h-8 w-8 flex items-center justify-center border border-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Wallet Connection */}
          {!isConnected && (
            <motion.div 
              className="mb-12 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.button
                type="button"
                onClick={() => connect({ connector: connectors[0] })}
                className="w-full bg-transparent text-white font-medium py-5 px-8 border-2 border-[#00FFAA] flex items-center justify-between relative overflow-hidden group"
                whileHover={{ backgroundColor: "rgba(0, 255, 170, 0.05)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 border border-[#00FFAA] flex items-center justify-center mr-4">
                    <FontAwesomeIcon icon={faBolt} className="text-[#00FFAA] text-xs" />
                </div>
                  <span className="font-medium tracking-wider text-[#00FFAA]">CONNECT WALLET</span>
                </div>
                <div className="flex items-center">
                  <div className="h-[1px] w-10 bg-[#00FFAA] mr-3 opacity-50"></div>
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm text-[#00FFAA]" />
                </div>
                
                {/* Animated border effect */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#00FFAA] group-hover:w-full transition-all duration-500"></div>
                <div className="absolute top-0 right-0 h-[2px] w-0 bg-[#00FFAA] group-hover:w-full transition-all duration-500 delay-200"></div>
              </motion.button>
            </motion.div>
          )}

          {/* Stats Dashboard */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <StatsCard 
              icon={faUsers} 
              title="Active Players" 
              value="102" 
              trend="+23%" 
              color="from-cyan-400 via-blue-500 to-purple-600"
            />
            <StatsCard 
              icon={faCoins} 
              title="Rewards Pool" 
              value="100 ARB" 
              trend="LIVE" 
              color="from-purple-500 via-cyan-400 to-green-400"
            />
            <StatsCard 
              icon={faFire} 
              title="Games Today" 
              value="67" 
              trend="+12%" 
              color="from-pink-500 via-purple-500 to-cyan-400"
            />
            <StatsCard 
              icon={faBullseye} 
              title="WAGMI Blasters Hit"
              value={isLoadingTxCount ? "Loading..." : tokenTxCount ? tokenTxCount.toLocaleString() : "0"} 
              trend="Live" 
              color="from-green-400 via-cyan-400 to-purple-500"
            />
          </motion.div>

          {/* More Info Button */}
          <motion.div 
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <motion.button
              onClick={() => setShowRewardPopup(true)}
              className="w-full bg-transparent text-white font-medium py-5 px-8 border-2 border-[#00FFAA] flex items-center justify-between relative overflow-hidden group"
              whileHover={{ backgroundColor: "rgba(0, 255, 170, 0.05)" }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 border border-[#00FFAA] flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[#00FFAA] text-xs" />
                </div>
                <span className="font-medium tracking-wider text-[#00FFAA]">MORE INFO</span>
              </div>
              <div className="flex items-center">
                <div className="h-[1px] w-10 bg-[#00FFAA] mr-3 opacity-50"></div>
                <FontAwesomeIcon icon={faArrowRight} className="text-sm text-[#00FFAA]" />
              </div>
              
              {/* Animated border effect */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#00FFAA] group-hover:w-full transition-all duration-500"></div>
              <div className="absolute top-0 right-0 h-[2px] w-0 bg-[#00FFAA] group-hover:w-full transition-all duration-500 delay-200"></div>
            </motion.button>
          </motion.div>

        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 px-4 pb-24">
        <motion.div 
          className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <FeatureCard
            icon={faBullseye}
            title="WAGMI Blaster Shooter"
            description="Blast through waves of WAGMI Blasters in this epic space shooter. Destroy coins, collect power-ups, and earn rewards!"
            gradient="from-green-400 to-emerald-600"
            delay={0}
          />
          <FeatureCard
            icon={faCoins}
            title="Earn Rewards"
            description="Every WAGMI Blaster you destroy earns you points and ARB tokens. Compete for the ultimate prize pool!"
            gradient="from-purple-400 to-indigo-600"
            delay={0.2}
          />
          <FeatureCard
            icon={faTrophy}
            title="Compete"
            description="Climb the leaderboards and compete for massive weekly prize pools in our cosmic arena"
            gradient="from-yellow-400 to-orange-600"
            delay={0.4}
          />
        </motion.div>
      </div>
      
      {/* Reward Popup for First-Time Users */}
      {showRewardPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
          onClick={handleCloseRewardPopup}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(90vw, 500px)',
                maxHeight: '85vh',
              borderRadius: '20px',
                padding: '25px',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseRewardPopup}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div 
              className="popup-content-scrollable"
              style={{ 
                textAlign: 'center', 
                color: '#fff',
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                flex: 1,
                overflowY: 'auto',
                paddingRight: '10px',
                paddingTop: '10px'
              }}
            >
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>
                Welcome to WAGMI Blaster! 🚀
              </h2>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px', lineHeight: '1.5' }}>
                Get ready for epic gaming rewards! Play WAGMI Blaster daily and compete for $ARB tokens.
              </p>
              
              {/* How to Play Section */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#00FFAA' }}>
                  🎮 How to Play
                </h3>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>🎯</span>
                    <span><strong>Objective:</strong> Destroy falling stones to score points</span>
              </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>📱</span>
                    <span><strong>Touch Controls:</strong> Touch left/right sides of screen to move</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>📐</span>
                    <span><strong>Sensor Controls:</strong> Tilt your phone to move character</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>💎</span>
                    <span><strong>Scoring:</strong> Each stone destroyed = points based on type</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>❤️</span>
                    <span><strong>Lives:</strong> You have 3 lives - don't let stones hit bottom</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>⚡</span>
                    <span><strong>Power-ups:</strong> Collect power-ups for special abilities</span>
                  </div>
                </div>
              </div>
              {/* Competition Rules Section */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#FFD700' }}>
                  🏆 Competition Rules
                </h3>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>🏅</span>
                    <span><strong>Top 10 Only:</strong> Only top 10 players get $ARB rewards</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>⚖️</span>
                    <span><strong>Fair Play:</strong> No cheating or exploiting bugs</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>👤</span>
                    <span><strong>One Account:</strong> One wallet per player only</span>
                  </div>
                </div>
              </div>

              {/* Reward Info */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#FF6B6B' }}>
                  🎁 Top 10 Players Get Rewards
                </h3>
                  <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <strong>🥇 1st Place (20%)</strong>
                    <span style={{ opacity: 0.9 }}>20.0 $ARB</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>🥈 2nd Place (18%)</strong>
                    <span style={{ opacity: 0.9 }}>18.0 $ARB</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>🥉 3rd Place (15%)</strong>
                    <span style={{ opacity: 0.9 }}>15.0 $ARB</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>4th–6th Place</strong>
                    <span style={{ opacity: 0.9 }}>9.0 $ARB each</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                    <strong>7th–8th Place</strong>
                    <span style={{ opacity: 0.9 }}>6.0 $ARB each</span>
                  </div>
                  <div style={{ marginBottom: '6px' ,display:"flex",alignItems:"center",justifyContent:"space-between"}}>                   
                    <strong>9th–10th Place</strong>
                    <span style={{ opacity: 0.9 }}>4.0 $ARB each</span>
                  </div>
                </div>
              </div>
              
              {/* Gift Box System Section */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#00DDFF' }}>
                  🎁 Daily Gift Box System
                </h3>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>⏰</span>
                    <span><strong>Daily Claims:</strong> 4 gift boxes per 12 hours</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>📊</span>
                    <span><strong>Score-Based:</strong> Higher scores = better reward chances</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>🪙</span>
                    <span><strong>Token Types:</strong> ARB, PEPE, BOOP tokens available</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>🎲</span>
                    <span><strong>Probability:</strong> Score affects "better luck next time" chance</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fixed Button at Bottom */}
            <div style={{ 
              paddingTop: '20px', 
              borderTop: '1px solid rgba(255,255,255,0.1)',
              marginTop: '20px'
            }}>
              <motion.button
                onClick={handleCloseRewardPopup}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Let's Start Blasting! 🚀
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
      
      <BottomNavbar
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onShowGame={setShowGame} 
        onShowStats={setShowStats} 
        onShowLeaderboard={setShowLeaderboard} 
      />
      
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes shoot {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100vw) translateY(100vh);
            opacity: 0;
          }
        }
        
        .popup-content-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .popup-content-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }
        .popup-content-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        .popup-content-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  )
}

interface BottomNavbarProps {
  activeTab: 'home' | 'stats' | 'leaderboard'
  onTabChange: (tab: 'home' | 'stats' | 'leaderboard') => void
  onShowGame: (show: boolean) => void
  onShowStats: (show: boolean) => void
  onShowLeaderboard: (show: boolean) => void
}

// Stats Card Component
const StatsCard = ({ icon, title, value, trend, color }: {
  icon: any;
  title: string;
  value: string;
  trend: string;
  color: string;
}) => (
  <motion.div
    className="relative overflow-hidden border border-[#00FFAA]/30 bg-black/20 p-5 text-white backdrop-blur-sm"
    whileHover={{ borderColor: "rgba(0, 255, 170, 0.5)", backgroundColor: "rgba(0, 255, 170, 0.05)" }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 border border-[#00FFAA] flex items-center justify-center">
          <FontAwesomeIcon icon={icon} className="text-[#00FFAA] text-sm" />
        </div>
        <div className="flex items-center">
          <div className="h-[1px] w-10 bg-[#00FFAA]/30 mr-2"></div>
          <span className="text-xs font-medium text-[#00FFAA] uppercase tracking-wider">
          {value === "..." ? (
            <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-[#00FFAA] rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-[#00FFAA] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-[#00FFAA] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : (
            trend
          )}
        </span>
      </div>
      </div>
      <div className="text-2xl font-light mb-1 text-white">
        {value === "..." ? (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-[#00FFAA]/10 animate-pulse"></div>
            <div className="w-4 h-6 bg-[#00FFAA]/10 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          </div>
        ) : (
          value
        )}
      </div>
      <div className="text-xs text-white/60 uppercase tracking-wider mt-2">{title}</div>
    </div>
    <div className="absolute -bottom-1 -right-1 w-12 h-[1px] bg-[#00FFAA]/30" />
    <div className="absolute -bottom-1 -right-1 h-12 w-[1px] bg-[#00FFAA]/30" />
  </motion.div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, gradient, delay }: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.4 + delay, duration: 0.6 }}
  >
    <div className="relative overflow-hidden border border-[#00FFAA]/40 backdrop-blur-sm p-6 h-full" 
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 border border-[#00FFAA] flex items-center justify-center">
          <FontAwesomeIcon icon={icon} className="text-[#00FFAA]" />
      </div>
        <div className="ml-4 flex-grow">
          <div className="h-[1px] w-full bg-gradient-to-r from-[#00FFAA]/50 to-transparent"></div>
        </div>
      </div>
      
      <h3 className="text-lg font-medium text-[#00FFAA] mb-3 uppercase tracking-wider">{title}</h3>
      <p className="text-black font-medium leading-relaxed text-sm">{description}</p>
      
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-10 h-[1px] bg-[#00FFAA]/30" />
      <div className="absolute top-0 right-0 h-10 w-[1px] bg-[#00FFAA]/30" />
      
      {/* Hover effect */}
      <div className="absolute bottom-0 left-0 h-0 w-full bg-[#00FFAA]/5 group-hover:h-full transition-all duration-500 ease-in-out" />
    </div>
  </motion.div>
);

function BottomNavbar({ activeTab, onTabChange, onShowGame, onShowStats, onShowLeaderboard }: BottomNavbarProps) {
  const handleTabClick = (tab: 'home' | 'stats' | 'leaderboard') => {
    onTabChange(tab)
    
    switch (tab) {
      case 'stats':
        onShowGame(false)
        onShowStats(true)
        onShowLeaderboard(false)
        break
      case 'leaderboard':
        onShowGame(false)
        onShowStats(false)
        onShowLeaderboard(true)
        break
      case 'home':
      default:
        onShowGame(false)
        onShowStats(false)
        onShowLeaderboard(false)
        break
    }
  }

  const tabs = [
    { id: 'home', icon: faHome, label: 'Home', color: 'from-cyan-400 to-blue-500' },
    { id: 'stats', icon: faChartBar, label: 'Analytics', color: 'from-green-400 to-cyan-400' },
    { id: 'leaderboard', icon: faTrophy, label: 'Champions', color: 'from-purple-600 to-cyan-500' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div 
        className="relative overflow-hidden border-t border-l border-r border-[#00FFAA]/20 backdrop-blur-md mx-auto max-w-md"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Digital grid background */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 170, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 170, 0.3) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>
        
        <div className="relative z-10 flex justify-around items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className="relative flex flex-col items-center justify-center px-5 py-4 transition-all duration-300 border-b-2"
                style={{
                  borderColor: isActive ? '#00FFAA' : 'transparent'
                }}
                whileHover={{ backgroundColor: "rgba(0, 255, 170, 0.05)" }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon */}
                <motion.div
                  animate={{
                    color: isActive ? '#00FFAA' : 'rgba(255, 255, 255, 0.6)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <FontAwesomeIcon 
                    icon={tab.icon} 
                    className="text-sm mb-1 relative z-10" 
                  />
                </motion.div>
                
                {/* Label */}
                <motion.div 
                  className="text-[10px] uppercase tracking-wider relative z-10"
                  animate={{
                    color: isActive ? '#00FFAA' : 'rgba(255, 255, 255, 0.6)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.div>
                
                {/* Active indicator line */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#00FFAA]"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, 
  faCopy, 
  faUser, 
  faBullseye, 
  faCoins, 
  faCalendarDay,
  faTrophy,
  faHistory,
  faChartLine,
  faCheckCircle,
  faExternalLinkAlt,
  faRefresh,
  faShare,
  faRocket
} from '@fortawesome/free-solid-svg-icons';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { getAverageScore, getBestScore, getTotalGamesFromScores } from '@/docs/lib/game-counter';
import { APP_URL } from '@/docs/lib/constants';
import { generateAuthHeaders } from '@/docs/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';


interface UserStats {
  userAddress: string;
  dailyMintCount: number;
  mintHistory: Array<{
    score: number;
    timestamp: number;
    trait?: string;
    tokenId?: number;
  }>;
  topScores: Array<{
    userAddress: string;
    score: number;
    timestamp: number;
  }>;
  dailyMintsRemaining: number;
  totalGamesPlayed?: number;
  averageScore?: number;
  bestScore?: number;
  totalNFTsMinted?: number;
  currentSeasonScore?: number | null;
  ath?: number | null;
  level?: number | null;
  hasMintedToday?: boolean;
  nftsByTrait?: {
    common: number;
    epic: number;
    rare: number;
    legendary: number;
  };
  giftBoxStats?: {
    totalClaims: number;
    totalArb: number;
    totalPepe: number;
    totalBoop: number;
    claimsToday: number;
    remainingClaims: number;
    totalRewardsClaimed: number;
    lastGiftBoxUpdate?: string | null;
  };
}

export default function UserStats() {
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ethBalance, setEthBalance] = useState<string>('0.00');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [localBestScore, setLocalBestScore] = useState<number | null>(null);
  const [localGamesPlayed, setLocalGamesPlayed] = useState<number>(0);
  const [localAverageScore, setLocalAverageScore] = useState<number>(0);
  const [localBestFromScores, setLocalBestFromScores] = useState<number>(0);
  const [totalGamesFromScores, setTotalGamesFromScores] = useState<number>(0);
  const [sharing, setSharing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Share reward states
  const [shareRewardLoading, setShareRewardLoading] = useState(false);
  const [shareRewardCooldown, setShareRewardCooldown] = useState<{
    canClaim: boolean;
    timeUntilNextShare: number;
    lastShareTime?: number;
  }>({ canClaim: true, timeUntilNextShare: 0 });
  const [shareRewardSuccess, setShareRewardSuccess] = useState(false);

  // Memoized star and shooting star data for stable animation
  const starData = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const size = Math.random() * 6 + 3;
      const starColor = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffff88' : '#88ccff';
      return {
        size,
        color: starColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.6 + 0.2,
        textShadow: `0 0 ${size/2}px ${starColor}`,
      };
    }),
    []
  );
  const shootingStarData = useMemo(() =>
    Array.from({ length: 2 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      animation: `shoot ${Math.random() * 20 + 15}s linear infinite`,
      animationDelay: `${Math.random() * 15}s`,
    })),
    []
  );

  // Get best score from localStorage
  const getBestScoreFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedScore = localStorage.getItem('candyBestScore');
      console.log('Stored best score:', storedScore);
      if (storedScore) {
        const score = parseInt(storedScore, 10);
        if (!isNaN(score) && score > 0) {
          setLocalBestScore(score);
          return;
        }
      }
    }
    setLocalBestScore(null);
  };

  // Get games played count from localStorage
  const getGamesPlayedFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedCount = localStorage.getItem('candyGamesPlayed');
      console.log('Stored games played:', storedCount);
      if (storedCount) {
        const count = parseInt(storedCount, 10);
        if (!isNaN(count) && count >= 0) {
          setLocalGamesPlayed(count);
          return;
        }
      }
    }
    setLocalGamesPlayed(0);
  };

  // Get calculated stats from scores
  const getCalculatedStats = () => {
    const avgScore = getAverageScore();
    const bestScore = getBestScore();
    const totalGames = getTotalGamesFromScores();
    
    console.log('Calculated stats:', { avgScore, bestScore, totalGames });
    
    setLocalAverageScore(avgScore);
    setLocalBestFromScores(bestScore);
    setTotalGamesFromScores(totalGames);
    
    // Set debug info
    setDebugInfo(`Avg: ${avgScore}, Best: ${bestScore}, Games: ${totalGames}`);
  };

  // Share stats function using Farcaster ComposerCast
  const shareStats = async () => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    setSharing(true);
    try {
      // Build the stats message
      const shareStats = [];
      
      // Add Rewards Claimed count
      const totalRewards = stats?.giftBoxStats?.totalRewardsClaimed || 0;
      if (totalRewards > 0) {
        shareStats.push(`🎁 ${totalRewards} Rewards Claimed`);
      }
      
   
      
      // Add best score
      const bestScore = Math.max(localBestScore || 0, localBestFromScores);
      if (bestScore > 0) {
        shareStats.push(`🏆 ${bestScore.toLocaleString()} Best Score`);
      }
      
      // Add amount won if > 0
      if(stats?.giftBoxStats){
        const totalArb = stats.giftBoxStats.totalArb || 0;
        const totalPepe = stats.giftBoxStats.totalPepe || 0;
        const totalBoop = stats.giftBoxStats.totalBoop || 0;
        
        if (totalArb > 0) {
          shareStats.push(`💰 ${totalArb.toFixed(2)} $ARB`);
        }
        if (totalPepe > 0) {
          shareStats.push(`🐸 ${totalPepe.toLocaleString()} $PEPE`);
        }
        if (totalBoop > 0) {
          shareStats.push(`🎯 ${totalBoop.toLocaleString()} $BOOP`);
        }
      }
      // Add average score
      if (localAverageScore > 0) {
        shareStats.push(`📊 ${localAverageScore.toLocaleString()} Avg Score`);
      }
      
   
       

      // Create the share message
      const statsText = shareStats.length > 0 ? shareStats.join(' • ') : 'Just started playing!';
      const username = context?.user?.username || 'WAGMI Blaster Player';
      
      const shareMessage = `JUST BAGGED MASSIVE WINS on WAGMI Blaster! 💰

${statsText}

⚡ EARN FAST before the DAILY REWARD POOL disappears! 🔥
💎 This game is literally PRINTING MONEY — who’s ready to GET RICH? 👀

🎯 Drop your best score below… let’s see who’s really BUILT DIFFERENT!

Oh, and btw — you can also join the WEEKLY REWARD CHALLENGE and earn up to $50! 🚀`;
      
      await actions.composeCast({
        text: shareMessage,
        embeds: [APP_URL || "https://chain-crush-black.vercel.app/"]
      });
      
    } catch (error) {
      console.error('Failed to share stats:', error);
    } finally {
      setSharing(false);
    }
  };

  // Share with reward function (6-hour cooldown, gives 2 gift box claims)
  const shareWithReward = async () => {
    if (!actions || !address || !context?.user?.fid) {
      console.error('Required data not available');
      return;
    }

    if (!shareRewardCooldown.canClaim) {
      console.log('Share reward still in cooldown');
      return;
    }

    // Immediately disable button and start cooldown
    setShareRewardLoading(true);
    setShareRewardCooldown({
      canClaim: false,
      timeUntilNextShare: 6 * 60 * 60 * 1000, // 6 hours in ms
      lastShareTime: Date.now()
    });

    try {
      // First, share the stats with hyped message
      await shareStats();
      
      // Then claim the share reward
      const authHeaders = generateAuthHeaders();
      const response = await fetch('/api/share-reward', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          fid: context.user.fid
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShareRewardSuccess(true);
        // Refresh stats to show updated gift box claims
        await fetchStats();
        
        // Hide success message after 3 seconds
        setTimeout(() => setShareRewardSuccess(false), 3000);
      } else {
        console.error('Failed to claim share reward:', result.error);
        // If server says cooldown is different, update it
        if (result.timeUntilNextShare) {
          setShareRewardCooldown({
            canClaim: false,
            timeUntilNextShare: result.timeUntilNextShare,
            lastShareTime: result.lastShareTime
          });
        }
      }
    } catch (error) {
      console.error('Error sharing with reward:', error);
      // On error, re-enable the button
      setShareRewardCooldown({
        canClaim: true,
        timeUntilNextShare: 0,
        lastShareTime: undefined
      });
    } finally {
      setShareRewardLoading(false);
    }
  };

  // Check share reward eligibility
  const checkShareRewardEligibility = async () => {
    if (!address || !context?.user?.fid) return;

    try {
      const authHeaders = generateAuthHeaders();
      const response = await fetch(`/api/share-reward?userAddress=${address}&fid=${context.user.fid}`, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setShareRewardCooldown({
          canClaim: result.canClaim,
          timeUntilNextShare: result.timeUntilNextShare || 0,
          lastShareTime: result.lastShareTime
        });
      }
    } catch (error) {
      console.error('Error checking share reward eligibility:', error);
    }
  };

  // Format time remaining for cooldown
  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };



  // Helper function to copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Fetch ETH balance using ethers.js
  const fetchEthBalance = async () => {
    if (!address) return;
    setBalanceLoading(true);
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      // Format to 4 decimal places
      const roundedBalance = parseFloat(formattedBalance).toFixed(4);
      setEthBalance(roundedBalance);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setEthBalance('Error');
    } finally {
      setBalanceLoading(false);
    }
  };


  // Fetch user stats function
  const fetchStats = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const fid = context?.user?.fid;
      const [statsResponse, giftBoxResponse, giftBoxCheckResponse] = await Promise.all([
        fetch(`/api/user-stats?userAddress=${address}`),
        fetch(`/api/claim-gift-box?userAddress=${address}&fid=${fid}&stats=true`),
        fetch(`/api/claim-gift-box?userAddress=${address}&fid=${fid}`)
      ]);
      
      const statsResult = await statsResponse.json();
      const giftBoxResult = await giftBoxResponse.json();
      const giftBoxCheck = await giftBoxCheckResponse.json();
      
      console.log('Stats result:', statsResult);
      console.log('Gift box result:', giftBoxResult);
      console.log('Gift box check result:', giftBoxCheck);
      
      if (statsResult.success) {
        const data = statsResult.data;
        console.log('Stats data:', data);
        
        // Get gift box stats from the response
        const giftBoxStats = giftBoxResult.success ? giftBoxResult.stats : null;
        console.log('Gift box stats from API:', giftBoxStats);
        
        // Calculate remaining claims based on giftBoxClaimsInPeriod from gameScore
        let remainingClaims = 5;
        let claimsToday = 0;
        let lastGiftBoxUpdate = null;
        
        console.log('Checking giftBoxCheck:', giftBoxCheck);
        console.log('giftBoxCheck.success:', giftBoxCheck.success);
        console.log('giftBoxCheck.gameScore:', giftBoxCheck.gameScore);
        console.log('Stats data giftBoxClaimsInPeriod:', data.giftBoxClaimsInPeriod);
        console.log('Stats data lastGiftBoxUpdate:', data.lastGiftBoxUpdate);
        
        // Check if data is in statsResult.data (your data structure)
        if (data.giftBoxClaimsInPeriod !== undefined) {
          const giftBoxClaimsInPeriod = data.giftBoxClaimsInPeriod || 0;
          console.log('giftBoxClaimsInPeriod found in stats data:', giftBoxClaimsInPeriod);
          claimsToday = giftBoxClaimsInPeriod; // Claims Today = giftBoxClaimsInPeriod
          remainingClaims = Math.max(0, 5 - giftBoxClaimsInPeriod); // Remaining = 5 - giftBoxClaimsInPeriod
          lastGiftBoxUpdate = data.lastGiftBoxUpdate;
          console.log('Calculated from stats data - claimsToday:', claimsToday, 'remainingClaims:', remainingClaims);
        }
        // Check if data is directly in giftBoxCheck (current API response structure)
        else if (giftBoxCheck.success && giftBoxCheck.claimsToday !== undefined) {
          console.log('Using giftBoxCheck direct values');
          claimsToday = giftBoxCheck.claimsToday; // Claims Today = claimsToday
          remainingClaims = giftBoxCheck.remainingClaims; // Remaining = remainingClaims
          
          // Calculate next reset time: lastClaimTime + 12 hours
          if (giftBoxCheck.lastClaimTime) {
            const lastClaimTime = new Date(giftBoxCheck.lastClaimTime);
            const nextResetTime = new Date(lastClaimTime.getTime() + (12 * 60 * 60 * 1000)); // Add 12 hours
            lastGiftBoxUpdate = nextResetTime.toISOString();
            console.log('Next reset time calculated:', nextResetTime.toISOString());
          }
          
          console.log('Using giftBoxCheck values - claimsToday:', claimsToday, 'remainingClaims:', remainingClaims);
        }
        // Fallback to giftBoxCheck.gameScore if not found in stats data
        else if (giftBoxCheck.success && giftBoxCheck.gameScore) {
          const giftBoxClaimsInPeriod = giftBoxCheck.gameScore.giftBoxClaimsInPeriod || 0;
          console.log('giftBoxClaimsInPeriod found in giftBoxCheck.gameScore:', giftBoxClaimsInPeriod);
          claimsToday = giftBoxClaimsInPeriod; // Claims Today = giftBoxClaimsInPeriod
          remainingClaims = Math.max(0, 5 - giftBoxClaimsInPeriod); // Remaining = 5 - giftBoxClaimsInPeriod
          lastGiftBoxUpdate = giftBoxCheck.gameScore.lastGiftBoxUpdate;
          console.log('Calculated from giftBoxCheck.gameScore - claimsToday:', claimsToday, 'remainingClaims:', remainingClaims);
        } else {
          console.log('No giftBoxClaimsInPeriod data found, using defaults');
        }
        
        // Update gift box stats with calculated values
        if (giftBoxStats) {
          giftBoxStats.claimsToday = claimsToday;
          giftBoxStats.remainingClaims = remainingClaims;
          giftBoxStats.lastGiftBoxUpdate = lastGiftBoxUpdate;
        }
        
        setStats({
          ...data,
          dailyMintsRemaining: Math.max(0, 5 - (data.dailyMintCount || 0)),
          giftBoxStats
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchEthBalance()
    ]);
    getBestScoreFromStorage(); // This is synchronous, so no need to await
    getGamesPlayedFromStorage(); // This is synchronous, so no need to await
    getCalculatedStats(); // This is synchronous, so no need to await
    setRefreshing(false);
  };

  // Debug function to add test data (remove in production)
  const addTestData = () => {
    if (typeof window !== 'undefined') {
      // Add some test scores
      const testScores = [1500, 2300, 1800, 3200, 2100, 2800, 1900, 2500];
      localStorage.setItem('candyGameScores', JSON.stringify(testScores));
      
      // Set games played
      localStorage.setItem('candyGamesPlayed', '8');
      
      // Set best score
      localStorage.setItem('candyBestScore', '3200');
      
      // Refresh the stats
      getBestScoreFromStorage();
      getGamesPlayedFromStorage();
      getCalculatedStats();
    }
  };

  useEffect(() => {
    if (address) {
      fetchStats();
      fetchEthBalance();
      checkShareRewardEligibility();
    }
    // Always get best score and games played from localStorage regardless of wallet connection
    getBestScoreFromStorage();
    getGamesPlayedFromStorage();
    getCalculatedStats();
  }, [address]);

  // Real-time countdown for share reward cooldown
  useEffect(() => {
    if (!shareRewardCooldown.canClaim && shareRewardCooldown.timeUntilNextShare > 0) {
      const interval = setInterval(() => {
        setShareRewardCooldown(prev => {
          const newTimeRemaining = prev.timeUntilNextShare - 1000; // Subtract 1 second
          
          if (newTimeRemaining <= 0) {
            // Cooldown expired, user can claim again
            return {
              canClaim: true,
              timeUntilNextShare: 0,
              lastShareTime: prev.lastShareTime
            };
          }
          
          return {
            ...prev,
            timeUntilNextShare: newTimeRemaining
          };
        });
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [shareRewardCooldown.canClaim, shareRewardCooldown.timeUntilNextShare]);

  // Listen for localStorage changes to update best score and games played in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'candyBestScore') {
        getBestScoreFromStorage();
      } else if (e.key === 'candyGamesPlayed') {
        getGamesPlayedFromStorage();
      } else if (e.key === 'candyGameScores') {
        getCalculatedStats();
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case the values are updated in the same tab
    const interval = setInterval(() => {
      getBestScoreFromStorage();
      getGamesPlayedFromStorage();
      getCalculatedStats();
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)' }}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4 text-white">🔗</div>
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-white/70">Please connect your wallet to view your stats</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)' }}>
        {/* Animated Stars Background */}
        <div className="absolute inset-0 overflow-hidden">
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
        
        <div className="relative z-10 px-6 pb-24">
          {/* Header Skeleton */}
          <motion.div 
            className="pt-12 pb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-8">
              {/* Profile Picture Skeleton */}
              <div className="relative mr-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 animate-pulse"></div>
        </div>
        
              <div className="flex-grow">
                {/* Welcome Text Skeleton */}
                <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-4 w-64 animate-pulse"></div>
                
                {/* Buttons Skeleton */}
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-24 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
                  <div className="h-10 w-20 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
                  <div className="h-10 w-28 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards Skeleton */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden border border-[#00FFAA]/30 bg-black/20 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 border border-[#00FFAA] bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
                  <div className="w-12 h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
          </div>
                <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-1 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-3/4 animate-pulse"></div>
                <div className="absolute -bottom-1 -right-1 w-12 h-[1px] bg-[#00FFAA]/30" />
                <div className="absolute -bottom-1 -right-1 h-12 w-[1px] bg-[#00FFAA]/30" />
            </div>
            ))}
          </motion.div>

          {/* Additional Stats Cards Skeleton */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden border border-[#00FFAA]/30 bg-black/20 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 border border-[#00FFAA] bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
                  <div className="w-12 h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
          </div>
                <div className="h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded mb-1 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-3/4 animate-pulse"></div>
                <div className="absolute -bottom-1 -right-1 w-12 h-[1px] bg-[#00FFAA]/30" />
                <div className="absolute -bottom-1 -right-1 h-12 w-[1px] bg-[#00FFAA]/30" />
              </div>
            ))}
          </motion.div>

          {/* Gift Box Stats Skeleton */}
          <motion.div 
            className="border border-[#00FFAA]/40 backdrop-blur-sm p-6 mb-8"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 border border-[#00FFAA] bg-gradient-to-r from-gray-700 to-gray-600 rounded mr-4 animate-pulse"></div>
              <div className="flex-grow">
                <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-[1px] w-full bg-gradient-to-r from-[#00FFAA]/50 to-transparent"></div>
          </div>
        </div>

            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center p-3 border border-[#00FFAA]/20 bg-black/30">
                  <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-r from-gray-700 to-gray-600 rounded animate-pulse"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-12 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-16 mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
          </motion.div>
        </div>

        {/* Same animations as home page */}
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
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)' }}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4 text-white">📊</div>
          <h2 className="text-2xl font-bold text-white">No Stats Available</h2>
          <p className="text-white/70">Start playing to generate your statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #001122 0%, #001122 90%, #f9f7f4 100%)' }}>
      {/* Animated Stars Background - Same as home page */}
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
      
      <div className="relative z-10 px-6 pb-24">
      {/* Header with User Profile */}
      <motion.div 
          className="pt-12 pb-8"
          initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring" }}
        >
          <div className="flex items-center mb-8">
            <motion.div
              className="relative mr-4"
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <div className="w-20 h-20 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#0088FF] rounded-xl blur-lg opacity-40 animate-pulse"></div>
          {context?.user?.pfpUrl ? (
            <img 
              src={context.user.pfpUrl} 
              alt="Profile" 
                    className="relative w-20 h-20 rounded-xl shadow-lg border-2 border-[#00FFAA]/30 object-cover"
            />
          ) : (
                  <div className="relative w-20 h-20 rounded-xl shadow-lg border-2 border-[#00FFAA]/30 bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
            </div>
          )}
              </div>
            </motion.div>
            
            <div className="flex-grow">
              {/* <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-2">
                Player <span className="text-[#00FFAA]">Analytics</span>
              </h1> */}
              <p className="text-lg text-white/70 font-light mb-2">
                Welcome back, <span className="text-[#00FFAA] font-normal">{context?.user?.username || 'Player'}</span>
              </p>
              
              {/* Wallet Address and Balance */}
              <div className="mb-4 p-3 border border-[#00FFAA]/20 bg-black/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faWallet} className="text-[#00FFAA] text-sm" />
                    <span className="text-xs text-[#00FFAA] uppercase tracking-wider">Wallet Address</span>
                  </div>
                  <motion.button
                    onClick={copyAddress}
                    className="text-[#00FFAA] hover:text-[#00FFAA]/80 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FontAwesomeIcon icon={faCopy} className="text-xs" />
                  </motion.button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/80 font-mono">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCoins} className="text-[#00FFAA] text-xs" />
                    <span className="text-sm text-white/80">
                      {balanceLoading ? (
                        <span className="text-[#00FFAA]">Loading...</span>
                      ) : (
                        `${ethBalance} ETH`
                      )}
                    </span>
                  </div>
                </div>
                {copiedAddress && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-2 right-2 bg-[#00FFAA] text-black text-xs px-2 py-1 rounded"
                  >
                    Copied!
                  </motion.div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="bg-transparent text-[#00FFAA] font-medium py-2 px-4 border border-[#00FFAA]/30 flex items-center space-x-2 hover:bg-[#00FFAA]/10 transition-all duration-300"
                  whileHover={{ backgroundColor: "rgba(0, 255, 170, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FontAwesomeIcon icon={faRefresh} className={`${refreshing ? 'animate-spin' : ''} text-sm`} />
                  <span className="text-sm">{refreshing ? 'REFRESHING...' : 'REFRESH'}</span>
                </motion.button>
                
                                 <motion.button
                   onClick={shareStats}
                   disabled={sharing}
                   className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium py-2 px-4 flex items-center space-x-2 hover:from-purple-700 hover:to-pink-600 transition-all duration-300"
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none">
                     <rect width="256" height="256" rx="56" fill="#7C65C1"></rect>
                     <path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path>
                   </svg>
                   <span className="text-sm">{sharing ? 'SHARING...' : 'SHARE'}</span>
                 </motion.button>

                 
                 {/* Debug button (remove in production) */}
                
              </div>
              
                 {/* Share with Reward Button */}
                 <motion.button
                   onClick={shareWithReward}
                   disabled={shareRewardLoading || !shareRewardCooldown.canClaim}
                   className={`font-medium py-2 px-4 flex items-center space-x-2 transition-all duration-300 ${
                     shareRewardCooldown.canClaim && !shareRewardLoading
                       ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 shadow-lg' 
                       : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-60'
                   }`}
                   whileHover={shareRewardCooldown.canClaim && !shareRewardLoading ? { scale: 1.02 } : {}}
                   whileTap={shareRewardCooldown.canClaim && !shareRewardLoading ? { scale: 0.98 } : {}}
                   style={{marginTop:"13px"}}
                 >
                   <FontAwesomeIcon icon={faRocket} className="text-sm" />
                   <span className="text-sm">
                     {shareRewardLoading 
                       ? 'SHARING...' 
                       : shareRewardCooldown.canClaim 
                         ? 'SHARE + 2 CLAIMS 🚀' 
                         : `COOLDOWN: ${formatTimeRemaining(shareRewardCooldown.timeUntilNextShare)}`
                     }
                   </span>
                 </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {(stats.giftBoxStats?.totalRewardsClaimed || 0) > 0 && (
            <StatsCard 
              icon={faCoins} 
              title="Rewards Claimed" 
              value={(stats.giftBoxStats?.totalRewardsClaimed || 0).toString()} 
              trend="TOTAL" 
            />
          )}
          {(Math.max(localBestScore || 0, localBestFromScores, stats.bestScore || 0) || 0) > 0 && (
            <StatsCard 
              icon={faTrophy} 
              title="Best Score" 
              value={Math.max(localBestScore || 0, localBestFromScores, stats.bestScore || 0).toLocaleString()} 
              trend="HIGH" 
            />
          )}
          {(Math.max(localGamesPlayed, totalGamesFromScores) || 0) > 0 && (
            <StatsCard 
              icon={faChartLine} 
              title="Games Played" 
              value={Math.max(localGamesPlayed, totalGamesFromScores).toString()} 
              trend="COUNT" 
            />
          )}
          <StatsCard 
            icon={faCheckCircle} 
            title="Daily Boxes Left" 
            value={stats.giftBoxStats?.remainingClaims?.toString() || '0'} 
            trend={(stats.giftBoxStats?.remainingClaims || 0) > 0 ? "READY" : "LEFT"} 
            showProgressBar={true}
            progressValue={stats.giftBoxStats?.remainingClaims || 0}
            maxProgress={4}
          />
        </motion.div>

        {/* Additional Stats Cards */}
          <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {stats.currentSeasonScore && stats.currentSeasonScore > 0 && (
            <StatsCard 
              icon={faCalendarDay} 
              title="Current Season Score" 
              value={stats.currentSeasonScore.toLocaleString()} 
              trend="SEASON" 
            />
          )}
          {stats.ath && stats.ath > 0 && (
            <StatsCard 
              icon={faHistory} 
              title="All Time High" 
              value={stats.ath.toLocaleString()} 
              trend="ATH" 
            />
          )}
          {stats.level && stats.level > 1 && (
            <StatsCard 
              icon={faUser} 
              title="Player Level" 
              value={stats.level.toString()} 
              trend="LEVEL" 
            />
          )}
          {(localAverageScore || 0) > 0 && (
            <StatsCard 
              icon={faRocket} 
              title="Average Score" 
              value={localAverageScore.toLocaleString()} 
              trend="AVG" 
            />
          )}
        </motion.div>

                 {/* Debug Info (remove in production) */}
       

      {/* Daily Gift Box Status */}
         {stats.giftBoxStats && (
      <motion.div 
             className="border border-[#00FFAA]/40 backdrop-blur-sm p-6 text-white mb-8"
             style={{
               background: 'rgba(255, 255, 255, 0.05)',
               boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
             }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5, duration: 0.6 }}
           >
             <div className="flex items-center mb-6">
               <div className="w-10 h-10 border border-[#00FFAA] flex items-center justify-center mr-4">
                 <span className="text-[#00FFAA] text-xl">🎁</span>
        </div>
               <div className="flex-grow">
                 <h3 className="text-lg font-bold text-[#00FFAA] uppercase tracking-wider">Daily Gift Box Status</h3>
                 <div className="h-[1px] w-full bg-gradient-to-r from-[#00FFAA]/50 to-transparent mt-1"></div>
          </div>
        </div>
        
             {/* Daily Status Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
               <div className="text-center p-4 border border-[#00FFAA]/20 bg-black/30">
                 <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                   <FontAwesomeIcon icon={faCalendarDay} className="text-[#00FFAA] text-xl" />
          </div>
                 <p className="text-xs text-[#00FFAA] uppercase tracking-wider">Claims Today</p>
                 <p className="text-2xl font-bold text-white">{stats.giftBoxStats.claimsToday}</p>
                 <p className="text-xs text-white/60">/ 5 per period</p>
        </div>
        
               <div className="text-center p-4 border border-[#00FFAA]/20 bg-black/30">
                 <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                   <FontAwesomeIcon icon={faCheckCircle} className="text-[#00FFAA] text-xl" />
            </div>
                 <p className="text-xs text-[#00FFAA] uppercase tracking-wider">Remaining</p>
                 <p className="text-2xl font-bold text-white">{stats.giftBoxStats.remainingClaims}</p>
                 <p className="text-xs text-white/60">boxes left</p>
                 
                 {/* Progress Bar */}
                 <div className="mt-3">
                   <div className="w-full bg-black/50 rounded-full h-2 border border-[#00FFAA]/20">
                     <div 
                       className="bg-gradient-to-r from-[#00FFAA] to-[#0088FF] h-2 rounded-full transition-all duration-500"
                       style={{ width: `${(stats.giftBoxStats.remainingClaims / 5) * 100}%` }}
                     ></div>
                   </div>
                 </div>
            </div>
               
               <div className="text-center p-4 border border-[#00FFAA]/20 bg-black/30">
                 <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                   <FontAwesomeIcon icon={faHistory} className="text-[#00FFAA] text-xl" />
          </div>
                 <p className="text-xs text-[#00FFAA] uppercase tracking-wider">Total Claims</p>
                 <p className="text-2xl font-bold text-white">{stats.giftBoxStats.totalClaims}</p>
                 <p className="text-xs text-white/60">all time</p>
            </div>
            </div>

            {/* Reset Time Information */}
            {stats.giftBoxStats.lastGiftBoxUpdate && (
              <div className="mb-6 p-4 border border-[#00FFAA]/20 bg-black/30 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <FontAwesomeIcon icon={faRefresh} className="text-[#00FFAA] mr-2" />
                  <span className="text-sm text-[#00FFAA] font-medium">Next Reset</span>
                </div>
                <p className="text-center text-white/80 text-sm">
                  {(() => {
                    const now = new Date();
                    const resetTime = new Date(stats.giftBoxStats.lastGiftBoxUpdate);
                    const timeDiff = resetTime.getTime() - now.getTime();
                    
                    if (timeDiff <= 0) {
                      return "Available now!";
                    }
                    
                    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (hours > 0) {
                      return `${hours}h ${minutes}m remaining`;
                    } else {
                      return `${minutes}m remaining`;
                    }
                  })()}
                </p>
              </div>
            )}

             {/* Token Rewards Summary */}
             <div className="border-t border-[#00FFAA]/20 pt-4">
               <h4 className="text-sm font-bold text-[#00FFAA] uppercase tracking-wider mb-3">Total Rewards Collected</h4>
               <div className="grid grid-cols-3 gap-4">
                 <div className="text-center p-3 border border-[#00FFAA]/20 bg-black/30">
              <div className="w-8 h-8 mx-auto mb-1">
                <img src="/candy/1.png" alt="ARB" className="w-full h-full object-contain" />
              </div>
                   <p className="text-xs text-[#00FFAA]">ARB</p>
                   <p className="text-lg font-bold text-white">{stats.giftBoxStats.totalArb.toFixed(2)}</p>
            </div>
                 <div className="text-center p-3 border border-[#00FFAA]/20 bg-black/30">
              <div className="w-8 h-8 mx-auto mb-1">
                <img src="/candy/2.png" alt="PEPE" className="w-full h-full object-contain" />
              </div>
                   <p className="text-xs text-[#00FFAA]">PEPE</p>
                   <p className="text-lg font-bold text-white">{stats.giftBoxStats.totalPepe.toLocaleString()}</p>
            </div>
                 <div className="text-center p-3 border border-[#00FFAA]/20 bg-black/30">
              <div className="w-8 h-8 mx-auto mb-1">
                <img src="/candy/player.png" alt="BOOP" className="w-full h-full object-contain" />
              </div>
                   <p className="text-xs text-[#00FFAA]">BOOP</p>
                   <p className="text-lg font-bold text-white">{stats.giftBoxStats.totalBoop.toLocaleString()}</p>
            </div>
          </div>
             </div>

             <div className="absolute top-0 right-0 w-10 h-[1px] bg-[#00FFAA]/30" />
             <div className="absolute top-0 right-0 h-10 w-[1px] bg-[#00FFAA]/30" />
        </motion.div>
      )}

      {/* Same animations as home page */}
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

        {/* Share Reward Success Notification */}
        <AnimatePresence>
          {shareRewardSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl border border-green-400/30 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faRocket} className="text-white text-sm" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">🚀 SHARE REWARD CLAIMED!</div>
                    <div className="text-xs opacity-90">+2 Gift Box Claims Added - Keep Earning!</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  
  );
}

// Stats Card Component (same as home page)
const StatsCard = ({ 
  icon, 
  title, 
  value, 
  trend, 
  showProgressBar = false, 
  progressValue = 0, 
  maxProgress = 4 
}: {
  icon: any;
  title: string;
  value: string;
  trend: string;
  showProgressBar?: boolean;
  progressValue?: number;
  maxProgress?: number;
}) => (
              <motion.div 
    className="relative overflow-hidden border border-[#00FFAA]/30 bg-black/20 p-4 text-white backdrop-blur-sm"
    whileHover={{ borderColor: "rgba(0, 255, 170, 0.5)", backgroundColor: "rgba(0, 255, 170, 0.05)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 border border-[#00FFAA] flex items-center justify-center">
          <FontAwesomeIcon icon={icon} className="text-[#00FFAA] text-sm" />
                  </div>
        <span className="text-xs font-medium text-[#00FFAA] uppercase tracking-wider">
          {trend}
                  </span>
          </div>
      <div className="text-2xl font-light mb-1 text-white">{value}</div>
      <div className="text-xs text-white/60 uppercase tracking-wider">{title}</div>
      
      {/* Progress Bar for Gift Box Remaining */}
      {showProgressBar && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>0</span>
            <span>{maxProgress}</span>
        </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-[#00FFAA] to-[#0088FF] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(progressValue / maxProgress) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
                </div>
                </div>
      )}
              </div>
    <div className="absolute -bottom-1 -right-1 w-12 h-[1px] bg-[#00FFAA]/30" />
    <div className="absolute -bottom-1 -right-1 h-12 w-[1px] bg-[#00FFAA]/30" />
            </motion.div>
  );

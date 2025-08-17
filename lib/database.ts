import clientPromise from './mongodb';

export interface UserMint {
  userAddress: string;
  score: number;
  timestamp: number;
  tokenId?: number;
  trait?: string;
  signature: string;
}

export interface DailyMintCount {
  userAddress: string;
  date: string; // YYYY-MM-DD format
  count: number;
  lastMintTime: number;
}

export interface GameScore {
  fid: number;
  pfpUrl: string;
  username?: string;
  score: number; // All-time high (ATH) - only updated when beaten
  currentSeasonScore?: number; // Current season score - updated every game
  level: number;
  userAddress?: string;
  timestamp: number;
  duration?: number; // Game duration in seconds
  nftMinted?: boolean;
  nftName?: string;
  nftCount?: number; // Added for NFT tracking
  lastNftMint?: number; // Added for NFT tracking
  hasNft?: boolean; // Added for NFT tracking
  faucetClaimed?: boolean; // Added for faucet tracking
  hasMintedToday?: boolean; // Track if user has minted today
  lastMintDate?: string; // YYYY-MM-DD format of last mint date
  totalRewardsClaimed?: number; // Total gift box rewards claimed (all-time)
}

export interface FaucetClaim {
  userAddress: string;
  amount: string;
  transactionHash: string;
  timestamp: number;
  blockNumber: number;
  walletIndex?: number; // Which wallet was used (1-5)
}

export interface UsedAuthKey {
  fusedKey: string;
  randomString: string;
  timestamp: number;
  ipAddress: string;
  createdAt: Date;
}

export interface GameSession {
  userAddress: string;
  fid?: number;
  periodStartTime: number;
  gamesPlayed: number;
  lastGameTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftBoxClaim {
  userAddress: string;
  fid?: number;
  tokenType: 'arb' | 'pepe' | 'boop' | 'none';
  amount: number;
  timestamp: number;
  signature?: string;
  transactionHash?: string;
  createdAt: Date;
}

export interface DailyGiftBoxCount {
  userAddress: string;
  date: string; // YYYY-MM-DD format
  count: number;
  lastClaimTime: number;
}

// Authentication key management functions
export async function isAuthKeyUsed(fusedKey: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    if (!client) {
      console.warn('MongoDB client not available');
      return false;
    }
    const db = client.db('bounce');
    
    const usedKey = await db.collection('usedAuthKeys').findOne({ fusedKey });
    return !!usedKey;
  } catch (error) {
    console.warn('Error checking auth key:', error);
    return false;
  }
}

export async function storeUsedAuthKey(authKeyData: Omit<UsedAuthKey, 'createdAt'>): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  await db.collection('usedAuthKeys').insertOne({
    ...authKeyData,
    createdAt: new Date()
  });
}

export async function cleanupOldAuthKeys(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  // Remove keys older than 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  await db.collection('usedAuthKeys').deleteMany({
    createdAt: { $lt: twentyFourHoursAgo }
  });
}

// Optional database validation for critical operations
export async function validateAuthKeyInDatabase(fusedKey: string, randomString: string): Promise<boolean> {
  try {
    const isUsed = await isAuthKeyUsed(fusedKey);
    if (isUsed) {
      return false;
    }
    
    // Store the key for future validation
    await storeUsedAuthKey({
      fusedKey,
      randomString,
      timestamp: Date.now(),
      ipAddress: 'unknown' // Will be set by the calling API route
    });
    
    return true;
  } catch (error) {
    console.error('Database validation error:', error);
    return false;
  }
}

export async function getUserDailyMintCount(userAddress: string): Promise<number> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const dailyCount = await db.collection('dailyMints').findOne({
    userAddress: userAddress.toLowerCase(),
    date: today
  });
  
  return dailyCount?.count || 0;
}

export async function incrementDailyMintCount(userAddress: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  
  await db.collection('dailyMints').updateOne(
    {
      userAddress: userAddress.toLowerCase(),
      date: today
    },
    {
      $inc: { count: 1 },
      $set: { lastMintTime: now },
      $setOnInsert: { userAddress: userAddress.toLowerCase(), date: today }
    },
    { upsert: true }
  );
}

export async function canUserMint(userAddress: string, dailyLimit: number = 5): Promise<boolean> {
  const currentCount = await getUserDailyMintCount(userAddress);
  return currentCount < dailyLimit;
}

export async function saveUserMint(mintData: UserMint): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  await db.collection('userMints').insertOne({
    ...mintData,
    userAddress: mintData.userAddress.toLowerCase(),
    createdAt: new Date()
  });
}

export async function getUserMintHistory(userAddress: string, limit: number = 50): Promise<UserMint[]> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const mints = await db.collection('userMints')
    .find({ userAddress: userAddress.toLowerCase() })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return mints as unknown as UserMint[];
}

export async function getTotalMints(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  return await db.collection('userMints').countDocuments();
}

export async function getTodayMints(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await db.collection('userMints').countDocuments({
    timestamp: { $gte: today.getTime() }
  });
}

export async function getTopScores(limit: number = 10): Promise<Array<{ userAddress: string; score: number; timestamp: number }>> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const topScores = await db.collection('userMints')
    .find({})
    .sort({ score: -1 })
    .limit(limit)
    .project({ userAddress: 1, score: 1, timestamp: 1 })
    .toArray();
  
  return topScores as Array<{ userAddress: string; score: number; timestamp: number }>;
}

export async function saveGameScore(gameScore: GameScore): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  // Check if player already exists
  const existingPlayer = await db.collection('gameScores').findOne({ fid: gameScore.fid });
  
  if (existingPlayer) {
    const newScore = gameScore.score;
    
    // Check if this is a new all-time high (score field)
    const currentAth = existingPlayer.score || 0;
    const newAth = Math.max(currentAth, newScore);
    
    // Check if this is a new current season high
    const currentSeasonScore = existingPlayer.currentSeasonScore || 0;
    const newCurrentSeasonScore = Math.max(currentSeasonScore, newScore);
    
    // Prepare update fields
    const updateFields: any = {
      pfpUrl: gameScore.pfpUrl,
      username: gameScore.username,
      timestamp: gameScore.timestamp,
      updatedAt: new Date()
    };
    
    // Only update currentSeasonScore if it's a new season high
    if (newScore > currentSeasonScore) {
      updateFields.currentSeasonScore = newScore;
      // Only update duration when current season score improves
      if (gameScore.duration !== undefined) {
        updateFields.duration = gameScore.duration;
      }
    }
    
    // Only update score (ATH) if it's a new all-time high
    if (newScore > currentAth) {
      updateFields.score = newScore;
    }
    
    // Update level if it's higher than existing
    if (gameScore.level > (existingPlayer.level || 0)) {
      updateFields.level = gameScore.level;
    }
    
    // Always update userAddress if provided
    if (gameScore.userAddress) {
      updateFields.userAddress = gameScore.userAddress;
    }
    
    await db.collection('gameScores').updateOne(
      { fid: gameScore.fid },
      { $set: updateFields }
    );
    
    if (newScore > currentAth) {
      console.log(`Updated player ${gameScore.fid} with new ATH: ${newScore}, level: ${gameScore.level}`);
    } else if (newScore > currentSeasonScore) {
      console.log(`Updated player ${gameScore.fid} with new current season score: ${newScore}, level: ${gameScore.level}`);
    } else {
      console.log(`Updated player ${gameScore.fid} profile info - level: ${gameScore.level}`);
    }
  } else {
    // Create new player record with both scores initialized
    const newPlayerData = {
      ...gameScore,
      currentSeasonScore: gameScore.score,
      createdAt: new Date()
    };
    
    await db.collection('gameScores').insertOne(newPlayerData);
    console.log(`Created new player ${gameScore.fid} with score: ${gameScore.score}`);
  }
}

export async function getLeaderboard(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const leaderboard = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true }
    })
    .sort({ currentSeasonScore: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

export async function getUserBestScore(fid: number): Promise<GameScore | null> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const bestScore = await db.collection('gameScores')
    .findOne(
      { fid, currentSeasonScore: { $exists: true } },
      { sort: { currentSeasonScore: -1 } }
    );
  
  return bestScore as GameScore | null;
} 

// NFT minting tracking functions
export async function incrementUserNftCount(fid: number): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  await db.collection('gameScores').updateOne(
    { fid },
    { 
      $inc: { nftCount: 1 },
      $set: { lastNftMint: Date.now() }
    },
    { upsert: true }
  );
}

export async function getUserNftCount(fid: number): Promise<number> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const userData = await db.collection('gameScores').findOne({ fid });
  return userData?.nftCount || 0;
}

export async function updateUserNftInfo(fid: number, nftName: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  await db.collection('gameScores').updateOne(
    { fid },
    { 
      $set: { 
        nftName,
        hasNft: true,
        lastNftMint: Date.now()
      }
    },
    { upsert: true }
  );
}

export async function getLeaderboardWithNfts(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  // Get all game scores with NFT data, filter out users without NFTs
  const leaderboard = await db.collection('gameScores')
    .find({ hasNft: true }) // Only get users who have minted NFTs
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

export async function getMixedLeaderboard(limit: number = 50, offset: number = 0): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  // Get all players with currentSeasonScore, sorted by currentSeasonScore
  const allPlayers = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true }
    })
    .sort({ currentSeasonScore: -1 })
    .toArray();
  
  // Remove duplicates by fid (keep highest currentSeasonScore for each user)
  const uniquePlayers = new Map();
  allPlayers.forEach(player => {
    const existing = uniquePlayers.get(player.fid);
    if (!existing || (player.currentSeasonScore || 0) > (existing.currentSeasonScore || 0)) {
      uniquePlayers.set(player.fid, player);
    }
  });
  
  const uniquePlayersList = Array.from(uniquePlayers.values()).sort((a, b) => (b.currentSeasonScore || 0) - (a.currentSeasonScore || 0));
  
  // Separate NFT holders and non-NFT holders
  const nftHolders = uniquePlayersList.filter(player => player.hasNft === true && player.nftCount > 0);
  const nonNftHolders = uniquePlayersList.filter(player => !player.hasNft || !player.nftCount || player.nftCount === 0);
  
  // Ensure top 10 are NFT holders, then add others
  const top10NftHolders = nftHolders.slice(0, 10);
  const remainingNftHolders = nftHolders.slice(10);
  
  // Combine remaining players and sort by currentSeasonScore
  const othersPool = [...remainingNftHolders, ...nonNftHolders].sort((a, b) => (b.currentSeasonScore || 0) - (a.currentSeasonScore || 0));
  
  // Final leaderboard: top 10 NFT holders + others
  const finalLeaderboard = [
    ...top10NftHolders,
    ...othersPool
  ];
  
  // Apply pagination (offset and limit)
  const paginatedResult = finalLeaderboard.slice(offset, offset + limit);
  
  // Additional deduplication check to ensure no duplicates in the result
  const seenFids = new Set();
  const deduplicatedResult = paginatedResult.filter(player => {
    if (seenFids.has(player.fid)) {
      console.log(`Duplicate FID found and removed: ${player.fid} (${player.username || 'Unknown'})`);
      return false;
    }
    seenFids.add(player.fid);
    return true;
  });
  
  // Log pagination info for debugging
  console.log(`getMixedLeaderboard: offset=${offset}, limit=${limit}, total=${finalLeaderboard.length}, returned=${deduplicatedResult.length}`);
  
  return deduplicatedResult as unknown as GameScore[];
}

export async function getTotalPlayersCount(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  // Get unique player count by counting distinct fids who have currentSeasonScore
  const totalPlayers = await db.collection('gameScores').distinct('fid', { 
    currentSeasonScore: { $exists: true }
  });
  return totalPlayers.length;
}

// Faucet functions
export async function saveFaucetClaim(faucetData: FaucetClaim): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  // Save to faucet claims collection
  await db.collection('faucetClaims').insertOne({
    ...faucetData,
    createdAt: new Date()
  });
  
  // Also mark in gameScores that this user has claimed faucet
  await db.collection('gameScores').updateMany(
    { userAddress: faucetData.userAddress },
    { $set: { faucetClaimed: true } }
  );
}

export async function hasUserClaimedFaucet(userAddress: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  // Check in faucet claims collection
  const faucetClaim = await db.collection('faucetClaims').findOne({ userAddress });
  if (faucetClaim) {
    return true;
  }
  
  // Also check in gameScores collection
  const gameScore = await db.collection('gameScores').findOne({ 
    userAddress, 
    faucetClaimed: true 
  });
  
  return !!gameScore;
}

export async function getUserFaucetClaim(userAddress: string): Promise<FaucetClaim | null> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const faucetClaim = await db.collection('faucetClaims').findOne({ userAddress });
  return faucetClaim as FaucetClaim | null;
}

export async function getWalletUsageStats(): Promise<Array<{ walletIndex: number; usageCount: number; totalAmount: string }>> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const stats = await db.collection('faucetClaims').aggregate([
    {
      $group: {
        _id: '$walletIndex',
        usageCount: { $sum: 1 },
        totalAmount: { $sum: { $toDouble: '$amount' } }
      }
    },
    {
      $project: {
        walletIndex: '$_id',
        usageCount: 1,
        totalAmount: { $toString: '$totalAmount' }
      }
    },
    { $sort: { walletIndex: 1 } }
  ]).toArray();
  
  return stats as Array<{ walletIndex: number; usageCount: number; totalAmount: string }>;
}

// Migration function to update existing data with new scoring fields
export async function migrateToNewScoringSystem(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  console.log('Starting migration to new scoring system...');
  
  // Find all documents that don't have currentSeasonScore field
  const documentsToUpdate = await db.collection('gameScores').find({
    currentSeasonScore: { $exists: false }
  }).toArray();
  
  console.log(`Found ${documentsToUpdate.length} documents to migrate`);
  
  for (const doc of documentsToUpdate) {
    const legacyScore = doc.score || 0;
    
    await db.collection('gameScores').updateOne(
      { _id: doc._id },
      {
        $set: {
          currentSeasonScore: legacyScore
        }
      }
    );
  }
  
  console.log('Migration completed successfully');
}

// Get all-time high leaderboard
export async function getAllTimeHighLeaderboard(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const leaderboard = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true }
    })
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

// Get user's game data by address
export async function getUserGameDataByAddress(userAddress: string): Promise<GameScore | null> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const userData = await db.collection('gameScores')
    .findOne(
      { userAddress: userAddress }
    );
  
  return userData as GameScore | null;
}

// Check if user has minted today
export async function hasUserMintedToday(userAddress: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const userData = await db.collection('gameScores')
    .findOne(
      { 
        userAddress: userAddress,
        hasMintedToday: true,
        lastMintDate: today
      }
    );
  
  return !!userData;
}

// Update user's daily mint status
export async function updateUserDailyMintStatus(userAddress: string, hasMinted: boolean = true): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  await db.collection('gameScores').updateMany(
    { userAddress: userAddress },
    {
      $set: {
        hasMintedToday: hasMinted,
        lastMintDate: today,
        updatedAt: new Date()
      }
    }
  );
}

// Reset daily mint status for all users (run daily)
export async function resetDailyMintStatus(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  await db.collection('gameScores').updateMany(
    { hasMintedToday: true },
    {
      $set: {
        hasMintedToday: false,
        updatedAt: new Date()
      }
    }
  );
}

// Game session management functions
const GAMES_PER_PERIOD = 5;
const PERIOD_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export async function canUserStartGame(userAddress: string, fid?: number): Promise<{
  canPlay: boolean;
  gamesPlayed: number;
  gamesRemaining: number;
  periodStartTime: number;
  periodEndTime: number;
  timeUntilReset: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const currentTime = Date.now();
  
  // Find user's current game session
  const gameSession = await db.collection('gameSessions').findOne({
    userAddress: userAddress.toLowerCase()
  });
  
  if (!gameSession) {
    // User has never played - can start a new period
    return {
      canPlay: true,
      gamesPlayed: 0,
      gamesRemaining: GAMES_PER_PERIOD,
      periodStartTime: 0,
      periodEndTime: 0,
      timeUntilReset: 0
    };
  }
  
  const periodStartTime = gameSession.periodStartTime;
  const periodEndTime = periodStartTime + PERIOD_DURATION;
  
  // Check if current period has expired
  if (currentTime >= periodEndTime) {
    // Period expired - user can start a new period
    return {
      canPlay: true,
      gamesPlayed: 0,
      gamesRemaining: GAMES_PER_PERIOD,
      periodStartTime: 0,
      periodEndTime: 0,
      timeUntilReset: 0
    };
  }
  
  // Check if user has games remaining in current period
  const gamesPlayed = gameSession.gamesPlayed;
  const gamesRemaining = GAMES_PER_PERIOD - gamesPlayed;
  const timeUntilReset = periodEndTime - currentTime;
  
  return {
    canPlay: gamesRemaining > 0,
    gamesPlayed,
    gamesRemaining,
    periodStartTime,
    periodEndTime,
    timeUntilReset
  };
}

export async function startUserGame(userAddress: string, fid?: number): Promise<{
  success: boolean;
  gamesPlayed: number;
  gamesRemaining: number;
  periodStartTime: number;
  periodEndTime: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const currentTime = Date.now();
  const userAddressLower = userAddress.toLowerCase();
  
  // Check if user can start a game
  const canPlay = await canUserStartGame(userAddress, fid);
  
  if (!canPlay.canPlay) {
    return {
      success: false,
      gamesPlayed: canPlay.gamesPlayed,
      gamesRemaining: canPlay.gamesRemaining,
      periodStartTime: canPlay.periodStartTime,
      periodEndTime: canPlay.periodEndTime
    };
  }
  
  // Find existing game session
  const existingSession = await db.collection('gameSessions').findOne({
    userAddress: userAddressLower
  });
  
  if (!existingSession || currentTime >= existingSession.periodStartTime + PERIOD_DURATION) {
    // Start new period
    const newSession: GameSession = {
      userAddress: userAddressLower,
      fid,
      periodStartTime: currentTime,
      gamesPlayed: 1,
      lastGameTime: currentTime,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('gameSessions').updateOne(
      { userAddress: userAddressLower },
      { $set: newSession },
      { upsert: true }
    );
    
    return {
      success: true,
      gamesPlayed: 1,
      gamesRemaining: GAMES_PER_PERIOD - 1,
      periodStartTime: currentTime,
      periodEndTime: currentTime + PERIOD_DURATION
    };
  }
  
  // Increment games played in current period
  const newGamesPlayed = existingSession.gamesPlayed + 1;
  
  await db.collection('gameSessions').updateOne(
    { userAddress: userAddressLower },
    {
      $set: {
        gamesPlayed: newGamesPlayed,
        lastGameTime: currentTime,
        updatedAt: new Date()
      }
    }
  );
  
  return {
    success: true,
    gamesPlayed: newGamesPlayed,
    gamesRemaining: GAMES_PER_PERIOD - newGamesPlayed,
    periodStartTime: existingSession.periodStartTime,
    periodEndTime: existingSession.periodStartTime + PERIOD_DURATION
  };
}

export async function getUserGameInfo(userAddress: string): Promise<{
  gamesPlayed: number;
  gamesRemaining: number;
  periodStartTime: number;
  periodEndTime: number;
  timeUntilReset: number;
  canPlay: boolean;
}> {
  const canPlay = await canUserStartGame(userAddress);
  
  return {
    gamesPlayed: canPlay.gamesPlayed,
    gamesRemaining: canPlay.gamesRemaining,
    periodStartTime: canPlay.periodStartTime,
    periodEndTime: canPlay.periodEndTime,
    timeUntilReset: canPlay.timeUntilReset,
    canPlay: canPlay.canPlay
  };
}

export async function resetExpiredGameSessions(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const currentTime = Date.now();
  const expiredTime = currentTime - PERIOD_DURATION;
  
  // Find and update expired sessions
  await db.collection('gameSessions').updateMany(
    { periodStartTime: { $lt: expiredTime } },
    {
      $set: {
        gamesPlayed: 0,
        periodStartTime: 0,
        updatedAt: new Date()
      }
    }
  );
}

// Gift Box System Functions
const GIFT_BOXES_PER_DAY = 5;

export async function canUserClaimGiftBox(userAddress: string, fid?: number): Promise<{
  canClaim: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const currentTime = Date.now();
  
  console.log('🔍 canUserClaimGiftBox - searching for user by FID:', fid);
  
  // Find user's game score record by FID (more reliable)
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  console.log('🔍 canUserClaimGiftBox - found userData:', {
    exists: !!userData,
    userAddress: userData?.userAddress,
    lastGiftBoxUpdate: userData?.lastGiftBoxUpdate,
    giftBoxClaimsInPeriod: userData?.giftBoxClaimsInPeriod
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can claim
    console.log('🔍 canUserClaimGiftBox - user not found, can claim');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  console.log('🔍 canUserClaimGiftBox - current values:', {
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate
  });
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    console.log('🔍 canUserClaimGiftBox - 12 hours passed, resetting');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canClaim = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  console.log('🔍 canUserClaimGiftBox - result:', {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod)
  });
  
  return {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

// Function to check if user can see gift box (without incrementing count)
export async function canUserSeeGiftBox(userAddress: string, fid?: number): Promise<{
  canSee: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const currentTime = Date.now();
  
  // Find user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can see gift box
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canSee = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  return {
    canSee,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

export async function generateGiftBoxReward(score: number = 0): Promise<{
  tokenType: 'arb' | 'pepe' | 'boop' | 'none';
  amount: number;
}> {
  // Calculate "better luck next time" probability based on score
  let betterLuckProbability = 0.5; // Default 50%
  
  // if (score < 2000) {
  //   betterLuckProbability = 0.9; // 90% chance for scores under 4000
  // } else if (score < 4000) {
  //   betterLuckProbability = 0.7; // 70% chance for scores 4000-7999
  // } else if (score < 8000) {
  //   betterLuckProbability = 0.5; // 50% chance for scores 8000-11999
  // } else if (score < 12000) {
  //   betterLuckProbability = 0.3; // 30% chance for scores 12000-15999
  // } else if (score < 16000) {
  //   betterLuckProbability = 0.2; // 20% chance for scores 16000-19999
  // } else {
  //   betterLuckProbability = 0.1; // 10% chance for scores 20000+
  // }
  
  const random = Math.random();
  
  if (random < betterLuckProbability) {
    console.log(`🎁 Gift Box: Better luck next time! (${(betterLuckProbability * 100).toFixed(1)}% chance) - Score: ${score.toLocaleString()}`);
    return { tokenType: 'none', amount: 0 };
  }
  
  // Remaining chance of getting a token (distributed equally among the 3 tokens)
  const tokenRandom = Math.random();
  const tokenChance = (1 - betterLuckProbability) / 3; // Equal distribution among 3 tokens
  
  if (tokenRandom < tokenChance) {
    // ARB: 0.05 - 0.15 (halved from 0.1 - 0.3)
    const arbAmount = 0.05 + (Math.random() * 0.1);
    console.log(`🎁 Gift Box: ARB reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${arbAmount.toFixed(6)} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'arb', amount: parseFloat(arbAmount.toFixed(6)) };
  } else if (tokenRandom < tokenChance * 2) {
    // PEPE: 4473 - 13557 (halved from 8946 - 27115)
    const pepeAmount = 4473 + Math.floor(Math.random() * (13557 - 4473 + 1));
    console.log(`🎁 Gift Box: PEPE reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${pepeAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'pepe', amount: pepeAmount };
  } else {
    // BOOP: 1423 - 2000 (halved from 2847 - 4000)
    const boopAmount = 1423 + Math.floor(Math.random() * (2000 - 1423 + 1));
    console.log(`🎁 Gift Box: BOOP reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${boopAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'boop', amount: boopAmount };
  }
}

export async function claimGiftBox(userAddress: string, fid?: number): Promise<{
  success: boolean;
  tokenType: 'arb' | 'pepe' | 'boop' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  claimsToday: number;
  remainingClaims: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const userAddressLower = userAddress;
  
  // Check if user can claim
  const canClaim = await canUserClaimGiftBox(userAddress, fid);
  if (!canClaim.canClaim) {
    return {
      success: false,
      tokenType: 'none',
      amount: 0,
      claimsToday: canClaim.claimsToday,
      remainingClaims: canClaim.remainingClaims
    };
  }
  
  // Get user's best score for reward calculation
  let userBestScore = 0;
  if (fid) {
    try {
      const userGameData = await db.collection('gameScores').findOne(
        { fid: fid },
        { sort: { score: -1 } }
      );
      userBestScore = userGameData?.score || 0;
      console.log(`🎯 User best score for gift box calculation: ${userBestScore.toLocaleString()}`);
    } catch (error) {
      console.log('⚠️ Error getting user score for gift box, using 0:', error);
      userBestScore = 0;
    }
  }
  
  // Generate reward based on user's score
  const reward = await generateGiftBoxReward(userBestScore);
  
  // Update gift box claims in gameScores collection
  const currentTime = Date.now();
  const lastGiftBoxUpdate = canClaim.lastClaimTime || 0;
  const claimsInPeriod = canClaim.claimsToday;
  
  console.log('🔍 Claiming gift box - Debug info:', {
    userAddress: userAddressLower,
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate,
    twelveHours: 12 * 60 * 60 * 1000
  });
  
  // Check if we need to reset the counter (12 hours passed)
  let newClaimsInPeriod = 1;
  let newLastGiftBoxUpdate = currentTime;
  
  if (lastGiftBoxUpdate === 0) {
    // First time claiming - start with 1
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🎯 First time claiming - starting with 1');
  } else if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, start new period
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🔄 12 hours passed - resetting counter to 1');
  } else {
    // Continue in current period
    newClaimsInPeriod = claimsInPeriod + 1;
    newLastGiftBoxUpdate = currentTime; // Always update to current time when claiming
    console.log(`📈 Continuing period - incrementing from ${claimsInPeriod} to ${newClaimsInPeriod}`);
  }
  
  console.log('💾 Updating database with:', {
    userAddress: userAddressLower,
    newClaimsInPeriod,
    newLastGiftBoxUpdate
  });
  
  const updateResult = await db.collection('gameScores').updateOne(
    { fid: fid },
    {
      $set: {
        giftBoxClaimsInPeriod: newClaimsInPeriod,
        lastGiftBoxUpdate: newLastGiftBoxUpdate,
        updatedAt: new Date()
      },
      $inc: {
        totalRewardsClaimed: 1
      }
    },
    { upsert: true }
  );
  
  console.log('✅ Database update result:', {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    upsertedCount: updateResult.upsertedCount
  });
  
  // Store the claim
  const giftBoxClaim: GiftBoxClaim = {
    userAddress: userAddressLower,
    fid,
    tokenType: reward.tokenType,
    amount: reward.amount,
    timestamp: Date.now(),
    createdAt: new Date()
  };
  
  await db.collection('giftBoxClaims').insertOne(giftBoxClaim);
  
  // Generate signature for token reward (only if not "none")
  let signature: string | undefined;
  if (reward.tokenType !== 'none') {
    const { ethers } = await import('ethers');
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY;
    
    // Convert amount to wei (18 decimals)
    const amountInWei = convertToWei(reward.amount);
    
    console.log('Signature data:', {
      userAddress: userAddressLower,
      tokenAddress: getTokenAddress(reward.tokenType),
      amount: reward.amount,
      amountInWei: amountInWei
    });
    
    if (serverPrivateKey) {
      const wallet = new ethers.Wallet(serverPrivateKey);

      const packedData = ethers.solidityPacked(
        ["address", "address", "uint256"],
        [userAddressLower, getTokenAddress(reward.tokenType), amountInWei]
      );
      const messageHash = ethers.keccak256(packedData);
      
      signature = await wallet.signMessage(ethers.getBytes(messageHash));
    }
  }
  
  return {
    success: true,
    tokenType: reward.tokenType,
    amount: reward.amount,
    amountInWei: reward.tokenType !== 'none' ? convertToWei(reward.amount).toString() : '0',
    signature,
    claimsToday: newClaimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - newClaimsInPeriod)
  };
}

function getTokenAddress(tokenType: 'arb' | 'pepe' | 'boop' | 'none'): string {
  // These should match your actual token contract addresses
  switch (tokenType) {
    case 'arb':
      return '0x912CE59144191C1204E64559FE8253a0e49E6548'; // Arbitrum token address
    case 'pepe':
      return '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00'; // PEPE token address
    case 'boop':
      return '0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3'; // Replace with actual BOOP address
    case 'none':
      throw new Error('Cannot get token address for "none" type');
    default:
      throw new Error('Invalid token type');
  }
}

function convertToWei(amount: number): bigint {
  // Convert amount to 18 decimals (wei)
  return BigInt(Math.floor(amount * Math.pow(10, 18)));
}

export async function getUserGiftBoxStats(userAddress: string, fid?: number): Promise<{
  totalClaims: number;
  totalArb: number;
  totalPepe: number;
  totalBoop: number;
  claimsToday: number;
  remainingClaims: number;
  totalRewardsClaimed: number;
}> {
  const client = await clientPromise;
  const db = client.db('bounce');
  
  const userAddressLower = userAddress.toLowerCase();
  const currentTime = Date.now();
  
  // Get user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  // Get current period claims
  let claimsToday = 0;
  if (userData) {
    const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
    const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
    
    // Check if 12 hours have passed since last update
    if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
      claimsToday = 0; // Reset if 12 hours passed
    } else {
      claimsToday = claimsInPeriod;
    }
  }
  
  // Get all-time stats from giftBoxClaims collection
  const allClaims = await db.collection('giftBoxClaims').find({
    userAddress: userAddressLower
  }).toArray();
  
  let totalArb = 0;
  let totalPepe = 0;
  let totalBoop = 0;
  
  allClaims.forEach(claim => {
    if (claim.tokenType === 'arb') totalArb += claim.amount;
    else if (claim.tokenType === 'pepe') totalPepe += claim.amount;
    else if (claim.tokenType === 'boop') totalBoop += claim.amount;
  });
  
  return {
    totalClaims: allClaims.length,
    totalArb,
    totalPepe,
    totalBoop,
    claimsToday,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsToday),
    totalRewardsClaimed: userData?.totalRewardsClaimed || 0
  };
} 
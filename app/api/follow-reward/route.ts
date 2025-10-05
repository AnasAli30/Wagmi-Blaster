import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/docs/lib/mongodb';
import { generateAuthHeaders } from '@/docs/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const fid = searchParams.get('fid');
    
    if (!userAddress || !fid) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const followRewardCollection = db.collection('followRewards');
    
    // Check if user has already claimed
    const existingReward = await followRewardCollection.findOne({
      userAddress,
      fid: parseInt(fid)
    });

    return NextResponse.json({
      success: true,
      alreadyClaimed: !!existingReward
    });
  } catch (error) {
    console.error('Error checking follow reward eligibility:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, fid } = body;
    
    if (!userAddress || !fid) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const followRewardCollection = db.collection('followRewards');
    const gameScoreCollection = db.collection('gameScores');
    
    // Check if user has already claimed
    const existingReward = await followRewardCollection.findOne({
      userAddress,
      fid: parseInt(fid)
    });

    if (existingReward) {
      return NextResponse.json({ 
        success: false, 
        error: 'Follow reward already claimed',
        alreadyClaimed: true 
      }, { status: 400 });
    }

    // Record the follow reward claim
    await followRewardCollection.insertOne({
      userAddress,
      fid: parseInt(fid),
      claimedAt: new Date(),
      rewardType: 'follow',
      giftBoxClaimsAdded: 1
    });

    // Add 1 gift box claim to user's game score
    await gameScoreCollection.updateOne(
      { userAddress },
      {
        $inc: { 
          giftBoxClaimsInPeriod: 1,
          totalGiftBoxClaims: 1
        },
        $set: { 
          lastGiftBoxUpdate: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Follow reward claimed successfully',
      giftBoxClaimsAdded: 1
    });
  } catch (error) {
    console.error('Error claiming follow reward:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


#!/usr/bin/env node

/**
 * Script to remove currentSeason field from all existing users
 * This allows starting a new season with fresh currentSeasonScore values
 * 
 * Usage: node remove-current-season.js
 */

const { MongoClient } = require('mongodb');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bounce';

async function removeCurrentSeasonField() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('bounce');
    const collection = db.collection('gameScores');
    
    console.log('📊 Checking current data...');
    
    // Count total documents
    const totalDocs = await collection.countDocuments();
    console.log(`📈 Total documents in gameScores collection: ${totalDocs}`);
    
    // Count documents with currentSeasonScore field
    const docsWithCurrentSeason = await collection.countDocuments({
      currentSeasonScore: { $exists: true }
    });
    console.log(`🎯 Documents with currentSeasonScore field: ${docsWithCurrentSeason}`);
    
    if (docsWithCurrentSeason === 0) {
      console.log('✅ No documents have currentSeasonScore field. Nothing to remove.');
      return;
    }
    
    // Show some sample data before removal
    console.log('\n📋 Sample data before removal:');
    const sampleDocs = await collection.find({
      currentSeasonScore: { $exists: true }
    }).limit(3).toArray();
    
    sampleDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. FID: ${doc.fid}, Score: ${doc.score}, CurrentSeason: ${doc.currentSeasonScore}`);
    });
    
    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will remove the currentSeasonScore field from ALL users!');
    console.log('   This action cannot be undone.');
    console.log('   Users will need to play again to get new currentSeasonScore values.');
    
    // In a real script, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically
    
    console.log('\n🗑️  Removing currentSeasonScore field from all documents...');
    
    // Remove the currentSeasonScore field from all documents
    const result = await collection.updateMany(
      { currentSeasonScore: { $exists: true } },
      { $unset: { currentSeasonScore: "" } }
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} documents`);
    console.log(`📊 Matched ${result.matchedCount} documents`);
    
    // Verify the removal
    console.log('\n🔍 Verifying removal...');
    const remainingDocsWithCurrentSeason = await collection.countDocuments({
      currentSeasonScore: { $exists: true }
    });
    
    if (remainingDocsWithCurrentSeason === 0) {
      console.log('✅ SUCCESS: All currentSeasonScore fields have been removed!');
    } else {
      console.log(`⚠️  WARNING: ${remainingDocsWithCurrentSeason} documents still have currentSeasonScore field`);
    }
    
    // Show some sample data after removal
    console.log('\n📋 Sample data after removal:');
    const sampleDocsAfter = await collection.find({}).limit(3).toArray();
    
    sampleDocsAfter.forEach((doc, index) => {
      console.log(`  ${index + 1}. FID: ${doc.fid}, Score: ${doc.score}, CurrentSeason: ${doc.currentSeasonScore || 'REMOVED'}`);
    });
    
    console.log('\n🎉 Script completed successfully!');
    console.log('💡 Users can now start a new season with fresh currentSeasonScore values.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  removeCurrentSeasonField()
    .then(() => {
      console.log('✅ Script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { removeCurrentSeasonField };

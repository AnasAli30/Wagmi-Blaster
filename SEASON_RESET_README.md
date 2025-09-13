# Season Reset Scripts

This directory contains scripts to reset the current season by removing the `currentSeasonScore` field from all existing users in the database.

## Understanding the System

### How Scores Work
- **`score`**: All-time high (ATH) - only updated when a user beats their previous best
- **`currentSeasonScore`**: Current season score - updated every game, used for leaderboard ranking
- **Leaderboard**: Sorted by `currentSeasonScore`, not by all-time high

### Why Reset?
When starting a new season, you want to:
1. Keep all-time high scores (`score` field) for historical records
2. Reset current season scores (`currentSeasonScore` field) so everyone starts fresh
3. Allow users to compete for new season rankings

## Scripts Available

### 1. Simple Script (`remove-current-season.js`)
Basic script that removes `currentSeasonScore` from all users.

```bash
node remove-current-season.js
```

**Features:**
- Shows statistics before/after
- Removes `currentSeasonScore` field from all users
- Preserves all other user data
- Simple and straightforward

### 2. Advanced Script (`remove-current-season-advanced.js`)
More sophisticated script with backup and restore capabilities.

```bash
# Preview changes (recommended first)
node remove-current-season-advanced.js --dry-run

# Create backup and execute
node remove-current-season-advanced.js --backup --execute

# Just execute (no backup)
node remove-current-season-advanced.js --execute

# Restore from backup
node remove-current-season-advanced.js --restore=backups/gameScores-backup-2024-01-01T00-00-00-000Z.json
```

**Features:**
- Dry run mode to preview changes
- Automatic backup creation
- Restore functionality
- Better error handling
- Detailed statistics

## Setup

1. **Install MongoDB driver** (if not already installed):
```bash
npm install mongodb
```

2. **Set MongoDB connection string**:
```bash
export MONGODB_URI="mongodb://localhost:27017/bounce"
# or update the MONGODB_URI variable in the scripts
```

3. **Run the script**:
```bash
# Recommended: Start with dry run
node remove-current-season-advanced.js --dry-run

# If everything looks good, create backup and execute
node remove-current-season-advanced.js --backup --execute
```

## What Happens After Reset

1. **Users**: All users will have their `currentSeasonScore` field removed
2. **Leaderboard**: Will be empty until users play again
3. **New Games**: When users play again, they'll get fresh `currentSeasonScore` values
4. **All-time Highs**: Preserved in the `score` field

## Safety Notes

⚠️ **Important**: 
- This operation cannot be undone without a backup
- Always run `--dry-run` first to preview changes
- Consider creating a backup with `--backup` flag
- Test on a development database first

## Database Schema

The `gameScores` collection contains documents like:
```javascript
{
  _id: ObjectId,
  fid: 12345,
  username: "player_name",
  pfpUrl: "https://...",
  score: 15000,              // All-time high (preserved)
  currentSeasonScore: 12000, // Current season (removed)
  level: 5,
  userAddress: "0x...",
  // ... other fields
}
```

After reset:
```javascript
{
  _id: ObjectId,
  fid: 12345,
  username: "player_name", 
  pfpUrl: "https://...",
  score: 15000,              // All-time high (preserved)
  // currentSeasonScore removed
  level: 5,
  userAddress: "0x...",
  // ... other fields
}
```

## Troubleshooting

### Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure database name is correct

### Permission Issues
- Ensure MongoDB user has read/write permissions
- Check if database exists

### Script Errors
- Run with `--dry-run` first to identify issues
- Check MongoDB logs for detailed error messages
- Verify all required fields exist in documents

## Example Workflow

```bash
# 1. Preview what will be changed
node remove-current-season-advanced.js --dry-run

# 2. Create backup and execute
node remove-current-season-advanced.js --backup --execute

# 3. Verify results
node remove-current-season-advanced.js --dry-run

# 4. If something went wrong, restore from backup
node remove-current-season-advanced.js --restore=backups/gameScores-backup-2024-01-01T00-00-00-000Z.json
```

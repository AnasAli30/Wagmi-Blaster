// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract TokenReward is Ownable {
    using ECDSA for bytes32;

    // Mapping to track used signatures
    mapping(bytes => bool) public usedSignatures;
    
    // Server's public key for signature verification
    address public serverSigner;

    // Game tracking system
    uint256 public constant GAMES_PER_PERIOD = 5;
    uint256 public constant PERIOD_DURATION = 12 hours; // 12 hours in seconds
    mapping(address => uint256) public userGameCount;
    mapping(address => uint256) public userPeriodStart;

    event TokenRewarded(address indexed user, address indexed token, uint256 amount);
    event ServerSignerUpdated(address indexed newSigner);
    event GameStarted(address indexed user, uint256 gameCount, uint256 periodStart);
    event PeriodDurationUpdated(uint256 oldDuration, uint256 newDuration);

    constructor(address _serverSigner) {
        serverSigner = _serverSigner;
    }

    function updateServerSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        serverSigner = _newSigner;
        emit ServerSignerUpdated(_newSigner);
    }

    // Function to start a game - checks if user can play
    function startGame() external returns (bool) {
        uint256 currentTime = block.timestamp;
        uint256 userPeriodStartTime = userPeriodStart[msg.sender];
        
        // Check if period has expired or user hasn't started a period yet
        if (userPeriodStartTime == 0 || currentTime >= userPeriodStartTime + PERIOD_DURATION) {
            // Start new period
            userPeriodStart[msg.sender] = currentTime;
            userGameCount[msg.sender] = 1;
            emit GameStarted(msg.sender, 1, currentTime);
            return true;
        }
        
        // Check if user has games remaining in current period
        if (userGameCount[msg.sender] < GAMES_PER_PERIOD) {
            userGameCount[msg.sender]++;
            emit GameStarted(msg.sender, userGameCount[msg.sender], userPeriodStartTime);
            return true;
        }
        
        // User has exceeded game limit for this period
        return true;
    }

    // Function to check if user can start a game
    function canStartGame(address user) external view returns (bool) {
        uint256 currentTime = block.timestamp;
        uint256 userPeriodStartTime = userPeriodStart[user];
        
        // If no period started or period expired, user can play
        if (userPeriodStartTime == 0 || currentTime >= userPeriodStartTime + PERIOD_DURATION) {
            return true;
        }
        
        // Check if user has games remaining
        return userGameCount[user] < GAMES_PER_PERIOD;
    }

    // Function to get user's game info
    function getUserGameInfo(address user) external view returns (
        uint256 gamesPlayed,
        uint256 gamesRemaining,
        uint256 periodStartTime,
        uint256 periodEndTime,
        bool canPlay
    ) {
        uint256 currentTime = block.timestamp;
        uint256 userPeriodStartTime = userPeriodStart[user];
        
        if (userPeriodStartTime == 0 || currentTime >= userPeriodStartTime + PERIOD_DURATION) {
            // No active period or period expired
            return (0, GAMES_PER_PERIOD, 0, 0, true);
        }
        
        uint256 played = userGameCount[user];
        uint256 remaining = GAMES_PER_PERIOD - played;
        uint256 periodEnd = userPeriodStartTime + PERIOD_DURATION;
        
        return (played, remaining, userPeriodStartTime, periodEnd, remaining > 0);
    }

    // Function to update period duration (only owner)
    function updatePeriodDuration(uint256 newDuration) external onlyOwner {
        require(newDuration > 0, "Duration must be greater than 0");
        uint256 oldDuration = PERIOD_DURATION;
        // Note: This would require making PERIOD_DURATION a storage variable
        // For now, this is a placeholder - you'd need to modify the contract structure
        emit PeriodDurationUpdated(oldDuration, newDuration);
    }

    function claimTokenReward(
        address token,
        uint256 amount,
        bytes memory signature
    ) external {
        require(!usedSignatures[signature], "Signature already used");
        require(verifySignature(token, amount, signature), "Invalid signature");

        // Mark signature as used
        usedSignatures[signature] = true;

        // Transfer tokens
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");

        emit TokenRewarded(msg.sender, token, amount);
    }

    function verifySignature(
        address token,
        uint256 amount,
        bytes memory signature
    ) public view returns (bool) {
        // Create the message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                msg.sender,
                token,
                amount
            )
        );

        // Create the signed message hash
        bytes32 signedMessageHash = messageHash.toEthSignedMessageHash();

        // Recover the signer
        address recoveredSigner = signedMessageHash.recover(signature);

        // Check if the recovered signer matches our server signer
        return recoveredSigner == serverSigner;
    }

    // Function to withdraw any stuck tokens
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
} 
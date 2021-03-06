// SPDX-License-Identifier: MIT


pragma solidity ^0.6.0;

import "./Controllable.sol";
import "./LPTokenWrapper.sol";
import "./hardworkInterface/IController.sol";
import "./hardworkInterface/IRewardDistributionRecipient.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";

/*
*   [Harvest]
*   This pool doesn't mint.
*   the rewards should be first transferred to this pool, then get "notified"
*   by calling `notifyRewardAmount`
*/

contract NoMintRewardPool is LPTokenWrapper, IRewardDistributionRecipient, Controllable {

    using Address for address;

    IBEP20 public rewardToken;
    uint256 public duration; // making it not a constant is less gas efficient, but portable

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    mapping (address => bool) smartContractStakers;

    // Harvest Migration
    // lpToken is the target vault
    address public sourceVault;
    address public migrationStrategy;
    bool public canMigrate;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardDenied(address indexed user, uint256 reward);
    event SmartContractRecorded(address indexed smartContractAddress, address indexed smartContractInitiator);

    // Harvest Migration
    event Migrated(address indexed account, uint256 legacyShare, uint256 newShare);

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier onlyMigrationStrategy() {
      require(msg.sender == migrationStrategy, "sender needs to be migration strategy");
      _;
    }

    // [Hardwork] setting the reward, lpToken, duration, and rewardDistribution for each pool
    constructor(
        address _rewardToken,
        address _lpToken,
        uint256 _duration,
        address _rewardDistribution,
        address _storage,
        address _sourceVault,
        address _migrationStrategy
    ) 
        public
        IRewardDistributionRecipient(_rewardDistribution)
        Controllable(_storage) // only used for referencing the grey list
    {
        rewardToken = IBEP20(_rewardToken);
        lpToken = IBEP20(_lpToken);
        duration = _duration;
        sourceVault = _sourceVault;
        migrationStrategy = _migrationStrategy;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return SafeMath.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    function earned(address account) public view returns (uint256) {
        return
            balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    // stake visibility is public as overriding LPTokenWrapper's stake() function
    function stake(uint256 amount) public override updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        recordSmartContract();

        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public override updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(balanceOf(msg.sender));
        getReward();
    }

    /// A push mechanism for accounts that have not claimed their rewards for a long time.
    /// The implementation is semantically analogous to getReward(), but uses a push pattern
    /// instead of pull pattern.
    function pushReward(address recipient) public updateReward(recipient) onlyGovernance {
        uint256 reward = earned(recipient);
        if (reward > 0) {
            rewards[recipient] = 0;
            // If it is a normal user and not smart contract,
            // then the requirement will pass
            // If it is a smart contract, then
            // make sure that it is not on our greyList.
            if (!recipient.isContract() || !IController(controller()).greyList(recipient)) {
                rewardToken.safeTransfer(recipient, reward);
                emit RewardPaid(recipient, reward);
            } else {
                emit RewardDenied(recipient, reward);
            }
        }
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            // If it is a normal user and not smart contract,
            // then the requirement will pass
            // If it is a smart contract, then
            // make sure that it is not on our greyList.
            if (tx.origin == msg.sender || !IController(controller()).greyList(msg.sender)) {
                rewardToken.safeTransfer(msg.sender, reward);
                emit RewardPaid(msg.sender, reward);
            } else {
                emit RewardDenied(msg.sender, reward);
            }
        }
    }

    function notifyRewardAmount(uint256 reward)
        external
        override 
        onlyRewardDistribution
        updateReward(address(0))
    {
        // overflow fix according to https://sips.synthetix.io/sips/sip-77
        require(reward < uint(-1) / 1e18, "the notified reward cannot invoke multiplication overflow");

        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(duration);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(duration);
        }
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(duration);
        emit RewardAdded(reward);
    }

    // Harvest Smart Contract recording
    function recordSmartContract() internal {
      if( tx.origin != msg.sender ) {
        smartContractStakers[msg.sender] = true;
        emit SmartContractRecorded(msg.sender, tx.origin);
      }
    }


    // Harvest Migrate

    function setCanMigrate(bool _canMigrate) public onlyGovernance {
      canMigrate = _canMigrate;
    }

    // obtain the legacy vault sahres from the migration strategy
    function pullFromStrategy() public onlyMigrationStrategy {
      canMigrate = true;
      lpToken.safeTransferFrom(msg.sender, address(this),lpToken.balanceOf(msg.sender));
    }

    // called only by migrate() 
    function migrateStakeFor(address target, uint256 amountNewShare) internal override updateReward(target) {
      super.migrateStakeFor(target, amountNewShare);
      emit Staked(target, amountNewShare);
    }

    // The MigrationHelperReward Pool already holds the shares of the targetVault
    // the users are coming with the old share to exchange for the new one
    // We want to incentivize the user to migrate, thus we will not stake for them before they migrate.
    // We also want to save user some hassle, thus when user migrate, we will automatically stake for them

    function migrate() external {
      require(canMigrate, "Funds not yet migrated");
      recordSmartContract();

      // casting here for readability
      address targetVault = address(lpToken);

      // total legacy share - migrated legacy shares
      // What happens when people wrongfully send their shares directly to this pool
      // without using the migrate() function? The people that are properly migrating would benefit from this.
      uint256 remainingLegacyShares = (IBEP20(sourceVault).totalSupply()).sub(IBEP20(sourceVault).balanceOf(address(this)));

      // How many new shares does this contract hold?
      // We cannot get this just by IERC20(targetVault).balanceOf(address(this))
      // because this contract itself is a reward pool where they stake those vault shares
      // luckily, reward pool share and the underlying lp token works in 1:1
      // _totalSupply is the amount that is staked
      uint256 unmigratedNewShares = IBEP20(targetVault).balanceOf(address(this)).sub(totalSupply());
      uint256 userLegacyShares = IBEP20(sourceVault).balanceOf(msg.sender);
      require(userLegacyShares <= remainingLegacyShares, "impossible for user legacy share to have more than the remaining legacy share");

      // Because of the assertion above, 
      // we know for sure that userEquivalentNewShares must be less than unmigratedNewShares (the idle tokens sitting in this contract)
      uint256 userEquivalentNewShares = userLegacyShares.mul(unmigratedNewShares).div(remainingLegacyShares);
      
      // Take the old shares from user
      IBEP20(sourceVault).safeTransferFrom(msg.sender, address(this), userLegacyShares);
      
      // User has now migrated, let's stake the idle tokens into the pool for the user
      migrateStakeFor(msg.sender, userEquivalentNewShares);

      emit Migrated(msg.sender, userLegacyShares, userEquivalentNewShares);
    }
}
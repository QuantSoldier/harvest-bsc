// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "./Governable.sol";
import "./hardworkInterface/IRewardPool.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";


// FeeRewardForwarder with no grain config
contract FeeRewardForwarder is Governable {
  using SafeBEP20 for IBEP20;
  using SafeMath for uint256;

  address public farm;

  // stables
  address constant public usdt = address(0x55d398326f99059fF775485246999027B3197955);
  address constant public vai = address(0x4BD17003473389A42DAF6a0a729f6Fdb328BbBd7);

  // yield farming
  address constant public cake = address(0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82);
  address constant public xvs = address(0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63);

  // wbnb
  address constant public wbnb = address(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c);

  mapping (address => mapping (address => address[])) public pancakeswapRoutes;
  
  // the targeted reward token to convert everything to
  address public targetToken;
  address public profitSharingPool;

  address constant public pancakeswapRouterV2 = address(0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F);

  event TokenPoolSet(address token, address pool);

  constructor(address _storage, address _farm) public Governable(_storage) {
    require(_farm != address(0), "_farm not defined");
    farm = _farm;

    pancakeswapRoutes[cake][wbnb] = [cake, wbnb];
    pancakeswapRoutes[xvs][wbnb] = [xvs, wbnb];
    
    // // Route to grain is always to farm then to grain.
    // // So we will just use the existing route to buy FARM first
    // // then sell partially to grain.
    // pancakeswapRoutes[grain][farm] = [grain, farm];
    // pancakeswapRoutes[farm][grain] = [farm, grain];

    // // preset for grainBacker (usdc or weth)
    // //weth
    // pancakeswapRoutes[dai][weth] = [dai, weth];
    // pancakeswapRoutes[usdc][weth] = [usdc, weth];
    // pancakeswapRoutes[usdt][weth] = [usdt, weth];

    // pancakeswapRoutes[wbtc][weth] = [wbtc, weth];
    // pancakeswapRoutes[renBTC][weth] = [renBTC, weth];
    // pancakeswapRoutes[sushi][weth] = [sushi, weth];
    // pancakeswapRoutes[dego][weth] = [dego, weth];
    // pancakeswapRoutes[crv][weth] = [crv, weth];
    // pancakeswapRoutes[comp][weth] = [comp, weth];

    // // usdc
    // pancakeswapRoutes[weth][usdc] = [weth, usdc];
    // pancakeswapRoutes[dai][usdc] = [dai, weth, usdc];
    // pancakeswapRoutes[usdt][usdc] = [usdt, weth, usdc];

    // pancakeswapRoutes[wbtc][usdc] = [wbtc, weth, usdc];
    // pancakeswapRoutes[renBTC][usdc] = [renBTC, weth, usdc];
    // pancakeswapRoutes[sushi][usdc] = [sushi, weth, usdc];
    // pancakeswapRoutes[dego][usdc] = [dego, weth, usdc];
    // pancakeswapRoutes[crv][usdc] = [crv, weth, usdc];
    // pancakeswapRoutes[comp][usdc] = [comp, weth, usdc];
  }

  /*
  *   Set the pool that will receive the reward token
  *   based on the address of the reward Token
  */
  function setTokenPool(address _pool) public onlyGovernance {
    require(wbnb == IRewardPool(_pool).rewardToken(), "Rewardpool's token is not WBNB");
    profitSharingPool = _pool;
    targetToken = wbnb;
    emit TokenPoolSet(targetToken, _pool);
  }

  /**
  * Sets the path for swapping tokens to the to address
  * The to address is not validated to match the targetToken,
  * so that we could first update the paths, and then,
  * set the new target
  */
  function setConversionPath(address from, address to, address[] memory _pancakeswapRoute)
    public 
    onlyGovernance 
  {
    require(
      from == _pancakeswapRoute[0],
      "The first token of the Pancakeswap route must be the from token"
    );
    require(
      to == _pancakeswapRoute[_pancakeswapRoute.length - 1],
      "The last token of the Pancakeswap route must be the to token"
    );
    
    pancakeswapRoutes[from][to] = _pancakeswapRoute;
  }

  // Transfers the funds from the msg.sender to the pool
  // under normal circumstances, msg.sender is the strategy
  function poolNotifyFixedTarget(address _token, uint256 _amount) external {
    uint256 remainingAmount = _amount;
    // Note: targetToken could only be FARM or NULL. 
    // it is only used to check that the rewardPool is set.
    if (targetToken == address(0)) {
      return; // a No-op if target pool is not set yet
    }

    if (_token == wbnb) {
      // this is already the right token
      // Note: Under current structure, this would be FARM.
      // This would pass on the grain buy back as it would be the special case
      // designed for NotifyHelper calls
      // This is assuming that NO strategy would notify profits in FARM

      // IBEP20(_token).safeTransferFrom(msg.sender, profitSharingPool, _amount);
      // IRewardPool(profitSharingPool).notifyRewardAmount(_amount);

      // send the _amount of wbnb to the cross-chain converter
    } else {

      // we need to convert _token to FARM
      if (pancakeswapRoutes[_token][farm].length > 1) {
        IBEP20(_token).safeTransferFrom(msg.sender, address(this), remainingAmount);
        uint256 balanceToSwap = IBEP20(_token).balanceOf(address(this));
        liquidate(_token, wbnb, balanceToSwap);

        // now we can send this token forward
        uint256 convertedRewardAmount = IBEP20(wbnb).balanceOf(address(this));
        
        // IBEP20(farm).safeTransfer(profitSharingPool, convertedRewardAmount);
        // IRewardPool(profitSharingPool).notifyRewardAmount(convertedRewardAmount);

        // send the token to the cross-chain converter address
      } else { 
        // else the route does not exist for this token
        // do not take any fees and revert. 
        // It's better to set the liquidation path then perform it again, 
        // rather then leaving the funds in controller
        revert("FeeRewardForwarder: liquidation path doesn't exist"); 
      }
    }
  }

  function liquidate(address _from, address _to, uint256 balanceToSwap) internal {
    if(balanceToSwap > 0){
      IBEP20(_from).safeApprove(pancakeswapRouterV2, 0);
      IBEP20(_from).safeApprove(pancakeswapRouterV2, balanceToSwap);

      IUniswapV2Router02(pancakeswapRouterV2).swapExactTokensForTokens(
        balanceToSwap,
        0,
        pancakeswapRoutes[_from][_to],
        address(this),
        block.timestamp
      );
    }
  }
}

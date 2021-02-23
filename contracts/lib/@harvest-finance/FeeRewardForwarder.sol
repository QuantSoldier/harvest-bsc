// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0;

import "./Governable.sol";
import "./hardworkInterface/IRewardPool.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol";
import "@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";


// FeeRewardForwarder with no grain config
contract FeeRewardForwarder is Governable {
  using SafeBEP20 for IBEP20;
  using SafeMath for uint256;

  address public farm;

  // address constant public usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
  // address constant public usdt = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
  // address constant public dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
  
  // address constant public wbtc = address(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);
  // address constant public renBTC = address(0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D);
  // address constant public sushi = address(0x6B3595068778DD592e39A122f4f5a5cF09C90fE2);
  // address constant public dego = address(0x88EF27e69108B2633F8E1C184CC37940A075cC02);
  // address constant public uni = address(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984);
  // address constant public comp = address(0xc00e94Cb662C3520282E6f5717214004A7f26888);
  // address constant public crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);

  // address constant public ycrv = address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8);

  // address constant public weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

  mapping (address => mapping (address => address[])) public pancakeswapRoutes;

  // grain 
  // grain is a burnable ERC20 token that is deployed by Harvest
  // we sell crops to buy back grain and burn it
  // address public grain;
  // uint256 public grainShareNumerator;
  // uint256 public grainShareDenominator;

  // In case we're not buying back grain immediately,
  // we liquidate the crops into the grainBackerToken
  // and send it to an EOA `grainBuybackReserve`
  // bool public grainImmediateBuyback;
  // address public grainBackerToken;
  // address public grainBuybackReserve;
  
  // the targeted reward token to convert everything to
  address public targetToken;
  address public profitSharingPool;

  // address constant public uniswapRouterV2 = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
  address constant public pancakeswapRouterV2 = address(0);

  event TokenPoolSet(address token, address pool);

  constructor(address _storage, address _farm) public Governable(_storage) {
    // require(_grain != address(0), "_grain not defined");
    require(_farm != address(0), "_farm not defined");
    // grain = _grain;
    farm = _farm;

    // preset for the already in use crops
    // pancakeswapRoutes[weth][farm] = [weth, usdc, farm];
    // pancakeswapRoutes[dai][farm] = [dai, weth, usdc, farm];
    // pancakeswapRoutes[usdc][farm] = [usdc, farm];
    // pancakeswapRoutes[usdt][farm] = [usdt, weth, usdc, farm];

    // pancakeswapRoutes[wbtc][farm] = [wbtc, weth, usdc, farm];
    // pancakeswapRoutes[renBTC][farm] = [renBTC, weth, usdc, farm];
    // pancakeswapRoutes[sushi][farm] = [sushi, weth, usdc, farm];
    // pancakeswapRoutes[dego][farm] = [dego, weth, usdc, farm];
    // pancakeswapRoutes[crv][farm] = [crv, weth, usdc, farm];
    // pancakeswapRoutes[comp][farm] = [comp, weth, usdc, farm];
    
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
    // To buy back grain, our `targetToken` needs to be FARM
    require(farm == IRewardPool(_pool).rewardToken(), "Rewardpool's token is not FARM");
    profitSharingPool = _pool;
    targetToken = farm;
    emit TokenPoolSet(targetToken, _pool);
  }

  /**
  * Sets the path for swapping tokens to the to address
  * The to address is not validated to match the targetToken,
  * so that we could first update the paths, and then,
  * set the new target
  */
  function setConversionPath(address from, address to, address[] memory _pancakeswapRoute)
  public onlyGovernance {
    require(from == _pancakeswapRoute[0],
      "The first token of the Pancakeswap route must be the from token");
    require(to == _pancakeswapRoute[_pancakeswapRoute.length - 1],
      "The last token of the Pancakeswap route must be the to token");
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

    if (_token == farm) {
      // this is already the right token
      // Note: Under current structure, this would be FARM.
      // This would pass on the grain buy back as it would be the special case
      // designed for NotifyHelper calls
      // This is assuming that NO strategy would notify profits in FARM
      IBEP20(_token).safeTransferFrom(msg.sender, profitSharingPool, _amount);
      IRewardPool(profitSharingPool).notifyRewardAmount(_amount);
    } else {
      // // If grainImmediateBuyback is set to false, then funds to buy back grain needs to be sent to an address

      // if (grainShareNumerator != 0 && !grainImmediateBuyback) {
      //   require(grainBuybackReserve != address(0), "grainBuybackReserve should not be empty");
      //   uint256 balanceToSend = _amount.mul(grainShareNumerator).div(grainShareDenominator);
      //   remainingAmount = _amount.sub(balanceToSend);
        
      //   // If the liquidation path is set, liquidate to grainBackerToken and send it over
      //   // if not, send the crops immediately
      //   // this also covers the case when the _token is the grainBackerToken
      //   if(pancakeswapRoutes[_token][grainBackerToken].length > 1){
      //     IERC20(_token).safeTransferFrom(msg.sender, address(this), balanceToSend);
      //     liquidate(_token, grainBackerToken, balanceToSend);
      //     // send the grainBackerToken to the reserve
      //     IERC20(grainBackerToken).safeTransfer(grainBuybackReserve, IERC20(grainBackerToken).balanceOf(address(this)));
      //   } else {
      //     IERC20(_token).safeTransferFrom(msg.sender, grainBuybackReserve, balanceToSend);
      //   }
      // }

      // we need to convert _token to FARM
      if (pancakeswapRoutes[_token][farm].length > 1) {
        IBEP20(_token).safeTransferFrom(msg.sender, address(this), remainingAmount);
        uint256 balanceToSwap = IBEP20(_token).balanceOf(address(this));
        liquidate(_token, farm, balanceToSwap);

        // if grain buyback is activated, then sell some FARM to buy and burn grain
        // if(grainShareNumerator != 0 && grainImmediateBuyback) {
        //   uint256 balanceToBuyback = (IERC20(farm).balanceOf(address(this))).mul(grainShareNumerator).div(grainShareDenominator);
        //   liquidate(farm, grain, balanceToBuyback);

        //   // burn all the grains in this contract
        //   ERC20Burnable(grain).burn(IERC20(grain).balanceOf(address(this)));
        // }

        // now we can send this token forward
        uint256 convertedRewardAmount = IBEP20(farm).balanceOf(address(this));
        IBEP20(farm).safeTransfer(profitSharingPool, convertedRewardAmount);
        IRewardPool(profitSharingPool).notifyRewardAmount(convertedRewardAmount);
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
        1, // we will accept any amount
        pancakeswapRoutes[_from][_to],
        address(this),
        block.timestamp
      );
    }
  }

  // function setGrainBuybackRatio(uint256 _grainShareNumerator, uint256 _grainShareDenominator) public onlyGovernance {
  //   require(_grainShareDenominator >= _grainShareNumerator, "numerator cannot be greater than denominator");
  //   require(_grainShareDenominator != 0, "_grainShareDenominator cannot be 0");
    
  //   grainShareNumerator = _grainShareNumerator;
  //   grainShareDenominator = _grainShareDenominator;
  // }

  // function setGrainConfig(
  //   uint256 _grainShareNumerator, 
  //   uint256 _grainShareDenominator, 
  //   bool _grainImmediateBuyback, 
  //   address _grainBackerToken,
  //   address _grainBuybackReserve
  // ) external onlyGovernance {
  //   require(_grainBuybackReserve != address(0), "_grainBuybackReserve is empty");
  //   // grainBackerToken can be address(0), this way the forwarder will send the crops directly
  //   // since it cannot find a path.
  //   // grainShareNumerator can be 0, this means that no grain is being bought back
  //   setGrainBuybackRatio(_grainShareNumerator, _grainShareDenominator);

  //   grainImmediateBuyback = _grainImmediateBuyback;
  //   grainBackerToken = _grainBackerToken;
  //   grainBuybackReserve = _grainBuybackReserve;
  // }
}

// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

//import {SafeMath} from '../../dependencies/openzeppelin/contracts/SafeMath.sol';
//import {VersionedInitializable} from '../libraries/aave-upgradeability/VersionedInitializable.sol';
//import {
//  InitializableImmutableAdminUpgradeabilityProxy
//} from '../libraries/aave-upgradeability/InitializableImmutableAdminUpgradeabilityProxy.sol';
import {ReserveConfiguration} from '../libraries/configuration/ReserveConfiguration.sol';
//import {ILendingPoolAddressesProvider} from '../../interfaces/ILendingPoolAddressesProvider.sol';
import {ILendingPool} from '../interfaces/ILendingPool.sol';
//import {IERC20Detailed} from '../../dependencies/openzeppelin/contracts/IERC20Detailed.sol';
//import {Errors} from '../libraries/helpers/Errors.sol';
//import {PercentageMath} from '../libraries/math/PercentageMath.sol';
import {DataTypes} from '../libraries/types/DataTypes.sol';
//import {IInitializableDebtToken} from '../../interfaces/IInitializableDebtToken.sol';
//import {IInitializableAToken} from '../../interfaces/IInitializableAToken.sol';
//import {IAaveIncentivesController} from '../../interfaces/IAaveIncentivesController.sol';
import {ILendingPoolConfigurator} from '../interfaces/ILendingPoolConfigurator.sol';

/**
 * @title LendingPoolConfigurator contract
 * @author Aave
 * @dev Implements the configuration methods for the Aave protocol
 **/

contract LendingPoolConfigurator is ILendingPoolConfigurator {
  //using SafeMath for uint256;
  //using PercentageMath for uint256;
  using ReserveConfiguration for DataTypes.ReserveConfigurationMap;

  //ILendingPoolAddressesProvider internal addressesProvider;
  ILendingPool internal pool;

  //modifier onlyPoolAdmin {
  //  require(addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
  //  _;
  //}

  //modifier onlyEmergencyAdmin {
  //  require(
  //    addressesProvider.getEmergencyAdmin() == msg.sender,
  //    Errors.LPC_CALLER_NOT_EMERGENCY_ADMIN
  //  );
  //  _;
  //}

  //uint256 internal constant CONFIGURATOR_REVISION = 0x1;

  //function getRevision() internal pure override returns (uint256) {
  //  return CONFIGURATOR_REVISION;
  //}

  function initialize(
      address underlyingAsset, 
      address aTokenProxyAddress, 
      address stableDebtTokenProxyAddress,
      address variableDebtTokenProxyAddress,
      address interestRateStrategyAddress,
      uint8 underlyingAssetDecimals
      ) public {
  //function initialize(ILendingPoolAddressesProvider provider) public initializer {
    address ILendingPoolAddress = stableDebtTokenProxyAddress;
    pool = ILendingPool(ILendingPoolAddress);

  pool.initReserve(
      underlyingAsset,
      aTokenProxyAddress,
      stableDebtTokenProxyAddress,
      variableDebtTokenProxyAddress,
      interestRateStrategyAddress
    );

    DataTypes.ReserveConfigurationMap memory currentConfig =
      pool.getConfiguration(underlyingAsset);

    currentConfig.setDecimals(underlyingAssetDecimals);

    currentConfig.setActive(true);
    currentConfig.setFrozen(false);

    pool.setConfiguration(underlyingAsset, currentConfig.data);

    emit ReserveInitialized(
      underlyingAsset,
      aTokenProxyAddress,
      stableDebtTokenProxyAddress,
      variableDebtTokenProxyAddress,
      interestRateStrategyAddress
    );

  }
}
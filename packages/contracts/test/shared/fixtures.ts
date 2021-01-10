import '@nomiclabs/hardhat-waffle'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'

import { IFixture, RELAYER_FEE, MAINNET_CHAIN_ID } from './constants'
import Transfer from '../../lib/Transfer'

export async function fixture(): Promise<IFixture> {
  const accounts = await ethers.getSigners()
  const user = accounts[0]
  const liquidityProvider = accounts[1]
  const committee = accounts[2]
  const challenger = accounts[3]
  const governance = accounts[4]

  const MockERC20 = await ethers.getContractFactory('contracts/test/MockERC20.sol:MockERC20')
  const L1_Bridge = await ethers.getContractFactory('contracts/bridges/L1_Bridge.sol:L1_Bridge')
  const L2_Bridge = await ethers.getContractFactory('contracts/bridges/L2_ArbitrumBridge.sol:L2_ArbitrumBridge')
  const L1_MessengerWrapper = await ethers.getContractFactory('contracts/wrappers/Arbitrum.sol:Arbitrum')
  const L1_Messenger = await ethers.getContractFactory('contracts/test/L1_MockMessenger.sol:L1_MockMessenger')
  const L2_Messenger = await ethers.getContractFactory('contracts/test/L2_MockMessenger.sol:L2_MockMessenger')
  const UniswapRouter = await ethers.getContractFactory('contracts/uniswap/UniswapV2Router02.sol:UniswapV2Router02')
  const UniswapFactory = await ethers.getContractFactory('@uniswap/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory')

  // Deploy canonical tokens
  const l1_canonicalToken = await MockERC20.deploy('Dai Stable Token', 'DAI')
  const l2_canonicalToken = await MockERC20.deploy('L2 Dai Stable Token', 'L2DAI')

  // Deploy canonical messengers
  const l1_messenger = await L1_Messenger.deploy(l1_canonicalToken.address)
  const l2_messenger = await L2_Messenger.deploy(l2_canonicalToken.address)

  // Deploy Hop L1 contracts
  const l1_bridge = await L1_Bridge.deploy(l1_canonicalToken.address, await committee.getAddress())
  const l1_messengerWrapper = await L1_MessengerWrapper.deploy()

  // Deploy Hop L2 contracts
  const l2_bridge = await L2_Bridge.deploy(
    l2_messenger.address,
    governance.getAddress(),
    l2_canonicalToken.address,
    l1_bridge.address,
    [MAINNET_CHAIN_ID],
    committee.getAddress()
  )

  // Deploy auxiliary contracts
  const weth = await MockERC20.deploy('WETH', 'WETH')
  const l2_uniswapFactory = await UniswapFactory.deploy(await user.getAddress())
  const l2_uniswapRouter = await UniswapRouter.deploy(l2_uniswapFactory.address, weth.address)

  const transfers = [
      new Transfer({
        chainId: MAINNET_CHAIN_ID,
        sender: await user.getAddress(),
        recipient: await user.getAddress(),
        amount: BigNumber.from('12345'),
        nonce: 0,
        relayerFee: RELAYER_FEE,
        amountOutMin: BigNumber.from('0'),
        deadline: BigNumber.from('0')
      }),
      new Transfer({
        chainId: MAINNET_CHAIN_ID,
        sender: await liquidityProvider.getAddress(),
        recipient: await liquidityProvider.getAddress(),
        amount: BigNumber.from('12345'),
        nonce: 0,
        relayerFee: RELAYER_FEE,
        amountOutMin: BigNumber.from('0'),
        deadline: BigNumber.from('0')
      })
    ]

  return {
    accounts,
    user,
    liquidityProvider,
    committee,
    challenger,
    L1_Bridge,
    L2_Bridge,
    MockERC20,
    L1_MessengerWrapper,
    L1_Messenger,
    L2_Messenger,
    UniswapRouter,
    UniswapFactory,
    l1_canonicalToken,
    l1_messenger,
    l1_messengerWrapper,
    l1_bridge,
    l2_messenger,
    l2_bridge,
    l2_canonicalToken,
    l2_uniswapFactory,
    l2_uniswapRouter,
    transfers
  }
}

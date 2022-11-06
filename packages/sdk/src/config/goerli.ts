import { Chains } from './types'
import { goerli as goerliAddresses } from '@hop-protocol/core/addresses'
import { goerli as goerliConfig } from '@hop-protocol/core/config'
import { goerli as networks, mainnet as _mainnetNetworks } from '@hop-protocol/core/networks'

let networkList = networks.extend(_mainnetNetworks);
const chains: Chains = {}

for (const chain in networkList) {
  const network = (networkList as any)[chain] as any
  if (!chains[chain]) {
    chains[chain] = {}
  }
  chains[chain].name = network?.name
  chains[chain].chainId = network?.networkId
  chains[chain].rpcUrl = network?.publicRpcUrl
  chains[chain].explorerUrl = network?.explorerUrls?.[0]
  chains[chain].waitConfirmations = network?.waitConfirmations ?? 1
}

const addresses = goerliAddresses.bridges
const bonders = goerliAddresses.bonders
const bonderFeeBps = goerliConfig.bonderFeeBps
const destinationFeeGasPriceMultiplier = goerliConfig.destinationFeeGasPriceMultiplier
const relayerFeeEnabled = goerliConfig.relayerFeeEnabled

export { addresses, chains, bonders, bonderFeeBps, destinationFeeGasPriceMultiplier, relayerFeeEnabled }

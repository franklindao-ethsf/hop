import { BigNumber, constants } from 'ethers'
import { useWeb3Context } from 'src/contexts/Web3Context'
import { useApp } from 'src/contexts/AppContext'
import { Token, Chain } from '@hop-protocol/sdk'
import Transaction from 'src/models/Transaction'
import { toTokenDisplay } from 'src/utils'
import { useTransactionReplacement } from './useTransactionReplacement'

const useApprove = (token: any) => {
  const { provider } = useWeb3Context()
  const { txConfirm } = useApp()
  const { waitForTransaction, addTransaction } = useTransactionReplacement()

  const checkApproval = async (amount: BigNumber, token: Token, spender: string) => {
    try {
      const signer = provider?.getSigner()
      if (!signer) {
        throw new Error('Wallet not connected')
      }

      if (token.isNativeToken) {
        return false
      }

      const approved = await token.allowance(spender)
      if (approved.gte(amount)) {
        return false
      }

      return true
    } catch (err: any) {
      console.error('checkApproval error:', err)
      return false
    }
  }

  const approve = async (amount: BigNumber, token: Token, spender: string) => {
    const signer = provider?.getSigner()
    if (!signer) {
      throw new Error('Wallet not connected')
    }

    if (token.isNativeToken) {
      return
    }

    // const approved = await token.allowance(spender)
    // if (approved.gte(amount)) {
    //   return
    // }

    const formattedAmount = toTokenDisplay(amount, token.decimals)
    const chain = Chain.fromSlug(token.chain.slug)
    console.log("ABC");

    const tx = await txConfirm?.show({
      kind: 'approval',
      inputProps: {
        tagline: `Allow bridge to spend your ${token.symbol} on ${chain.name}`,
        amount: token.symbol === 'USDT' ? undefined : formattedAmount,
        token,
        tokenSymbol: token.symbol,
        source: {
          network: {
            slug: token.chain?.slug || "gnosis",
            networkId: token.chain?.chainId || 100,
          },
        },
      },
      onConfirm: async (approveAll: boolean) => {
        return token.approve(spender, constants.MaxUint256)
      },
    })

    if (tx?.hash) {
      addTransaction(
        new Transaction({
          hash: tx?.hash,
          networkName: token.chain.slug,
          token,
        })
      )

      const res = await waitForTransaction(tx, { networkName: token.chain.slug, token })
      if (res && 'replacementTx' in res) {
        return res.replacementTx
      }
    }

    return tx
  }

  return { approve, checkApproval }
}

export default useApprove

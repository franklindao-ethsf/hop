import { ChainSlug } from '@hop-protocol/sdk'
import ArrowDownIcon from '@material-ui/icons/ArrowDownwardRounded'
import SendIcon from '@material-ui/icons/Send'
import { BigNumber, ethers, providers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import React, { ChangeEvent, FC, useEffect, useMemo, useState } from 'react'
import Button from 'src/components/buttons/Button'
import { ButtonsWrapper } from 'src/components/buttons/ButtonsWrapper'
import { Div, Flex } from 'src/components/ui'
import { reactAppNetwork, showRewards } from 'src/config'
import { useApp } from 'src/contexts/AppContext'
import { useWeb3Context } from 'src/contexts/Web3Context'
import {
  useApprove, useAssets,
  useAsyncMemo, useBalance,
  useEstimateTxCost, useFeeConversions, useNeedsTokenForFee, useQueryParams, useSufficientBalance, useTxResult
} from 'src/hooks'
import useIsSmartContractWallet from 'src/hooks/useIsSmartContractWallet'
import logger from 'src/logger'
import Network from 'src/models/Network'
import SendAmountSelectorCard from 'src/pages/Send/SendAmountSelectorCard'
import useSendData from 'src/pages/Send/useSendData'
import { commafy, findMatchingBridge, sanitizeNumericalString, toTokenDisplay } from 'src/utils'
import { amountToBN, formatError } from 'src/utils/format'
import SendHeader from './SendHeader'
import { useSendStyles } from './useSendStyles'

const Send: FC = () => {
  const styles = useSendStyles()
  const {
    networks,
    txConfirm,
    txHistory,
    sdk,
    bridges,
    selectedBridge,
    setSelectedBridge,
    settings,
  } = useApp()
  const { slippageTolerance, deadline } = settings
  const { checkConnectedNetworkId, address } = useWeb3Context()
  const { queryParams, updateQueryParams } = useQueryParams()
  const [fromNetwork, _setFromNetwork] = useState<Network>()
  const [toNetwork, _setToNetwork] = useState<Network>()
  const [fromTokenAmount, setFromTokenAmount] = useState<string>()
  const [toTokenAmount, setToTokenAmount] = useState<string>()
  const [approving, setApproving] = useState<boolean>(false)
  const [amountOutMinDisplay, setAmountOutMinDisplay] = useState<string>()
  const [warning, setWarning] = useState<any>(null)
  const [error, setError] = useState<string | null | undefined>(null)
  const [noLiquidityWarning, setNoLiquidityWarning] = useState<any>(null)
  const [minimumSendWarning, setMinimumSendWarning] = useState<string | null | undefined>(null)
  const [info, setInfo] = useState<string | null | undefined>(null)
  const [isLiquidityAvailable, setIsLiquidityAvailable] = useState<boolean>(true)
  const [customRecipient, setCustomRecipient] = useState<string>('')
  const [manualWarning, setManualWarning] = useState<string>('')
  const { isSmartContractWallet } = useIsSmartContractWallet()
  const [manualError, setManualError] = useState<string>('')
  const [feeRefund, setFeeRefund] = useState<string>('')
  const [feeRefundUsd, setFeeRefundUsd] = useState<string>('')
  const [feeRefundTokenSymbol, setFeeRefundTokenSymbol] = useState<string>('')
  const [destinationChainPaused, setDestinationChainPaused] = useState<boolean>(false)
  const [feeRefundEnabled] = useState<boolean>(showRewards)

  const [selectedToken, setSelectedToken] = useState(""); 

  // Reset error message when fromNetwork/toNetwork changes
  useEffect(() => {
    if (warning) {
      setWarning('')
    }
    if (error) {
      setError('')
    }
  }, [fromNetwork, toNetwork])

  // Set fromNetwork and toNetwork using query params
  useEffect(() => {
    const _fromNetwork = networks.find(network => network.slug === queryParams.sourceNetwork)
    _setFromNetwork(_fromNetwork)

    const _toNetwork = networks.find(network => network.slug === queryParams.destNetwork)

    if (_fromNetwork?.name === _toNetwork?.name) {
      // Leave destination network empty
      return
    }

    _setToNetwork(_toNetwork)
  }, [queryParams, networks])

  useEffect(() => {
    if (queryParams.amount && !Number.isNaN(Number(queryParams.amount))) {
      setFromTokenAmount(queryParams.amount as string)
      updateQueryParams({
        amount: undefined
      })
    }
  }, [queryParams])

  // Get assets
  // eslint-disable-next-line no-use-before-define
  const { unsupportedAsset, sourceToken, destToken, placeholderToken } = useAssets(
    selectedBridge,
    fromNetwork,
    toNetwork
  )

  // Get token balances for both networks
  const { balance: fromBalance, loading: loadingFromBalance } = useBalance(sourceToken, address)
  const { balance: toBalance, loading: loadingToBalance } = useBalance(destToken, address)

  // Set fromToken -> BN
  const fromTokenAmountBN = useMemo<BigNumber | undefined>(() => {
    if (fromTokenAmount && sourceToken) {
      return amountToBN(fromTokenAmount, sourceToken.decimals)
    }
  }, [sourceToken, fromTokenAmount])

  // Get available liquidity
  const availableLiquidity = 999999999;

  // Use send data for tx
  const {
    amountOut,
    rate,
    priceImpact,
    amountOutMin,
    intermediaryAmountOutMin,
    adjustedBonderFee,
    adjustedDestinationTxFee,
    totalFee,
    requiredLiquidity,
    loading: loadingSendData,
    estimatedReceived,
    error: sendDataError,
  } = useSendData(sourceToken, slippageTolerance, fromNetwork, toNetwork, fromTokenAmountBN)

  // Set toAmount
  useEffect(() => {
    if (!destToken) {
      setToTokenAmount('')
      return
    }

    let amount: any
    if (amountOut) {
      amount = toTokenDisplay(amountOut, destToken.decimals)
    }
    setToTokenAmount(amount)
  }, [destToken, amountOut])

  // Convert fees to displayed values
  const {
    destinationTxFeeDisplay,
    bonderFeeDisplay,
    totalBonderFee,
    totalBonderFeeDisplay,
    estimatedReceivedDisplay,
  } = useFeeConversions(adjustedDestinationTxFee, adjustedBonderFee, estimatedReceived, destToken)

  const { estimateSend } = useEstimateTxCost(fromNetwork)

  const { data: estimatedGasCost } = useTxResult(
    sourceToken,
    fromNetwork,
    toNetwork,
    fromTokenAmountBN,
    estimateSend,
    { deadline }
  )

  const { sufficientBalance, warning: sufficientBalanceWarning } = useSufficientBalance(
    sourceToken,
    fromTokenAmountBN,
    estimatedGasCost,
    fromBalance
  )

  useEffect(() => {
    const update = async () => {
      if (fromNetwork?.isL1 && toNetwork && sourceToken) {
        const bridge = sdk.bridge(sourceToken.symbol)
        const isPaused = await bridge.isDestinationChainPaused(toNetwork?.slug)
        setDestinationChainPaused(isPaused)
      } else {
        setDestinationChainPaused(false)
      }
    }

    update().catch(console.error)
  }, [sdk, sourceToken, fromNetwork, toNetwork])

  // ==============================================================================================
  // Error and warning messages
  // // ==============================================================================================
  // useEffect(() => {
  //   setError(formatError(sendDataError))
  // }, [sendDataError])

  // Set error message if asset is unsupported
  // useEffect(() => {
  //   if (unsupportedAsset) {
  //     const { chain, tokenSymbol } = unsupportedAsset
  //     setError(`${tokenSymbol} is currently not supported on ${chain}`)
  //   } else if (error) {
  //     setError('')
  //   }
  // }, [unsupportedAsset])

  // Check if there is sufficient available liquidity
  // useEffect(() => {
  //   const checkAvailableLiquidity = async () => {
  //     if (!toNetwork || !availableLiquidity || !requiredLiquidity || !sourceToken) {
  //       setNoLiquidityWarning('')
  //       return
  //     }

  //     let isAvailable = BigNumber.from(availableLiquidity).gte(requiredLiquidity)
  //     if (fromNetwork?.isL1) {
  //       isAvailable = true
  //     }

  //     const formattedAmount = toTokenDisplay(availableLiquidity, sourceToken.decimals)

  //     const warningMessage = (
  //       <>
  //         Insufficient liquidity. There is {formattedAmount} {sourceToken.symbol} bonder liquidity
  //         available on {toNetwork.name}. Please try again in a few minutes when liquidity becomes
  //         available again.{' '}
  //         <InfoTooltip
  //           title={
  //             <>
  //               <div>
  //                 The Bonder does not have enough liquidity to bond the transfer at the destination.
  //                 Liquidity will become available again after the bonder has settled any bonded
  //                 transfers.
  //               </div>
  //               <div>Available liquidity: {formattedAmount}</div>
  //               <div>
  //                 Required liquidity: {toTokenDisplay(requiredLiquidity, sourceToken.decimals)}
  //               </div>
  //             </>
  //           }
  //         />
  //       </>
  //     )
  //     if (!isAvailable) {
  //       if (hopAppNetwork !== 'staging') {
  //         setIsLiquidityAvailable(false)
  //         return setNoLiquidityWarning(warningMessage)
  //       }
  //     } else {
  //       setIsLiquidityAvailable(true)
  //       setNoLiquidityWarning('')
  //     }
  //   }

  //   checkAvailableLiquidity()
  // }, [fromNetwork, sourceToken, toNetwork, availableLiquidity, requiredLiquidity])

  // const checkingLiquidity = useMemo(() => {
  //   return !fromNetwork?.isLayer1 && availableLiquidity === undefined
  // }, [fromNetwork, availableLiquidity])

  // const needsTokenForFee = useNeedsTokenForFee(fromNetwork)

  // useEffect(() => {
  //   const warningMessage = `Send at least ${destinationTxFeeDisplay} to cover the transaction fee`
  //   if (estimatedReceived?.lte(0) && adjustedDestinationTxFee?.gt(0)) {
  //     setMinimumSendWarning(warningMessage)
  //   } else if (minimumSendWarning) {
  //     setMinimumSendWarning('')
  //   }
  // }, [estimatedReceived, adjustedDestinationTxFee])

  // useEffect(() => {
  //   let message = noLiquidityWarning || minimumSendWarning

  //   const isFavorableSlippage = Number(toTokenAmount) >= Number(fromTokenAmount)
  //   const isHighPriceImpact = priceImpact && priceImpact !== 100 && Math.abs(priceImpact) >= 1
  //   const showPriceImpactWarning = isHighPriceImpact && !isFavorableSlippage

  //   if (sufficientBalanceWarning) {
  //     message = sufficientBalanceWarning
  //   } else if (estimatedReceived && adjustedBonderFee?.gt(estimatedReceived)) {
  //     message = 'Bonder fee greater than estimated received'
  //   } else if (estimatedReceived?.lte(0)) {
  //     message = 'Estimated received too low. Send a higher amount to cover the fees.'
  //   } else if (showPriceImpactWarning) {
  //     message = `Warning: Price impact is high. Slippage is ${commafy(priceImpact)}%`
  //   }

  //   setWarning(message)
  // }, [
  //   noLiquidityWarning,
  //   minimumSendWarning,
  //   sufficientBalanceWarning,
  //   estimatedReceived,
  //   priceImpact,
  //   fromTokenAmount,
  //   toTokenAmount,
  // ])

  useEffect(() => {
    if (!amountOutMin || !destToken) {
      setAmountOutMinDisplay(undefined)
      return
    }
    let _amountOutMin = amountOutMin
    if (adjustedDestinationTxFee?.gt(0)) {
      _amountOutMin = _amountOutMin.sub(adjustedDestinationTxFee)
    }

    if (_amountOutMin.lt(0)) {
      _amountOutMin = BigNumber.from(0)
    }

    const amountOutMinFormatted = commafy(formatUnits(_amountOutMin, destToken.decimals), 4)
    setAmountOutMinDisplay(`${amountOutMinFormatted} ${destToken.symbol}`)
  }, [amountOutMin])

  // ==============================================================================================
  // Approve fromNetwork / fromToken
  // ==============================================================================================

  const { approve, checkApproval } = useApprove(sourceToken)

  // const needsApproval = useAsyncMemo(async () => {
  //   try {
  //     if (!(fromNetwork && sourceToken && fromTokenAmount)) {
  //       return false
  //     }

  //     const parsedAmount = amountToBN(fromTokenAmount, sourceToken.decimals)
  //     const bridge = sdk.bridge(sourceToken.symbol)

  //     const spender: string = await bridge.getSendApprovalAddress(fromNetwork.slug)
  //     return checkApproval(parsedAmount, sourceToken, spender)
  //   } catch (err: any) {
  //     logger.error(err)
  //     return false
  //   }
  // }, [sdk, fromNetwork, sourceToken, fromTokenAmount, checkApproval])

  useEffect(() => {
    async function update() {
      try {
        if (!feeRefundEnabled) {
          return
        }
        if (fromNetwork && toNetwork && sourceToken && fromTokenAmountBN && totalBonderFee && estimatedGasCost && toNetwork?.slug === ChainSlug.Optimism) {
          const payload: any = {
            gasCost: estimatedGasCost?.toString(),
            amount: fromTokenAmountBN?.toString(),
            token: sourceToken?.symbol,
            bonderFee: totalBonderFee.toString(),
            fromChain: fromNetwork?.slug
          }

          const query = new URLSearchParams(payload).toString()
          const apiBaseUrl = reactAppNetwork === 'goerli' ? 'https://hop-merkle-rewards-backend.hop.exchange' : 'https://optimism-fee-refund-api.hop.exchange'
          // const apiBaseUrl = 'http://localhost:8000'
          const url = `${apiBaseUrl}/v1/refund-amount?${query}`
          const res = await fetch(url)
          const json = await res.json()
          if (json.error) {
            throw new Error(json.error)
          }
          console.log(json.data.refund)
          const { refundAmountInRefundToken, refundAmountInUsd, refundTokenSymbol } = json.data.refund
          setFeeRefundTokenSymbol(refundTokenSymbol)
          if (refundAmountInUsd > 0) {
            setFeeRefund(refundAmountInRefundToken.toFixed(4))
            setFeeRefundUsd(refundAmountInUsd.toFixed(2))
          } else {
            setFeeRefund('')
            setFeeRefundUsd('')
          }
        } else {
          setFeeRefund('')
          setFeeRefundUsd('')
        }
      } catch (err) {
        console.error('fee refund fetch error:', err)
        setFeeRefund('')
        setFeeRefundUsd('')
      }
    }

    update().catch(console.error)
  }, [feeRefundEnabled, fromNetwork, toNetwork, sourceToken, fromTokenAmountBN, totalBonderFee, estimatedGasCost])

  // Change the bridge if user selects different token to send
  const handleBridgeChange = (event: ChangeEvent<{ value: unknown }>) => {
    const tokenSymbol = event.target.value as string

    const bridge = findMatchingBridge(bridges, tokenSymbol)
    if (bridge) {
      setSelectedBridge(bridge)
    }
  }

  // Set fromNetwork
  const setFromNetwork = (network: Network | undefined) => {
    updateQueryParams({
      sourceNetwork: network?.slug ?? '',
    })
    _setFromNetwork(network)
  }

  // Set toNetwork
  const setToNetwork = (network: Network | undefined) => {
    updateQueryParams({
      destNetwork: network?.slug ?? '',
    })
    _setToNetwork(network)
  }

  // Switch the fromNetwork <--> toNetwork
  const handleSwitchDirection = () => {
    setToTokenAmount('')
    setFromNetwork(toNetwork)
    setToNetwork(fromNetwork)
  }

  // Change the fromNetwork
  const handleFromNetworkChange = (network: Network | undefined) => {
    if (network?.slug === toNetwork?.slug) {
      handleSwitchDirection()
    } else {
      setFromNetwork(network)
    }
  }

  // Change the toNetwork
  const handleToNetworkChange = (network: Network | undefined) => {
    if (network?.slug === fromNetwork?.slug) {
      handleSwitchDirection()
    } else {
      setToNetwork(network)
    }
  }

  return (
    <Flex column alignCenter>
      <SendHeader
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
        styles={styles}
        bridges={bridges}
        selectedBridge={selectedBridge}
        handleBridgeChange={handleBridgeChange}
      />

      <SendAmountSelectorCard
        value={fromTokenAmount}
        // token={sourceToken ?? placeholderToken}
        selectedToken={selectedToken}
        label={'From'}
        onChange={value => {
          if (!value) {
            setFromTokenAmount('')
            setToTokenAmount('')
            return
          }

          const amountIn = sanitizeNumericalString(value)
          setFromTokenAmount(amountIn)
        }}
        selectedNetwork={fromNetwork}
        networkOptions={networks}
        onNetworkChange={handleFromNetworkChange}
        balance={fromBalance}
        loadingBalance={loadingFromBalance}
        deadline={deadline}
        toNetwork={toNetwork}
        fromNetwork={fromNetwork}
      // setWarning={setWarning}
      />

      <Flex justifyCenter alignCenter my={1} pointer hover>
        <ArrowDownIcon color="primary" className={styles.downArrow} />
      </Flex>

      <SendAmountSelectorCard
        value={fromTokenAmount}
        // token={destToken ?? placeholderToken}
        selectedToken={selectedToken}
        label={'To'}
        selectedNetwork={toNetwork}
        networkOptions={networks}
        onNetworkChange={handleToNetworkChange}
        balance={toBalance}
        loadingBalance={loadingToBalance}
        loadingValue={loadingSendData}
        disableInput
      />
{/* 
      <Flex justifyCenter alignCenter my={1} pointer hover>
        <ArrowDownIcon color="primary" className={styles.downArrow} />
      </Flex>

      <SendAmountSelectorCard
        value={fromTokenAmount}
        // token={destToken ?? placeholderToken}
        selectedToken={selectedToken}

        label={'To Final Destination'}
        selectedNetwork={toNetwork}
        networkOptions={networks}
        onNetworkChange={handleToNetworkChange}
        balance={toBalance}
        loadingBalance={loadingToBalance}
        loadingValue={loadingSendData}
        disableInput
      /> */}


      <ButtonsWrapper>
       {/*  {true && (
          <Div mb={[3]} fullWidth={true}>
            <Button
              className={styles.button}
              large
              highlighted
              // disabled={!approveButtonActive}
              onClick={() => {
                // alert(`hi approve! ${fromNetwork} to ${toNetwork} ${fromTokenAmount} ` +
                //   `${sourceToken?.name} ${sourceToken?.address}`);
                if (!sourceToken) {
                  // @ts-ignore
                  const provider = new providers.Web3Provider(window.ethereum, "any");
                  provider.send("eth_requestAccounts", []);
                  const signer = provider.getSigner();
                  const tokenContract = new ethers.Contract("0x45cD94330AC3aeA42cc21Cf9315B745e27e768BD", ["function approve(address spender, uint256 amount)"], signer);
                  tokenContract.approve("0x45cD94330AC3aeA42cc21Cf9315B745e27e768BD", BigNumber.from(100000000000), { gasLimit: 100000 })
                } else {
                  sourceToken.approve("0x86283791B4e9BF64AA71b921A302559b48911c61", BigNumber.from(100000000000));
                }
              }}
              loading={approving}
              fullWidth
            >
              Approve Tokens
            </Button>
          </Div>
        )} */}
        <Div mb={[3]} fullWidth={true}>
          <Button
            className={styles.button}
            startIcon={true && <SendIcon />}
            onClick={async () => {
              alert(`hi send! ${fromNetwork} to ${toNetwork} ${fromTokenAmount} ` +
                `${sourceToken?.name} ${sourceToken?.address}`);
              // @ts-ignore
              const provider = new providers.Web3Provider(window.ethereum, "any");
              provider.send("eth_requestAccounts", []);
              const signer = provider.getSigner();
              const caller_pubkey = await signer.getAddress(); 

              const deposit_addr = "0xB9B112e2c591DeaDe330f1c2C28eC7EfaC84f1A7";
              const gsb_addr = "0x80ed42C3601CD1E05c062cF0c6Edc037D1658C92";
              const gnosis_addr = "0x22932A69b4e078963c44c3B6f31A7677C72ED0dE";
              const withdraw_addr = "0xA7c4EE85071949A00B4f65FdEDca41f79ba0DDc9";

              const deposit_contractABI = ["function deposit(uint8 tokenId, address recipient,uint256 amount,address tokenAddress,uint16 destinationChainId)", "function addToken(uint8 tokenId, uint16 sourceChain, uint16[] calldata chainIds, address[] calldata addresses)"];
              const gsb_contractABI = ["function approve(address spender,uint256 amount)"]
              const faucet_contractABI = ["function mint(address to, uint256 amount)"]
              const withdraw_contractABI = ["function receiveSuccinct(address srcAddress,bytes calldata callData)", "function addToken(uint8 tokenId, uint16 sourceChain, uint16[] calldata chainIds, address[] calldata addresses)"];
              const mint_contractABI = ["function mint(address to, uint256 amount)"]

              const faucet_contract = new ethers.Contract(gsb_addr, faucet_contractABI, signer);
              // faucet_contract.connect(goerliWallet);

              const deposit_contract = new ethers.Contract(deposit_addr, deposit_contractABI, signer);
              // deposit_contract.connect(goerliWallet);

              const approve_contract = new ethers.Contract(gsb_addr, gsb_contractABI, signer);
              // approve_contract.connect(goerliWallet);

              const faucet_tx = await faucet_contract.mint(
                caller_pubkey,
                69420,
                {
                  gasLimit: 500000,
                }
              )
              console.log("faucet_tx")
              console.log(faucet_tx);
              const faucet_receipt = await faucet_tx.wait();
              console.log(faucet_receipt);

              const approve_tx = await approve_contract.approve(
                deposit_addr,
                69420
              )
              console.log("approve_tx")
              console.log(approve_tx);
              const approve_receipt = await approve_tx.wait();
              console.log(approve_receipt);

              const tx = await deposit_contract.deposit(
                1,
                caller_pubkey,
                1,
                gsb_addr,
                100,
                // inputs
                {
                  gasLimit: 1000000,
                }
              )
              console.log("deposit_tx")
              console.log(tx);
              const receipt = await tx.wait();
              console.log(receipt);


              // const tokenContract = new ethers.Contract("0x45cD94330AC3aeA42cc21Cf9315B745e27e768BD",
              //   ["function deposit(address recipient, uint256 amount, address tokenAddress)"], signer);
              // tokenContract.deposit("0x45cD94330AC3aeA42cc21Cf9315B745e27e768BD",
              //   ethers.utils.parseEther(fromTokenAmount ?? "0"),
              //   "0x45cD94330AC3aeA42cc21Cf9315B745e27e768BD",
              //   { gasLimit: 100000 })
            }}
            // disabled={!sendButtonActive}
            loading={false}
            large
            fullWidth
            highlighted
          >
            Approve and Send
          </Button>
        </Div>
      </ButtonsWrapper>

    </Flex>
  )
}

export default Send

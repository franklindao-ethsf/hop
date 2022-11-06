import React, { useState }  from 'react'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import MenuItem from '@material-ui/core/MenuItem'
import RaisedSelect from 'src/components/selects/RaisedSelect'
import SelectOption from 'src/components/selects/SelectOption'

function SendHeader(props) {
  const { selectedToken, setSelectedToken, styles, bridges, selectedBridge, handleBridgeChange } = props

  const [tokens, setTokens] = useState(["USDC", "ETH", "GFB"]); 

  const handleChange = event => {
    console.log(event?.target.value); 
    setSelectedToken(event?.target.value);
  }

  return (
    <div className={styles.header}>
      <Box display="flex" alignItems="center" className={styles.sendSelect}>
        <Typography variant="h4" className={styles.sendLabel}>
          Send
        </Typography>
        <RaisedSelect value={selectedToken} 
          onChange={handleChange}>
          {tokens.map((token, idx) => (
            <MenuItem value={token} key={idx}>
              <SelectOption
                value={token}
                label={token}
              ></SelectOption>
            </MenuItem>
          ))}
          
          {/* {bridges.map(bridge => (
            <MenuItem value={bridge.getTokenSymbol()} key={bridge.getTokenSymbol()}>
              <SelectOption
                value={bridge?.getTokenSymbol()}
                // icon={bridge?.getTokenImage()}
                label={bridge?.getTokenSymbol()}
              />
            </MenuItem>
          ))} */}
        </RaisedSelect>
      </Box>
    </div>
  )
}

export default SendHeader

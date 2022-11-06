import React from 'react'
import 'src/App.css'
import AppRoutes from 'src/AppRoutes'
import Header from 'src/components/header/Header'
import Footer from 'src/components/footer/Footer'
import AccountDetails from 'src/components/accountDetails'
import TxConfirm from 'src/components/txConfirm/TxConfirm'
import bgImage from 'src/assets/circles-bg.svg'
import bgImageDark from 'src/assets/circles-bg-dark.svg'
import { useThemeMode } from './theme/ThemeProvider'
import styled from 'styled-components'
import { Flex } from './components/ui'

// background-image: ${({ isDarkMode }) => (isDarkMode ? `url(${bgImageDark})` : `url(${bgImage})`)};
// background-color: ${({ theme }) => theme.colors.background.default};

const AppWrapper = styled(Flex)<any>`
  align-items: stretch;
  background-size: 120%;
  transition: background 0.15s ease-out;
  min-height: 100vh;
  background: rgb(238,174,202);
  background: linear-gradient(90deg, rgba(238,174,202,1) 0%, rgba(233,221,148,1) 100%);
`

function App() {
  const { isDarkMode } = useThemeMode()

  return (
    <AppWrapper column isDarkMode={isDarkMode}>
      <Header />
      <AccountDetails />
      <AppRoutes />
      <TxConfirm />
      {/* <Footer /> */}
    </AppWrapper>
  )
}

export default App

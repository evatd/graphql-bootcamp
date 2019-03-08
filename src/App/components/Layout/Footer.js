import React from 'react'
import styled from 'styled-components'
// import colours from '../../styles/export/colours.css'

const FooterWrapper = styled.div`
  padding: 8px;
  text-align: center;
  background: grey;
  border-top: 1px solid grey;
  font-size: 0.8rem;
`

const Footer = (props) => (
  <FooterWrapper>
    ReactJS Academy
  </FooterWrapper>
)

export default Footer

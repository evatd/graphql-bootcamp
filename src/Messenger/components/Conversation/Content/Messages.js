import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { connect } from 'react-redux'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import CONVERSATION_QUERY from '../Conversation.graphql'
import { THREADS_QUERY } from '../../Threads'
import colours from '../../../../App/styles/export/colours.css'
import Avatar from '../../../../App/components/Layout/Avatar'
import Icon from '../../../../App/components/Layout/Icon'

const MessagesWrapper = styled.div`
  display: flex;
  flex:2;
  flex-direction: column;
  justify-content: space-between;
`

const MessagesList = styled.div`
    padding: 1em;
    overflow-y: auto;
    p {
      color: ${colours.darkGrey};
      font-size: 0.9em;
    }
`

const NewMessage = styled.div`
    min-height: 20px;
    padding: 1em;
    border-top: 1px solid ${colours.mediumGrey};
    font-size: 0.9rem;
    display: flex;
    justify-content: space-between;
    height: 60px;
`

const MessageBox = styled.input`
  border-color: transparent;
  width: 90%;
`

const MessageWrapper = styled.div`
  padding: 0.5em;
  display: flex;

  ${props => props.from === 'sent' && css`
    justify-content: flex-end;
  `}
`

const MessageRead = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: flex-end;
`

const Message = styled.div`
    border-radius: 20px;
    padding: 0.5em 1em;
    display: inline-block;
    font-size: 0.9rem;
    background: ${props => props.from === 'received' ? colours.lightGrey : colours.lightBlue};
    color: ${props => props.from === 'received' ? colours.black : colours.white}
`


class Messages extends React.Component {
  state = {
    newMessage: ''
  }

  sendMessage = async () => {
    const { username, } = this.props
    const { newMessage } = this.state

    await this.props.sendMessage({
      variables: {
        to: username,
        from: 'me',
        message: newMessage
      }
    })

    this.setState({ newMessage: '' })
  }

  render() {
    const { conversation = [], username } = this.props
    const styledConversation = conversation.map((message, i) => (
      <MessageWrapper key={i} from={message.from === "you" ? "sent" : "received"}>
        {message.to === "you" && <Avatar username={username} size="medium" />}
        <Message from={message.from === "you" ? "sent" : "received"}>
          {message.message}
        </Message>
        {message.from === "you" && (
          <MessageRead>
            <Icon name="check-circle" size={0.6} />
          </MessageRead>
        )}
      </MessageWrapper>
    ))

    return (
      <MessagesWrapper>
        <MessagesList>
          {styledConversation.length ? (
            styledConversation
          ) : (
            <p>You have no messages</p>
          )}
        </MessagesList>
        <NewMessage>
          <MessageBox
            onChange={e => this.setState({ newMessage: e.target.value })}
            type="text"
            value={this.state.newMessage}
            placeholder="Type your message..."
          />
          <button onClick={this.sendMessage}>Send</button>
        </NewMessage>
      </MessagesWrapper>
    )
  }
}

Messages.propTypes = {
  conversation: PropTypes.array,
  username: PropTypes.string.isRequired,
}

const sendMessage = graphql(gql`
  mutation sendMessage($from: String!, $to: String!, $message: String!) {
    sendMessage(input: { from: $from, to: $to, message: $message }) {
      id
      time
      to
      from
      message
    }
  }
`,
{
  options: (props) => ({
    refetchQueries: [{
      query: CONVERSATION_QUERY, variables: { username: props.username }
    }],
    update: (proxy, { data: { sendMessage } }) => {
      const query = { query: THREADS_QUERY }

      // Read the data from our cache for this query.
      const data = proxy.readQuery(query)

      //data.threads.edges = data.threads.edges.filter(({ node, cursor }) => node.id !== id)
      const threads = data.threads.map(thread => {
        if (thread.username === sendMessage.to) {
          thread.lastMessage = sendMessage
        }
        return thread
      })

      // Write our data back to the cache.
      proxy.writeQuery({ ...query, data: { threads } })
    }
  }),
  name: 'sendMessage',
})

export default sendMessage(Messages)
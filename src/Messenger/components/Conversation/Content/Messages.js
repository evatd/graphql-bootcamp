import React from "react";
import PropTypes from "prop-types";
import styled, { css } from "styled-components";
import { withRouter } from "react-router-dom";
import { graphql, compose } from "react-apollo";
import gql from "graphql-tag";
import THREADS_CONNECTION_QUERY from "../../Threads";
// import MESSAGES_QUERY from './Messages.graphql'
// import { THREADS_QUERY } from '../../Threads'
// import colours from "../../../../App/styles/export/colours.css";
import Avatar from "../../../../App/components/Layout/Avatar";
import Icon from "../../../../App/components/Layout/Icon";
import Snackbar from "@material-ui/core/Snackbar";

const MessagesWrapper = styled.div`
  display: flex;
  flex: 2;
  flex-direction: column;
  justify-content: space-between;
`;

const MessagesList = styled.div`
  padding: 1em;
  overflow-y: auto;
  p {
    color: grey;
    font-size: 0.9em;
  }
`;

const NewMessage = styled.div`
  min-height: 20px;
  padding: 1em;
  border-top: 1px solid grey;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  height: 60px;
`;

const MessageBox = styled.input`
  border-color: transparent;
  width: 90%;
`;

const MessageWrapper = styled.div`
  padding: 0.5em;
  display: flex;

  ${props =>
    props.from === "sent" &&
    css`
      justify-content: flex-end;
    `}
`;

const MessageRead = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: flex-end;
`;

const Message = styled.div`
  border-radius: 20px;
  padding: 0.5em 1em;
  display: inline-block;
  font-size: 0.9rem;
  background: ${props => (props.from === "received" ? "grey" : "blue")};
  color: ${props => (props.from === "received" ? "black" : "white")};
`;

class Messages extends React.Component {
  state = {
    newMessage: ""
  };

  sendMessage = async () => {
    const { username } = this.props;
    const { newMessage } = this.state;

    await this.props.sendMessage({
      variables: {
        to: username,
        from: "me",
        message: newMessage
      }
    });

    this.setState({ newMessage: "" });
  };

  render() {
    const {
      data: { conversationConnection, loading },
      username
    } = this.props;
    if (loading) {
      return <h2>Loading...</h2>;
    }

    const styledConversation = conversationConnection.edges.map(
      ({ node }, i) => (
        <MessageWrapper
          key={i}
          from={node.from === "you" ? "sent" : "received"}
        >
          {node.to === "you" && <Avatar username={username} size="medium" />}
          <Message from={node.from === "you" ? "sent" : "received"}>
            {node.message}
          </Message>
          {node.from === "you" && (
            <MessageRead>
              <Icon name="check-circle" size={0.6} />
            </MessageRead>
          )}
        </MessageWrapper>
      )
    );

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
    );
  }
}

Messages.propTypes = {
  data: PropTypes.object,
  username: PropTypes.string.isRequired
};

Messages.defaultProps = {
  data: {
    loading: true
  }
};

// // use the following function to send a message
// const sendMessage = graphql(
//   gql`
//     mutation sendMessage($from: String!, $to: String!, $message: String!) {
//       sendMessage(input: { from: $from, to: $to, message: $message }) {
//         id
//       }
//     }
//   `,
//   {
//     options: props => ({
//       // TODO https://www.apollographql.com/docs/react/advanced/caching.html#after-mutations
//       refetchQueries: [
//         {
//           query: CONVERSATION_QUERY,
//           variables: { username: props.username }
//         }
//       ],
//       update: (store, { data: { sendMessage } }) => {
//         //   // TODO you need to update a thread and write the Query again in the cache
//         //   // Hint https://www.apollographql.com/docs/react/advanced/caching.html#writequery-and-writefragment
//         // Read the data from our cache for this query.
//         const data = store.readQuery({ query: THREADS_CONNECTION_QUERY });
//         // Add our comment from the mutation to the end.
//         data.sendMessage.push(sendMessage);
//         // Write our data back to the cache.
//         store.writeQuery({ query: CONVERSATION_QUERY, data });
//       }
//     }),
//     // if not named, it shows up as "mutate"
//     name: "sendMessage"
//   }
// );

// query is executed on ComponentDidMount
// mutation is triggered when something happens, e.g. user onChange
// so it won't be executed on first render
// so graphQL gives you a prop called mutate - or
// you can name it, e.g. name: "sendMessage" - can be seen in React dev tools
// mutation will always have varialbes if it has them
// can be seen in network, request payload. OperationName is what you're requesting, e.g. threadsConnection
// in network, click on each message thread and see queries. Only runs once, then gets cached - super
const SEND_MESSAGE_MUTATION = gql`
  mutation sendMessage($from: String!, $to: String!, $message: String!) {
    sendMessage(input: { from: $from, to: $to, message: $message }) {
      id
    }
  }
`;

const sendMessage = graphql(SEND_MESSAGE_MUTATION, {
  options: props => ({
    // TODO https://www.apollographql.com/docs/react/advanced/caching.html#after-mutations
    // limitation: you need to tell graphql client that the messages are cached, need to fetch data again
    // 1 option: refetch query: for this user, just fetch that convo again
    // as a result you see 2 queries, one that mutates and one that sends query again
    // but the thread for the second convo isn't fetched - so need to qeury that too
    // THREADS_CONNECTION_QUERY - but less performant as need to query twice
    // so we comment this query out and replace it with update
    refetchQueries: [
      {
        query: CONVERSATION_QUERY,
        variables: { username: props.username }
      }
      // {
      //   query: THREADS_CONNECTION_QUERY,
      // }
    ],
    update: (proxy, { data: { sendMessage } }) => {
      const query = { query: THREADS_CONNECTION_QUERY };

      // better option:Read the data from our cache for this query.
      const data = proxy.readQuery(query);

      const edges = data.threadsConnection.edges.map(({ node }) => {
        if (node.username === sendMessage.to) {
          node.lastMessage.message = sendMessage.message;
        }
        return node;
      });

      const newData = Object.assign({ threadsConnection: { edges } }, data);

      // Write our data back to the cache.
      proxy.writeQuery({ ...query, data: newData });
    }
  }),
  name: "sendMessage"
});

const CONVERSATION_QUERY = gql`
  query conversation($username: String!) {
    conversationConnection(username: $username) {
      edges {
        node {
          from
          to
          message
          time
        }
        cursor
      }
    }
  }
`;

// query, object with variable
// could also name it withConversation to make it more readable in compose
// but with var defined like this,
// if there's no username, the page will error out
// it works without the variables bit too => const getMessages = graphql(CONVERSATION_QUERY)

const getMessages = graphql(CONVERSATION_QUERY, {
  options: props => ({
    variables: {
      username: props.username
    }
  })
});

export default compose(
  withRouter,
  getMessages,
  sendMessage
)(Messages);

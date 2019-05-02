import React, { Component } from 'react'
import { ChatManager, TokenProvider } from '@pusher/chatkit-client'; // WAS @pusher/chatkit
import Chatkit from '@pusher/chatkit-server';
import MessageList from './components/MessageList';
import SendMessageForm from './components/SendMessageForm';
import RoomList from './components/RoomList';
import NewRoomForm from './components/NewRoomForm';
import "./styles.css";

export class ChatApp extends Component {
  state = {
    roomId: null,
    messages: [],
    joinableRooms: [],
    joinedRooms: [],

  }

  componentDidMount() {
    const instanceLocator = process.env.REACT_APP_INSTANCE_LOCATOR;
    const tokenUrl = process.env.REACT_APP_TOKEN_PROVIDER_URL;
    const chatManager = new ChatManager({
      instanceLocator,
      userId: 'orlando',
      tokenProvider: new TokenProvider({
        url: tokenUrl
      })
    }) // end chatManager

    // handles all the connections
    chatManager.connect()
      .then(currentUser => {
        this.currentUser = currentUser; // hook itself
        this.getRooms();
      })
      .catch(err => console.log("ChatManager Connection Error: ", err));

  } // end componentDidMount()

  getRooms = () => {
    this.currentUser.getJoinableRooms()
      .then(joinableRooms => {
        this.setState({
          joinableRooms,
          joinedRooms: this.currentUser.rooms,
        })
      })
      .catch(err => console.log('Error on joinableRooms: ', err))
  }

  subscribeToRoom = roomId => {
    this.setState({ messages: [] }) // clear chats in room before showing selected room
    this.currentUser.subscribeToRoom({
      // .subscribeToRoomMultipart() has .parts[] array instead of .text property
      roomId: roomId,
      hooks: {
        onMessage: message => {
          this.setState({
            messages: [...this.state.messages, message]
            // Multipart version: parts[0].payload.content
          })
        }
      }
    })
      .then(room => { this.setState({ roomId: room.id }); this.getRooms(); })
      .catch(err => console.log('Error subscribing to room! ', err))
  }

  // inverse data flow by sending function down to child
  sendMessage = text => {
    this.currentUser.sendMessage({
      text,
      roomId: this.state.roomId
    })
  }

  // pass function to NewRoomForm
  createRoom = (name) => {
    this.currentUser.createRoom({
      name
    })
      .then(room => this.subscribeToRoom(room.id))
      .catch(err => ("Error creating room: ", err))
  }

  render() {
    return (
      <div className="row justify-content-center">
        <div className="col-lg-6">

          <div className="col-md-12 bg-primary rounded py-2">
            <NewRoomForm createRoom={this.createRoom} />

            <RoomList
              subscribeToRoom={this.subscribeToRoom}
              rooms={[...this.state.joinableRooms, ...this.state.joinedRooms]}
              roomId={this.state.roomId}
            />
          </div>

          <div className="col-md-12 message-window">

            <MessageList
              roomId={this.state.roomId}
              messages={this.state.messages} />

            <SendMessageForm
              disabled={!this.state.roomId}
              sendMessage={this.sendMessage} />

          </div>

        </div>
      </div >
    )
  }
}

export default ChatApp

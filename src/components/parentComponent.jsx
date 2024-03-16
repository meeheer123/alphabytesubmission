import React, { useState, useEffect } from 'react';
import './ParentComponent.css';
import io from 'socket.io-client';
import Peer from 'peerjs';
import VideoComponent from './videoComponent'; // Import the VideoComponent

const ParentComponent = () => {
  const [roomIds, setRoomIds] = useState(['room1', 'room2', 'room3']);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [peers, setPeers] = useState({});
  const [myPeer, setMyPeer] = useState(null);

  useEffect(() => {
    const socket = io('/');
    const peer = new Peer(undefined, {
      host: '/',
      port: '3001'
    });
    setMyPeer(peer);

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      if (currentRoomId) { // Only add video stream if user has joined a room
        addVideoStream(document.createElement('video'), stream);
      }

      peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
          if (currentRoomId) { // Only add video stream if user has joined a room
            addVideoStream(video, userVideoStream);
          }
        });
      });

      socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
      });

      peer.on('open', id => {
        socket.emit('join-room', currentRoomId, id);
      });
    });

    socket.on('user-disconnected', userId => {
      if (peers[userId]) {
        peers[userId].close();
      }
    });

    return () => {
      socket.disconnect();
      peer.disconnect();
    };
  }, [currentRoomId]);

  const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      if (currentRoomId) { // Only add video stream if user has joined a room
        addVideoStream(video, userVideoStream);
      }
    });
    call.on('close', () => {
      video.remove();
    });

    setPeers(prevPeers => ({
      ...prevPeers,
      [userId]: call
    }));
  };

  const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    document.getElementById('video-grid').append(video);
  };

  const handleJoinRoom = () => {
    const roomIdToJoin = prompt('Enter room ID to join:');
    if (roomIds.includes(roomIdToJoin)) {
      setCurrentRoomId(roomIdToJoin);
    } else {
      alert('Invalid room ID!');
    }
  };

  return (
    <div className="parent-container">
      <div id="video-grid" className="video-container">
        {/* Render VideoComponent only if currentRoomId is truthy */}
        {currentRoomId && <VideoComponent roomId={currentRoomId} />}
      </div>
      {!currentRoomId && <button onClick={handleJoinRoom}>Join Room</button>}
    </div>
  );
};

export default ParentComponent;

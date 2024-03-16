import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';

const VideoComponent = ({ roomId }) => {
  const videoGridRef = useRef();
  const myPeerRef = useRef();
  const socketRef = useRef();
  const myVideoRef = useRef(); // Define myVideoRef

  useEffect(() => {
    myPeerRef.current = new Peer(undefined, {
      host: '/',
      port: '3001'
    });

    socketRef.current = io('/');

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      addVideoStream(myVideoRef.current, stream);

      myPeerRef.current.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream);
        });
      });

      socketRef.current.on('user-connected', userId => {
        connectToNewUser(userId, stream);
      });
    });

    socketRef.current.on('user-disconnected', userId => {
      if (peersRef.current[userId]) peersRef.current[userId].close();
    });

    myPeerRef.current.on('open', id => {
      socketRef.current.emit('join-room', roomId, id);
    });

    return () => {
      myPeerRef.current.disconnect();
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const connectToNewUser = (userId, stream) => {
    const call = myPeerRef.current.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
      video.remove();
    });

    peersRef.current[userId] = call;
  };

  const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGridRef.current.append(video);
  };

  return (
    <div>
      <div id="video-grid" ref={videoGridRef}></div>
      <video ref={myVideoRef} muted autoPlay playsInline></video>
    </div>
  );
};

export default VideoComponent;

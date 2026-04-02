import React, { useMemo } from 'react';

const ChatView = () => {
  const messages = useMemo(() => {
    // fetch messages from API or database
  }, []);

  return (
    <div>
      {messages.map((message) => (
        <p key={message.id}>{message.text}</p>
      ))}
    </div>
  );
};

export default ChatView;
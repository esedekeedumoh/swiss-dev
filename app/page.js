import React from 'react';
import dynamic from 'next/dynamic';

const ChatView = dynamic(() => import('../components/custom/ChatView'), { ssr: false });
const CodeView = dynamic(() => import('../components/custom/CodeView'), { ssr: false });

const Page = () => {
  return (
    <>
      <ChatView />
      <CodeView />
    </>
  );
};

export default Page;
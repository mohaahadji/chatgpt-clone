// src/app/page.js
'use client';

import ChatComponent from './components/ChatComponent';

export default function HomePage() {
  
  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-800 ">
    
      <ChatComponent />
    </div>
  );
}
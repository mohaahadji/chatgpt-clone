import { useState, useEffect } from 'react';
import { FaEllipsisVertical } from "react-icons/fa6";
import { IoExtensionPuzzle } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";

function ChatComponent() {
  const [conversations, setConversations] = useState([{ id: 1, name: 'Chat 1', messages: [] }]);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditingName, setIsEditingName] = useState(null);
  const [newName, setNewName] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query

  useEffect(() => {
    const savedConversations = JSON.parse(localStorage.getItem('conversations'));
    if (savedConversations) {
      setConversations(savedConversations);
      setActiveConversationId(savedConversations[0]?.id || 1);
    }
  }, []);

  const handleOutsideClick = (e) => {
    if (isPopupOpen && !e.target.closest('.popup')) {
      setIsPopupOpen(null);
    }
  };

  useEffect(() => {
    if (isPopupOpen !== null) {
      document.addEventListener('click', handleOutsideClick);
    } else {
      document.removeEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isPopupOpen]);


  const getCompletion = async () => {
    setError(null);
    setLoading(true);
  
    // Add the user's message to the active conversation
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, { type: 'user', text: prompt }] }
          : conv
      )
    );
  
    try {
      // Call the API
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: prompt }), // Match the 'description' field expected in the backend
      });
  
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }
  
      const { response } = await res.json(); // Extract the response from the API
  
      // Update the conversation with the AI's response
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    type: 'ai',
                    text: response, // Use the response from the API
                  },
                ],
              }
            : conv
        )
      );
    } catch (err) {
      // Handle errors
      setError('Something went wrong. Please try again later.');
      console.error(err.message);
    } finally {
      // Clean up state
      setLoading(false);
      setPrompt(''); // Reset the prompt input
    }
  };

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  const addNewConversation = () => {
    const newId = conversations.length + 1;
    setConversations([...conversations, { id: newId, name: `Chat ${newId}`, messages: [] }]);
    setActiveConversationId(newId);
  };

  const selectConversation = (id) => {
    setActiveConversationId(id);
  };

  const startRenaming = (id, currentName) => {
    setIsEditingName(id);
    setNewName(currentName);
  };

  const handleRename = (id) => {
    setConversations((prevConversations) =>
      prevConversations.map((conv) => (conv.id === id ? { ...conv, name: newName } : conv))
    );
    setIsEditingName(null);
  };

  const deleteConversation = (id) => {
    setConversations(conversations.filter((conv) => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(conversations[0]?.id || null);
    }
  };

  const activeConversation = conversations.find((conv) => conv.id === activeConversationId);

  // Filtered conversations based on search query
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-black h-screen w-screen overflow-hidden">
      <div className="bg-[#303030]  text-white p-4 w-1/4 h-full flex flex-col">
        <h2 className="text-lg font-bold mb-4">Projects</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
    {/* Search Icon */}
    <FaSearch />
  </span>
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search Chats"
    className="w-full p-2 pl-10 rounded-lg bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
  />
</div>

        <ul className="flex-grow overflow-y-auto space-y-2">
          {filteredConversations.map((conv) => (
            <li key={conv.id} className="relative group cursor-pointer">
              {isEditingName === conv.id ? (
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => handleRename(conv.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(conv.id)}
                  className="w-full p-2 text-white bg-neutral-800 rounded-lg"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => selectConversation(conv.id)}
                  className={`p-2 w-full text-left rounded-lg flex justify-between ${
                    conv.id === activeConversationId ? 'bg-neutral-700' : 'bg-transparent hover:bg-neutral-700'
                  }`}
                >
                  <span>{conv.name}</span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent selecting the conversation
                      setIsPopupOpen(isPopupOpen === conv.id ? null : conv.id); // Toggle popup
                    }}
                    className="p-2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <FaEllipsisVertical />
                  </span>

                  {/* Popup for delete and rename options */}
                  {isPopupOpen === conv.id && (
                    <div className="absolute right-0 mt-2 w-24 bg-neutral-800 rounded-lg shadow-lg py-2 z-10">
                      {conversations.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenaming(conv.id, conv.name);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neutral-700 rounded-sm"
                      >
                        Rename
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        
        <button onClick={addNewConversation} className="mt-4 p-2 mb-4 bg-white text-black rounded-lg">
          + New Chat
        </button>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 bg-neutral-800 h-full">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 ">
          {activeConversation?.messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.type === 'user' ? 'bg-neutral-800' : 'bg-neutral-700'
              }`}
            >
              {message.type === 'user' ? (
                <p className="text-white">
                  <strong>You:</strong> {message.text}
                </p>
              ) : (
                <div>
                  <p className="text-white">
                    <strong>AI:</strong> {message.text}
                  </p>
              
                </div>
              )}
            </div>
          ))}
          {loading && <p className="text-neutral-500 text-center">Generating response...</p>}
        </div>

        {/* Input area */}
        <div className="p-4 bg-neutral-800">
          <div className="flex space-x-4">
            {/* Relative container for textarea and + button */}
            <div className="relative w-full">
  {/* Textarea */}
  <textarea
    rows={2}
    className="w-full text-white bg-neutral-800 border-[0.5px] border-neutral-600 rounded-lg pr-12  focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-lg resize-y overflow-hidden"
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    placeholder="Enter a coding prompt here"
  />

 

  {/* Send Button on the right */}
  <button
    onClick={getCompletion}
    disabled={loading}
    className={`absolute bg-neutral-600 rounded-full py-6 px-6 top-1/2 right-2 transform -translate-y-1/2   text-black font-semibold ${
      loading ? 'bg-transparent text-white cursor-not-allowed' : 'bg-neutral-200 hover:bg-neutral-700'
    }`}
  >
          {loading ? <div role="status">
          <svg aria-hidden="true" className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-400 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="sr-only">Loading...</span>
      </div> : <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <svg width="20" height="20" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.9576 7.71521C13.0903 7.6487 13.2019 7.54658 13.2799 7.42027C13.3579 7.29396 13.3992 7.14845 13.3992 7.00001C13.3992 6.85157 13.3579 6.70606 13.2799 6.57975C13.2019 6.45344 13.0903 6.35132 12.9576 6.28481L1.75762 0.684812C1.61875 0.615327 1.46266 0.587759 1.30839 0.605473C1.15412 0.623186 1.00834 0.685413 0.888833 0.784565C0.769325 0.883716 0.681257 1.01551 0.635372 1.16385C0.589486 1.3122 0.587767 1.4707 0.630424 1.62001L1.77362 5.62001C1.82144 5.78719 1.92243 5.93424 2.06129 6.03889C2.20016 6.14355 2.36934 6.20011 2.54322 6.20001H6.20002C6.4122 6.20001 6.61568 6.2843 6.76571 6.43433C6.91574 6.58436 7.00002 6.78784 7.00002 7.00001C7.00002 7.21218 6.91574 7.41567 6.76571 7.5657C6.61568 7.71573 6.4122 7.80001 6.20002 7.80001H2.54322C2.36934 7.79991 2.20016 7.85647 2.06129 7.96113C1.92243 8.06578 1.82144 8.21283 1.77362 8.38001L0.631223 12.38C0.588482 12.5293 0.590098 12.6877 0.635876 12.8361C0.681652 12.9845 0.769612 13.1163 0.889027 13.2155C1.00844 13.3148 1.15415 13.3771 1.30838 13.3949C1.46262 13.4128 1.61871 13.3854 1.75762 13.316L12.9576 7.71601V7.71521Z"
            fill="#ffff"></path>
        </svg>
      </span>}
  </button>
</div>
          </div>
          
          {error && <p className='text-red'>{error}</p>}
        </div>
      </div>

      {/* Icon Prompt Modal */}
      
    </div>
  );
}

export default ChatComponent;
"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { userGifs } from "@/lib/mock-data";
import { EmojiPicker } from "@/components/EmojiPicker";
import { parseMessageWithEmojis, getEmojiCodeByUrl } from "@/lib/emoji-map";
import { ArrowRightIcon, Star } from "lucide-react";
import { usePrivy } from '@privy-io/react-auth';
import { WalletConnect } from './WalletConnect';

interface ChatSectionProps {
  messages: ChatMessage[];
}

const mockResponses = [
  "LFG! 🚀",
  "To the moon!",
  "gm",
  "This pot is getting huge",
  "I'm feeling lucky",
  "Another deposit incoming",
  "Can't wait for the draw",
  "Who's winning this one?",
  "Best lottery ever",
  "Love this community"
];

export function ChatSection({ messages: initialMessages }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { authenticated } = usePrivy();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const users = Object.keys(userGifs);
    const interval = setInterval(() => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomMessage = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const randomGif = userGifs[randomUser][Math.floor(Math.random() * userGifs[randomUser].length)];
      
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        user: randomUser,
        message: randomMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gif: randomGif
      };

      setMessages(prev => [...prev.slice(-19), newMsg]);
      setTimeout(scrollToBottom, 100);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const messageSegments = parseMessageWithEmojis(newMessage);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      message: newMessage,
      messageSegments,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev.slice(-19), userMessage]);
    setNewMessage("");
    setIsEmojiPickerOpen(false);
    setTimeout(scrollToBottom, 100);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  return (
    <div className="h-full w-full">
      <Card className="casino-box casino-box-gold overflow-hidden p-0 h-full flex flex-col relative">
        {/* Corner stars */}
        <div className="absolute top-2 left-2 z-10">
          <Star className="h-4 w-4 casino-star" fill="currentColor" />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Star className="h-4 w-4 casino-star" fill="currentColor" />
        </div>
        
        <CardContent className="p-4 h-full flex flex-col min-w-0">
          {/* Title integrated into content */}
          <h2 className="text-xl font-black uppercase text-center tracking-wide mb-4 casino-text-gold truncate" 
              style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>
            Chat
          </h2>
          
          <div className="flex-1 overflow-hidden min-w-0">
            <ScrollArea 
              className="h-[370px] rounded-lg p-3 min-w-0" 
              ref={scrollAreaRef}
            >
              <div className="space-y-2 min-w-0">
                {messages.map((message, index) => (
                  <motion.div 
                    key={message.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative min-w-0"
                  >
                    <div className="text-white min-w-0 overflow-hidden">
                      <span className="font-black casino-text-yellow text-sm" style={{ fontFamily: "Visby Round CF, SF Pro Display, sans-serif" }}>{message.user}: </span>
                      {message.messageSegments ? (
                        message.messageSegments.map((segment, i) => (
                          segment.type === 'text' ? (
                            <span key={i} className="casino-text-gold break-words text-sm">{segment.content}</span>
                          ) : (
                            <img 
                              key={i}
                              src={segment.content} 
                              alt="emoji" 
                              className="inline-block mx-1"
                              style={{ height: "1.2em", verticalAlign: "middle" }}
                              title={getEmojiCodeByUrl(segment.content) || "emoji"}
                            />
                          )
                        ))
                      ) : (
                        <>
                          <span className="casino-text-gold break-words text-sm">{message.message}</span>
                          {message.gif && (
                            <img 
                              src={message.gif} 
                              alt="emoji" 
                              className="inline-block mx-1"
                              style={{ height: "1.2em", verticalAlign: "middle" }}
                              title={getEmojiCodeByUrl(message.gif) || "emoji"}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
        
        <CardFooter className="shrink-0 p-2 min-w-0">
          {authenticated ? (
            <form onSubmit={handleSend} className="w-full flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0">
                <EmojiPicker 
                  onEmojiSelect={handleEmojiSelect} 
                  isOpen={isEmojiPickerOpen}
                  setIsOpen={setIsEmojiPickerOpen}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="casino-input pr-10 text-sm min-w-0"
                  />
                  <Button 
                    type="submit" 
                    className="absolute right-0 top-0 bottom-0 casino-button font-black rounded-r-md border-l-2 border-[#2D0A30] flex items-center justify-center px-2"
                    style={{ borderRadius: "0 6px 6px 0" }}
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="w-full min-w-0">
              <WalletConnect />
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
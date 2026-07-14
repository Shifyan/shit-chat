"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PlusCircle,
  Chat,
  AddressBook,
  Gear,
  Question,
  UsersThree,
  MagnifyingGlass,
  DotsThreeVertical,
  CheckCircle,
  Paperclip,
  Smiley,
  PaperPlaneRight,
} from "@phosphor-icons/react";

interface Message {
  id: string;
  sender: "user" | "other";
  text: string;
  time: string;
  status?: "read" | "sent";
}

interface ChatSession {
  id: string;
  name: string;
  time: string;
  lastMessage: string;
  active: boolean;
  avatarText?: string;
  avatarUrl?: string;
  isGroup?: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "other",
      text: "Hey! Did you get a chance to look at the latest design system updates?",
      time: "10:42 AM",
    },
    {
      id: "2",
      sender: "user",
      text: "Just finished going through them. The monochrome approach for the active states is much cleaner than the previous version.",
      time: "10:44 AM",
      status: "read",
    },
    {
      id: "3",
      sender: "other",
      text: "Glad you agree. I think it removes a lot of cognitive load during deep work sessions.",
      time: "10:45 AM",
    },
    {
      id: "4",
      sender: "other",
      text: "Are you free for a quick huddle at 2 PM to finalize the navigation components?",
      time: "10:45 AM",
    },
    {
      id: "5",
      sender: "user",
      text: "Sounds good, let's meet then.",
      time: "10:48 AM",
      status: "read",
    },
  ]);

  const [chatSessions] = useState<ChatSession[]>([
    {
      id: "alex",
      name: "Alex Rivera",
      time: "2m",
      lastMessage: "Sounds good, let's meet then.",
      active: true,
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDbUgDb_zx0aXg9bh_29tGv38R5IqQnbIxaSDDvKScaZ5Jr-gX4abS9xdJyNKcLnytiGABBn-Uxj2lgUAplipLqrm2aXLDODPWJCF1uE53y-1YACaqCMC_IShHcqz87iMreO8mzCb6v4VVONm9AI5SFCjBBV463WE3j323Fz-UAkvlwr1cFOcJgS2XygA8Bo4KZoprQ3ExgGQ0Vqrg4X5CKZF9hc3PH069j4_K399C41ClqNrGtp-fX",
    },
    {
      id: "product",
      name: "Product Team",
      time: "15m",
      lastMessage: "Jordan: Updated the design tokens...",
      active: false,
      avatarText: "PT",
    },
    {
      id: "family",
      name: "Family",
      time: "1h",
      lastMessage: "Mom: See you all on Sunday!",
      active: false,
      isGroup: true,
    },
    {
      id: "casey",
      name: "Casey Chen",
      time: "3h",
      lastMessage: "The deployment is live.",
      active: false,
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBFeqQ5K4SP2S5wC2Eu8y6yPlySOhU0hnnzjfUyDLQLmu5orLL6YoFqnRohJZiIpgA0MejwPPMu1DYsRbLBVpgjtwGE2ECi_6WAZ9nVd3QItS14uviDZbIGQHLNyukIjTtOdcICI9i90ygg5upij09YIOzjbs0L856_UItTuERzsceW97PZMpczEXJmKbMJcdI6_6rAtDPxxt09gBUBDX6cVmnSuvooQpJIE2kZ0MlIvIknVusQbUbo",
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: inputMessage.trim(),
      time: timeString,
      status: "read",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-container-lowest selection:bg-primary selection:text-white">
      {/* SideNavBar Component */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-72 bg-surface-container-lowest border-r border-outline-variant z-50">
        <div className="p-lg">
          <div className="text-headline-lg font-bold text-primary mb-sm leading-headline-lg">
            Messages
          </div>
          <div className="text-label-md font-medium text-secondary leading-label-md">
            Active now
          </div>
          <button className="mt-lg w-full py-2 bg-primary text-on-primary font-label-md font-medium rounded flex items-center justify-center gap-sm hover:opacity-90 transition-opacity cursor-pointer">
            <PlusCircle className="size-5" />
            Add Chat
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto mt-sm px-xs space-y-md">
          {/* Navigation Tabs */}
          <div className="space-y-sm">
            <a
              className="text-primary font-bold border-l-2 border-primary pl-4 py-2 flex items-center gap-sm bg-surface-container-low transition-colors duration-200"
              href="#"
            >
              <Chat className="size-5" />
              <span className="text-label-md font-medium leading-label-md">
                Chats
              </span>
            </a>
            <a
              className="text-secondary p-4 py-2 flex items-center gap-sm hover:bg-surface-container-low transition-colors duration-200"
              href="#"
            >
              <AddressBook className="size-5" />
              <span className="text-label-md font-medium leading-label-md">
                Contacts
              </span>
            </a>
            <a
              className="text-secondary p-4 py-2 flex items-center gap-sm hover:bg-surface-container-low transition-colors duration-200"
              href="#"
            >
              <Gear className="size-5" />
              <span className="text-label-md font-medium leading-label-md">
                Settings
              </span>
            </a>
          </div>

          {/* Chat List Section */}
          <div className="space-y-sm">
            <div className="px-md">
              <span className="text-label-sm font-semibold uppercase tracking-widest text-[#7c7e7e]">
                Recent Conversations
              </span>
            </div>
            <div className="mt-sm">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`relative p-4 flex items-center gap-sm cursor-pointer hover:bg-surface-container-low transition-all ${
                    session.active ? "bg-surface-container-low" : ""
                  }`}
                >
                  {session.active && (
                    <div className="absolute left-0 top-0 h-full w-0.5 bg-black"></div>
                  )}

                  {session.avatarUrl ? (
                    <img
                      className="w-10 h-10 rounded-full object-cover grayscale"
                      src={session.avatarUrl}
                      alt={session.name}
                    />
                  ) : session.isGroup ? (
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                      <UsersThree className="size-5 text-secondary" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-tertiary text-white flex items-center justify-center font-bold text-xs">
                      {session.avatarText}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-body-md font-bold text-primary truncate leading-body-md">
                        {session.name}
                      </h3>
                      <span className="text-[10px] text-secondary leading-none">
                        {session.time}
                      </span>
                    </div>
                    <p className="text-label-md text-secondary truncate mt-xs leading-label-md">
                      {session.lastMessage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-md border-t border-outline-variant">
          <a
            className="text-secondary p-4 py-2 flex items-center gap-sm hover:bg-surface-container-low transition-colors duration-200"
            href="#"
          >
            <Question className="size-5" />
            <span className="text-label-md font-medium leading-label-md">
              Help
            </span>
          </a>
          <div className="flex items-center gap-sm p-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
              JD
            </div>
            <span className="text-label-md font-bold leading-label-md text-primary">
              John Doe
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-72 h-full bg-white relative">
        {/* TopNavBar Header */}
        <header className="flex justify-between items-center w-full px-lg h-16 border-b border-outline-variant bg-surface-container-lowest z-40">
          <div className="flex items-center gap-md">
            <img
              className="w-10 h-10 rounded-full object-cover grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1eHOH3BSUhExJwC5Nvef_yXou0tEefkQrNhdVVSXR2lwqMggSUpFSIvZ4cLzP9hl1SdUTN3TP_V3XbfPKwD3qb0LEm8CdE-_PVLHg7hMOQStJ_C_iA9E4bvrFKObFppyab9Wu1hoTYlA6FwCsbivsi2bgPiGjqQ03df11FWYaR8m-lmUwqgpBhtF9XnfnklKiAhs8NRS22TwS_KU1gRVVIGEs0G3ukQOUZbJM2oJXkttL_o24toch"
              alt="Alex Rivera"
            />
            <div>
              <h1 className="text-body-lg font-bold text-primary leading-tight">
                Alex Rivera
              </h1>
              <p className="text-label-sm text-[#22C55E] flex items-center gap-1 leading-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>{" "}
                Active now
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-lg">
            <a
              className="text-primary font-bold border-b-2 border-primary pb-2 text-label-md leading-label-md"
              href="#"
            >
              Recent
            </a>
            <a
              className="text-secondary pb-2 text-label-md hover:text-primary transition-all leading-label-md"
              href="#"
            >
              Pinned
            </a>
            <a
              className="text-secondary pb-2 text-label-md hover:text-primary transition-all leading-label-md"
              href="#"
            >
              Archived
            </a>
          </nav>

          <div className="flex items-center gap-md">
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
              <MagnifyingGlass className="size-5 text-secondary" />
            </button>
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
              <DotsThreeVertical className="size-5 text-secondary" />
            </button>
          </div>
        </header>

        {/* Chat Canvas Message Container */}
        <section
          className="flex-1 overflow-y-auto p-lg flex flex-col gap-gutter"
          id="message-container"
        >
          <div className="flex justify-center mb-lg">
            <span className="text-[11px] font-bold bg-surface-container-low px-3 py-1 rounded-full text-secondary opacity-65 leading-none">
              TODAY
            </span>
          </div>

          {messages.map((msg, index) => {
            const isSent = msg.sender === "user";
            // Hide avatar if consecutive message by same sender
            const showAvatar =
              !isSent &&
              (index === 0 || messages[index - 1].sender !== "other");

            return (
              <div
                key={msg.id}
                className={`flex gap-md max-w-[80%] mt-1.5 ${
                  isSent ? "self-end flex-col items-end gap-xs" : "items-end"
                }`}
              >
                {!isSent && (
                  <img
                    className={`w-6 h-6 rounded-full grayscale mb-1 ${
                      showAvatar ? "opacity-100" : "opacity-0"
                    }`}
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNa5iLhmZ-6iPtalrikR7KUywMGaHqffGSIURlLfHoBo_WjxG3HqJmACyFKa2nwuNc-I6qEQdQg-zBfrqr_H6zLOp-bM1nUn6V2siS_BsyABYN-o5xRk9WCCEJj6UozrGYY3BU1qD7Nhcr-dehDwhH-mf4I3oMQvtVzILmQUydAGUendBDz3I0rfoAlUrK6ch9GQe59cThPTmeYZy9e60gU8Jv21VAWIW_QORRMuVb6IbBENeyRO0F"
                    alt="Alex Rivera"
                  />
                )}

                <div
                  className={`p-md rounded-xl ${
                    isSent
                      ? "bg-black text-white rounded-br-none border border-black shadow-sm"
                      : "bg-[#F3F4F6] text-primary rounded-bl-none"
                  }`}
                >
                  <p className="text-body-md leading-body-md md:whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <span
                    className={`text-[10px] mt-1 block leading-none ${
                      isSent ? "text-white/60 text-right" : "text-secondary"
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>

                {isSent &&
                  msg.status === "read" &&
                  index === messages.length - 1 && (
                    <div className="flex items-center gap-1 text-[10px] text-secondary mt-1 leading-none font-semibold">
                      <span>Read</span>
                      <CheckCircle weight="fill" className="size-3" />
                    </div>
                  )}
              </div>
            );
          })}

          <div ref={messageEndRef} />
        </section>

        {/* Message Input Footer panel */}
        <footer
          className={`px-lg pb-lg pt-sm bg-white border-t border-outline-variant transition-shadow duration-200 z-40 ${
            inputFocused ? "shadow-[0px_-2px_15px_rgba(0,0,0,0.04)]" : ""
          }`}
        >
          <form
            onSubmit={handleSend}
            className="max-w-container-max mx-auto relative flex items-center gap-md"
          >
            <button
              type="button"
              className="p-2 text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <Paperclip className="size-5" />
            </button>
            <div className="flex-1 relative">
              <input
                className="w-full bg-[#F3F4F6] border-none rounded-lg py-3 px-4 text-body-md focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
                placeholder="Type a message..."
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-sm">
                <button
                  type="button"
                  className="text-secondary hover:text-primary cursor-pointer"
                >
                  <Smiley className="size-5" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="bg-black text-white w-10 h-10 rounded-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <PaperPlaneRight className="size-5" />
            </button>
          </form>
        </footer>

        {/* Decorative Grid Micro-interaction layer */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#000000_1px,transparent_1px)] bg-position-[40px_40px]"></div>
        </div>
      </main>
    </div>
  );
}

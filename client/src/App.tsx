import axios from "axios";
import { useEffect, useRef, useState } from "react";
import ChatMessage from "./components/Message";
import ChatInput from "./components/Input";
import { ENSInfo, Message } from "./interfaces";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";
import useGetMessages from "./hooks/useGetMessages";
import { Controller } from "./controllers/Controller";
import useGetENS from "./hooks/useGetENS";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Login from "./components/Login";
import Loading from "./components/Loading";

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [myChats, setMyChats] = useState<ENSInfo[]>([]);
  const { walletProvider } = useWeb3ModalProvider();
  const { isConnected, chainId, address } = useWeb3ModalAccount();
  const ref = useRef<HTMLInputElement>(null);
  const [valid, setValid] = useState(false);
  const { loading, details: userENS } = useGetENS(
    walletProvider,
    isConnected,
    valid
  );

  const { globalMessages, chats } = useGetMessages(walletProvider, isConnected);
  const controller = new Controller(chainId, walletProvider);
  function extractMessages() {
    if (selectedChat) {
      const msgs = globalMessages.filter(
        (ft) =>
          ft.from.toString() === selectedChat.address_.toString() ||
          ft.to.toString() === selectedChat.address_.toString()
      );
      setMessages(msgs);
    }
  }

  function extractChats() {
    let ids: string[] = [];
    for (let i = 0; i < globalMessages.length; i++) {
      const element = globalMessages[i];

      if (element.from.toString() === address?.toString()) {
        if (!ids.includes(element.to.toString())) {
          ids.push(element.to.toString());
        }
      } else {
        if (!ids.includes(element.from.toString())) {
          ids.push(element.from.toString());
        }
      }
    }

    for (let i = 0; i < ids.length; i++) {
      const element = ids[i];
      // console.log(chats);
      const find = chats.find(
        (fd) => fd.address_?.toString() === element.toString()
      );
      // console.log(find);
      if (find) {
        setMyChats([...myChats, find]);
      }
    }
  }

  const [search, setSearch] = useState<ENSInfo | null>(null);

  const addMessage = async (text: string) => {
    const newMessage: Message = {
      from: address?.toString() ?? "",
      to: selectedChat?.address_ ?? "",
      message: text,
      userProfile: selectedChat!,
    };
    setMessages([...messages, newMessage]);
    const transaction = {
      from: address?.toString(),
      to: selectedChat?.address_.toString(),
      message: text,
    };
    const toastId = toast.loading("Processing");

    const provider = new ethers.BrowserProvider(walletProvider!);
    try {
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(JSON.stringify(transaction));
      const response = await fetch(
        "https://ens-contract.onrender.com/send-message",
        {
          method: "POST",
          body: JSON.stringify({ ...transaction, signature }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const jsonResponse = await response.json();

      if (jsonResponse.success) {
        toast.success(jsonResponse.message);
      } else {
        toast.error(jsonResponse.message);
      }
      toast.dismiss(toastId);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("OOPS!! SOMETHING_WENT_WRONG");
    }
  };
  // const [registering, setRegistering] = useState<boolean>(false);
  // const ensRef = useRef<HTMLInputElement>(null);
  // const [fileImg, setFileImg] = useState<any>();
  const [selectedChat, setSelectedChat] = useState<ENSInfo | null>(null);
  // const [cachedImageHash, setCachedImgHash] = useState<string | null>(null);
  // const sendFileToIPFS = async () => {
  //   if (registering) return;
  //   if (fileImg && ensRef.current?.value) {
  //     try {
  //       if (cachedImageHash) {
  //         const tx = await controller.registerENS(
  //           cachedImageHash,
  //           ensRef.current.value.trim()
  //         );

  //         if (tx) {
  //           setCachedImgHash(null);
  //         } else {
  //           setCachedImgHash(cachedImageHash);
  //         }

  //         return;
  //       }
  //       setRegistering(true);
  //       const formData = new FormData();
  //       formData.append("file", fileImg);

  //       const resFile = await axios({
  //         method: "post",
  //         url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
  //         data: formData,
  //         headers: {
  //           pinata_api_key: `${import.meta.env.VITE_API_KEY}`,
  //           pinata_secret_api_key: import.meta.env.VITE_SECRET_KEY,
  //           "Content-Type": "multipart/form-data",
  //         },
  //       });

  //       const ImgHash = resFile.data.IpfsHash;
  //       const tx = await controller.registerENS(
  //         ImgHash,
  //         ensRef.current.value.trim()
  //       );

  //       if (tx) {
  //         setCachedImgHash(null);
  //         setValid(!setValid);
  //       } else {
  //         setCachedImgHash(ImgHash);
  //       }
  //       setRegistering(false);
  //     } catch (error) {
  //       console.log("Error sending File to IPFS: ");
  //       console.log(error);
  //     }
  //   }
  // };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  function processURL(hash: string): string {
    // return hash;
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  useEffect(() => {
    setMyChats([]);
    setSearch(null);
    setMessages([]);
  }, [address]);

  useEffect(() => {
    setMessages([]);
    extractMessages();
  }, [selectedChat]);

  useEffect(() => {
    extractChats();
  }, [globalMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isConnected) {
    return (
      <div className="h-screen ">
        <nav className="py-3 px-2 max-w-[90vw] shadow shadow-[rgba(255,255,255,.1)]">
          <div className="flex items-center justify-between container ">
            {userENS ? (
              <div className="flex items-center gap-3">
                <img
                  src={processURL(userENS?.avatar ?? "")}
                  className="w-8 h-8 rounded-full"
                  alt=""
                />
                <h1 className=" madimi-one-regular text-2xl">
                  {userENS?.name}
                </h1>
              </div>
            ) : (
              <h1 className=" madimi-one-regular text-3xl">PYDE</h1>
            )}
            <w3m-button />
          </div>
        </nav>
        {loading ? (
          <Loading />
        ) : userENS ? (
          <div className="max-w-[90vw] mx-auto flex mt-7">
            <div className="w-1/4 h-[82vh] overflow-y-auto bg-black shadow-md rounded p-4 mr-4">
              <h2 className="text-lg font-bold mb-4">CHATS</h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const result = await controller.searchENS(
                    ref.current?.value.trim() ?? ""
                  );
                  if (result) {
                    setSearch(result);
                  }
                }}
              >
                <input
                  ref={ref}
                  type="text"
                  placeholder="search..."
                  className="w-full border px-2 py-1 rounded"
                  required
                />
              </form>
              <ul className="space-y-3 mt-5">
                {search ? (
                  <li
                    onClick={() => setSelectedChat(search)}
                    className="py-1 border-b-[1px] pb-2 flex items-center gap-2 text-white  bg-slate-400 p-2 rounded-md"
                  >
                    <img
                      src={processURL(search.avatar)}
                      className="w-8 h-8 rounded-full"
                      alt=""
                    />
                    <p>{search.name}</p>
                  </li>
                ) : null}
                {myChats.map((chat, index) => (
                  <li
                    key={index}
                    onClick={() => setSelectedChat(chat)}
                    className="py-1 border-b-[1px] pb-2 flex items-center gap-2"
                  >
                    <img
                      src={processURL(chat.avatar)}
                      className="w-8 h-8 rounded-full"
                      alt=""
                    />
                    <p>{chat.name}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-3/4 bg-teal-300 h-[82vh] shadow-md rounded p-4">
              {selectedChat ? (
                <div className="">
                  <div className="flex items-center mb-4 gap-3">
                    <img
                      src={processURL(selectedChat.avatar)}
                      className="h-10 w-10 rounded-full"
                      alt=""
                    />
                    <h2 className="text-lg font-bold">{selectedChat.name}</h2>
                  </div>
                  <div
                    ref={messagesEndRef}
                    className="mb-4  h-[60vh] overflow-y-auto"
                  >
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={index}
                        message={message.message}
                        from={message.from}
                        to={message.to}
                        userProfile={message.userProfile}
                      />
                    ))}
                  </div>
                  <ChatInput addMessage={addMessage} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  PYDE Chat
                </div>
              )}
            </div>
          </div>
        ) : (
          <Login />
        )}
      </div>
    );
  } else {
    return (
      <div className="w-full h-screen flex items-center justify-center ">
        <w3m-button />
      </div>
    );
  }
};

export default App;

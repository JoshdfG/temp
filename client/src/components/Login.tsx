import React, { useRef, useState } from "react";
import { Controller } from "../controllers/Controller";
import axios from "axios";

import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers/react";

export default function Login() {
  const [cachedImageHash, setCachedImgHash] = useState<string | null>(null);
  const [registering, setRegistering] = useState<boolean>(false);
  const ensRef = useRef<HTMLInputElement>(null);
  const [fileImg, setFileImg] = useState<any>();
  const { walletProvider } = useWeb3ModalProvider();
  const { isConnected, chainId, address } = useWeb3ModalAccount();
  const controller = new Controller(chainId, walletProvider);
  const [valid, setValid] = useState(false);

  const sendFileToIPFS = async () => {
    if (registering) return;
    if (fileImg && ensRef.current?.value) {
      try {
        if (cachedImageHash) {
          const tx = await controller.registerENS(
            cachedImageHash,
            ensRef.current.value.trim()
          );

          if (tx) {
            setCachedImgHash(null);
          } else {
            setCachedImgHash(cachedImageHash);
          }

          return;
        }
        setRegistering(true);
        const formData = new FormData();
        formData.append("file", fileImg);

        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: `${import.meta.env.VITE_API_KEY}`,
            pinata_secret_api_key: import.meta.env.VITE_SECRET_KEY,
            "Content-Type": "multipart/form-data",
          },
        });

        const ImgHash = resFile.data.IpfsHash;
        const tx = await controller.registerENS(
          ImgHash,
          ensRef.current.value.trim()
        );

        if (tx) {
          setCachedImgHash(null);
          setValid(!setValid);
        } else {
          setCachedImgHash(ImgHash);
        }
        setRegistering(false);
      } catch (error) {
        console.log("Error sending File to IPFS: ");
        console.log(error);
      }
    }
  };
  return (
    <div className=" h-[80vh] w-full flex items-center justify-center ">
      <div className="w-1/2 shadow-md rounded-xl bg-gray-100 p-5">
        <h1 className="text-xl font-[600]">Register ENS</h1>
        <div className="flex mt-10 items-center justify-center">
          {/* <form></form> */}
          {fileImg ? (
            <label
              htmlFor="file"
              className="h-32 cursor-pointer w-32 bg-gray-300 rounded-full"
            >
              <img
                src={URL.createObjectURL(fileImg)}
                className="w-full h-full rounded-full"
                alt=""
              />
            </label>
          ) : (
            <label
              htmlFor="file"
              className="h-32 cursor-pointer w-32 bg-gray-300 rounded-full"
            ></label>
          )}
        </div>
        <input
          ref={ensRef}
          type="text"
          placeholder="Name..."
          className="outline-none border-[1px] p-3 rounded-lg mt-10 w-full"
          name=""
          id=""
        />
        <button
          disabled={registering}
          onClick={sendFileToIPFS}
          className="bg-blue-400 w-full p-3 text-white mt-10 rounded"
        >
          {registering ? "Loading..." : "Register"}
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.length) {
              setFileImg(e.target.files[0]);
            }
            console.log("sdfs");
          }}
          className="w-0 h-0"
          name=""
          id="file"
        />
      </div>
    </div>
  );
}

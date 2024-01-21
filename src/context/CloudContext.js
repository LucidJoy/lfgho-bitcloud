import React, { createContext, useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";

import Crossway from "./Crossway.json";
import ERC20 from "./ERC20.json";

export const CloudContext = createContext({});

const contractAddress = "0x03aBb516722Db6ffc36a33b74B656C876D542D92"; // crosspay address
const erc20ContractAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60"; // ccip token
const contractAbi = Crossway.abi;
const erc20ContractAbi = ERC20.abi;

const ghoAddress = "0xc4bF5CbDaBE595361438F8c6a187bDc330539c60";

export const CloudProvider = ({ children }) => {
  const [toggleTransferSuccess, setToggleTransferSuccess] = useState(false);
  const [visibleTransfer, setVisibleTransfer] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [receivingTxns, setReceivingTxns] = useState([]);
  const [sendingTxns, setSendingTxns] = useState([]);
  const [accountBalance, setAccountBalance] = useState("");

  const [singleTxForm, setsingleTxForm] = useState({
    receiver: "",
    amount: "",
    chain: "",
  });

  const [multiTxForm, setMultiTxForm] = useState({
    // MULTI_WALLET
    amount: "",
    chain: "",
  });

  const [recentSendingCode, setRecentSendingCode] = useState("");
  const [verificationId, setVerificationId] = useState(""); // POPULATE In Modal
  const [currentTxn, setCurrentTxn] = useState("");

  const convertDateTime = (unixTime) => {
    let date = new Date(unixTime * 1000).toString();

    const parsedDate = new Date(date);

    // Get the desired components
    const month = parsedDate.toLocaleString("en-us", { month: "short" });
    const day = parsedDate.getDate();
    const year = parsedDate.getFullYear();
    const hours = parsedDate.getHours();
    const minutes = parsedDate.getMinutes();
    const seconds = parsedDate.getSeconds();

    // Create the formatted date and time string
    const formattedDate = `${month} ${day} ${year} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
  };

  // Check if it is connected to wallet
  const checkIfWalletIsConnect = async () => {
    // While installing metamask, it has an ethereum object in the window
    if (!window.ethereum) return alert("Please install MetaMask.");

    // Fetch all the eth accounts
    const accounts = await window.ethereum.request({ method: "eth_accounts" });

    // Connecting account if exists
    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log("No accounts found");
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");

    // Fetch all the eth accounts------------------------------------here----------------
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("Account--->", accounts[0]);
    setCurrentAccount(accounts[0]);

    // Reloading window
    window.location.reload();
  };

  // Checking if wallet is there in the start
  useEffect(() => {
    checkIfWalletIsConnect();
  }, []);

  useEffect(() => {
    console.log("Current account--->", currentAccount);
    console.log("Receiving Txns--->", receivingTxns);
  }, [currentAccount]);

  useEffect(() => {
    (async () => {
      await getAllMySending();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await getAccountBalance();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await getAllMyReceiving();
    })();
  }, []);

  const getAccountBalance = async () => {
    let userAddress;

    if (window.ethereum) {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        erc20ContractAddress,
        erc20ContractAbi,
        provider
      );

      if (window.ethereum.isConnected()) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        console.log(accounts[0]);
        userAddress = accounts[0];
      }

      const txRes = await contract.balanceOf("0x03aBb516722Db6ffc36a33b74B656C876D542D92");
      console.log("🟢🟢🟢", txRes)
      console.log("🟢🟢🟢", txRes._hex)
      let formattedtxRes = ethers.utils.formatEther(Number(txRes._hex).toString());
      console.log("🟢🟢🟢", formattedtxRes)
      // formattedtxRes = formattedtxRes / 10 ** 18;
      console.log("====================================");
      console.log("balance of ---> ", formattedtxRes);
      console.log("====================================");

      setAccountBalance(formattedtxRes);
    }
  };

  const getAllMySending = async () => {
    let results = [],
      txn;
    let userAddress;

    if (window.ethereum) {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        provider
      );

      if (window.ethereum.isConnected()) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        console.log(accounts[0]);
        userAddress = accounts[0];
      }

      const txRes = await contract.getSendingPayments(userAddress);
      console.log("My sending payments: ", txRes);

      txRes &&
        txRes.map((details, index) => {
          txn = {
            id: Number(details.transactionId._hex),
            verificationId: ethers.BigNumber.from(
              details.verficationId._hex
            ).toString(),
            sender: details.sender,
            receiver: details.receiver,
            amount: Number(details.amount._hex),
            chain: details.chain,
            status: details.status,
            startTime: convertDateTime(Number(details.startTime._hex)),
          };

          results.push(txn);
          txn = {};
        });

      setSendingTxns(results);
      console.log("Formatted Receiving: ", results);
    }
  };

  const getAllMyReceiving = async () => {
    let results = [],
      txn;
    let userAddress;

    if (window.ethereum) {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        provider
      );

      if (window.ethereum.isConnected()) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        console.log(accounts[0]);
        userAddress = accounts[0];
      }

      const txRes = await contract.getReceivingPayments(userAddress);
      console.log("My Receiving payments: ", txRes);

      txRes &&
        txRes.map((details, index) => {
          txn = {
            id: Number(details.transactionId._hex),
            verificationId: ethers.BigNumber.from(
              details.verficationId._hex
            ).toString(),
            sender: details.sender,
            receiver: details.receiver,
            amount: Number(details.amount._hex),
            chain: details.chain,
            status: details.status,
            startTime: convertDateTime(Number(details.startTime._hex)),
          };

          results.push(txn);
          txn = {};
        });

      setReceivingTxns(results);
      console.log("Formatted Receiving: ", results);
    }
  };

  const getLatestId = async () => {
    let results = [],
      txn;
    let userAddress;

    if (window.ethereum) {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        provider
      );

      if (window.ethereum.isConnected()) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        console.log(accounts[0]);
        userAddress = accounts[0];
      }

      const txRes = await contract.getLatestVerificationId();
      // ethers.BigNumber.from(details.verficationId._hex).toString(),
      console.log(
        "My Recent ID: ",
        ethers.BigNumber.from(txRes._hex).toString()
      );

      setRecentSendingCode(ethers.BigNumber.from(txRes._hex).toString());
    }
  };

  const getRandomNumber = async ({ receiver, amount, chain }) => {
    let user;
    try {
      if (window.ethereum) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        if (window.ethereum.isConnected()) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          console.log(accounts[0]);
          user = accounts[0];
        }

        // string memory _companyName, string memory _description, uint256 _loanAmt, string memory _docs
        const txRes = await contract.requestRandomWords({ gasLimit: 5000000 });

        await txRes.wait(1);

        setTimeout(async () => {
          await getLatestId();
          const res = await initiateTransaction(receiver, amount, chain);

          setToggleTransferSuccess(true);
        }, 50000); // doubt

        console.log("Random words: ", txRes);
        return true;
      }
    } catch (error) {
      console.log("Random words: ", error);
      alert("Random words: ");
    }
  };

  const initiateTransaction = async (receiver, amount, chain) => {
    let user;
    try {
      if (window.ethereum) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        if (window.ethereum.isConnected()) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          console.log(accounts[0]);
          user = accounts[0];
        }

        //address _sender, address _receiver, uint256 _amount, string memory _chain, string memory _receiverStr
        const txRes = await contract.executePayment(
          user,
          receiver,
          ethers.utils.parseEther(amount),
          chain,
          receiver,
          { gasLimit: 5000000 }
        );

        await txRes.wait(1);

        console.log("Initiate Txn: ", txRes);

        return true;
      }
    } catch (error) {
      console.log("Initiate Txn: ", error);
      alert("Initiate Txn: ");
    }
  };

  const cancelTransaction = async (transactionId) => {
    let user;
    try {
      if (window.ethereum) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        if (window.ethereum.isConnected()) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          console.log(accounts[0]);
          user = accounts[0];
        }

        const txRes = await contract.cancelPayment(user, transactionId, {
          gasLimit: 5000000,
        });

        await txRes.wait(1);

        console.log("Cancel Txn: ", txRes);

        return true;
      }
    } catch (error) {
      console.log("Cancel Txn: ", error);
      alert("Cancel Txn: ");
    }
  };

  const acceptInTransaction = async () => {
    let user;
    try {
      if (window.ethereum) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        if (window.ethereum.isConnected()) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          console.log(accounts[0]);
          user = accounts[0];
        }

        const txRes = await contract.acceptIncomingPayment(
          user,
          currentTxn,
          verificationId,
          { gasLimit: 5000000 }
        );

        await txRes.wait(1);

        console.log("Accept Txn: ", txRes);

        return true;
      }
    } catch (error) {
      console.log("Accept Txn: ", error);
      alert("Accept Txn: ");
    }
  };

  const approveOutTransaction = async (transactionId) => {
    // Integrated
    let user;
    try {
      if (window.ethereum) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        if (window.ethereum.isConnected()) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          console.log(accounts[0]);
          user = accounts[0];
        }

        const txRes = await contract.approveOutgoingPayment(
          user,
          transactionId,
          { gasLimit: 5000000 }
        );

        await txRes.wait(1);

        console.log("Approve Txn: ", txRes);

        return true;
      }
    } catch (error) {
      console.log("Approve Txn: ", error);
      alert("Approve Txn: ");
    }
  };

  const multiTransaction = async (
    walletAddresses,
    { receiver, chain, amount },
    symbol = "CCIP-BnM"
  ) => {
    let user;
    try {
      if (window.ethereum) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractAbi,
          signer
        );

        if (window.ethereum.isConnected()) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          console.log(accounts[0]);
          user = accounts[0];
        }

        const txRes = await contract.sendToMany(
          chain,
          "0xEC6C1001a15c48D4Ea2C7CD7C45a1c5b6aD120E9",
          walletAddresses,
          symbol,
          amount,
          user,
          { gasLimit: 5000000, value: ethers.utils.parseEther("0.4") }
        );

        await txRes.wait(1);

        console.log("Multi Txn: ", txRes);

        return true;
      }
    } catch (error) {
      console.log("Multi Txn: ", error);
      alert("Multi Txn: ");
    }
  };

  const approveCCIPToken = async () => {
    try {
      let user;
      if (window.ethereum) {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = new ethers.Contract(
          ghoAddress,
          erc20ContractAbi,
          signer
        );

        if (window.ethereum.isConnected()) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          console.log(accounts[0]);
          user = accounts[0];
        }

        const txRes = await contract.approve(
          contractAddress,
          ethers.utils.parseEther(singleTxForm.amount),
          { gasLimit: 5000000}
        );

        await txRes.wait(1);

        console.log("GHO Token Approve: ", txRes);

        return true;
      }
    } catch (error) {
      console.log("GHO Token Approve Error: ", error);
      alert("GHO Token Approve Error!!");
    }
  }

  return (
    <CloudContext.Provider
      value={{
        approveCCIPToken,
        multiTransaction,
        approveOutTransaction,
        acceptInTransaction,
        cancelTransaction,
        initiateTransaction,
        getRandomNumber,
        toggleTransferSuccess,
        setToggleTransferSuccess,
        visibleTransfer,
        setVisibleTransfer,
        currentAccount,
        setCurrentAccount,
        connectWallet,
        receivingTxns,
        setReceivingTxns,
        getAllMyReceiving,
        sendingTxns,
        accountBalance,
        singleTxForm,
        setsingleTxForm,
        recentSendingCode,
        setRecentSendingCode,
        multiTxForm,
        setMultiTxForm,
        verificationId,
        setVerificationId,
        currentTxn,
        setCurrentTxn,
      }}
    >
      {children}
    </CloudContext.Provider>
  );
};

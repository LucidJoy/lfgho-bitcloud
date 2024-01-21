import React, { useState, useContext, useEffect } from "react";
import cn from "classnames";
import styles from "./Transfer.module.sass";
import Icon from "../Icon";
import TextInput from "../TextInput";
import Dropdown from "../Dropdown";

import { CloudContext } from "../../context/CloudContext";

const fromDirectionOptions = ["Margin", "Fiat and Spot"];
const toDirectionOptions = ["Sepolia", "Mumbai", "Fuji", "Arbitrum Sepolia"];
const coinOptions = ["CCIP-BnM", "clCCIP-LnM", "GHO"];

const Transfer = () => {
  const [fromDirection, setFromDirection] = useState(fromDirectionOptions[0]);
  const [toDirection, setToDirection] = useState(toDirectionOptions[0]);
  const [coin, setCoin] = useState(coinOptions[0]);

  const {
    toggleTransferSuccess,
    setToggleTransferSuccess,
    visibleTransfer,
    setVisibleTransfer,
    accountBalance,
    singleTxForm,
    setsingleTxForm,
    getRandomNumber,
    recentSendingCode,
    setRecentSendingCode,
    sendingTxns,
    getAllMySending,
    approveCCIPToken
  } = useContext(CloudContext);

  useEffect(() => console.log(toggleTransferSuccess), [toggleTransferSuccess]);

  const handleSingleTransfer = async () => {
    // Approve Token here - 0xf1E3A5842EeEF51F2967b3F05D45DD4f4205FF40 (Polygon Mumbai)
    const response = await approveCCIPToken();

    if (response) {
      const res = await getRandomNumber(singleTxForm);
      console.log("Initiating tx Status: ", res);
    }

    // setTimeout(async () =>  { // BUG
    //   await getAllMySending();
    //   console.log(sendingTxns[sendingTxns.length - 1].verificationId);
    //   // setRecentSendingCode(sendingTxns[sendingTxns.length - 1].verificationId);
    //   setToggleTransferSuccess(true);
    // }, 70000);
  };

  return (
    <div className={styles.transfer}>
      <div className={cn("h4", styles.title)}>
        <Icon name="arrow-left" size="32" />
        Transfer
      </div>
      <div className={styles.wrap}>
        <div className={styles.category}>
          Available <br></br>balance
        </div>
        <div className={styles.details}>
          <div className={styles.currency}>{accountBalance} GHO</div>
          {/* <div className={styles.price}></div> */}
        </div>
      </div>
      <div className={styles.field}>
        {/* <Dropdown
          className={styles.dropdown}
          label='from'
          value={fromDirection}
          setValue={setFromDirection}
          options={fromDirectionOptions}
        /> */}
        <TextInput
          className={styles.field}
          label="Receiver Address"
          name="Address"
          type="text"
          note=""
          required
        />
      </div>
      {/* <div className={styles.sign}>
        <Icon name='arrows' size='16' />
      </div> */}
      <div className={styles.field}>
        <Dropdown
          className={styles.dropdown}
          label="Chain"
          value={toDirection}
          setValue={setToDirection}
          options={toDirectionOptions}
        />
      </div>
      <div className={styles.field}>
        <Dropdown
          className={styles.dropdown}
          label="coin"
          value={coin}
          setValue={setCoin}
          options={coinOptions}
        />
      </div>
      <div className={styles.box}>
        <TextInput
          className={styles.field}
          label="Amount to transfer"
          name="amount"
          type="text"
          note={`${accountBalance} CCIP-BnM available`}
          required
        />
        <button className={cn("button-stroke button-small", styles.button)}>
          Max amount
        </button>
      </div>
      <button
        className={cn("button", styles.button)}
        onClick={() => {
          handleSingleTransfer(true);
        }}
      >
        Transfer
      </button>
    </div>
  );
};

export default Transfer;

// SENDING TABLE

import React, { useContext, useState } from "react";
import cn from "classnames";
import styles from "./Table.module.sass";
import { Link } from "react-router-dom";

import {ethers} from "ethers";

import { CloudContext } from "../../../context/CloudContext";

import { shortenAddress } from "../../../utils/shortenAddress.jsx";

const Table2 = ({ className, items }) => {
  const { sendingTxns, approveOutTransaction } = useContext(CloudContext);

  const [isClicked, setIsClicked] = useState(false);

  const handleApproveTxn = async (txId) => {
    console.log(`Approve was hit for TxID: ${txId}`);

    const res = await approveOutTransaction(txId);
    console.log("Approve Status: ", res);
  };

  console.log("State Sending txs: ", sendingTxns);

  return (
    <div className={cn(className, styles.table)}>
      <div className={styles.row}>
        <div className={styles.col}>
          <div className="sorting">Type</div>
        </div>
        <div className={styles.col}>
          <div className="sorting">Coin</div>
        </div>
        <div className={styles.col}>
          <div className="sorting">Amount</div>
        </div>
        <div className={styles.col}>
          <div className="sorting">Address</div>
        </div>
        <div className={styles.col}>
          <div className="sorting">Chain</div>
        </div>
        {/* <div className={styles.col}> */}
        <div className={styles.col}>Date</div>
        {/* </div> */}
        {/* <div className={styles.col}>Action</div> */}
      </div>

      {sendingTxns.length == 0 && (
        <div className={styles.currency}>No records found</div>
      )}
      {sendingTxns.length > 0 &&
        sendingTxns.map((x, index) => (
          <div className={styles.row} key={index}>
            <div className={styles.col}>
              {x.status === "Completed" || x.status === "Cancelled" ? (
                <div className={cn("category-green", styles.category)}>
                  {x.status}
                </div>
              ) : (
                <div
                  className={cn("category-blue", styles.category)}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    handleApproveTxn(x.id);
                  }}
                >
                  {x.status == "Waiting for approval" ? "Approve" : x.status}
                </div>
              )}
            </div>
            <div className={styles.col}>
              <div className={styles.item}>
                <div className={styles.icon}>
                  <img
                    src={"/images/content/currency/usd-coin.svg"}
                    alt="Coin"
                  />
                </div>
                <div className={styles.currency}>{"GHO"}</div>
              </div>
            </div>
            <div className={styles.col}>
              <div className={styles.label}>Amount</div>
              {ethers.utils.formatEther((x.amount).toString())}
            </div>
            <div className={styles.col}>
              <div className={styles.label}>Address</div>
              {shortenAddress(x.receiver)}
            </div>
            <div className={styles.col}>
              <div className={styles.label}>Chain</div>
              {"Arbitrum Sepolia"}
            </div>
            <div className={styles.col}>
              <div className={styles.label}>Date</div>
              {x.startTime}
            </div>
            {/* <button className={styles.col}>
              {"Cancel"}
            </button>
            <button className={styles.col}>
              {"Approve"}
            </button> */}
          </div>
        ))}
    </div>
  );
};

export default Table2;

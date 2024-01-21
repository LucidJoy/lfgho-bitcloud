// RECEIVING TABLE

import React, { useContext, useState } from "react";
import cn from "classnames";
import styles from "./Table.module.sass";
import { Link } from "react-router-dom";

import {ethers} from "ethers";

import { CloudContext } from "../../../context/CloudContext";

import { shortenAddress } from "../../../utils/shortenAddress.jsx";
import Modal from "../../../components/Modal";
const Table = ({ className, items }) => {
  const {
    receivingTxns,
    verificationId,
    setVerificationId,
    currentTxn,
    setCurrentTxn,
    acceptInTransaction,
  } = useContext(CloudContext);
  const [showModal, setShowModal] = useState(false);

  console.log("State txs: ", receivingTxns);

  const handleAcceptTxn = async () => {
    const res = await acceptInTransaction();
    console.log("Accepting status: ", res);
  };

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
          <div className="sorting">Sender</div>
        </div>
        <div className={styles.col}>
          <div className="sorting">Chain</div>
        </div>
        <div className={styles.col}>Date</div>
      </div>

      {receivingTxns.length == 0 && (
        <div className={styles.currency}>No records found</div>
      )}
      {receivingTxns.length > 0 &&
        receivingTxns.map((x, index) => (
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
                    setCurrentTxn(x.id);
                    if (x.status == "Waiting for acceptance") {
                      if (!showModal) setShowModal(true);
                    }
                  }}
                >
                  {x.status == "Waiting for acceptance" ? "Accept" : x.status}
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
              {shortenAddress(x.sender)}
            </div>
            <div className={styles.col}>
              <div className={styles.label}>Chain</div>
              {"Arbitrum Sepolia"}
            </div>
            <div className={styles.col}>
              <div className={styles.label}>Date</div>
              {x.startTime}
            </div>
          </div>
        ))}
      <Modal
        visible={showModal}
        onClose={() => {
          setVerificationId("");
          setShowModal(false);
        }}
      >
        <div className={styles.modal}>
          <div className={styles.title}>Enter verification ID</div>
          <div className={styles.subtitle}>
            Please enter the verification ID sent to your email
          </div>
          <div className={styles.form}>
            <div className={styles.field}>
              <input
                className={styles.input}
                type="text"
                placeholder="Verification ID"
                value={verificationId}
                onChange={(e) => setVerificationId(e.target.value)}
              />
              {/* {console.log("Verification ID entered: ", verificationId)}
              {console.log("Txn ID entered: ", currentTxn)} */}
            </div>
            <div className={styles.btns}>
              <button
                className="button-stroke button-small"
                onClick={() => {
                  setVerificationId("");
                  setShowModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="button button-small"
                onClick={() => {
                  setVerificationId("");
                  handleAcceptTxn(); // MODAL for entering verification id
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Table;

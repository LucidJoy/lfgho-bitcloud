import React, {useContext} from "react";
import cn from "classnames";
import styles from "./Successfully.module.sass";
import { Link } from "react-router-dom";

import { CloudContext } from "../../../../context/CloudContext";


const items = [
  {
    title: "Status",
    content: "Completed",
    color: "#58BD7D",
  },
  {
    title: "Transaction ID",
    content: "0msx836930...87r398",
  },
];

const Successfully = () => {

  const {
    recentSendingCode, 
  } = useContext(CloudContext);
  return (
    <>
      <div className={styles.successfully}>
        <div className={cn("h4", styles.title)}>Verification Code</div>
        <div className={cn("h6", styles.title)} style={{ marginTop: "-30px" }}>
          (Chainlink VRF)
        </div>
        {/* <div className={styles.info}>
          You successfully purchased <span>0.020202 BTC</span> from Bitcloud
        </div> */}
        <div className={`${styles.list} ${styles.longText}`}>
          <span>
            {recentSendingCode != '' ? recentSendingCode :'000000000000000000000000000000000000000000000000000000000000000000000000000000'}
          </span>
        </div>
        <div
          className={styles.btns}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* <Link className={cn("button-stroke", styles.button)} to='/exchange'>
            Trade
          </Link> */}
          <Link className={cn("button", styles.button)} to='/wallet-overview'>
            Done
          </Link>
        </div>
      </div>
    </>
  );
};

export default Successfully;

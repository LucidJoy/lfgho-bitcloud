import React, { useState, useContext } from "react";
import cn from "classnames";
import styles from "./WalletOverview.module.sass";
import Wallet from "../../components/Wallet";
import Icon from "../../components/Icon";
import Dropdown from "../../components/Dropdown";
import AccountBalances from "./AccountBalances";
import AssetBalances from "./AssetBalances";
import Integrations from "./Integrations";
import Activity from "../../screens/Activity/index";
import Activity2 from "../../screens/Activity2/index";

import {CloudContext} from '../../context/CloudContext';

const optionsCurrency = ["USD", "EUR", "RUB"];



const WalletOverview = () => {
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState(optionsCurrency[0]);

  const {accountBalance} = useContext(CloudContext);


  const handleSubmit = (e) => {
    alert();
  };

  return (
    <Wallet>
      <div className={styles.top}>
        <div className={styles.line}>
          <h4 className={cn("h4", styles.title)}>Overview</h4>
          <div className={styles.wrap}>
            <form
              className={styles.form}
              action=''
              onSubmit={() => handleSubmit()}
            >
              <input
                className={styles.input}
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                name='search'
                placeholder='Search coin'
                required
              />
              <button className={styles.result}>
                <Icon name='search' size='20' />
              </button>
            </form>
            {/* <Dropdown
              className={styles.dropdown}
              classDropdownHead={styles.dropdownHead}
              value={currency}
              setValue={setCurrency}
              options={optionsCurrency}
            /> */}
            <button className={cn("button-black button-small", styles.button)}>
              Show balance
            </button>
          </div>
        </div>
        <div className={styles.details}>
          <div className={styles.info}>Total balance</div>
          <div className={styles.currency}>
            <div className={styles.number}>{accountBalance}</div>
            <div className={cn("category-green", styles.category)}>GHO</div>
          </div>
        </div>
      </div>
      <div className={styles.list}>
        <div className={styles.item}>
          <div className={styles.head}>Send Transactions</div>
          <div>
            <Activity2/>  
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.head}>Receive Transactions</div>
          <div>
            <Activity/>
          </div>
        </div>
        {/* <div className={styles.item}>
          <div className={styles.head}>Asset Balances</div>
          <div className={styles.body}>
            <AssetBalances />
          </div>
        </div>
        <div className={styles.item}>
          <div className={styles.head}>Integrations</div>
          <div className={styles.body}>
            <Integrations />
          </div>
        </div> */}
      </div>
    </Wallet>
  );
};

export default WalletOverview;

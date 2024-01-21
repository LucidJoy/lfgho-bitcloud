import React, { useEffect, useState, useContext } from "react";
import cn from "classnames";
import styles from "./TextInput.module.sass";
import Icon from "../Icon";

import { CloudContext } from "../../context/CloudContext";

const TextInput = ({
  className,
  classLabel,
  classInput,
  label,
  empty,
  view,
  icon,
  note,
  ...props
}) => {
  const { singleTxForm, setsingleTxForm } = useContext(CloudContext);

  useEffect(() => {
    console.log("Form Data: ", singleTxForm);
  }, [singleTxForm]);

  return (
    <div
      className={cn(
        styles.field,
        { [styles.empty]: empty },
        { [styles.view]: view },
        { [styles.icon]: icon },
        className
      )}
    >
      {label && <div className={cn(classLabel, styles.label)}>{label}</div>}
      <div className={styles.wrap}>
        {label == "Amount to transfer" ? (
          <input
            className={cn(classInput, styles.input)}
            {...props}
            onChange={(e) =>
              setsingleTxForm({ ...singleTxForm, amount: e.target.value })
            }
          />
        ) : (
          <input
            className={cn(classInput, styles.input)}
            {...props}
            onChange={(e) =>
              setsingleTxForm({ ...singleTxForm, receiver: e.target.value })
            }
          />
        )}
        {view && (
          <button className={styles.toggle}>
            <Icon name="eye" size="24" />
          </button>
        )}
        {icon && (
          <div className={styles.preview}>
            <Icon name={icon} size="24" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TextInput;

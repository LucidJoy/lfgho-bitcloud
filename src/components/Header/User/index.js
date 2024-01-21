import React, { useState } from "react";
import { Link } from "react-router-dom";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./User.module.sass";
import Icon from "../../Icon";
import Theme from "../../Theme";

const items = [
  {
    title: "Profile",
    icon: "user",
    content: "Important account details",
    url: "/profile-info",
  },
  {
    title: "Referrals",
    icon: "share",
    content: "Invite your friends and earn rewards",
    url: "/referrals",
  },
  {
    title: "2FA security",
    icon: "lock",
    content: "Setup 2FA for more security",
    url: "/2fa",
  },
  {
    title: "Settings",
    icon: "cog",
    content: "View additional settings",
    url: "/api-keys",
  },
  {
    title: "Dark mode",
    icon: "theme-dark",
    content: "Switch dark/light mode",
  },
  {
    title: "Log out",
    icon: "exit",
    url: "/",
  },
];

const User = ({ className }) => {
  const [visible, setVisible] = useState(false);

  return (
    <OutsideClickHandler onOutsideClick={() => setVisible(false)}>
      <div className={cn(className, styles.user, { [styles.active]: visible })}>
        <button className={styles.head} onClick={() => setVisible(!visible)}>
          <img src="/images/content/avatar-user.jpg" alt="Avatar" />
        </button>
      </div>
    </OutsideClickHandler>
  );
};

export default User;

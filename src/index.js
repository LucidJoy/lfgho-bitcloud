import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
// import { WagmiConfig, createConfig } from "wagmi";
// import {
//   ConnectKitProvider,
//   ConnectKitButton,
//   getDefaultConfig,
// } from "connectkit";

import { CloudProvider } from "./context/CloudContext";

// const config = createConfig(
//   getDefaultConfig({
//     // Required API Keys
//     alchemyId: "0YB05pw82Hcy9XURB229iSxTdo4CdN23", // or infuraId
//     walletConnectProjectId: "03f7a34eb9ec74413407ed6f27d138fe",

//     // Required
//     appName: "lfgho",

//     // Optional
//     appDescription: "Your App Description",
//     appUrl: "https://family.co", // your app's url
//     appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
//   })
// );

ReactDOM.render(
  <React.StrictMode>
    {/* <WagmiConfig config={config}> */}
    <CloudProvider>
      <App />
    </CloudProvider>
    {/* </WagmiConfig> */}
  </React.StrictMode>,
  document.getElementById("root")
);

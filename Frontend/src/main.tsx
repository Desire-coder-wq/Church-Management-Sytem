import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";
import { App } from "./App";

// FontAwesome Imports
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faChurch,
  faUsers,
  faHeart,
  faCreditCard,
  faChartLine,
  faBell,
  faArrowRight,
  faEye,
  faEyeSlash,
  faArrowLeft,
  faEnvelope,
  faLock,
  faChartBar,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

// Register icons globally
library.add(
  faChurch,
  faUsers,
  faHeart,
  faCreditCard,
  faChartLine,
  faBell,
  faArrowRight,
  faEye,
  faEyeSlash,
  faArrowLeft,
  faEnvelope,
  faLock,
  faChartBar,
  faShieldHalved
);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
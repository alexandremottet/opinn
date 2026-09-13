import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@opinn/panel-nesting/algorithms/genetic";
import "@opinn/panel-nesting/algorithms/first-fit-decreasing";
import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

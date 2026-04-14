import { useState } from "react";

import { ActionDemo } from "./demos/ActionDemo";
import { ChangeDemo } from "./demos/ChangeDemo";
import { MountDemo } from "./demos/MountDemo";

type Tab = "mount" | "action" | "change";

export const App = () => {
  const [tab, setTab] = useState<Tab>("mount");

  return (
    <>
      <nav className="tabs">
        <button className={tab === "mount" ? "active" : ""} onClick={() => setTab("mount")}>
          useAnimateOnMount
        </button>
        <button className={tab === "action" ? "active" : ""} onClick={() => setTab("action")}>
          useAnimateOnAction
        </button>
        <button className={tab === "change" ? "active" : ""} onClick={() => setTab("change")}>
          useAnimateOnChange
        </button>
      </nav>
      {tab === "mount" && <MountDemo />}
      {tab === "action" && <ActionDemo />}
      {tab === "change" && <ChangeDemo />}
    </>
  );
};

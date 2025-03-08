import { useNavigate } from "react-router-dom";
import { initialState } from "../Store/store";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Presets({ socket }) {
  const [presetsData, setPresetsData] = useState([]);
  const [activeTab, setActiveTab] = useState(1);

  const getPresets = async () => {
    const response = await fetch("http://127.0.0.1:3001/presets", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const resp = await response.json();
    setData(resp);
  };

  useEffect(() => {
    getPresets();
    socket.on("presetAdded", () => {
      getPresets();
    });
  }, []);

  return (
    <>
      <div role="tablist" className="tabs tabs-boxed">
        <a
          role="tab"
          className={`tab ${activeTab === 1 ? "tab-active" : ""}`}
          onClick={() => setActiveTab(1)}
        >
          My presets
        </a>
        <a
          role="tab"
          className={`tab ${activeTab === 2 ? "tab-active" : ""}`}
          onClick={() => setActiveTab(2)}
        >
          Explore
        </a>
      </div>
      <div className="h-100 overflow-y-auto">
        <ul>
          {activeTab === 1 ? (
            <>
              {data.map((preset) => {
                if (preset.user_id === initialState.user_id) {
                  return <li>{preset.name}</li>;
                }
              })}
            </>
          ) : (
            <>
              {data.map((preset) => {
                return <li>{preset.name}</li>;
              })}
            </>
          )}
        </ul>
      </div>
    </>
  );
}
export default Presets;

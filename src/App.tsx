import { Sidebar } from "./components/Sidebar";
import { ResourceTable } from "./components/ResourceTable";
import { DetailPanel } from "./components/DetailPanel";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

function App() {
  useKeyboardShortcuts();
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <CommandPalette />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <ResourceTable />
        <DetailPanel />
      </div>
      <StatusBar />
    </div>
  );
}

export default App;

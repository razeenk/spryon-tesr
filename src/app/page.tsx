import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Stats from "@/components/Stats";
import MenuTable from "@/components/MenuTable";

export default function Home() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar title="Dashboard" />
        <div className="content">
          <Stats />
          <MenuTable />
        </div>
      </div>
    </div>
  );
}

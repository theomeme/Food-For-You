import React from "react";
import Sidebar from "../components/Sidebar";

const Dashboard: React.FC = () => {
  return (
    <>
      <div className="w-screen h-screen flex bg-dark-white">
        <Sidebar />
        <div></div>
      </div>
    </>
  );
};

export default Dashboard;

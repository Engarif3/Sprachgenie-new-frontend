import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SideBarItem from "./SideBarItem";
import assets from "@/assets";
import { drawerItems } from "@/utils/drwaerItems";
import { getUserInfo } from "@/services/auth.services";

const SideBar = () => {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const { role } = getUserInfo();
    setUserRole(role);
  }, []);

  return (
    <div>
      <div className="py-2 mt-2 flex justify-center items-center gap-2 cursor-pointer">
        <Link to="/">
          <img src={assets.images.science} alt="logo" className="w-10 h-10" />
        </Link>
        <Link to="/" className="text-xl font-semibold">
          DoughnutEquity
        </Link>
      </div>
      <div>
        {drawerItems(userRole).map((item, index) => (
          <SideBarItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default SideBar;

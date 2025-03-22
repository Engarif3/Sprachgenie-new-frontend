import { Link, useLocation } from "react-router-dom";

const SideBarItem = ({ item }) => {
  const location = useLocation();
  const linkPath = `/dashboard/${item.path}`;

  return (
    <Link to={linkPath}>
      <div
        className={`${
          location.pathname === linkPath ? "border-r-4 border-blue-500" : ""
        } mb-1 px-4 py-2 flex items-center cursor-pointer`}
      >
        <div className="mr-3">{item.icon && <item.icon />}</div>
        <span className="text-gray-900">{item.title}</span>
      </div>
    </Link>
  );
};

export default SideBarItem;

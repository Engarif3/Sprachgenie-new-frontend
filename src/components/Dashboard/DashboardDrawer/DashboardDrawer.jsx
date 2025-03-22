// "use client";
// import * as React from "react";
// import AppBar from "@mui/material/AppBar";
// import Box from "@mui/material/Box";
// import CssBaseline from "@mui/material/CssBaseline";
// import Drawer from "@mui/material/Drawer";
// import IconButton from "@mui/material/IconButton";
// import MenuIcon from "@mui/icons-material/Menu";
// import Toolbar from "@mui/material/Toolbar";
// import Typography from "@mui/material/Typography";
// import SideBar from "../SideBar/SideBar";
// import { getUserInfo } from "@/services/auth.services";

// const drawerWidth = 240;

// export default function DashboardDrawer({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [mobileOpen, setMobileOpen] = React.useState(false);
//   const [isClosing, setIsClosing] = React.useState(false);
//   const [userEmail, setUserEmail] = React.useState("");

//   React.useEffect(() => {
//     const { email } = getUserInfo();
//     setUserEmail(email);
//   }, []);

//   const handleDrawerClose = () => {
//     setIsClosing(true);
//     setMobileOpen(false);
//   };

//   const handleDrawerTransitionEnd = () => {
//     setIsClosing(false);
//   };

//   const handleDrawerToggle = () => {
//     if (!isClosing) {
//       setMobileOpen(!mobileOpen);
//     }
//   };

//   return (
//     <Box sx={{ display: "flex" }}>
//       <CssBaseline />
//       <AppBar
//         position="fixed"
//         sx={{
//           width: { sm: `calc(100% - ${drawerWidth}px)` },
//           ml: { sm: `${drawerWidth}px` },
//           backgroundColor: "#F4F7FE",
//           boxShadow: 0,
//           borderBottom: "1px solid lightgray",
//         }}
//       >
//         <Toolbar>
//           <IconButton
//             color="inherit"
//             aria-label="open drawer"
//             edge="start"
//             onClick={handleDrawerToggle}
//             sx={{ mr: 2, display: { sm: "none" }, color: "primary.main" }}
//           >
//             <MenuIcon />
//           </IconButton>
//           <Box>
//             <Typography variant="body2" noWrap component="div" color="gray">
//               {userEmail}
//             </Typography>
//             <Typography
//               variant="body2"
//               noWrap
//               component="div"
//               color="primary.main"
//             >
//               Welcome To DoughnutEquity !!
//             </Typography>
//           </Box>
//         </Toolbar>
//       </AppBar>
//       <Box
//         component="nav"
//         sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
//         aria-label="mailbox folders"
//       >
//         {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
//         <Drawer
//           variant="temporary"
//           open={mobileOpen}
//           onTransitionEnd={handleDrawerTransitionEnd}
//           onClose={handleDrawerClose}
//           ModalProps={{
//             keepMounted: true, // Better open performance on mobile.
//           }}
//           sx={{
//             display: { xs: "block", sm: "none" },
//             "& .MuiDrawer-paper": {
//               boxSizing: "border-box",
//               width: drawerWidth,
//             },
//           }}
//         >
//           <SideBar />
//         </Drawer>
//         <Drawer
//           variant="permanent"
//           sx={{
//             display: { xs: "none", sm: "block" },
//             "& .MuiDrawer-paper": {
//               boxSizing: "border-box",
//               width: drawerWidth,
//             },
//           }}
//           open
//         >
//           <SideBar />
//         </Drawer>
//       </Box>
//       <Box
//         component="main"
//         sx={{
//           flexGrow: 1,
//           p: 3,
//           width: { sm: `calc(100% - ${drawerWidth}px)` },
//         }}
//       >
//         <Toolbar />
//         <Box>{children}</Box>
//       </Box>
//     </Box>
//   );
// }
import React, { useState, useEffect } from "react";
import SideBar from "../SideBar/SideBar";
import { getUserInfo } from "../../../services/auth.services";

const drawerWidth = 60;

export default function DashboardDrawer({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const { email } = getUserInfo() || {};
    setUserEmail(email);
  }, []);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 bg-gray-900 text-white w-${drawerWidth} p-4 transition-transform transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0`}
      >
        <SideBar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col w-full sm:ml-16">
        {/* Navbar */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-300 p-4 flex items-center shadow-sm sm:pl-20">
          <button
            className="sm:hidden text-gray-700 focus:outline-none"
            onClick={handleDrawerToggle}
          >
            &#9776;
          </button>
          <div className="ml-4">
            <p className="text-sm text-gray-500">{userEmail}</p>
            <p className="text-sm font-semibold text-blue-600">
              Welcome To DoughnutEquity !!
            </p>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-grow p-4 pt-16 bg-gray-100">{children}</main>
      </div>
    </div>
  );
}

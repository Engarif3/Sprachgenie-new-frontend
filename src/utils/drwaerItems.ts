// // import { USER_ROLE } from "@/constants/role";
// // import { DrawerItem, UserRole } from "@/types";
// // //mu icons
// // import DashboardIcon from "@mui/icons-material/Dashboard";
// // import GroupIcon from "@mui/icons-material/Group";

// // export const drawerItems = (role: UserRole): DrawerItem[] => {
// //   const roleMenus: DrawerItem[] = [];
// //   switch (role) {
// //     case USER_ROLE.SUPER_ADMIN:
// //       roleMenus.push(
// //         {
// //           title: "Dashboard",
// //           path: `${role}`,
// //           icon: DashboardIcon,
// //         },
// //         {
// //           title: "Manage Users",
// //           path: `${role}/manage-users`,
// //           icon: GroupIcon,
// //         }
// //       );
// //       break;
// //   }
// //   return [...roleMenus];
// // };

// import { DrawerItem, UserRole } from "@/types";

// //icons
// import DashboardIcon from "@mui/icons-material/Dashboard";
// import GroupIcon from "@mui/icons-material/Group";

// import PersonIcon from "@mui/icons-material/Person";
// import KeyIcon from "@mui/icons-material/Key";

// import { USER_ROLE } from "@/constants/role";

// export const drawerItems = (role: UserRole): DrawerItem[] => {
//   const roleMenus: DrawerItem[] = [];

//   const defaultMenus = [
//     {
//       title: "Profile",
//       path: `${role}/profile`,
//       icon: PersonIcon,
//     },
//     {
//       title: "Change Password",
//       path: `change-password`,
//       icon: KeyIcon,
//     },
//   ];

//   switch (role) {
//     case USER_ROLE.SUPER_ADMIN:
//       roleMenus.push(
//         {
//           title: "Dashboard",
//           path: `${role}`,
//           icon: DashboardIcon,
//         },
//         {
//           title: "Manage Users",
//           path: `${role}/manage-users`,
//           icon: GroupIcon,
//         }
//       );
//       break;

//     case USER_ROLE.ADMIN:
//       roleMenus.push({
//         title: "Dashboard",
//         path: `${role}`,
//         icon: DashboardIcon,
//       });
//       break;

//     case USER_ROLE.COMPANY:
//       roleMenus.push({
//         title: "Dashboard",
//         path: `${role}`,
//         icon: DashboardIcon,
//       });
//       break;

//     default:
//       break;
//   }

//   return [...roleMenus, ...defaultMenus];
// };

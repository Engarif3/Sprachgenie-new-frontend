// "use client";

// import { Box, Container, Stack, Typography } from "@mui/material";
// import dynamic from "next/dynamic";
// import Link from "next/link";

// const Navbar = () => {
//   const AuthButton = dynamic(
//     () => import("@/components/UI/AuthButton/AuthButton"),
//     { ssr: false }
//   );
//   return (
//     <>
//       <Container>
//         <Stack
//           py={1}
//           direction="row"
//           justifyContent="space-between"
//           alignItems="center"
//         >
//           <Typography variant="h4" component={Link} href="/" fontWeight={600}>
//             {/* <Box component="span" color="primary.main"> */}
//             <Box component="span" color="#cc8d5e">
//               Doughnut
//             </Box>
//             <Box component="span" color="#2e7442">
//               Equity
//             </Box>
//           </Typography>
//           <Stack direction="row" justifyContent="space-between" gap={4}>
//             <Typography>About Us</Typography>
//             <Typography>About Us</Typography>
//             <Typography>About Us</Typography>
//             <Typography>About Us</Typography>
//             <Typography component={Link} href="/register">
//               Register
//             </Typography>
//           </Stack>
//           <AuthButton />
//         </Stack>
//       </Container>
//       <hr style={{ margin: "0 5rem 0 5rem" }} />
//     </>
//   );
// };

// export default Navbar;

"use client";

import {
  Box,
  Container,
  Stack,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
} from "@mui/material";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";

const Navbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const AuthButton = dynamic(
    () => import("@/components/UI/AuthButton/AuthButton"),
    { ssr: false }
  );

  const navLinks = [
    { label: "About Us", href: "#" },
    { label: "About Us", href: "#" },
    { label: "About Us", href: "#" },
    { label: "About Us", href: "#" },
    { label: "Register", href: "/register" },
  ];

  return (
    <>
      <Container>
        <Stack
          py={1}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="h4"
            component={Link}
            href="/"
            fontWeight={600}
            sx={{
              fontSize: { xs: "1.5rem", md: "2.125rem" },
            }}
          >
            <Box component="span" color="#cc8d5e">
              Doughnut
            </Box>
            <Box component="span" color="#2e7442">
              Equity
            </Box>
          </Typography>

          {/* Desktop Navigation */}
          <Stack
            direction="row"
            gap={4}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {navLinks.map((link, index) => (
              <Typography
                key={index}
                component={Link}
                href={link.href}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  "&:hover": { color: "primary.main" },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>

          {/* Mobile Menu Button */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" } }}
            onClick={() => setIsDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>

          <AuthButton />
        </Stack>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        >
          <Box sx={{ width: 250 }} role="presentation">
            <List>
              {navLinks.map((link, index) => (
                <ListItem
                  // button
                  key={index}
                  component={Link}
                  href={link.href}
                  onClick={() => setIsDrawerOpen(false)}
                  sx={{
                    "&:hover": { backgroundColor: "action.hover" },
                    py: 2,
                  }}
                >
                  <Typography variant="body1">{link.label}</Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      </Container>

      {/* Divider */}
      <Box
        sx={{
          margin: { xs: "0 1rem", md: "0 5rem" },
          borderTop: 1,
          borderColor: "divider",
        }}
      />
    </>
  );
};

export default Navbar;

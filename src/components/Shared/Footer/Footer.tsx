// import { Box, Container, Stack, Typography } from "@mui/material";
// import Image from "next/image";
// import facebookIcon from "@/assets/social-icons/facebook.png";
// import Link from "next/link";
// import assets from "@/assets";

// const Footer = () => {
//   return (
//     <Box bgcolor="rgb(17,26,34)" py={5}>
//       <Container>
//         <Stack direction="row" justifyContent="center" gap={4}>
//           <Typography color="#fff">About Us</Typography>
//           <Typography color="#fff">About Us</Typography>
//           <Typography color="#fff">About Us</Typography>
//           <Typography color="#fff">About Us</Typography>
//           <Typography color="#fff">About Us</Typography>
//         </Stack>
//         <Stack direction="row" justifyContent="center" gap={2} py={2}>
//           <Image src={facebookIcon} alt="facebook" width={30} height={30} />
//           <Image
//             src={assets.images.instagram}
//             alt="facebook"
//             width={30}
//             height={30}
//           />
//           <Image
//             src={assets.images.linkedIn}
//             alt="facebook"
//             width={30}
//             height={30}
//           />
//           <Image
//             src={assets.images.twitter}
//             alt="facebook"
//             width={30}
//             height={30}
//           />
//           <Image
//             src={assets.svg.whatsapp}
//             alt="facebook"
//             width={30}
//             height={30}
//           />
//         </Stack>
//         <div className="border-b-[1px] border-dashed "> </div>
//         <Stack
//           direction="row"
//           justifyContent="space-between"
//           alignItems="center"
//           gap={2}
//           py={3}
//         >
//           <Typography component="p" color="white">
//             &copy;2025 DoughnutEquity. All Rights Reserved.
//           </Typography>
//           <Typography
//             variant="h4"
//             component={Link}
//             href="/"
//             fontWeight={600}
//             color="white"
//           >
//             {/* <Box component="span" color="primary.main"> */}
//             <Box component="span" color="#cc8d5e">
//               Doughnut
//             </Box>
//             <Box component="span" color="#2e7442">
//               Equity
//             </Box>
//           </Typography>
//           <Typography component="p" color="white">
//             Privacy Policy! Terms & Conditions.
//           </Typography>
//         </Stack>
//       </Container>
//     </Box>
//   );
// };

// export default Footer;
import { Box, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";
import facebookIcon from "@/assets/social-icons/facebook.png";
import Link from "next/link";
import assets from "@/assets";

const Footer = () => {
  return (
    <Box bgcolor="rgb(17,26,34)" py={{ xs: 3, md: 5 }}>
      <Container>
        {/* Navigation Links */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="center"
          gap={{ xs: 2, md: 4 }}
          textAlign="center"
          mb={{ xs: 3, md: 4 }}
        >
          {[...Array(5)].map((_, index) => (
            <Typography
              key={index}
              color="#fff"
              component={Link}
              href="#"
              sx={{
                textDecoration: "none",
                "&:hover": { color: "primary.main" },
              }}
            >
              About Us
            </Typography>
          ))}
        </Stack>

        {/* Social Icons */}
        <Stack
          direction="row"
          justifyContent="center"
          gap={2}
          py={2}
          flexWrap="wrap"
        >
          {[
            facebookIcon,
            assets.images.instagram,
            assets.images.linkedIn,
            assets.images.twitter,
            assets.svg.whatsapp,
          ].map((icon, index) => (
            <Box
              key={index}
              component="a"
              href="#"
              sx={{
                display: "flex",
                "&:hover": { transform: "scale(1.1)" },
                transition: "transform 0.3s ease",
              }}
            >
              <Image
                src={icon}
                alt={`social-icon-${index}`}
                width={30}
                height={30}
                style={{ objectFit: "contain" }}
              />
            </Box>
          ))}
        </Stack>

        {/* Divider */}
        <Box
          sx={{
            borderBottom: "1px dashed",
            borderColor: "rgba(255,255,255,0.3)",
            my: { xs: 2, md: 3 },
          }}
        />

        {/* Bottom Section */}
        <Stack
          direction={{ xs: "column-reverse", md: "row" }}
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          py={3}
          textAlign={{ xs: "center", md: "left" }}
        >
          <Typography component="p" color="white" variant="body2">
            &copy;2025 DoughnutEquity. All Rights Reserved.
          </Typography>

          <Typography
            variant="h5"
            component={Link}
            href="/"
            fontWeight={600}
            color="white"
            sx={{
              textDecoration: "none",
              fontSize: { xs: "1.5rem", md: "2rem" },
            }}
          >
            <Box component="span" color="#cc8d5e">
              Doughnut
            </Box>
            <Box component="span" color="#2e7442">
              Equity
            </Box>
          </Typography>

          <Stack direction="row" gap={2} component="div">
            <Typography component="p" color="white" variant="body2">
              Privacy Policy
            </Typography>
            <Typography component="p" color="white" variant="body2">
              Terms & Conditions
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;

// import assets from "@/assets";
// import { Box, Button, Container, Typography } from "@mui/material";
// import Image from "next/image";

// const HeroSection = () => {
//   return (
//     <Container
//       sx={{
//         display: "flex",
//         direction: "row",
//         mt: 20,
//         mb: 16,
//         height: "800px",
//       }}
//     >
//       {/* //left side */}
//       <Box
//         sx={{
//           flex: 1,
//           position: "relative",
//         }}
//       >
//         <Box
//           sx={{
//             position: "absolute",
//             // top: "-70px",
//           }}
//         >
//           {/* <Image
//             src={assets.images.grid1}
//             alt="grid"
//             className=" h-[500px] opacity-70 "
//           /> */}
//         </Box>
//         <Typography
//           variant="h3"
//           component="h1"
//           fontWeight={600}
//           color="info.main"
//         >
//           Lorem ipsum
//         </Typography>
//         <Typography variant="h3" component="h1" fontWeight={600}>
//           Lorem ipsum dolor
//         </Typography>
//         <Typography
//           variant="h3"
//           component="h1"
//           color="success.main"
//           fontWeight={600}
//         >
//           Lorem ipsum dolor amet.
//         </Typography>
//         <Typography variant="h6" component="p" fontWeight={400} my={4}>
//           Lorem ipsum dolor sit, amet consectetur adipisicing elit. Vel eum,
//           sequi voluptatibus suscipit tempora voluptates accusantium a. Ipsam
//           blanditiis excepturi sint fugiat, enim id, quo, sed eius commodi.
//           nostrum ea!
//         </Typography>
//         <Box sx={{ display: "flex", gap: 2 }}>
//           <Button>Make Appointment</Button>
//           <Button variant="outlined">Contact US</Button>
//         </Box>
//       </Box>
//       {/* right side */}
//       <Box
//         sx={{
//           pl: 2,
//           flex: 1,
//           display: "flex",
//           justifyContent: "center",
//           //   alignItems: "center",
//           position: "relative",
//           //   mt: 0,
//           //   top: "-210px",
//           top: "-120px",
//           //   right: "-120px",
//         }}
//       >
//         <Box>
//           <Image
//             src={assets.images.grid}
//             alt="grid"
//             className=" opacity-55 text-red-600"
//           />
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default HeroSection;

// // 45-1

import assets from "@/assets";
import { Box, Button, Container, Typography } from "@mui/material";
import Image from "next/image";

const HeroSection = () => {
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        mt: { xs: 8, md: 20 },
        mb: { xs: 8, md: 8 },
        py: 4,
        gap: 4,
      }}
    >
      {/* Left side */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          textAlign: { xs: "center", md: "left" },
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          fontWeight={600}
          color="info.main"
          sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" } }}
        >
          Lorem ipsum
        </Typography>
        <Typography
          variant="h3"
          component="h1"
          fontWeight={600}
          sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" } }}
        >
          Lorem ipsum dolor
        </Typography>
        <Typography
          variant="h3"
          component="h1"
          color="success.main"
          fontWeight={600}
          sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" } }}
        >
          Lorem ipsum dolor amet.
        </Typography>

        <Typography
          variant="h6"
          component="p"
          fontWeight={400}
          my={4}
          sx={{ fontSize: { xs: "0.875rem", md: "1.25rem" } }}
        >
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Vel eum,
          sequi voluptatibus suscipit tempora voluptates accusantium a. Ipsam
          blanditiis excepturi sint fugiat, enim id, quo, sed eius commodi.
          nostrum ea!
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          <Button variant="contained" size="large">
            Make Appointment
          </Button>
          <Button variant="outlined" size="large">
            Contact US
          </Button>
        </Box>
      </Box>

      {/* Right side */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          position: "relative",
          top: { xs: 0, md: -12 },
          height: { xs: "400px", md: "auto" },
          width: "100%",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: 600,
            height: "100%",
          }}
        >
          <Image
            src={assets.images.grid}
            alt="grid"
            fill
            style={{
              objectFit: "contain",
              opacity: 0.55,
            }}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default HeroSection;

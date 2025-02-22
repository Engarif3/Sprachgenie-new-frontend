import { createTheme } from "@mui/material/styles";
// import { green, purple } from "@mui/material/colors";

export const theme = createTheme({
  palette: {
    primary: {
      //   main: purple[500],
      main: "#1586FD",
    },
    secondary: {
      //   main: green[500],
      main: "#666f73",
    },
    info: {
      main: "#cc8d5e",
    },
    success: {
      main: "#2e7442",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: "contained",
      },
      styleOverrides: {
        root: {
          padding: "6px 18px",
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: "xl",
      },
    },
  },
  typography: {
    body1: {
      color: "#0B1134CC",
    },
  },
});

theme.shadows[1] = "0px 5px 22px lightgray";

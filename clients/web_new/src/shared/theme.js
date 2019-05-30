import { createMuiTheme } from '@material-ui/core/styles';

export default createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#454546',
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      main: '#1976d2',
    },
  },
  // custom var
  drawerWidth: 240,
});

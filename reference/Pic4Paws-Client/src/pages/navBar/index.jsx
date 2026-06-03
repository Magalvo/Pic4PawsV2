import { useState, useContext } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchModule from "@mui/icons-material/Search";
import MessageModule from "@mui/icons-material/Message";
import DarkModeModule from "@mui/icons-material/DarkMode";
import LightModeModule from "@mui/icons-material/LightMode";
import NotificationsModule from "@mui/icons-material/Notifications";
import HelpModule from "@mui/icons-material/Help";
import MenuModule from "@mui/icons-material/Menu";
import CloseModule from "@mui/icons-material/Close";
import { useDispatch } from "react-redux";
import { setMode } from "../../state/index.js";
import { useNavigate } from "react-router-dom";
import FlexBetween from "../../components/flexBetween";
import { AuthContext } from "../../context/auth.context.jsx";
import { NavLink } from "react-router-dom";
import Logo from "../../assets/images/logiz.png";
import { resolveComponent } from "../../utils/componentInterop.js";

const Search = resolveComponent(SearchModule);
const Message = resolveComponent(MessageModule);
const DarkMode = resolveComponent(DarkModeModule);
const LightMode = resolveComponent(LightModeModule);
const Notifications = resolveComponent(NotificationsModule);
const Help = resolveComponent(HelpModule);
const Menu = resolveComponent(MenuModule);
const Close = resolveComponent(CloseModule);

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const { isGuest, stateUser, logOutUser } = useContext(AuthContext);
  //const userName = useSelector(state => state.user.firstName);

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const dark = theme.palette.neutral.dark;
  const background = theme.palette.background.default;
  const alt = theme.palette.background.alt;
  const userId = isGuest
    ? sessionStorage.getItem("guestUserId")
    : localStorage.getItem("userId");

  const userName = stateUser?.firstName || (isGuest ? "Guest" : "");

  return (
    <FlexBetween padding="1rem 6%" backgroundColor={alt}>
      <FlexBetween gap="1.75rem">
        <IconButton onClick={() => navigate("/home")}>
          <img
            src={Logo}
            style={{
              width: "8rem",
            }}
          />
        </IconButton>
        {isNonMobileScreens && (
          <FlexBetween
            backgroundColor={neutralLight}
            borderRadius="9px"
            gap="3rem"
            padding="0.1rem 1.5rem"
          >
            <InputBase placeholder="Search..." />
            <IconButton>
              <Search />
            </IconButton>
          </FlexBetween>
        )}
      </FlexBetween>

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <FlexBetween gap="2rem">
          <NavLink
            to="/pets"
            style={{
              textDecoration: "none",
              color: "white",
              backgroundColor: "#638BF1",
              borderRadius: "20px",
              padding: "0.5rem 1.5rem",
              fontWeight: 700,
              boxShadow: "0px 2px 8px #638BF133",
              transition: "background 0.2s",
              border: "none",
              display: "inline-block",
            }}
          >
            Adopt
          </NavLink>
          <IconButton onClick={() => navigate("/messenger")}>
            <Message sx={{ fontSize: "25px", color: dark }} />
          </IconButton>

          <Notifications sx={{ fontSize: "25px" }} />
          <IconButton
            onClick={() => {
              if (!isGuest) navigate(`/users/${userId}`);
            }}
          >
            {" "}
            <Help sx={{ fontSize: "25px", color: dark }} />
          </IconButton>
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkMode sx={{ fontSize: "25px" }} />
            ) : (
              <LightMode sx={{ color: dark, fontSize: "25px" }} />
            )}
          </IconButton>

          <FormControl variant="standard" value={userName}>
            <Select
              value={userName}
              sx={{
                backgroundColor: neutralLight,
                width: "150px",
                borderRadius: "0.25rem",
                p: "0.25rem 1rem",
                "& .MuiSvgIcon-root": {
                  pr: "0.25rem",
                  width: "3rem",
                },
                "& .MuiSelect-select:focus": {
                  backgroundColor: neutralLight,
                },
              }}
              input={<InputBase />}
            >
              <MenuItem value={userName}>
                <Typography>{userName}</Typography>
              </MenuItem>
              <MenuItem onClick={logOutUser}>Log Out</MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <FlexBetween gap="1rem">
          <NavLink
            to="/pets"
            style={{
              textDecoration: "none",
              color: "white",
              backgroundColor: "#638BF1",
              borderRadius: "20px",
              padding: "0.5rem 1.5rem",
              fontWeight: 700,
              boxShadow: "0px 2px 8px #638BF133",
              transition: "background 0.2s",
              border: "none",
              display: "inline-block",
            }}
          >
            Adopt
          </NavLink>
          <IconButton
            onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
          >
            <Menu />
          </IconButton>
        </FlexBetween>
      )}

      {/* MOBILE NAV */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          position="fixed"
          right="0"
          bottom="0"
          height="100%"
          zIndex="10"
          maxWidth="500px"
          minWidth="300px"
          backgroundColor={background}
        >
          {/* CLOSE ICON */}
          <Box display="flex" justifyContent="flex-end" p="1rem">
            <IconButton
              onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
            >
              <Close />
            </IconButton>
          </Box>

          {/* MENU ITEMS */}
          <FlexBetween
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap="3rem"
          >
            <NavLink
              to="/pets"
              style={{
                textDecoration: "none",
                color: "white",
                backgroundColor: "#638BF1",
                borderRadius: "20px",
                padding: "0.5rem 1.5rem",
                fontWeight: 700,
                boxShadow: "0px 2px 8px #638BF133",
                transition: "background 0.2s",
                border: "none",
                display: "inline-block",
              }}
            >
              Adopt
            </NavLink>
            <IconButton
              onClick={() => dispatch(setMode())}
              sx={{ fontSize: "25px" }}
            >
              {theme.palette.mode === "dark" ? (
                <DarkMode sx={{ fontSize: "25px" }} />
              ) : (
                <LightMode sx={{ color: dark, fontSize: "25px" }} />
              )}
            </IconButton>
            <IconButton onClick={() => navigate("/messenger")}>
              <Message sx={{ fontSize: "25px", color: dark }} />
            </IconButton>
            <Notifications sx={{ fontSize: "25px" }} />
            <IconButton
              onClick={() => {
                if (!isGuest) navigate(`/users/${userId}`);
              }}
            >
              <Help sx={{ fontSize: "25px" }} />
            </IconButton>
            <FormControl variant="standard" value={userName}>
              <Select
                value={userName}
                sx={{
                  backgroundColor: neutralLight,
                  width: "150px",
                  borderRadius: "0.25rem",
                  p: "0.25rem 1rem",
                  "& .MuiSvgIcon-root": {
                    pr: "0.25rem",
                    width: "3rem",
                  },
                  "& .MuiSelect-select:focus": {
                    backgroundColor: neutralLight,
                  },
                }}
                input={<InputBase />}
              >
                <MenuItem value={userName}>
                  <Typography>{userName}</Typography>
                </MenuItem>
                <MenuItem onClick={logOutUser}>Log Out</MenuItem>
              </Select>
            </FormControl>
          </FlexBetween>
        </Box>
      )}
    </FlexBetween>
  );
};

export default Navbar;

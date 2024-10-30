import Icon from "./extensions/icon.png";
import Logo from "./extensions/logo.svg";

export default {
  config: {
    auth: {
      logo: Logo,
    },
    head: {
      favicon: Icon,
    },
    locales: [],
    translations: {
      en: {
        "Auth.form.welcome.title": "Welcome to Root Games!",
        "Auth.form.welcome.subtitle": "Log in to your account",
        "app.components.LeftMenu.navbrand.title": "Root Games",
      },
    },
    menu: {
      logo: Icon,
    },
    theme: {
      light: {},
      dark: {
        colors: {
          primary100: "#030415",
          primary600: "#FFB300",
          primary700: "#FFB300",
          neutral0: "#0d102f",
          neutral100: "#212121",
        },
      },
    },
    tutorials: false,
    notifications: {
      releases: false,
    },
  },
  bootstrap() { },
};

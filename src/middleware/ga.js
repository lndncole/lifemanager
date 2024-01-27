import ReactGA from 'react-ga4';

const googleOAuthLogin = ()=> ReactGA.event('login', {method: "Google OAuth2"});

const gaEvents = {
    gaOauthLogin: googleOAuthLogin
}

export { gaEvents };
 var auth_conf = {
    authority: "https://aac.platform.smartcommunitylab.it/",
    client_id: "c_104137f7-0049-40ae-811e-ad33eb59fd36",
    redirect_uri: "http://localhost/oidc",
    end_session_redirect_url: `http://localhost/oidc`,
    post_logout_redirect_uri: "https://localhost/oidc",
    silent_redirect_uri: "https://localhost/oidc",
    response_type: "code",
    scope: "openid email profile offline_access",
    pkce: true,
    automaticSilentRenew: true,
    filterProtocolClaims: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),

    loadUserInfo: true,
    popupNavigator: new Oidc.CordovaPopupNavigator(),
    iframeNavigator: new Oidc.CordovaIFrameNavigator()
}
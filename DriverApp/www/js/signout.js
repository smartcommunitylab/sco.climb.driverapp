var mgr = new Oidc.UserManager(auth_conf);
console.log("signout");
localStorage.clear();
sessionStorage.clear()
window.location = "https://localhost/oidc"
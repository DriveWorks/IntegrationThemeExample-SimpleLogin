// Get config
const SERVER_URL = config.serverUrl;
const GROUP_ALIAS = config.groupAlias;

// Elements
const loginButton = document.getElementById("login-button");
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", handleLogin);

// Display any notice passed e.g. "You have been logged out."
showLoginNotice();

// Construct DriveWorks Live client
let DW_CLIENT;
try {
    DW_CLIENT = new window.DriveWorksLiveClient(SERVER_URL);
} catch (error) {
    loginError(error, "Cannot access client.");
}

/**
 * Handle login
 *
 * @param evt Form submit event
 */
async function handleLogin(evt) {

    // Prevent browser handling submission
    evt.preventDefault();

    // Get user credentials
    const inputUsername = document.getElementById("username").value;
    const inputPassword = document.getElementById("password").value;
    const userCredentials = {
        username: inputUsername,
        password: inputPassword
    };

    try {

        // Show loading state
        loginButton.classList.add("is-loading");

        // Start session
        const result = await DW_CLIENT.loginGroup(GROUP_ALIAS, userCredentials);

        // Show error is login failed
        if (!result){
            loginError(false, "No connection found.");
            return;
        }

        // Store session details
        localStorage.setItem("sessionId", result.sessionId);
        localStorage.setItem("sessionUser", inputUsername);

        // Direct to running Specification
        window.location.href = "run.html";

    } catch (error) {
        loginError(error, "Invalid login, please try again.");
    }

}

/**
 * Show login error
 *
 * @param {Object} [text] The originating error
 * @param {string} [text] The text displayed to the user on the login screen
 */
function loginError(error, text){

    // Log error to console
    if (error){
        console.log(error);
    }

    // Create and set error message
    message = {
        text: text,
        state: "error"
    };
    localStorage.setItem("loginNotice", JSON.stringify(message));

    // Show message
    showLoginNotice();

    // Remove loading state
    loginButton.classList.remove("is-loading");

}

/**
 * Show login notice
 */
function showLoginNotice(){

    const loginNotice = document.getElementById("login-notice");
    const notice = JSON.parse(localStorage.getItem("loginNotice"));

    if (notice){

        // Display feedback
        loginNotice.innerText = notice.text;
        loginNotice.classList.remove("error", "success");
        loginNotice.classList.add(notice.state, "is-shown");

        // Clear message
        localStorage.removeItem("loginNotice");

    }

}

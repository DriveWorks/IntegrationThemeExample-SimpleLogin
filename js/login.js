// Get config
const SERVER_URL = config.serverUrl;
const GROUP_ALIAS = config.groupAlias;

// Elements
const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginSSOButton = document.getElementById("login-sso-button");

// Error Messages
const genericErrorMessage = "There has been an issue.";
const clientErrorMessage = "Cannot access client.";

// Global client
let DW_CLIENT;

/**
 * On page load.
 */
(() => {
    loginForm.addEventListener("submit", handleLoginForm);

    if (loginSSOButton) {
        loginSSOButton.addEventListener("click", handleLoginSSO);
    }

    // Display any notice passed e.g. "You have been logged out."
    showLoginNotice();
})();

/**
 * DriveWorks Live client loaded.
 */
function dwClientLoaded() {
    try {
        DW_CLIENT = new window.DriveWorksLiveClient(SERVER_URL);
    } catch (error) {
        loginError(clientErrorMessage, error);
        return;
    }
}

/**
 * Handle DriveWorks Group login via form credentials.
 *
 * @param {Object} event - Form submit event.
 */
async function handleLoginForm(event) {

    // Prevent browser handling submission
    event.preventDefault();

    // Show error if cannot connect to client
    if (!DW_CLIENT) {
        loginError(clientErrorMessage);
        return;
    }

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

        // Start Session
        const result = await DW_CLIENT.loginGroup(GROUP_ALIAS, userCredentials);

        loginSuccess(result, inputUsername);
    } catch (error) {
        loginError(genericErrorMessage, error);
    }
}

/**
 * Handle DriveWorks Group login via Single Sign-On (SSO).
 */
async function handleLoginSSO() {

    // Show error if cannot connect to client
    if (!DW_CLIENT) {
        loginError(clientErrorMessage);
        return;
    }

    try {
        // Start Session
        const result = await DW_CLIENT.loginSSO(GROUP_ALIAS);

        loginSuccess(result);
    } catch (error) {
        loginError(genericErrorMessage, error);
    }
}

/**
 * Handle successful login. Store Session data to localStorage & redirect.
 */
function loginSuccess(result, username) {

    // Store session details to localStorage
    localStorage.setItem("sessionId", result.sessionId);

    if (username) {
        localStorage.setItem("sessionUsername", username);
    }

    // Direct to running Specification
    window.location.href = "run.html";
}

/**
 * Show login error.
 *
 * @param {string} text - The text displayed to the user on the login screen.
 * @param {Object} error - The originating error object.
 */
function loginError(text, error) {

    // Log error to console
    if (error) {
        console.log(error);
    }

    // Create and set error message
    message = {
        text: text,
        state: "error",
    };

    localStorage.setItem("loginNotice", JSON.stringify(message));

    // Show message
    showLoginNotice();

    // Remove loading state
    loginButton.classList.remove("is-loading");
}

/**
 * Show login notice.
 */
function showLoginNotice() {
    const loginNotice = document.getElementById("login-notice");
    const notice = JSON.parse(localStorage.getItem("loginNotice"));

    if (notice) {

        // Display feedback
        loginNotice.innerText = notice.text;
        loginNotice.classList.remove("error", "success");
        loginNotice.classList.add(notice.state, "is-shown");

        // Clear message
        localStorage.removeItem("loginNotice");
    }
}

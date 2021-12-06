// Get config
const SERVER_URL = config.serverUrl;
const GROUP_ALIAS = config.groupAlias;
const PROJECT_NAME = config.projectName;

// Get session
const CURRENT_SESSION = localStorage.getItem("sessionId");

// Elements
const logoutButton = document.getElementById("logout-button");

// Global client
let DW_CLIENT;

/**
 * On page load.
 */
(() => {

    // Check if Session Id exists
    checkSession();

    // Attach logout function to button click
    logoutButton.onclick = () => handleLogout();

    // Quick Logout (?bye URL query)
    const urlQuery = new URLSearchParams(window.location.search);
    if (urlQuery.has("bye")) {
        handleLogout();
    }

    setTabTitle(PROJECT_NAME);
})();

/**
 * DriveWorks Live client loaded.
 */
function dwClientLoaded() {
    try {
        // Construct DriveWorks Live client
        DW_CLIENT = new window.DriveWorksLiveClient(SERVER_URL);

        // Set client's session id passed from login
        DW_CLIENT._sessionId = localStorage.getItem("sessionId");
    } catch (error) {
        redirectToLogin("Cannot access client.", "error");
    }

    run();
}

/**
 * Setup page and run Specification, attach event handling.
 */
async function run() {
    showUsername();

    try {
        // Create new specification
        const specification = await DW_CLIENT.createSpecification(GROUP_ALIAS, PROJECT_NAME);
        if (!specification._id) {
            redirectToLogin("No connection found.", "error");
            return;
        }

        // Render specification
        const specificationOutput = document.getElementById("specification-output");
        await specification.render(specificationOutput);

        // Attach events
        specification.registerSpecificationCancelledDelegate(() => handleLogout());
        specification.registerSpecificationClosedDelegate(() => handleLogout());

        // Remove loading state
        specificationOutput.classList.remove("is-loading");

        // (Optional) Prevent Specification timeout
        pingSpecification(specification);

        // (Optional) Show warning dialog when exiting page after Form renders
        attachPageUnloadEvent();

        // (Optional) Show Specification Name in browser tab title
        const formData = await specification.getFormData();
        setTabTitle(formData.form.specificationName);
    } catch (error) {
        console.log(error);

        // If authorization error, handle appropriately
        if (String(error).includes("401")) {
            redirectToLogin("Please login to view that.", "error");
            return;
        }
    }
}

/**
 * Check for stored session id. Redirect to login if not found.
 */
function checkSession() {
    // If no session is stored (e.g. not logged in), redirect to login
    if (CURRENT_SESSION === null || CURRENT_SESSION === "undefined") {
        redirectToLogin("Please login to view that.", "error");
    }
}

/**
 * Ping the running Specification to prevent timeout.
 *
 * A Specification will timeout after a configured period of inactivity (see DriveWorksConfigUser.xml).
 * This function prevents a Specification timing out as long as the page is in view.
 *
 * @param {object} specification - The Specification object.
 */
function pingSpecification(specification) {
    // Disable ping if interval is 0
    if (config.specificationPingInterval === 0) {
        return;
    }

    // Ping Specification to reset timeout
    specification.ping();

    // Schedule next ping
    setTimeout(pingSpecification, config.specificationPingInterval * 1000, specification);
}

/**
 * Handle Group logout.
 * 
 * @param {string} [text] - The message to display when directed to the login screen.
 * @param {string} [state] - The type of message state (error/success).
 */
async function handleLogout(text = "You have been logged out.", state = "success") {
    try {
        logoutButton.classList.add("is-loading");

        // Remove warning on unload - intentional navigation
        window.removeEventListener("beforeunload", beforeUnloadHandler);

        // Logout of Group
        await DW_CLIENT.logoutGroup(GROUP_ALIAS);

        redirectToLogin(text, state);
    } catch (error) {
        console.log(error);
    }
}

/**
 * Redirect to login screen.
 * 
 * @param {string} text - The message to display when directed to the login screen.
 * @param {string} state - The type of message state (error/success).
 */
function redirectToLogin(text, state) {
    // Clear all stored credentials
    localStorage.clear();

    // Set login screen message
    setLoginMessage(text, state);

    // Redirect to login screen
    window.location.href = "index.html";
}

/**
 * Set login screen message.
 * 
 * @param {string} text - The message to display when directed to the login screen.
 * @param {string} state - The type of message state (error/success).
 */
function setLoginMessage(text, state) {
    message = {
        text: text,
        state: state
    }
    localStorage.setItem("loginNotice", JSON.stringify(message));
}

/**
 * Display username onscreen.
 */
function showUsername() {
    const username = localStorage.getItem("sessionUser");
    if (username) {
        document.getElementById("username").textContent = username;
        document.getElementById("header-user").classList.add("is-shown");
    }
}

/**
 * On page unload, show dialog to confirm navigation.
 */
function attachPageUnloadEvent() {
    if (config.run.showWarningOnExit) {
        window.addEventListener("beforeunload", beforeUnloadHandler);
    }
}

/**
 * Handle beforeunload event.
 * 
 * @param {Object} event - The beforeunload event object
 */
function beforeUnloadHandler(event) {
    event.preventDefault();
    event.returnValue = "Are you sure you want to leave this page?";
}

/**
 * Set browser tab title
 * 
 * @param {Object} text - The text to display in the title.
 */
function setTabTitle(text) {
    document.title = `${text} | Run - DriveWorks`;
}

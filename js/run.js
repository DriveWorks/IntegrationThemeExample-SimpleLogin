// Get config
const SERVER_URL = config.serverUrl;
const GROUP_ALIAS = config.groupAlias;
const PROJECT_NAME = config.projectName;

// Get session
const CURRENT_SESSION = localStorage.getItem("sessionId");
checkSession();

// Construct DriveWorks Live client
let DW_CLIENT;
function dwClientLoaded() {
    try {
        DW_CLIENT = new window.DriveWorksLiveClient(SERVER_URL);

        // Set client's session id passed from login
        DW_CLIENT._sessionId = localStorage.getItem("sessionId");
    } catch (error) {
        redirectToLogin("Cannot access client.", "error");
    }

    run();
}

// Run on load
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
 * Check for stored session
 */
function checkSession() {
    // If no session is stored (e.g. not logged in), redirect to login
    if (CURRENT_SESSION === null || CURRENT_SESSION === "undefined") {
        redirectToLogin("Please login to view that.", "error");
    }
}

/**
 * Ping the running Specification
 *
 * A Specification will timeout after a configured period of inactivity (see DriveWorksConfigUser.xml).
 * This function prevents a Specification timing out as long as the page is in view.
 *
 * @param specification The Specification object.
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
 * Handle logout
 */
async function handleLogout(text = "You have been logged out.", state = "success") {
    try {
        // Logout of Group
        await DW_CLIENT.logoutGroup(GROUP_ALIAS);
        redirectToLogin(text, state);
    } catch (error) {
        console.log(error);
    }
}

// Attach logout function to button click
document.getElementById("logout-button").onclick = function() {
    handleLogout();
};

// Quick Logout (?bye URL query)
const urlQuery = new URLSearchParams(window.location.search);
if (urlQuery.has("bye")) {
    handleLogout();
}

/**
 * Set login screen message
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
 * Set login screen message
 */
function setLoginMessage(text, state) {
    message = {
        text: text,
        state: state
    }
    localStorage.setItem("loginNotice", JSON.stringify(message));
}

/**
 * Show username in header
 */
function showUsername() {
    const username = localStorage.getItem("sessionUser");
    if (username) {
        document.getElementById("username").textContent = username;
        document.getElementById("header-user").classList.add("is-shown");
    }
}

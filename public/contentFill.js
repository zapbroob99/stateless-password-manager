// public/contentFill.js

function findUsernameField() {
    let field = document.querySelector('input[type="email"]');
    if (field) return field;
    field = document.querySelector('input[name*="username"], input[id*="username"]');
    if (field) return field;
    field = document.querySelector('input[name*="login"], input[id*="login"]');
    if (field) return field;
    field = document.querySelector('input[name*="user"], input[id*="user"]');
    if (field) return field;
    const textInputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (let input of textInputs) {
        if (/(user|login|mail)/i.test(input.name || '') || /(user|login|mail)/i.test(input.id || '')) {
            return input;
        }
    }
    return null;
}

function findPasswordField() {
    return document.querySelector('input[type="password"]');
}

function fillForm(username, password) {
    const usernameField = findUsernameField();
    const passwordField = findPasswordField();
    let filledSomething = false;

    if (usernameField && username) {
        usernameField.value = username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true })); 
        usernameField.dispatchEvent(new Event('change', { bubbles: true }));
        filledSomething = true;
        console.log("Username field filled.");
    } else if (username) {
        console.log("Username field not found, but username provided.");
    }


    if (passwordField && password) {
        passwordField.value = password;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        filledSomething = true;
        console.log("Password field filled.");
    } else if (password) {
        console.log("Password field not found, but password provided.");
    }
    return filledSomething;
}
((data) => {
    if (data && (data.username || data.password)) {
        console.log("Content script received data for autofill:", data);
        const filled = fillForm(data.username, data.password);
        if (filled) {
        } else {
        }
    } else {
        console.log("Content script executed without sufficient data for autofill.");
    }
})(/* injected_args_placeholder */); 
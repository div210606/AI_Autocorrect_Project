// REGISTER
function register() {

    let username = document.getElementById("username").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    if (!username || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    let user = {
        username,
        email,
        password
    };

    localStorage.setItem("user_" + username, JSON.stringify(user));

    alert("Account created successfully!");
    window.location.href = "login.html";
}


// LOGIN
function login() {

    let loginUser = document.getElementById("loginUser").value;
    let loginPass = document.getElementById("loginPass").value;

    let storedUser = localStorage.getItem("user_" + loginUser);

    if (!storedUser) {
        alert("User not found!");
        return;
    }

    let user = JSON.parse(storedUser);

    if (user.password !== loginPass) {
        alert("Incorrect password!");
        return;
    }

    localStorage.setItem("username", user.username);
    localStorage.setItem("email", user.email);

    alert("Login successful!");

    window.location.href = "index.html";
}
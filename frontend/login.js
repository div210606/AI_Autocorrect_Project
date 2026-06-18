const API_URL = "http://127.0.0.1:8000";

async function registerUser() {


const username =
    document.getElementById("username").value.trim();

const email =
    document.getElementById("email").value.trim();

const password =
    document.getElementById("password").value.trim();

if (!username || !email || !password) {

    document.getElementById("message").innerText =
        "Please fill all fields";

    return;
}

try {

    const response = await fetch(
        `${API_URL}/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        }
    );

    const data = await response.json();

    console.log("Register Status:", response.status);
    console.log("Register Response:", data);

    document.getElementById("message").innerText =
        data.message || data.detail;

} catch (error) {

    console.error(error);

    document.getElementById("message").innerText =
        "Server connection error";
}
```

}

async function loginUser() {

```
const username =
    document.getElementById("username").value.trim();

const password =
    document.getElementById("password").value.trim();

if (!username || !password) {

    document.getElementById("message").innerText =
        "Please enter username and password";

    return;
}

try {

    const response = await fetch(
        `${API_URL}/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        }
    );

    const data = await response.json();

    console.log("Login Status:", response.status);
    console.log("Login Response:", data);

    if (response.ok) {

        localStorage.setItem(
            "username",
            data.username
        );

        localStorage.setItem(
            "email",
            data.email
        );

        window.location.href = "index.html";

    } else {

        document.getElementById("message").innerText =
            data.detail || data.message;
    }

} catch (error) {

    console.error(error);

    document.getElementById("message").innerText =
        "Server connection error";
}


}

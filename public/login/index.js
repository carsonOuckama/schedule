function get(id) {return document.getElementById(id);}

async function signin() {
    var options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: get("username").value,
            password: get("password").value
        }),
        credentials: 'include'
    };
    var response = await fetch('/signin', options);

    if (response.ok) {
        window.location.href = '/employee'; 
    } else {
        console.error('Signin failed');
    }
}
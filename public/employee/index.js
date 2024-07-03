function get(id) {return document.getElementById(id);}
var user;

async function getInfo() {
    var options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({}),
        credentials: 'include'
    };
    var response = await fetch('/getUserInformation', options);
    var data = await response.json();
    if (data.loggedIn === false) window.location.href = "/";
    user = data;
}

async function updateInfo() {
    await getInfo();
    var options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            min: get("minimumDays").value,
            max: get("maximumDays").value,
            prefered: get("preferedDays").value
        }),
        credentials: 'include'
    };
    var response = await fetch('/updateUserInformation', options);
    if (response.ok) {
        console.log("Saved");
        return;
    }

    var data = await response.json();
    if (data.loggedIn === false) window.location.href = "/";
}

async function getSchedule() {
    var options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({}),
        credentials: 'include'
    };
    var response = await fetch('/getSchedule', options);
    var data = await response.json();
    if (data.loggedIn === false) window.location.href = "/";
    text = data.text;
    text = text.replaceAll("\n", "<br>");
    text = text.replaceAll(",", " | ");
    get('schedule').innerHTML = text;
}

async function UpdateUserData() {
    get("name").textContent = user.name;
    get("minimumDays").value = user.min;
    get("preferedDays").value = user.prefered;
    get("maximumDays").value = user.max;
}

async function takeDayOff() {
    await getInfo();
    var options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            month: parseInt(get('month').value),
            day: parseInt(get("dayOfMonth").value),
            year: parseInt(get("year").value),
            shift: get("shift").value
        }),
        credentials: 'include'
    };
    var response = await fetch('/takeDayOff', options);
    if (response.ok) {
        get("dayOffMessage").textContent = "Complete!";
        get("dayOffMessage").style.color = "green";
        return;
    } else if (response.status === 409) {
        get("dayOffMessage").textContent = "This day is already taken off";
        get("dayOffMessage").style.color = "red";
    } else if (response.status === 404) {
        get("dayOffMessage").textContent = "Day not found!";
        get("dayOffMessage").style.color = "red";
    } else if (response.status === 403) {
        get("dayOffMessage").textContent = "This day is not available to take off!";
        get("dayOffMessage").style.color = "red";
    }

    var data = await response.json();
    if (data.loggedIn === false) window.location.href = "/";
}

getInfo().then(UpdateUserData);
getSchedule();
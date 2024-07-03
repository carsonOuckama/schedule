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
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    get("name").textContent = user.name;
    get("minimumDays").value = user.min;
    get("preferedDays").value = user.prefered;
    get("maximumDays").value = user.max;

    var list = get("listOfDaysOff");
    list.innerHTML = "";
    for (var i = 1; i < user.daysOff.length; i++) {
        var shiftDay = user.daysOff[i].split("|")[0];
        var shiftType = user.daysOff[i].split("|")[1];

        var obj = NumberToDay(parseInt(shiftDay));
        var date = months[obj.month] + ", " + (obj.day+1);

        let li = document.createElement('li');
        li.textContent = date + ": " + (shiftType === "A" ? "All Day" : shiftType === "O" ? "Open" : shiftType === "C" ? "Close" : shiftType === "N" ? "Unavailable" : "ERR");
        list.appendChild(li);
    }
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
        await getInfo().then(UpdateUserData);
        return;
    } else if (response.status === 409) {
        get("dayOffMessage").textContent = "This day is already up to date";
        get("dayOffMessage").style.color = "red";
    } else if (response.status === 404) {
        get("dayOffMessage").textContent = "Day not found!";
        get("dayOffMessage").style.color = "red";
    } else if (response.status === 403) {
        get("dayOffMessage").textContent = "This shift is not available!";
        get("dayOffMessage").style.color = "red";
    }

    var data = await response.json();
    if (data.loggedIn === false) window.location.href = "/";
}

function NumberToDay(number) {
    var year = 2024;
    var leapYears = [2024, 2028, 2032, 2036, 2040, 2044, 2048, 2052];
    
    var expectedDays = leapYears.includes(year) ? 366 : 365;
    while (number > expectedDays) {
        year++;
        number -= expectedDays;
        expectedDays = leapYears.includes(year) ? 366 : 365;
    }

    var month = 0;
    var months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (leapYears.includes(year)) {
        months[1] = 29;
    }
    while (number > months[month]) {
        number -= months[month];
        month++;
    }
    return {month: month, day: number, year: year};
    
}

getInfo().then(UpdateUserData);
getSchedule();
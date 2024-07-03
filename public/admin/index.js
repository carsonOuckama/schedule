function get(id) {return document.getElementById(id);}

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
    get('name').textContent = data.name;
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

async function BuildWorkWeek() {
    var options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({startDay: 0}),
        credentials: 'include'
    };
    var response = await fetch('/buildWorkWeek', options);
    
    if (response.ok) {
        getSchedule();
    }
}

async function CheckIfAdmin() {
    var options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({}),
        credentials: 'include'
    };
    var response = await fetch('/checkIfAdmin', options);
        
    if (response.ok) {
        return;
    } else {
        window.location.href = "/";
    }
}

CheckIfAdmin().then(function() {
    getInfo();
    getSchedule();
});
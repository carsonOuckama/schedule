const bodyParser = require('body-parser');
const { Console } = require('console');
const express = require('express');
const session = require('express-session');
const fs = require('fs');

const app = express();
app.listen(process.env.PORT || 3000, () => console.log('listening at 3000'));
app.use(bodyParser.json());
app.use( express.json() );
app.use( express.static("public") );

app.use(session({
    secret: 'asdfqwer987oasjdkljfnaksdfjhlikquerasdlfkjasdfj',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


//
//
//  You are now entering the express side of the server
//
//
//


app.get('/', function(req, res) {
    res.redirect("/login");
});

app.get('/login', function(req, res) {
    res.sendFile(__dirname + "/public/login/login.html");
});

app.get('/employee', function(req, res) {
    if (!req.session.filePath) {res.redirect(302, "/login"); return;}
    if (req.session.user.admin) {res.redirect(302, "/admin"); return;}
    
    res.sendFile(__dirname + "/public/employee/employee.html");
});

app.get('/admin', function(req, res) {
    if (!req.session.user?.admin) {res.redirect(302, "/login"); return;}
    res.sendFile(__dirname + "/public/admin/admin.html");
});

app.post('/signin', function(req, res) {    // Fix Vulnerabilities
    var { username, password } = req.body;

    fs.readFile(__dirname + "/master/UserNameLookUpTable.txt", "utf8", function(err, data) {
        data = data.split("\r\n");
        var usernames = data[0].split(",");
        var files = data[1].split(",");
        if (usernames.includes(username)) {
            req.session.filePath = __dirname + "\\employees\\" + files[usernames.indexOf(username)];
            req.session.user = SingleParse(req.session.filePath);
            if (password === req.session.user.password) {
                res.status(200).end();
            } else {
                res.status(401).end();
            }
        } else {
            res.status(401).end();
        }
    });
});

app.post("/getUserInformation", function(req, res) {

    if (!req.session.filePath) {res.json({loggedIn: false}); return;}

    res.json(req.session.user);
});

app.post("/updateUserInformation", function(req, res) {

    if (!req.session.filePath) {res.json({loggedIn: false}); return;}

    var employee = SingleParse(req.session.filePath);

    for (var key in req.body) {
        employee[key] = req.body[key];
    }

    employee.update(req.session.filePath);

    req.session.user = employee;
    res.sendStatus(200);


});

app.post("/getSchedule", function(req, res) {
    if (!req.session.filePath) {res.json({loggedIn: false}); return;}
    
    fs.readFile(__dirname + "/master/schedule.txt", "utf8", function(err, data) {
        res.json({text: data});
    });
});

app.post("/buildWorkWeek", function(req, res) {
    var { startDay } = req.body;

    if (!req.session.filePath) {res.json({loggedIn: false}); return;}
    if (!req.session.user?.admin) {res.json({loggedIn: false}); return;}
    BuildWorkWeek(startDay || 0, function() {res.sendStatus(200);});
});

app.post("/checkIfAdmin", function(req, res) {
    if (!req.session.user?.admin) {res.sendStatus(401); return;}
    res.send(200);
});

//
//  
// You are now exiting the express side of the server
//
//
//





function rand(min, max) {
    return Math.floor(Math.random() * (max-min) + min)
} function rand(max) {
    return Math.floor(Math.random() * max);
}
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function Solver(sched, emps, empsMin) {
    this.empAvail = [0, 0, 0, 0];
    this.empCount = [0, 0, 0, 0];
    this.emps = emps;
    this.empsMin = empsMin;
    this.arr = sched;

    this.collapseWorkDay = function() {
    for (var e = 0; e < this.emps.length; e++) {
        for (var i = 0; i < this.arr.length; i++) {
            var clear = "";
            var saveIndex = "";
            for (var j = 0; j < this.arr[i].length; j++) {
                if (this.arr[i][j].length === 1 && clear !== this.emps[e]) {
                    clear = this.arr[i][j][0];
                    saveIndex = j;
                }
            }
            if (clear !== "") {
                for (var j = 0; j < this.arr[i].length; j++) {
                    if (j !== saveIndex && this.arr[i][j].indexOf(clear) > -1) {
                        this.arr[i][j].splice(this.arr[i][j].indexOf(clear), 1);
                    }
                }   
            }
        }
    }
};

    this.calculateAvail = function() {
    for (var e = 0; e < this.emps.length; e++) {
        var num = 0;
        for (var i = 0; i < this.arr.length; i++) {
            for (var j = 0; j < this.arr[i].length; j++) {
                for (var k = 0; k < this.arr[i][j].length; k++) {
                    if (this.arr[i][j][k] === this.emps[e]) {
                        num++;
                    }
                }
            }
        }
        this.empAvail[e] = num;
    }
};

    this.tallyWorkDays = function() {
    this.empCount = [0, 0, 0, 0];
    for (var i = 0; i < this.arr.length; i++) {
        for (var j = 0; j < this.arr[i].length; j++) {
            if (this.arr[i][j].length === 1) {
                this.empCount[this.emps.indexOf(this.arr[i][j][0])]++;
            }
        }
    }
};

    this.checkprefer = function() {
    var under = false;
    for (var e = 0; e < this.emps.length; e++) {
        if (this.empCount[e] >= this.empsMin[e]) {
            for (var i = 0; i < this.arr.length; i++) {
                for (var j = 0; j < this.arr[i].length; j++) {
                    if (this.arr[i][j].length > 1) {
                        while (this.arr[i][j].includes(this.emps[e])) {
                            this.arr[i][j].splice(this.arr[i][j].indexOf(this.emps[e]), 1);
                        }
                    }
                }
            }
        } else {
            under = true;
        }
    }
    return under;
};

    this.collapseMultiples = function collapseMultiples() {
    var record = Infinity;
    var index = [];
    for (var i = 0; i < this.arr.length; i++) {
        for (var j = 0; j < this.arr[i].length; j++) {
            
            var score = 0;
            for (var k = 0; k < this.arr[i][j].length; k++) {
                var emp = this.emps.indexOf(this.arr[i][j][k]);
                score += this.empsMin[emp];//score += ( this.empAvail[emp] - this.empCount[emp] ) / this.empsMin[emp];
            }
            
            if (score < record && this.arr[i][j].length > 1) {
                record = score;
                index = [i, j];
            }
        }
    }
    
    if (record === 0) {return;}
    if (index.length === 0) {return;}
    
    var solveArr = this.arr[index[0]][index[1]];
    var score = [];
    for (var k = 0; k < solveArr.length; k++) {
        var emp = this.emps.indexOf(solveArr[k]);
        score.push(this.empsMin[emp]);//score.push(( this.empAvail[emp] - this.empCount[emp] ) / this.empsMin[emp]);
    }
    
    var record = Infinity;
    var ind = 0;
    for (var i = 0; i < score.length; i++) {
        if (score[i] < record) {
            record = score[i];
            ind = i;
        }    
    }
    this.arr[index[0]][index[1]] = [solveArr[ind]];
};

    this.cutOverShifts = function() {
    var booked = [];
    this.tallyWorkDays();
    for (var i = 0; i < this.emps.length; i++) {
        booked[i] = this.empCount[i] - this.empsMin[i];
    } 
    for (var i = 0; i < this.arr.length; i++) {
        for (var j = 0; j < this.arr[i].length; j++) {
            var index = this.emps.indexOf(this.arr[i][j][0]);
            if (booked[index] > 0) {
                this.arr[i][j].splice(0, 1);
                booked[index]--;
            }
        }
    }
};


    this.solve = function() {
        var c = this.checkprefer();
        var i = 0;
        while (c && i < 1000) {
            this.collapseWorkDay();
            this.calculateAvail();
            this.tallyWorkDays();
            c = this.checkprefer();
            if (c === true) {
                this.collapseMultiples();
            }
            i++;
        }

        
        this.cutOverShifts();

        if (i >= 1000) {
            return "Minimum Shifts not met";
        } else {
            return "Minimum Shifts met";
        }

    };

    this.clean = function() {
        for (var i = 0; i < this.arr.length; i++) {
            for (var j = 0; j < this.arr[i].length; j++) {
                this.arr[i][j] = this.arr[i][j][0] || null;
            }
        }
    };
}

function EmployeeObject(name, prefered, min, max, availability, daysOff, constant, password, admin, store) {
    this.name = name;
    this.prefered = prefered;
    this.min = min;
    this.max = max;
    this.availability = availability;
    this.daysOff = daysOff;
    this.constant = constant;
    this.password = password;
    this.admin = admin === "True" ? true : false;
    this.store = store;

    this.update = async function(filePath, callback) {
        filetext = fs.readFileSync(filePath, 'utf-8');
        filetext = filetext.split("\r\n");
        filetext[0] = this.name;
        filetext[3] = this.prefered;
        filetext[4] = this.min;
        filetext[5] = this.max;
        filetext[6] = this.availability[0];
        filetext[7] = this.availability[1];
        filetext[8] = this.availability[2];
        filetext[9] = this.availability[3];
        filetext[10] = this.availability[4];
        filetext[11] = this.availability[5];
        filetext[12] = this.availability[6];
        filetext[13] = this.daysOff.join(",");
        filetext[14] = this.constant;
        filetext[2] = this.password;
        filetext[15] = this.admin ? "True" : "False";
        filetext[16] = this.store;
        filetext = filetext.join("\r\n");
        await fs.writeFile(filePath, filetext, callback || function() {});
    }
}

function Schedule() {
    this.week = [[[], [], [], []], [[], [], [], []], [[], [], [], []], [[], [], [], []], [[], [], [], []], [[], [], [], []], [[], [], [], []]];
    this.log = function() {
        for (var i = 0; i < this.week.length; i++) {
            var str = "";
            for (var j = 0; j < this.week[i].length; j++) {
                var Jstr = " [ ";
                if (this.week[i][j] instanceof String) str += "| " + this.week[i][j] + " ";
                else {
                    for (var k = 0; k < this.week[i][j].length; k++) {
                        Jstr += " " + this.week[i][j][k] + " ";
                    }
                    str += Jstr + " ] ";
                }
            }    
            console.log(str);
        }
    };
}

function SingleParse(filePath) {
    filetext = fs.readFileSync(filePath, 'utf-8');
    filetext = filetext.split("\r\n");

    var availability = [];
    for (var j = 0; j < 7; j++) {
        availability.push(filetext[6 + j]);
    }
        
    return new EmployeeObject(filetext[0], filetext[3], filetext[4], filetext[5], availability, filetext[13].split(","), filetext[14], filetext[2], filetext[15], filetext[16]);
}

function Parse() {
    var filename = fs.readdirSync(__dirname + "/employees", { withFileTypes: true });
    var employees = [];
    for (var i = 0; i < filename.length; i++) {
        filetext = fs.readFileSync(__dirname + "/employees/" + filename[i].name, 'utf-8');
        filetext = filetext.split("\r\n");

        var availability = [];
        for (var j = 0; j < 7; j++) {
            availability.push(filetext[6 + j]);
        }
        
        var employee = new EmployeeObject(filetext[0], filetext[3], filetext[4], filetext[5], availability, filetext[13].split(","), filetext[14], filetext[2], filetext[15], filetext[16]);
        employees.push(employee);
    }
    return employees;
}

function CleanWorkDays(start, employees) {
    for (var i = 0; i < employees.length; i++) {
        var employee = employees[i];
        for (var j = employee.daysOff.length - 1; j >= 0; j--) {
            if (parseInt(employee.daysOff[j].split("|")[0]) < start) {
                employee.daysOff.splice(j, 1);
            }
        }
    }
}

function LookForAvailability(daysOff, dayIndex, shift) {
    for (var i = 0; i < daysOff.length; i++) {
        var day = daysOff[i].split("|");
        if (parseInt(day[0]) === dayIndex) {
            if (day[1] === "N") return false;
            if (day[1] !== "A") {
                if (day[1] === "O" && shift === "O") {
                    return true;
                } else if (day[1] === "C" && shift === "C") {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
    return true;
}

function CanTakeDayOff(emp, dayOff) {
    var dayNumber = dayOff.split("|")[0];
    var shiftType = dayOff.split("|")[1];

    var closestSunday = ClosestSunday(dayNumber);
    var employees = Parse();
    var schedule = new Schedule();

    for (var employee of employees) {
        if (emp.name === employee.name) continue;
        for (var i = 0; i < 28; i++) {
            var weekIndex = Math.floor( i / 4 );
            var dayIndex = closestSunday + weekIndex;
            var shiftLevel = i % 4;
            var shift = i % 2 === 0 ? 'O' : 'C';
            if (employee.availability[weekIndex] === shift || employee.availability[weekIndex] === "A") {
                if (LookForAvailability(employee.daysOff, dayIndex, shift)) {
                    if (employee.store === "Both") {
                        schedule.week[weekIndex][shiftLevel].push(employee.name);
                    } else if (employee.store === "B" && shiftLevel < 2) {
                        schedule.week[weekIndex][shiftLevel].push(employee.name);
                    } else if (employee.store === "Y" && shiftLevel > 1) {
                        schedule.week[weekIndex][shiftLevel].push(employee.name);
                    }
                }
            }
        }
    }

    var dayIndex = dayNumber - closestSunday;
    var lengthZero = false;

    if (emp.store === "Both") {
        if (shiftType === "N") {
            lengthZero = schedule.week[dayIndex][0].length === 0 ? true : lengthZero;
            lengthZero = schedule.week[dayIndex][1].length === 0 ? true : lengthZero;
            lengthZero = schedule.week[dayIndex][2].length === 0 ? true : lengthZero;
            lengthZero = schedule.week[dayIndex][3].length === 0 ? true : lengthZero;
        } else if (shiftType === "O") {
            lengthZero = schedule.week[dayIndex][1].length === 0 ? true : lengthZero;
            lengthZero = schedule.week[dayIndex][3].length === 0 ? true : lengthZero;
        } else if (shiftType === "C") {
            lengthZero = schedule.week[dayIndex][0].length === 0 ? true : lengthZero;
            lengthZero = schedule.week[dayIndex][2].length === 0 ? true : lengthZero;
        }
    } else if (emp.store === "Y") {
        if (shiftType === "N") {
            lengthZero = schedule.week[dayIndex][2].length === 0 ? true : lengthZero;
            lengthZero = schedule.week[dayIndex][3].length === 0 ? true : lengthZero;
        } else if (shiftType === "O") {
            lengthZero = schedule.week[dayIndex][3].length === 0 ? true : lengthZero;
        } else if (shiftType === "C") {
            lengthZero = schedule.week[dayIndex][2].length === 0 ? true : lengthZero;
        }
    } else if (emp.store === "C") {
        if (shiftType === "N") {
            lengthZero = schedule.week[dayIndex][0].length === 0 ? true : lengthZero;
            lengthZero = schedule.week[dayIndex][1].length === 0 ? true : lengthZero;
        } else if (shiftType === "O") {
            lengthZero = schedule.week[dayIndex][1].length === 0 ? true : lengthZero;
        } else if (shiftType === "C") {
            lengthZero = schedule.week[dayIndex][0].length === 0 ? true : lengthZero;
        }
    }

    return !lengthZero;

}

function ClosestSunday(num) {
    var text = fs.readFileSync(__dirname + "/master/EnvironmentVariables.txt", "utf-8");
    text = text.split("\r\n");
    var firstSunday = parseInt(text[1]) + 1;

    return num - ((num - firstSunday) % 7);
}

function BuildWorkWeek(start, callback) {
    var employees = Parse();
    CleanWorkDays(start, employees);
    var schedule = new Schedule();
    var employeeNameList = [];
    var employeeMinList = [];

    for (var employee of employees) {
        employeeNameList.push(employee.name);
        employeeMinList.push(parseInt(employee.min));
        for (var i = 0; i < 28; i++) {
            var weekIndex = Math.floor( i / 4 );
            var dayIndex = start + weekIndex;
            var shiftLevel = i % 4;
            var shift = i % 2 === 0 ? 'O' : 'C';
            if (employee.availability[weekIndex] === shift || employee.availability[weekIndex] === "A") {
                if (LookForAvailability(employee.daysOff, dayIndex, shift)) {
                    if (employee.store === "Both") {
                        schedule.week[weekIndex][shiftLevel].push(employee.name);
                    } else if (employee.store === "B" && shiftLevel < 2) {
                        schedule.week[weekIndex][shiftLevel].push(employee.name);
                    } else if (employee.store === "Y" && shiftLevel > 1) {
                        schedule.week[weekIndex][shiftLevel].push(employee.name);
                    }
                }
            }
        }
    }


    var Solve = new Solver(schedule.week, employeeNameList, employeeMinList);
    var message = Solve.solve();
    Solve.clean();    
    
    // Build prefer lottery 
    var preferLottery = [];
    for (var i = 0; i < employees.length; i++) {
        for (var j = 0; j < employees[i].prefered - employees[i].min; j++) {
            preferLottery.push(employees[i]);
        }
    }

    preferLottery = shuffleArray(preferLottery);
    preferLottery.sort(function(a, b) {return b.constant - a.constant;});
    for (var i = 0; i < preferLottery.length; i++) {
        var employee = preferLottery[i];
        weekLoop: for (var j = 0; j < 28; j++) {
            var weekIndex = Math.floor(j / 4);
            var dayIndex = start + weekIndex;
            var shift = j % 2 === 0 ? 'O' : 'C';
            var shiftLevel = j % 4;

            if (schedule.week[weekIndex][j - weekIndex*4] === null) {
                if (!schedule.week[weekIndex].includes(employee.name)) {
                    if (employee.availability[weekIndex] === shift || employee.availability[weekIndex] === "A") {
                        if (LookForAvailability(employee.daysOff, dayIndex, shift)) {
                            if (employee.store === "Both") {
                                schedule.week[weekIndex][j - weekIndex*4] = employee.name;
                                break weekLoop;
                            } else if (employee.store === "B" && shiftLevel < 2) {
                                schedule.week[weekIndex][j - weekIndex*4] = employee.name;
                                break weekLoop;
                            } else if (employee.store === "Y" && shiftLevel > 1) {
                                schedule.week[weekIndex][j - weekIndex*4] = employee.name;
                                break weekLoop;
                            }
                        }
                    }
                }
            }
        }
    }

    // Build Max Lottery
    var maxLottery = [];
    for (var i = 0; i < employees.length; i++) {
        for (var j = 0; j < employees[i].max - employees[i].prefered; j++) {
            maxLottery.push(employees[i]);
        }
    }

    maxLottery = shuffleArray(maxLottery);
    maxLottery.sort(function(a, b) {return b.constant - a.constant;});
    for (var i = 0; i < maxLottery.length; i++) {
        var employee = maxLottery[i];
        weekLoop: for (var j = 0; j < 28; j++) {
            var weekIndex = Math.floor(j / 4);
            var dayIndex = start + weekIndex;
            var shift = j % 2 === 0 ? 'O' : 'C';
            var shiftLevel = j % 4;

            if (schedule.week[weekIndex][j - weekIndex*4] === null) {
                if (!schedule.week[weekIndex].includes(employee.name)) {
                    if (employee.availability[weekIndex] === shift || employee.availability[weekIndex] === "A") {
                        if (LookForAvailability(employee.daysOff, dayIndex, shift)) {
                            if (employee.store === "Both") {
                                schedule.week[weekIndex][j - weekIndex*4] = employee.name;
                                break weekLoop;
                            } else if (employee.store === "B" && shiftLevel < 2) {
                                schedule.week[weekIndex][j - weekIndex*4] = employee.name;
                                break weekLoop;
                            } else if (employee.store === "Y" && shiftLevel > 1) {
                                schedule.week[weekIndex][j - weekIndex*4] = employee.name;
                                break weekLoop;
                            }
                        }
                    }
                }
            }
        }
    }

    var scheduleString = "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,\n";
    for (var i = 0; i < schedule.week[0].length; i++) {
        var str = "";
        for (var j = 0; j < schedule.week.length; j++) {
            str += schedule.week[j][i] + ",";
        }
        str += "\r\n";
        scheduleString += str;
    }
    
    scheduleString += message;

    fs.writeFile(__dirname + "/master/schedule.txt", scheduleString, callback);
    
}
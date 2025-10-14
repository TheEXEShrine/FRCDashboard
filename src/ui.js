// Define UI elements
let ui = {
    timer: document.getElementById('timer'),
    robotState: document.getElementById('robot-state').firstChild,
    gyro: {
        container: document.getElementById('gyro'),
        val: 0,
        offset: 0,
        visualVal: 0,
        arm: document.getElementById('gyro-arm'),
        number: document.getElementById('gyro-number')
    },
    robotDiagram: {
        arm: document.getElementById('robot-arm')
    },
    example: {
        button: document.getElementById('example-button'),
        readout: document.getElementById('example-readout').firstChild
    },
    autoSelect: document.getElementById('auto-select'),
    armPosition: document.getElementById('arm-position')
};

// ===============================
//        Key Listeners
// ===============================

// Gyro rotation
let updateGyro = (key, value) => {
    ui.gyro.val = value;
    ui.gyro.visualVal = Math.floor(ui.gyro.val - ui.gyro.offset);
    ui.gyro.visualVal %= 360;
    if (ui.gyro.visualVal < 0) {
        ui.gyro.visualVal += 360;
    }
    ui.gyro.arm.style.transform = `rotate(${ui.gyro.visualVal}deg)`;
    ui.gyro.number.textContent = ui.gyro.visualVal + 'º';
};
NetworkTables.addKeyListener('/SmartDashboard/drive/navx/yaw', updateGyro);

// Robot arm position
NetworkTables.addKeyListener('/SmartDashboard/arm/encoder', (key, value) => {
    if (value > 1140) value = 1140;
    else if (value < 0) value = 0;

    const armAngle = value * 3 / 20 - 45;
    ui.robotDiagram.arm.style.transform = `rotate(${armAngle}deg)`;
});

// Example variable
NetworkTables.addKeyListener('/SmartDashboard/example_variable', (key, value) => {
    ui.example.button.classList.toggle('active', value);
    ui.example.readout.data = 'Value is ' + value;
});

// ✅ Updated: match timer listener (from robot code)
NetworkTables.addKeyListener('/DashboardData/MatchTime', (key, value) => {
    // Format value (seconds) as M:SS
    const seconds = Math.floor(value);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    ui.timer.textContent = `${minutes}:${remainder < 10 ? '0' : ''}${remainder}`;
});

// Autonomous mode list
NetworkTables.addKeyListener('/SmartDashboard/autonomous/modes', (key, value) => {
    while (ui.autoSelect.firstChild) {
        ui.autoSelect.removeChild(ui.autoSelect.firstChild);
    }
    for (let i = 0; i < value.length; i++) {
        const option = document.createElement('option');
        option.appendChild(document.createTextNode(value[i]));
        ui.autoSelect.appendChild(option);
    }
    ui.autoSelect.value = NetworkTables.getValue('/SmartDashboard/currentlySelectedMode');
});

NetworkTables.addKeyListener('/SmartDashboard/autonomous/selected', (key, value) => {
    ui.autoSelect.value = value;
});

// ===============================
//        UI Event Handlers
// ===============================

ui.example.button.onclick = function() {
    NetworkTables.putValue('/SmartDashboard/example_variable', this.className != 'active');
};

ui.gyro.container.onclick = function() {
    ui.gyro.offset = ui.gyro.val;
    updateGyro('/SmartDashboard/drive/navx/yaw', ui.gyro.val);
};

ui.autoSelect.onchange = function() {
    NetworkTables.putValue('/SmartDashboard/autonomous/selected', this.value);
};

ui.armPosition.oninput = function() {
    NetworkTables.putValue('/SmartDashboard/arm/encoder', parseInt(this.value));
};

// ===============================
//        Error and Coral Status
// ===============================

addEventListener('error', (ev) => {
    window.api.sendWindowError({
        mesg: ev.message,
        file: ev.filename,
        lineNumber: ev.lineno
    });
});

// ✅ Fixed: Coral status listener (was using mismatched variable)
NetworkTables.addKeyListener('/SmartDashboard/Has Coral/', (key, value) => {
    const shooterStatus = document.getElementById('shooter-status');
    if (value === true) {
        shooterStatus.style.backgroundColor = 'green';
        shooterStatus.textContent = 'Coral In Fully';
    } else {
        shooterStatus.style.backgroundColor = 'red';
        shooterStatus.textContent = 'Coral Not In';
    }
});

const roomsInfo = [
    {"name": "Room1", "ipAddr":"http://192.168.1.11:5000"},
    {"name": "Room2", "ipAddr":"http://192.168.1.12:5000"}
];

const refreshPageTimeout = 1500;
const webserverUrl = "http://192.168.1.10";

// ===== API FUNCTIONS =====
async function callLightCtrlApiGet(apiUrl) {
    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(500)
        });
        return await apiResponse.json();
    } catch (err) {
        console.error("GET error:", err);
    }
}

async function callLightCtrlApiPost(apiUrl, postData) {
    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData),
            signal: AbortSignal.timeout(500)
        });
        return await apiResponse.json();
    } catch (err) {
        console.error("POST error:", err);
    }
}

// ===== INIT =====
$(document).ready(async function() {

    for (const room of roomsInfo) {

        const lightStateData = await callLightCtrlApiGet(room.ipAddr + "/getLightState");

        let btnClass = "switchBtn off";
        let btnText = "Turn On";
        let btnValue = "on";

        if (lightStateData && lightStateData.state == 1) {
            btnClass = "switchBtn on";
            btnText = "Turn Off";
            btnValue = "off";
        }

        const switchBtn = `
            <div class="switchCard">
                <span class="roomName">${room.name}</span>
                <button class="${btnClass}" id="${room.name}" value="${btnValue}">
                    ${btnText}
                </button>
            </div>
        `;

        $("#switchButtons").append(switchBtn);

        $("#lightCfgSelRoom").append(`<option value="${room.name}">${room.name}</option>`);
        $("#lightUsageSelRoom").append(`<option value="${room.name}">${room.name}</option>`);
    }

    // Load first room chart
    const firstRoom = {"roomNames": [roomsInfo[0].name]};
    const data = await callLightCtrlApiPost(webserverUrl+"/getLightUsageData.php", firstRoom);

    if (data && data.status !== "error") {
        for (let [roomName, usage] of Object.entries(data.lightUsageData.rooms)) {
            createLightDurationChart(roomName, usage);
            createLightKwhChart(roomName, usage);
        }
    }
});

// ===== SWITCH BUTTON =====
$("#switchButtons").on('click', '.switchBtn', async function(e) {

    const btn = e.target;
    const roomIp = roomsInfo.find(r => r.name === btn.id).ipAddr;

    const url = btn.value === "on"
        ? `${roomIp}/setLightState?state=1`
        : `${roomIp}/setLightState?state=0`;

    const res = await callLightCtrlApiGet(url);

    if (!res) alert("Failed to control light.");
    else setTimeout(() => location.reload(), refreshPageTimeout);
});

// ===== SETTINGS =====
$("#lightCfgSelRoom").on('change', async function() {

    const roomName = $(this).val();
    $("#lightCfgSettingsForm").html("");

    if (!roomName) return;

    const roomIp = roomsInfo.find(r => r.name === roomName).ipAddr;
    const data = await callLightCtrlApiGet(`${roomIp}/getCfgSettings`);

    if (!data) return alert("Failed to load settings");

    const form = `
        <div class="formGroup">
            <label>Voltage (V)</label>
            <input class="inputField" id="light_voltage" value="${data.light_voltage}">
        </div>

        <div class="formGroup">
            <label>Darkness (LUX)</label>
            <input class="inputField" id="lux_darkness" value="${data.lux_darkness}">
        </div>

        <div class="formGroup">
            <label>Log Interval (min)</label>
            <input class="inputField" id="log_interval_min" value="${data.log_interval_min}">
        </div>

        <button class="primaryBtn" id="setCfgSettingsBtn">Save Settings</button>
    `;

    $("#lightCfgSettingsForm").html(form);
});

// ===== SAVE SETTINGS =====
$("#lightCfgSettingsForm").on('click', '#setCfgSettingsBtn', async function() {

    const roomName = $("#lightCfgSelRoom").val();
    const roomIp = roomsInfo.find(r => r.name === roomName).ipAddr;

    const payload = {
        light_voltage: parseFloat($("#light_voltage").val()),
        lux_darkness: parseInt($("#lux_darkness").val()),
        log_interval_min: parseInt($("#log_interval_min").val())
    };

    const res = await callLightCtrlApiPost(`${roomIp}/setCfgSettings`, payload);

    if (!res) alert("Failed to save");
    else alert("Settings updated!");
});

// ===== USAGE STATS =====
$("#lightUsageSelRoom").on('change', async function() {

    const roomName = $(this).val();
    $("#lightUsageStatsChart").html("");

    if (!roomName) return;

    const data = await callLightCtrlApiPost(webserverUrl+"/getLightUsageData.php", {
        roomNames: [roomName]
    });

    if (!data) return alert("Failed to load stats");

    for (let [roomName, usage] of Object.entries(data.lightUsageData.rooms)) {
        createLightDurationChart(roomName, usage);
        createLightKwhChart(roomName, usage);
    }
});
const roomsInfo = [
    {"name": "Room1", "ipAddr":"http://192.168.1.11:5000"},
    {"name": "Room2", "ipAddr":"http://192.168.1.12:5000"}
];
const refreshPageTimeout = 1500;
const webserverUrl = "http://192.168.1.10";

async function callLightCtrlApiGet(apiUrl) {
    // fetch API GET method call function
    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(500) // Timeout after 0.5s
        });

        const respData = await apiResponse.json();
        return respData
    }
    catch (apiError) {
        if (apiError.name === "AbortError") { console.error(`API call to ${apiUrl} timed out.`); }
        else { console.error(`API call to ${apiUrl} error: `, apiError); }
    }
}

async function callLightCtrlApiPost(apiUrl, postData) {
    // fetch API POST method call function
    try {
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(postData),
            signal: AbortSignal.timeout(500) // Timeout after 0.5s
        });

        const respData = await apiResponse.json();
        return respData
    }
    catch (apiError) {
        if (apiError.name === "AbortError") { console.error(`API call to ${apiUrl} timed out.`); }
        else { console.error(`API call to ${apiUrl} error: `, apiError); }
    }
}

$(document).ready(async function() {
    //page initialization function!!

    //loop through each room, and populate the switch button rows
    for (const room of roomsInfo) {
        const lightStateData = await callLightCtrlApiGet(room["ipAddr"]+"/getLightState");
        let switchBtnRow;
        
        if (lightStateData === undefined) {
            switchBtn = `
                <span class="switchButton">
                    <label>${room["name"]}</label><button disabled class="userInput switchBtn" id="${room["name"]}">Turn On</button>
                </span>
            `;
        }
        else {
            let switchBtnCss = ""; let switchBtnTxt = ""; let switchBtnVal = ""
            if (lightStateData["state"] == 0) { switchBtnTxt = "Turn On"; switchBtnVal = "on" }
            else { switchBtnCss = "background:green; color:white"; switchBtnTxt = "Turn Off"; switchBtnVal = "off"  }

            switchBtn = `
                <span class="switchButton">
                    <label>${room["name"]}</label>
                    <button class="userInput switchBtn" id="${room["name"]}" style="${switchBtnCss}" value = "${switchBtnVal}">${switchBtnTxt}</button>
                </span>
            `;
        }
        
        $("#switchButtons").append(switchBtn);

        //populate the all the select drop down options as well for each room
        $("#lightCfgSelRoom").append(`<option value="${room["name"]}">${room["name"]}</option>`); //light control settings drop down
        $("#lightUsageSelRoom").append(`<option value="${room["name"]}">${room["name"]}</option>`); //light usage stats drop down
    }

    //load the lights usage charts for the first room
    $("#lightUsageStatsChart").html("");
    const filterFirstRoom = {"roomNames": [roomsInfo[0]["name"]]}
    const lightUsageData = await callLightCtrlApiPost(webserverUrl+"/getLightUsageData.php", filterFirstRoom);

    if (lightUsageData === undefined) { alert("Can't get lights usage statistics; server not reachable.") }
    else {
        if (lightUsageData["status"] == "error") {
            alert(lightUsageData["errormessage"]);
        }
        else {
            for (let [roomName, roomLightUsageData] of Object.entries(lightUsageData["lightUsageData"]["rooms"])) {
                createLightDurationChart(roomName, roomLightUsageData); //lightUsageChart.js
                createLightKwhChart(roomName, roomLightUsageData); //lightUsageChart.js
            }
        }
    }
});

$("#switchButtons").on('click', '.switchBtn', async function(event) {
    //switch button event to on/off light for corresponding room
    //when api receive as successful, wait for a short while and auto refresh page
    const switchBtn = event.target;
    const roomIpAddr = roomsInfo.find(room => room["name"] === switchBtn.id)["ipAddr"];
    let setLightStateRes;

    if (switchBtn.value == "on") { setLightStateRes = await callLightCtrlApiGet(`${roomIpAddr}/setLightState?state=1`) }
    else { setLightStateRes = await callLightCtrlApiGet(`${roomIpAddr}/setLightState?state=0`) }

    if (setLightStateRes === undefined) { alert("Can't on/off light. Light controller request failed.") }
    else {
        if (setLightStateRes["status"] == "error") {
            alert(setLightStateRes["errormessage"]);
        }
        setTimeout(function(){
            location.reload();
        }, refreshPageTimeout); 
    }
});

$("#lightCfgSelRoom").on('change', async function() {
    //drop down event to load the corresponding room's config settings from selected room
    $("#lightCfgSettingsForm").html(""); //clear form fields
    const roomName = $("#lightCfgSelRoom").val();

    if (roomName == "") { alert("No room is selected!"); }
    else {
        const roomIpAddr = roomsInfo.find(room => room["name"] === roomName)["ipAddr"];
        const lightCfgSettings = await callLightCtrlApiGet(`${roomIpAddr}/getCfgSettings`);

        if (lightCfgSettings === undefined) { alert(`Can't get light settings for room ${roomName}. Light controller request failed.`) }
        else {
            const cfgSettingsFields =  `
                <span class="formField">
                    <label>Voltage of light (V): </label> <input class="userInput" type="text" id="light_voltage" value="${lightCfgSettings["light_voltage"]}" />
                </span>
                <span class="formField">
                    <label>Darkness threshold (LUX): </label> <input class="userInput" type="text" id="lux_darkness" value="${lightCfgSettings["lux_darkness"]}" />
                </span>
                <span class="formField">
                    <label>Monitoring log interval (min): </label> <input class="userInput" type="text" id="log_interval_min" value="${lightCfgSettings["log_interval_min"]}" />
                </span>
                <button class="userInput" id="setCfgSettingsBtn" style="display:block; margin:auto;">Set Settings</button>
            `;
            
            $("#lightCfgSettingsForm").html(cfgSettingsFields);
        }
    }
    
});

$("#lightCfgSettingsForm").on('click', '#setCfgSettingsBtn', async function(event) {
    //set config settings button event
    //create json object of the fields' key and value, and send as POST request to the selected room
    let validationError = false;
    const light_voltage = parseFloat($("#light_voltage").val());
    const lux_darkness = parseInt($("#lux_darkness").val());
    const log_interval_min = parseInt($("#log_interval_min").val());

    if (isNaN(light_voltage)) { alert("Voltage of light is blank or non-numeric!"); validationError = true; }
    if (isNaN(lux_darkness)) { alert("Darkness threshold is blank or non-numeric!"); validationError = true; }
    if (isNaN(log_interval_min)) { alert("Monitoring log interval is blank or non-numeric!"); validationError = true; }

    if (validationError) { return; }

    const lightCfgSettings = {
        "light_voltage": light_voltage,
        "lux_darkness": lux_darkness,
        "log_interval_min": log_interval_min
    }

    const roomName = $("#lightCfgSelRoom").val();
    const roomIpAddr = roomsInfo.find(room => room["name"] === roomName)["ipAddr"];
    const setCfgSettingsRes = await callLightCtrlApiPost(`${roomIpAddr}/setCfgSettings`, lightCfgSettings);

    if (setCfgSettingsRes === undefined) { alert("Can't apply the light settings. Light controller request failed.") }
    else {
        if (setCfgSettingsRes["status"] == "error") {
            alert(setCfgSettingsRes["errormessage"]);
        }
        else { alert(`Light settings for ${roomName} is applied successfully!`) }
    }
});

$("#lightUsageSelRoom").on('change', async function() {
    //drop down event to load the corresponding room's light usage data from selected room
    const roomName = $("#lightUsageSelRoom").val();
    $("#lightUsageStatsChart").html("");

    if (roomName == "") { alert("No room is selected!"); }
    else {
        const filterTheRoom = {"roomNames": [roomName]}
        const lightUsageData = await callLightCtrlApiPost(webserverUrl+"/getLightUsageData.php", filterTheRoom);

        if (lightUsageData === undefined) { alert("Can't get lights usage statistics; server not reachable.") }
        else {
            if (lightUsageData["status"] == "error") {
                alert(lightUsageData["errormessage"]);
            }
            else {
                console.log(lightUsageData["lightUsageData"]["rooms"]);

                for (let [roomName, roomLightUsageData] of Object.entries(lightUsageData["lightUsageData"]["rooms"])) {
                    createLightDurationChart(roomName, roomLightUsageData); //lightUsageChart.js
                    createLightKwhChart(roomName, roomLightUsageData); //lightUsageChart.js
                }
            }
        }
    }
});

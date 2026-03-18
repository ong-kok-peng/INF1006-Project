const roomsInfo_old = [
    {"name": "Room1", "ipAddr":"http://192.168.1.11:5000"},
    {"name": "Room2", "ipAddr":"http://192.168.1.12:5000"}
]
const roomsInfo = [
    {"name": "Room1", "ipAddr":"http://10.150.189.2:5000"},
    {"name": "Room2", "ipAddr":"http://10.150.189.3/5000"}
]

const refreshPageTimeout = 1500

async function callLightCtrlApi(apiUrl) {
    try {
        const apiResponse = await fetch(apiUrl, {
            signal: AbortSignal.timeout(500) // Timeout after 0.5s
        });

        const respData = await apiResponse.json();
        return respData
    }
    catch (apiError) {
        if (apiError.name === "AbortError") { console.error(`API call to light controller ${apiUrl} timed out.`); }
        else { console.error(`API call to light controller ${apiUrl} error: `, apiError); }
    }
}

$(document).ready(async function() {
    //populate the switch button rows, and the selRoomDrpDwn select options
    for (const room of roomsInfo) {
        const lightStateData = await callLightCtrlApi(room["ipAddr"]+"/getLightState");
        let switchBtnRow;
        
        if (lightStateData === undefined) {
            switchBtnRow = `
                <p class="subContainerRow">
                    <label>${room["name"]}</label><button disabled class="userInput switchBtn" id="${room["name"]}" >Turn On</button>
                </p>
            `;
        }
        else {
            let switchBtnCss = ""; let switchBtnTxt = ""; let switchBtnVal = ""
            if (lightStateData["state"] == 0) { switchBtnTxt = "Turn On"; switchBtnVal = "on" }
            else { switchBtnCss = "background:green; color:white"; switchBtnTxt = "Turn Off"; switchBtnVal = "off"  }

            switchBtnRow = `
                <p class="subContainerRow">
                    <label>${room["name"]}</label>
                    <button class="userInput switchBtn" id="${room["name"]}" style="${switchBtnCss}" value = "${switchBtnVal}">${switchBtnTxt}</button>
                </p>
            `;
        }
        
        $("#lightCtrlSwitches").append(switchBtnRow);
        $("#selRoomDrpDwn").append(`<option value="${room["name"]}">${room["name"]}</option>`)
    }

    $(".switchBtn").on('click', async function(event) {
        //switch button event to on/off light for corresponding room
        //when api receive as successful, wait for a short while and auto refresh page
        const switchBtn = event.target;
        const roomIpAddr = roomsInfo.find(room => room["name"] === switchBtn.id)["ipAddr"];
        let setLightStateRes;

        if (switchBtn.value == "on") { setLightStateRes = await callLightCtrlApi(`${roomIpAddr}/setLightState?state=1`) }
        else { setLightStateRes = await callLightCtrlApi(`${roomIpAddr}/setLightState?state=0`) }

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

    $("#selRoomDrpDwn").on('change', async function() {
        //drop down event to load the corresponding room's config settings from selected room
        const roomName = $("#selRoomDrpDwn").val();
        if (roomName == "") {
            alert("No room is selected!");
            $("#lightCtrlSettingsForm").html("");
        }
        else {
            const roomIpAddr = roomsInfo.find(room => room["name"] === roomName)["ipAddr"];
            const lightCfgSettings = await callLightCtrlApi(`${roomIpAddr}/getCfgSettings`);

            if (lightCfgSettings === undefined) { alert("Can't get light settings. Light controller request failed.") }
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
                
                $("#lightCtrlSettingsForm").html(cfgSettingsFields);
            }
        }
        
    });

    $("#lightCtrlSettingsForm").on('click', '#setCfgSettingsBtn', async function(event) {
        //set config settings button event
        //create json object of the fields' key and value, and send as POST request
        console.log("Setting the config settings!");
    });
});
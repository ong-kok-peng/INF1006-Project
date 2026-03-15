import math, json, sys, time, threading, requests
from datetime import datetime
from flask import Flask, render_template, request
from gpiozero import LED, Button, GPIOZeroError
import board
from adafruit_ads1x15 import ADS1115, AnalogIn, ads1x15

configFilename = "./lightSensorCtrlCfg.json"
allConfig = None; configConstants = None; configSettings = None

initSensorSuccess = False
initSensorRetries = 0
maxRetries = 5

light_adcIna199 = None
ldr_adc = None
light_relay = None
light_pushswitch = None
light_pushswitch_state = 0 # 0 is not pressed, 1 is pressed

app = Flask(__name__)

def initSensors():
    try:
        global light_adcIna199, ldr_adc, light_relay, light_pushswitch
        i2c = board.I2C()
        adc = ADS1115(i2c)
        adc.gain = configConstants["ads1115_gain"]
        print("ADC sensor init OK!")

        ldr_adc = AnalogIn(adc, ads1x15.Pin.A0)
        light_adcIna199 = AnalogIn(adc, ads1x15.Pin.A2)
        light_relay = LED(configConstants["light_relay_gpio"])
        light_relay.off()
        light_pushswitch = Button(configConstants["push_switch_gpio"], bounce_time=0.05)
        light_pushswitch.when_pressed = light_pushswitch_pressed
        print("GPIOs init OK!")
        return True
        
    except ValueError:
        print("I2C busy or wrong address, cannot init ADC sensor."); return False
    except OSError as e:
        print(f"I2C error (perhaps the I2C is disconnected) More info: {e}"); return False
    except GPIOZeroError as e:
        print(f"GPIO init error: {e}"); return False

def light_pushswitch_pressed():
    global light_pushswitch_state
    light_pushswitch_state = 1
    time.sleep(1)
    light_pushswitch_state = 0

def ldrResistanceToLux(ldrResistance):
    resistance10Lux = 25000
    return 10*math.pow((resistance10Lux/ldrResistance), 1.667)

def log_lightState(lightState):
    jsonData = {"logEvent": "onOff", "lightState": lightState}
    lightStatus = ""

    if lightState == 1: lightStatus = "Light on!"
    else: lightStatus = "Light off!"

    try:
        response = requests.post(configConstants["log_server_ip"], json=jsonData)
        response.raise_for_status() 
        result = response.json()
        
        if response.status_code == 200 and result["status"] == "ok":
            print(f"{lightStatus} {result['message']}")
        elif response.status_code == 200 and result["status"] == "error":
            print(f"{lightStatus} {result['errormessage']}")
        
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")

def log_lightPower():
    light_amp = light_adcIna199.voltage / configConstants["ina199_gain"] / configConstants["ina199_shunt"]
    light_watt = configSettings["light_voltage"] * light_amp
    jsonData = {"logEvent": "measureKw", "kwPower": light_watt/1000}

    #print(f"{light_amp:.3f} A, {light_watt:.3f} W")
    
    #"""
    try:
        response = requests.post(configConstants["log_server_ip"], json=jsonData)
        response.raise_for_status() 
        result = response.json()
        
        if response.status_code == 200 and result["status"] == "ok":
            print(f"Light power: {light_watt:.3f} W. {result['message']}")
        elif response.status_code == 200 and result["status"] == "error":
            print(f"Light power: {light_watt:.3f} W. {result['errormessage']}")
        
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
    #"""
    

def pollSensors():
    while True:
        try:
            #log the light power consumption to server every log_interval_min
            timeNow = datetime.now().strftime("%H:%M:%S"); timeMinute = int(timeNow.split(':')[1]); timeSecond = int(timeNow.split(':')[2])
            if timeMinute % configSettings["log_interval_min"] == 0 and timeSecond == 0:
                log_lightPower()
            #log_lightPower()

            #poll the ldr automatically
            ldrResistance = (ldr_adc.voltage * configConstants["ldr_voltdivider_r1"])/(3.3 - ldr_adc.voltage)
            ldrLux = ldrResistanceToLux(ldrResistance)
            #print(f"LDR: {int(ldrResistance)} ohms, LUX: {ldrLux:.1f}")

            #do the light control logic here, while getting pushswitch and pir sensor states
            if light_relay.value == 0 and ldrLux < configSettings["lux_darkness"]:
                # prepare to turn on the light when darkness is detected, either by switch or pir
                if light_pushswitch_state == 1:
                    light_relay.on()
                    log_lightState(1)

            elif light_relay.value == 1:
                # prepare to turn off the light
                if light_pushswitch_state == 1:
                    light_relay.off()
                    log_lightState(0)

                elif ldrLux >= configSettings["lux_darkness"]:
                    light_relay.off()
                    log_lightState(0)

            #print("\n")
            time.sleep(configSettings["sensor_interval_sec"])
            
        except OSError as e:
            print(f"I2C error (perhaps the I2C is disconnected) More info: {e}")
            break
    sys.exit()

##### Flask server app routes put below here #####

@app.route("/overrideLightCtrl", methods=["GET"])
def overrideLightState():
    # override to manually switch on/off the light
    lightStatus = {
        "status": "",
        "errormessage": "",
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }

    lightState = request.args.get("state", "-1")
    
    if lightState == "-1":
        lightStatus["status"] = "error"
        lightStatus["errormessage"] = "No value is specified"

    elif lightState == "1": # override to turn on the light
        if light_relay.value == 0:
            light_relay.on()
            lightStatus["status"] = "ok"
            log_lightState(1)
        else:
            lightStatus["status"] = "error"
            lightStatus["errormessage"] = "Light is already on"

    elif lightState == "0": # override to turn off the light
        if light_relay.value == 1:
            light_relay.off()
            lightStatus["status"] = "ok"
            log_lightState(0)
        else:
            lightStatus["status"] = "error"
            lightStatus["errormessage"] = "Light is already off"
    else:
        lightStatus["status"] = "error"
        lightStatus["errormessage"] = "Invalid value"

    return lightStatus

@app.route('/setCfgSettings', methods=['POST'])
def setLoggerSettings():
    # change sensor logging config settings
    result = {
        "status": "",
        "errormessage": "",
        "message": "",
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }

    if request.is_json:
        settingsData = request.get_json() 

        #copy the settings json to the configSettings dict, then overwrite the sensorLoggerConfig.json
        for setting, value in settingsData.items():
            if setting in configSettings.keys():
                configSettings[setting] = value

        allConfig["settings"] = configSettings
        with open(configFilename, 'w') as file:
            json.dump(allConfig, file, indent=4)

        # Return a JSON response
        result["status"] = "ok"
        result["message"] = "Settings applied!"
    else:
        result["status"] = "error"
        result["errormessage"] = "Bad request; invalid settings data"
    
    return result

@app.route('/getCfgSettings')
def getLoggerSettings():
    # print all sensor logging config settings
    return configSettings


if __name__ == "__main__":
    try:
        with open(configFilename, 'r', encoding='utf-8') as file:
            allConfig = json.load(file)
            configConstants = allConfig["constants"]
            configSettings = allConfig["settings"]
            print("Config settings loaded!")
    except FileNotFoundError:
        print("I2C busy or wrong address, cannot init ADC sensor."); sys.exit()
    except json.jsonDecodeError as e:
        print("I2C busy or wrong address, cannot init ADC sensor."); sys.exit()

    while not initSensorSuccess:
        if initSensorRetries == maxRetries: break
        initSensorRetries += 1
        initSensorSuccess = initSensors()
        time.sleep(1)

    if initSensorSuccess:
        sensorPollThread = threading.Thread(target=pollSensors, daemon=True)
        sensorPollThread.start()
        app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
    else:
        sys.exit()

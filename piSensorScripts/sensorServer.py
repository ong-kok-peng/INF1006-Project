import sensorServerConstants as const
import sys, time, threading
from datetime import datetime
from flask import Flask, render_template, request
from gpiozero import LED, Button
import board
from adafruit_ads1x15 import ADS1115, AnalogIn, ads1x15

try:
    i2c = board.I2C()
    adc = ADS1115(i2c)
    adc.gain = const.ADS1115_GAIN
    print("ADC sensor init OK!")
    
except ValueError:
    print("I2C busy or wrong address, cannot init ADC sensor."); sys.exit()
except OSError:
    print("ADC sensor disconnected, cannot init ADC sensor."); sys.exit()
    
adcIna199Light1 = AnalogIn(adc, ads1x15.Pin.A0)
adcIna199Light2 = AnalogIn(adc, ads1x15.Pin.A1)
adcLdrResistance = AnalogIn(adc, ads1x15.Pin.A2)

relayLights = [ LED(const.LIGHT1_RELAY_GPIO), LED(const.LIGHT2_RELAY_GPIO) ]

app = Flask(__name__)

def pollSensors():
    while True:
        #poll the ldr automatically
        volt_adcLdrResistance = adcLdrResistance.voltage
        ldrResistance = (volt_adcLdrResistance * const.LDR_VOLTDIVIDER_R1)/(3.3 - volt_adcLdrResistance)
        print(f"{const.LDR_LABEL} {int(ldrResistance)} ohms")
        
        time.sleep(const.SENSOR_POLL_INTERVAL)
    
def toggleRelayLight(index):
    relayLights[index-1].toggle()
    
    toggleStatus = {
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        const.LIGHT_STATUS_LABELS[index-1]: relayLights[index-1].value
    }
    
    return toggleStatus

@app.route("/getSensor")
def getSensor():
    #get adc voltages, convert them to actual values and return the values in json
    try:
        volt_adcIna199Light1 = adcIna199Light1.voltage
        volt_adcIna199Light2 = adcIna199Light2.voltage
        volt_adcLdrResistance = adcLdrResistance.voltage
        
        ampIna199Light1 = volt_adcIna199Light1 / const.INA199_GAIN / const.INA199_SHUNT
        ampIna199Light2 = volt_adcIna199Light2 / const.INA199_GAIN / const.INA199_SHUNT
        ldrResistance = (volt_adcLdrResistance * const.LDR_VOLTDIVIDER_R1)/(3.3 - volt_adcLdrResistance)
        
        sensorValues = {
            "status": "Ok",
            "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            const.LIGHT1_AMP_LABEL: f"{ampIna199Light1:.3f} A",
            const.LIGHT2_AMP_LABEL: f"{ampIna199Light2:.3f} A",
            const.LDR_LABEL: f"{int(ldrResistance)} ohms"
        }
        
    except OSError:
        sensorValues = {
            "status": "Error",
            "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "errormessage": "ADC sensor disconnected, cannot read."
        }
    
    return sensorValues
    
@app.route("/getLightStatus")
def getLightStatus():
    lightStatus = {
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        const.LIGHT_STATUS_LABELS[0]: relayLights[0].value,
        const.LIGHT_STATUS_LABELS[1]: relayLights[1].value,
    }
    
    return lightStatus
    
@app.route("/relayLight1")
def toggleRelayLight1():
    return toggleRelayLight(1)
    
@app.route("/relayLight2")
def toggleRelayLight2():
    return toggleRelayLight(2)
    

if __name__ == "__main__":
    sensorPollThread = threading.Thread(target=pollSensors, daemon=True)
    sensorPollThread.start()
    app.run(debug=True, use_reloader=False)

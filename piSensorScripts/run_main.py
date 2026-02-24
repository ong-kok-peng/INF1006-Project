import subprocess
import time
from datetime import datetime
from subprocess import Popen, PIPE, STDOUT
from flask import Flask, render_template, request
import threading
import re

app = Flask(__name__)

sensorKeyValuesDict = {}
runMainCProgThreadLock = threading.Lock()

def runMainCProg():
    # Start the main C program process
    process = Popen(
        ['./main'], 
        stdout=PIPE, 
        stderr=STDOUT, 
        text=True, 
        bufsize=1
    )

    # Read output line by line
    for line in process.stdout: 
        # remove white spaces and C program's ANSI escape chars 
        ansiEscRegex = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        line = ansiEscRegex.sub('', line).strip()
        
        global sensorKeyValuesDict
        
        with runMainCProgThreadLock:
            sensorKeyValuesDict = {}
            sensorKeyValuesDict['timestamp'] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
            
            sensorKeyValues = line.split(';')
            if len(sensorKeyValues) > 0:
                sensorKeyValuesDict['status'] = "Ok"
                
                for sensorKeyValue in sensorKeyValues:
                    colonIndex = sensorKeyValue.find(':')
                    key = sensorKeyValue[:colonIndex].strip()
                    value = sensorKeyValue[colonIndex+1:].strip()
                    sensorKeyValuesDict[key] = value
                
                #print(sensorKeyValuesDict)
            else:
                sensorKeyValuesDict['status'] = "Error"
                sensorKeyValuesDict['error_message'] = "Unable to read sensors"

    # Wait for the process to finish and get any remaining output/errors
    stdout, stderr = process.communicate()
    
    if stderr:
        sensorKeyValuesDict = {}
        sensorKeyValuesDict['timestamp'] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        sensorKeyValuesDict['status'] = "Error"
        sensorKeyValuesDict['error_message'] = f"C Program STDERR: {stderr.strip()}"


@app.route("/getSensor")
def index():
    return sensorKeyValuesDict


if __name__ == "__main__":
    runMainCProgThread = threading.Thread(target=runMainCProg, daemon=True)
    runMainCProgThread.start()
    app.run(debug=True)

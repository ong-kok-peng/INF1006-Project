# INF1006-Project
SIT Computer Networks Module home automation lights control project

## Introduction
A demonstration of how network devices communicate with one another within a LAN. In this application, the lights in a house are controlled with Raspberry Pis through interfacing with sensors, with logging information such as overall lights' power consumption and duration of usage.

Raspberry Pis are used as part of the module's BOM requirements. We know this is overkill, and there are cheaper, more widely used alternatives such as the ESP32. 

## Key features
* Lights won't turn on when there is enough outdoor light (i.e., during daytime)
* Room 1 lights are controlled by a touch switch, while room 2 lights are controlled by a PIR motion sensor
* Lights turn off automatically when there is enough ambient light, solving the problem where the user forgets to turn off the light in daytime
* User can turn on/off the light with the convenience of their phones
* User can keep track of the light usage for each day and each room
* User can adjust certain parameters for the light control algorithm, i.e. darkness LUX threshold, suiting different home environments

## System architecture design
<img width="1080" height="667" alt="INF1006_project_topology" src="https://github.com/user-attachments/assets/d95b9c0e-c04c-42d6-a19d-8c9633672275" />

We deploy in a two-room apartment. There is one Pi for each room, which communicates to the central dashboard + server Pi in a star topology. All Pis connect to the same Wifi access point to form a local LAN.

The room Pis will interact with sensors, mainly the LDR (light-dependent resistor), which is deployed outside the apartment to capture outdoor light intensity. Each room will also have various sensors, such as a touch switch and a PIR motion sensor.

## Functionality of the Pis
* The room Pis
  * Controls the on/off of the light based on reading sensors, i.e. LDR, push switch and PIR sensor, with a defined algorithm.
  * Uses a configuration file containing constants and user-changeable settings
  * It also hosts a Flask HTTP server to allow turning on/off lights remotely and changing the configuration settings, i.e. LUX threshold
* The dashboard + server Pi
  * Hosts a LAMP (Apache, PHP, MySQL) web server to display a web interface for light control and store light usage logs (see next section)

## Network communication between the Pis
Communication is bi-directional between the room Pis and the dashboard + server Pi via HTTP GET and POST request calls
* The room Pis send logging messages to the dashboard + server Pi at particular events such as
  * When the lights change their state (from on to off and vice versa)
  * Measuring the lights' power consumption every n minutes
* The dashboard + server Pi sends control data (i.e. remote lights on/off and modified configuration settings) to the room Pis

## How logging computes the overall usage
To compute the overall duration usage, the time period of each on-off pair row of data is calculated, which is then summed up for the whole day. 

Also, to compute the overall power consumption in kWh, the per-period kWh is calculated for each data row and then summed up for the whole day.

## Benefits
* Significant reduction in unnecessary light usage
* Electricity savings
* Less physical interaction with on/off lights
* Improved tracking of electricity usage

## Future improvements
* Adding RTC time control (lights turn off automatically between 12 am and 7 am, for example)
* Logging additional parameters, i.e. ambient room LUX to study ambient light patterns
* Adding electricity price calculation
* Improving sensors with higher accuracy and real-time sensors, i.e. thermal map imaging
* Messaging alerts, i.e. lights usage exceeded user threshold

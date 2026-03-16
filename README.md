# INF1006-Project
SIT Computer Networks Module home automation lights control project

## Introduction
A demonstration on how network devices communicate with one another when connected in a LAN. In this application, the lights in a house is controlled with Raspberry Pis through interfacing with sensors, with logging information such as overall lights power consumption and duration usage.

## System architecture design
The lights in each room are controlled by one Pi, which communicates to the central dashboard + server Pi in a star topology. All Pis connect to the same Wifi access point to form a local LAN.

Raspberry Pis are used as part of the module's BOM requirements. We know that its overkill and there are cheaper and more widely-used alternatives such as the ESP32. 

## Functionality of the Pis
* The room Pis
  * Controls the on/off the light based on reading sensors i.e. LDR, push switch and PIR sensor with a defined algorithm.
  * Uses a configuration file containing constants and user changeable settings
  * It also hosts a REST API server to allow on/off lights remotely and changing the configuration settings i.e. LUX threshold
* The dashboard + server Pi
  * Hosts a HTTP web server to display a web interface for remote lights control and changing settings.
  * It contains server-side components to receive logging REST API requests from the room Pis and manages a RDBMS for holding logging data

## Network communication between the Pis
Communication is bi-directional between the room Pis and the dashboard + server Pi via REST API calls
* The room Pis send logging messages to the dashboard + server Pi at particular events such as
  * When the lights change its state (from on to off and vice versa)
  * Measuring the lights power consumption every n minutes
* The dashboard + server Pi send POST requests (remote lights on/off and modified configuration settings) to the room Pis

## How logging computes the overall usage
To compute the overall duration usage, the time period of each on-off pair rows of data is calculated, which is then summed up for the whole day. 

Also, to compute the overall power consumption in kWh, the per period kWh is calculated for each data row and then summed up for the whole day.

## User benefits
* Lights wont turn on when there is enough ambient light (i.e during daytime), saving unnecessary electricity use
* Lights turn on automatically without user intervention via motion sensors
* Lights turn off automatically when there is enough ambient light, solving the problem where user forgets to off the light in daytime
* User can turn on/off the light with the convenience on their phones
* User can keep track on the light usage for each day and each room
* User can adjust certain parameters for the light control algorithm i.e. darkness LUX threshold, suiting different home environments

## Future improvements
* Adding RTC time control (lights turn off automatically between 12am and 7am, for example)
* Logging additional parameters i.e. ambient room LUX to study ambient light patterns
* Adding electricity price calculation
* Improving sensors with higher accuracy and real-time sensors i.e. thermal map imaging
* Messaging alerts i.e. lights usage exceeded user threshold
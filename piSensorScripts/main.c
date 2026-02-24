#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include <wiringPi.h>
#include <ads1115.h>

//define adc config
#define ads1115Base 1000
#define minAdcValue 0
#define maxAdcValue 26325
#define ina199Sensor1 0  //adc0
#define ina199Sensor2 1  //adc1
#define ldrSensor 2 //adc2

//define ina199 config
#define ina199Gain 50
#define ina199ShuntResistor 0.05

//define ldr config
#define voltDividerR1 9858

//define sensor interval timer
uint64_t prevSensorTime = 0;
const uint16_t sensorInterval = 1000;

float getIna199Current(uint8_t adcChannel) {
	int adcValue = analogRead(ads1115Base + adcChannel);
	float adcVolt = 3.3*(adcValue*1.00/(maxAdcValue-minAdcValue));
	
	return (adcVolt/ina199Gain/ina199ShuntResistor);
}

uint32_t getLdrResistance(uint8_t adcChannel) {
	int adcValue = analogRead(ads1115Base + adcChannel);
	float adcVolt = 3.3*(adcValue*1.00/(maxAdcValue-minAdcValue));
	
	return (uint32_t) (adcVolt * voltDividerR1)/(3.3 - adcVolt);
}

int main(void) {
	//initalize the gpio and adc
	ads1115Setup(ads1115Base, 0x48);
	
	//measure sensors and do light control logic
	while (1) {
		uint64_t sensorTimeNow = millis();
		if (sensorTimeNow - prevSensorTime >= sensorInterval) {
			float light1_dcCurrent = getIna199Current(ina199Sensor1);
			float light2_dcCurrent = getIna199Current(ina199Sensor2);
			uint32_t ldrResistance = getLdrResistance(ldrSensor);
			
			//print monitoring text
			system("clear");
			printf("Light 1 DC current: %.3f A; Light 2 DC current: %.3f A; LDR resistance: %lu \n", light1_dcCurrent, light2_dcCurrent, (unsigned long)ldrResistance);
			fflush(stdout);
			
			prevSensorTime = sensorTimeNow;
		}
	}
	
	return 0;
}

#!/usr/bin/python3
# -*- coding: UTF-8 -*-

# inspired by https://gist.github.com/netmaniac/a6414149a5a09ba1ebf702ff8d5056c5

import serial, time, struct, array
from datetime import datetime

ser = serial.Serial()
ser.port = "COM5" # Set this to your serial port
ser.baudrate = 9600

ser.open()
ser.flushInput()

def readByteAsText(byte):
    text = "%x"%ord(byte)
    return text

byte, lastbyte = "\x00", "\x00"
while True:
    lastbyte = byte
    byte = ser.read(size=1)
    if readByteAsText(lastbyte) == "a5" and readByteAsText(byte) == "3":
        sentence = ser.read(size=10)
        readings = struct.unpack('<hhhxxh',sentence)

        pm_25 = readings[2]/10.0
        pm_10 = readings[3]/10.0

        moment = datetime.now().strftime("%d %b %Y %H:%M:%S.%f: ")
        measurments = "PM2.5 %s mcg/m3, PM10: %s mcg/m3"%(pm_25, pm_10)
		
        print(moment + measurments)
        date = datetime.now().strftime("%Y-%m-%d")
        with open('smog_'+date+'.txt', 'a') as file:
            file.write(moment + measurments + "\n")

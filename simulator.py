import paho.mqtt.client as mqtt
import json, time, random

client = mqtt.Client()
client.connect("broker.hivemq.com", 1883)

while True:
    client.publish("smartdrip/berat", json.dumps({
        "device_id": "AA:BB:CC:DD:EE:FF",
        "berat": random.randint(80, 500),
        "persen": random.randint(10, 90),
        "estimasi_menit": random.randint(30, 180)
    }))
    time.sleep(3)
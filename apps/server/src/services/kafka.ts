import { Kafka, Partitioners, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import exp from "constants";
import prismaClient from "./prisma";
config();

//kafka broker
const caPem = process.env.CA_PEM_BASE64
  ? Buffer.from(process.env.CA_PEM_BASE64, "base64").toString("utf-8")
  : null;

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER_URL || ""],
  ssl: {
    ca: caPem ? [caPem] : undefined,
  },
  sasl: {
    username: process.env.KAFKA_USERNAME || "",
    password: process.env.KAFKA_PWD || "",
    mechanism: "plain",
  },
});

//creating a single producer
let producer: null | Producer = null;
export async function createProducer() {
  if (producer) return producer;

  try {
    const _producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
    await _producer.connect();
    producer = _producer;
    return producer;
  } catch (error) {
    console.error("Error creating kakfa producer: ", error);
    throw Error;
  }
}

//send to producer
export async function produceMessage(message: string) {
  const producer = await createProducer();
  await producer.send({
    messages: [{ key: `message-${Date.now()}`, value: message }],
    topic: "MESSAGES",
  });
  return true;
}

//consume and save to the database
export async function startMessageConsumer() {
  console.log("Consumer is Running!");
  const consumer = kafka.consumer({ groupId: "default" });
  await consumer.connect();
  await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });

  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ message, pause }) => {
      if (!message.value) return;
      console.log("New Message received");
      try {
        await prismaClient.message.create({
          data: {
            text: message.value.toString(),
          },
        });
      } catch (error) {
        console.error("Error Encountered on consuming", error);
        pause();
        //resume consumer after 1 minute
        setTimeout(() => {
          consumer.resume([{ topic: "MESSAGES" }]);
        }, 60 * 1000);
      }
    },
  });
}

export default kafka;

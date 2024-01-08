const {setGlobalOptions} = require("firebase-functions/v2");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors({origin: true}));

setGlobalOptions({maxInstances: 10});
// check station exist
const isStationExist = async (stationID) => {
  const station = await db.collection("stations").doc(stationID).get();
  return station.exists;
};
// check node exist
const isNodeExist = async (stationID, nodeID) => {
  const node = await db.collection("stations").doc(stationID)
      .collection("nodes").doc(nodeID).get();
  return node.exists;
};
// insert data into the database
app.get("/update", async (req, res) => {
  try {
    const stationID = req.query.stationID;
    const nodeID = req.query.nodeID;
    let exist = false;
    exist = await isStationExist(stationID);
    if (!exist) {
      return res.status(200).send("Station's ID does not exist!");
    }
    exist = await isNodeExist(stationID, nodeID);
    if (!exist) {
      return res.status(200).send("Node's ID does not exist!");
    }
    const node = {
      date: (new Date()).toUTCString(),
      temperature: parseFloat(req.query.temperature),
      humidity: parseFloat(req.query.humidity),
      co: parseFloat(req.query.co),
      soil_moisture: parseFloat(req.query.soil_moisture),
      dust: parseFloat(req.query.dust),
      rain: parseFloat(req.query.rain),
    };
    const nodeRef = db.collection("stations").doc(stationID)
        .collection("nodes").doc(nodeID);
    const dataRef = nodeRef.collection("data").doc();
    await nodeRef.update(node);
    await dataRef.set(node);
    res.status(200).send("Success");
  } catch (error) {
    res.status(200).send("Fail");
  }
});
// create a station in the database
app.get("/createStation", async (req, res) => {
  try {
    const stationID = req.query.stationID;
    let exist = false;
    exist = await isStationExist(stationID);
    if (exist) {
      return res.status(200).send("Station's ID already exists!");
    }
    const stationData = {
      name: req.query.name,
      location: req.query.location,
      dateCreate: (new Date()).toUTCString(),
    };
    await db.collection("stations").doc(stationID).set(stationData);
    return res.status(200).send("Success");
  } catch (error) {
    res.status(200).send(error);
  }
});

// create a node in the database
app.get("/createNode", async (req, res) => {
  try {
    const stationID = req.query.stationID;
    const nodeID = req.query.nodeID;
    let exist = false;
    exist = await isStationExist(req.query.stationID);
    if (!exist) {
      res.status(200).send("Station's ID does not exist!");
    }
    exist = await isNodeExist(stationID, nodeID);
    if (exist) {
      res.status(200).send("Node's ID already exists!");
    }
    const nodeData = {
      name: req.query.name,
      distance: req.query.distance,
      device_status: req.query.device_status,
    };
    await db.collection("stations").doc(stationID).collection("nodes")
        .doc(nodeID).set(nodeData);
    res.status(200).send("Success");
  } catch (error) {
    res.status(200).send("Fail");
  }
});
// Export the api to Firebase Cloud Functions
exports.app = functions.https.onRequest(app);

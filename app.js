const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT
      *
    FROM
      state;
   `;
  const statesArray = await db.all(getStateQuery);
  response.send(statesArray);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
     SELECT
      *
    FROM
      state
    WHERE 
      state_id = ${stateId};
    `;
  const state = await db.get(getStateQuery);
  response.send(state);
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictDetails = `
    INSERT INTO
       district(district_name,state_id,cases,cured,active,deaths)
    VALUES
    (
      '${districtName}',
      '${stateId}',
      '${cases}',
      '${cured}',
      '${active}',
      '${deaths}'
    );
 `;
  const district = await db.run(addDistrictDetails);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
      SELECT
       *
     FROM
      district
     WHERE
     district_id = ${districtId}; 
    `;
  const district = await db.get(getDistrict);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
       DELETE FROM
         district
       WHERE
         district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE
          district
        SET
          district_name = '${districtName}',
         state_id = '${stateId}',
          cases = '${cases}',
          cured = '${cured}',
          active = '${active}',
          deaths = '${deaths}'
        WHERE
          district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
       SUM(cases),
       SUM(cured),
       SUM(active),
       SUM(deaths)
    FROM
       district
    WHERE 
       state_id = ${stateId};
    `;
  const statistics = await db.get(getStateStatsQuery);
  console.log(statistics);
  response.send({
    totalCases: statistics["SUM(cases)"],
    totalCured: statistics["SUM(cured)"],
    totalActive: statistics["SUM(active)"],
    totalDeaths: statistics["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
}); //sending the required response

module.exports = app;

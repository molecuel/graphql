"use strict";
process.env.configpath = "./test/config/";
import { graphiqlExpress, graphqlExpress } from "apollo-server-express";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as graphqlHTTP from "express-graphql";
import * as fs from "fs";
import "reflect-metadata";
import * as supertest from "supertest";

import * as chai from "chai";
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

import { MlclConfig, MlclCore } from "@molecuel/core";
import { di, injectable } from "@molecuel/di";
import { MlclMongoDb } from "@molecuel/mongodb";
import { MlclGraphQL } from "../lib";

// import * as casual from "casual";
import { Alloy, Robot } from "./data";

// tslint:disable:no-console
describe("graphql", () => {
  let coreInitSuccess: boolean = false;
  describe("schemas", () => {
    const mlclGql: MlclGraphQL = di.getInstance("MlclGraphQL");
    const elems = di.getInstance("MlclElements");
    it("should init core", async () => {
      di.bootstrap(
        Alloy,
        MlclConfig,
        MlclCore,
        MlclGraphQL,
        MlclMongoDb,
        Robot,
      );
      const core: MlclCore = di.getInstance("MlclCore");
      await core.init();
      should.exist(core);
      core.should.be.instanceOf(MlclCore);
      coreInitSuccess = true;
    });
    it("should get the type definition for all registered elements", () => {
      const typedefs = mlclGql.renderGraphQL();
      // console.log(typedefs);
      expect(typedefs).to.be.a("string");
    });
    it("should generate generic resolvers", () => {
      const resolvers = mlclGql.renderGenericResolvers();
      should.exist(resolvers);
    });
    it("should have the schema stored", () => {
      const schema = mlclGql.schema;
      should.exist(schema);
    });
    it("should save some mock data to the database(s)", async () => {
      const testAlloy = elems.getInstance("Alloy");
      testAlloy.id = testAlloy.name = "Steel";
      testAlloy.mixture = ["Iron", "Carbon"];
      const betaBot = elems.getInstance("Robot");
      betaBot.id = betaBot.model = "BETA";
      betaBot.arms = 1;
      betaBot.legs = 3;
      betaBot.material = testAlloy;
      const testBot = elems.getInstance("Robot");
      testBot.id = testBot.model = "pr0707yp3";
      testBot.arms = testBot.legs = 2;
      testBot.material = testAlloy;
      try {
        const success = await elems.init();
        expect(success).to.equal(true);
        await testAlloy.save();
        await betaBot.save();
        await testBot.save();
      } catch (error) {
        console.log(error);
        should.not.exist(error);
      }
    });
    it("should retrieve data", (done) => {
      const app = express();
      app.use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }))
        .use("/graphql", graphqlHTTP((req) => ({
          graphiql: false,
          pretty: true,
          schema: mlclGql.schema,
        })));
      supertest(app.listen())
        // .post("/graphql")
        // .send({ query: '{ Robot(id: "pr0707yp3"){ model, arms, legs, material { name, mixture } } }' })
        .get("/graphql"
          + '?query={Robot(id: "pr0707yp3"){id,model,arms,legs,material{id,name,mixture}}}',
      )
        .set("Accept", "application/json")
        .end((err: any, res: supertest.Response) => {
          // console.log({ err: err || res.body.errors, body: res.body, text: res.text });
          const errors = err || res.body.errors;
          should.not.exist(errors);
          should.exist(res);
          should.exist(res.body);
          should.exist(res.body.data);
          expect(res.body.data).to.be.an("object");
          expect(res.body.data.Robot).to.be.an("object");
          expect(res.body.data.Robot.id).to.equal("pr0707yp3");
          expect(res.body.data.Robot.model).to.equal("pr0707yp3");
          expect(res.body.data.Robot.arms).to.equal(2);
          expect(res.body.data.Robot.legs).to.equal(2);
          expect(res.body.data.Robot.material).to.be.an("object");
          expect(res.body.data.Robot.material.id).to.equal("Steel");
          expect(res.body.data.Robot.material.name).to.equal("Steel");
          expect(res.body.data.Robot.material.mixture).to.be.instanceOf(Array);
          expect(res.body.data.Robot.material.mixture).to.have.lengthOf(2);
          expect(res.body.data.Robot.material.mixture).to.include("Iron");
          expect(res.body.data.Robot.material.mixture).to.include("Carbon");
          done();
        });
    });
    it("should retrieve data", (done) => {
      const app = express();
      app.use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }))
        .use("/graphql", graphqlHTTP((req) => ({
          graphiql: false,
          pretty: true,
          schema: mlclGql.schema,
        })));
      supertest(app.listen())
        // .post("/graphql")
        // .send({ query: "{ everyRobot { model, arms, legs, material { name, mixture } } }" })
        .get("/graphql"
          + "?query={everyRobot{id,model,arms,legs,material{id,name,mixture}}}",
      )
        .set("Accept", "application/json")
        .end((err: any, res: supertest.Response) => {
          const errors = err || res.body.errors;
          should.not.exist(errors);
          should.exist(res);
          should.exist(res.body);
          should.exist(res.body.data);
          expect(res.body.data).to.be.an("object");
          expect(res.body.data.everyRobot).to.be.instanceOf(Array);
          expect(res.body.data.everyRobot[0].id).to.equal("BETA");
          expect(res.body.data.everyRobot[0].id).to.equal("BETA");
          expect(res.body.data.everyRobot[0].arms).to.equal(1);
          expect(res.body.data.everyRobot[0].legs).to.equal(3);
          expect(res.body.data.everyRobot[1].id).to.equal("pr0707yp3");
          expect(res.body.data.everyRobot[1].id).to.equal("pr0707yp3");
          expect(res.body.data.everyRobot[1].arms).to.equal(2);
          expect(res.body.data.everyRobot[1].legs).to.equal(2);
          for (const robot of res.body.data.everyRobot) {
            expect(robot.material).to.be.an("object");
            expect(robot.material.id).to.equal("Steel");
            expect(robot.material.name).to.equal("Steel");
            expect(robot.material.mixture).to.be.instanceOf(Array);
            expect(robot.material.mixture).to.have.lengthOf(2);
            expect(robot.material.mixture).to.include("Iron");
            expect(robot.material.mixture).to.include("Carbon");
          }
          done();
        });
    });
    it("should add additional resolvers", () => {
      try {
        mlclGql.addResolver(
          "allAlloys",
          [Alloy],
          new Map<string, any>([["length", Number]]),
          async (length: number) => {
            const ctxElements = di.getInstance("MlclElements");
            let hits: any[] = await ctxElements.find({}, ctxElements.getInstance("Alloy").collection);
            hits = length ? hits.slice(0, length) : hits;
            const result = hits.map(async (hit: object) => {
              const instance = ctxElements.toInstance("Alloy", hit);
              await instance.populate();
              return instance;
            });
            return result;
          },
        );
        should.exist(mlclGql.resolvers);
        should.exist(mlclGql.resolvers.Query);
        should.exist(mlclGql.resolvers.Query.allAlloys);
      } catch (error) {
        console.log(error);
        should.not.exist(error);
      }
    });
    it("should be able to re-initialize manually", () => {
      try {
        mlclGql.init();
      } catch (error) {
        should.not.exist(error);
      }
    });
    it("should execute the new resolver / query endpoint", (done) => {
      const app = express();
      app.use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }))
        .use("/graphql", graphqlHTTP((req) => ({
          graphiql: false,
          pretty: true,
          schema: mlclGql.schema,
        })));
      supertest(app.listen())
        // .post("/graphql")
        // .send({ query: "{ everyRobot { model, arms, legs, material { name, mixture } } }" })
        .get("/graphql"
          + "?query={allAlloys{id,name,mixture}}",
      )
        .set("Accept", "application/json")
        .end((err: any, res: supertest.Response) => {
          const errors = err || res.body.errors;
          if (errors) {
            console.log(errors);
          }
          should.not.exist(errors);
          should.exist(res);
          should.exist(res.body);
          should.exist(res.body.data);
          expect(res.body.data).to.be.an("object");
          expect(res.body.data.allAlloys).to.be.instanceOf(Array);
          expect(res.body.data.allAlloys).to.have.lengthOf(1);
          for (const alloy of res.body.data.allAlloys) {
            expect(alloy).to.be.an("object");
            expect(alloy.id).to.equal("Steel");
            expect(alloy.name).to.equal("Steel");
            expect(alloy.mixture).to.be.instanceOf(Array);
            expect(alloy.mixture).to.have.lengthOf(2);
            expect(alloy.mixture).to.include("Iron");
            expect(alloy.mixture).to.include("Carbon");
          }
          done();
        });
    });
    after(async () => {
      const dbHandler = elems.dbHandler;
      if (dbHandler && dbHandler.connections) {
        for (const con of dbHandler.connections) {
          try {
            await con.database.dropDatabase();
          } catch (error) {
            should.not.exist(error);
          }
        }
      }
    });
  }); // category end
}); // test end

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
    // const mockResolvers = {
    //   Query: () => ({
    //     Alloy: () => ({
    //       mixture: () => {
    //         const entryCount = Math.ceil(Math.random() * Math.pow(10, Math.random() * 3));
    //         const mix = [];
    //         for (let i = 0; i <= entryCount; i++) {
    //           const state = casual.state;
    //           mix.push(state);
    //         }
    //         return mix;
    //       },
    //       name: () => casual.last_name,
    //     }),
    //     Robot: (root, args) => {
    //       return { model: args.model };
    //     },
    //   }),
    //   Robot: () => ({
    //     arms: () => Math.ceil(Math.random() * 10),
    //     legs: () => Math.ceil(Math.random() * 10),
    //     model: () => casual.state_abbr + casual.longitude + casual.country_code + casual.latitude,
    //   }),
    // };
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
      const testBot = elems.getInstance("Robot");
      testBot.id = testBot.model = "pr0707typ3";
      testBot.arms = testBot.legs = 2;
      testBot.material = testAlloy;
      try {
        const success = await elems.init();
        expect(success).to.equal(true);
        await testAlloy.save();
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
      supertest(app.listen(/*3000, (err) => {
        if (err) { return err; }
      }*/))
        .post("/graphql")
        // .get("/graphql"
        //   + "query: { Robot(id: pr0707yp3){ model, arms, legs, material } }",
        // )
        .send({ query: '{ Robot(id: "pr0707typ3"){ model, arms, legs, material { name, mixture } } }' })
        .set("Accept", "application/json")
        .end((err: any, res: supertest.Response) => {
          console.log({ err: err || res.body.errors, body: res.body, text: res.text });
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
      supertest(app.listen(/*3000, (err) => {
        if (err) { return err; }
      }*/))
        .post("/graphql")
        // .get("/graphql"
        //   + "query: { Robot { model, arms, legs, material } }",
        // )
        .send({ query: "{ everyRobot { model, arms, legs, material { name, mixture } } }" })
        .set("Accept", "application/json")
        .end((err: any, res: supertest.Response) => {
          console.log(err || res.body.errors ? err || res.body.errors : res.body.data);
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

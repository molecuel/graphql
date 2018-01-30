"use strict";
process.env.configpath = "./test/config/";
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
      // const config = di.getInstance("MlclConfig").getConfig();
      coreInitSuccess = true;
    });
    it("should get the type definition for all registered elements", () => {
      const typedefs = mlclGql.renderGraphQL();
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
    it("should retrieve data", async () => {
      // save test data
      const testAlloy = elems.getInstance("Alloy");
      testAlloy.id = testAlloy.name = "Steel";
      testAlloy.mixture = ["Iron", "Carbon"];
      const testBot = elems.getInstance("Robot");
      testBot.id = testBot.model = "pr070typ3";
      testBot.arms = testBot.legs = 2;
      testBot.material = testAlloy;
      try {
        const success = await elems.init();
        await testAlloy.save();
        await testBot.save();
      } catch (error) {
        console.log(error);
      }
      // retrieve testdata
      // todo
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

"use strict";
import * as fs from "fs";
import "reflect-metadata";
import * as supertest from "supertest";

import * as chai from "chai";
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

import { MlclCore } from "@molecuel/core";
import { di, injectable } from "@molecuel/di";
import { MlclGraphQL } from "../lib";

import * as casual from "casual";
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
    it("should init core", async () => {
      di.bootstrap(
        Alloy,
        MlclGraphQL,
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
      // todo
      // retrieve testdata
      // todo
    });
  }); // category end
}); // test end

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

import { Robot } from "./data";

// tslint:disable:no-console
describe("graphql", () => {
  let coreInitSuccess: boolean = false;
  describe("schemas", () => {
    const mlclGql: MlclGraphQL = di.getInstance("MlclGraphQL");
    it("init core", async () => {
      di.bootstrap(
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
  }); // category end
}); // test end

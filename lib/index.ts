"use strict";
import "reflect-metadata";

import {MlclCore} from "@molecuel/core";
import {di, injectable, singleton} from "@molecuel/di";
import { MlclElements } from "@molecuel/elements";
import {Observable, Subject} from "@reactivex/rxjs";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  printSchema,
} from "graphql";

@injectable
export class MlclGraphQL {
  private elems: MlclElements = di.getInstance("MlclElements");
  private gqlStore: any = new Map();

  constructor() {
    di.bootstrap(MlclCore, MlclElements);
  }

  /**
   * Returns a graphql schema for all registered Elements
   *
   * @memberOf MlclGraphQL
   */
  public renderGraphQL() {
    const elemProperties = this.elems.getMetadataTypesForElements();
    const keys = Object.keys(elemProperties);
    for (const key of keys) {
      const item = this.renderGqlItem(key, elemProperties);
      this.gqlStore.set(key, item);
    }
    const queryType = {
      description: "The root query type.",
      fields: {},
      name: "Query",
    };

    for (const [key, gqlElement] of this.gqlStore) {
      queryType.fields[key] = {
        type: gqlElement,
      };
    }

    const queryGqlType = new GraphQLObjectType(queryType);

    const schema = new GraphQLSchema({
      query: queryGqlType,
    });

    return printSchema(schema);
  }

  /**
   * Renders a Object type as graphql object type
   *
   * @param  {string} name              [The item name]
   * @param {object} definitions        [The property definitions of the elements]
   *
   * @memberOf MlclGraphQL
   */
  public renderGqlItem(name: string, definitions: any) {
    const gqlObjDef = {
      fields: {},
      name,
    };
    for ( const prop of definitions[name]) {
      let gqlType;
      if (prop.type === "Number") {
        gqlObjDef.fields[prop.property] = {};
        gqlType = GraphQLFloat;
      } else if (prop.type === "String") {
        gqlObjDef.fields[prop.property] = {};
        gqlType = GraphQLString;
      } else if (prop.type === "Boolean") {
        gqlObjDef.fields[prop.property] = {};
        gqlType = GraphQLBoolean;
      } else {
        gqlObjDef.fields[prop.property] = {};
        if (this.gqlStore.get(prop.type)) {
          gqlType = this.gqlStore.get(prop.type);
        } else {
          gqlType = this.renderGqlItem(prop.type, definitions);
        }
      }
      if (prop.nested) {
        gqlType = new GraphQLList(gqlType);
      }
      gqlObjDef.fields[prop.property].type = gqlType;
    }
    return new GraphQLObjectType(gqlObjDef);
  }
}

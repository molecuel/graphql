"use strict";
import "reflect-metadata";

import { init, MlclCore } from "@molecuel/core";
import { di, injectable, singleton } from "@molecuel/di";
import { MlclElements } from "@molecuel/elements";
import { Observable, Subject } from "@reactivex/rxjs";
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
import { makeExecutableSchema } from "graphql-tools";

@singleton
export class MlclGraphQL {
  protected elems: MlclElements = di.getInstance("MlclElements");
  protected gqlStore: Map<string, any> = new Map();
  private ownSchema: any = undefined;
  private ownTypeDef: string = undefined;
  private ownResolvers: any = undefined;
  public get schema(): any { return this.ownSchema; }
  public set schema(newSchema: any) { if (!this.ownSchema) { this.ownSchema = newSchema; } }
  public get typedefs(): any { return this.ownTypeDef; }
  public set typedefs(newTypeDef: any) { this.ownTypeDef = newTypeDef; }
  public get resolvers(): any { return this.ownTypeDef; }
  public set resolvers(newResolvers: any) { this.ownResolvers = newResolvers; }

  constructor() {
    di.bootstrap(MlclCore, MlclElements);
  }

  /**
   * Returns a graphql schema for all registered Elements
   *
   * @memberOf MlclGraphQL
   */
  public renderGraphQL(): string {
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
        args: {
          id: {
            type: GraphQLID,
          },
        },
        type: gqlElement,
      };
      queryType.fields["every" + key] = {
        type: new GraphQLList(gqlElement),
      };
    }
    // console.log(queryType);
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
    // try {
    for (const prop of definitions[name]) {
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
      } else if (prop.type === "ID") {
        gqlObjDef.fields[prop.property] = {};
        gqlType = GraphQLID;
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
    // } catch (error) {
    //   console.log({error, definitions, name});
    // }
    // for (const prop in gqlObjDef) {
    //   if (gqlObjDef[prop]) {
    //     console.log(prop, gqlObjDef[prop]);
    //   }
    // }
    return new GraphQLObjectType(gqlObjDef);
  }

  /**
   * Returns generic resolvers for all registered Elements
   *
   * @memberOf MlclGraphQL
   */
  public renderGenericResolvers(): any {
    const res: any = {
      Query: {},
    };
    for (const className of this.elems.getClasses()) {
      res.Query[className] = async (root, {id}) => {
        const hit = await this.elems.findById(id, this.elems.getInstance(className).collection);
        const result = this.elems.toInstance(className, hit);
        // await hit.populate();
        // console.log({hit, className, result, id});
        return result;
      };
      res.Query["every" + className] = async () => {
        const hits = await this.elems.find({}, this.elems.getInstance(className).collection);
        return hits;
      };
    }
    return res;
  }

  public addResolver(name: string, resolverFunction: (...args: any[]) => any) {
    if (this.resolvers && this.resolvers.Query) {
      this.resolvers.Query[name] = resolverFunction;
    }
  }

  public setResolvers(resolvers: any) {
    if (this.resolvers && this.resolvers.Query) {
      this.resolvers.Query = resolvers;
    }
  }

  public init(): any {
    const schema = makeExecutableSchema({ typeDefs: this.ownTypeDef, resolvers: this.ownResolvers });
    this.ownSchema = schema;
    return schema;
  }

  @init(55)
  protected autoInit() {
    return Observable.create((o) => {
      const self = di.getInstance("MlclGraphQL");
      const types: string = self.renderGraphQL();
      const resolvers: any = self.renderGenericResolvers();
      try {
        self.typedefs = types;
        self.resolvers = resolvers;
        const schema = makeExecutableSchema({ typeDefs: types, resolvers });
        self.schema = schema;
      } catch (error) {
        // todo: react to error
      }
      o.next(o);
      o.complete();
    });
  }
}

"use strict";
import "reflect-metadata";

import { init, MlclCore } from "@molecuel/core";
import { di, injectable, singleton } from "@molecuel/di";
import { MlclElements } from "@molecuel/elements";
import { Observable, Subject } from "@reactivex/rxjs";
import {
  buildSchema,
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
  public get typeDefs(): any { return this.ownTypeDef; }
  public set typeDefs(newTypeDef: any) { this.ownTypeDef = newTypeDef; }
  public get resolvers(): any { return this.ownResolvers; }
  public set resolvers(newResolvers: any) { this.ownResolvers = newResolvers; }

  constructor() {
    di.bootstrap(MlclCore, MlclElements);
  }

  /**
   * Returns a graphql schema for all registered Elements
   *
   * @memberOf MlclGraphQL
   */
  public renderGraphQL(rootQuery?: object): string {
    const queryGqlType = new GraphQLObjectType(rootQuery || this.renderRootQuery());

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
      gqlObjDef.fields[prop.property] = {};
      gqlObjDef.fields[prop.property].type = this.getGqlType(prop, definitions);
    }
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
      res.Query[className] = async (root, { id }) => {
        const hit = await this.elems.findById(id, this.elems.getInstance(className).collection);
        const result = this.elems.toInstance(className, hit);
        await result.populate();
        return result;
      };
      res.Query["every" + className] = async () => {
        const hits = await this.elems.find({}, this.elems.getInstance(className).collection);
        const result = hits.map(async (hit: object) => {
          const instance = this.elems.toInstance(className, hit);
          await instance.populate();
          return instance;
        });
        return result;
      };
    }
    return res;
  }

  /**
   * Adds a given resolver to the current ones
   *
   * @param name The name of the resolver endpoint
   * @param returnType The expected type of the response
   * @param resolverFunction The resolver itself
   */
  public addResolver(
    name: string,
    returnType: any,
    functionParameters: Map<string, any>,
    resolverFunction: (...args: any[]) => any,
  ) {

    if (this.resolvers && this.resolvers.Query) {
      this.resolvers.Query[name] = resolverFunction;
    }
    const typeName = Array.isArray(returnType)
      ? returnType[0].name || returnType[0].constructor.name
      : returnType.name || returnType.constructor.name;
    const rootQuery: any = this.renderRootQuery();
    rootQuery.fields[name] = {
      type: this.getGqlType({
        nested: Array.isArray(returnType),
        type: typeName,
      }, this.elems.getMetadataTypesForElements()),
    };
    if (functionParameters && functionParameters.size) {
      const args = {};
      for (const [key, value] of functionParameters) {
        const argTypeName = Array.isArray(value)
        ? value[0].name || value[0].constructor.name
        : value.name || value.constructor.name;
        args[key] = {
          type: this.getGqlType({
            nested: Array.isArray(value),
            type: argTypeName,
          }, this.elems.getMetadataTypesForElements()),
        };
      }
      rootQuery.fields[name].args = args;
    }
    const newTypeDefs = this.renderGraphQL(rootQuery);
    this.ownTypeDef = newTypeDefs;
  }

  // public setResolvers(resolvers: any) {
  //   if (this.resolvers && this.resolvers.Query) {
  //     this.resolvers.Query = resolvers;
  //   }
  // }

  public init(): any {
    const schema = makeExecutableSchema({ typeDefs: this.ownTypeDef, resolvers: this.ownResolvers });
    this.ownSchema = schema;
    return schema;
  }

  protected renderRootQuery(): object {
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
    return queryType;
  }

  protected getGqlType(prop: { type: string, nested: boolean }, definitions: any) {
    let gqlType;
    if (prop.type === "Number") {
      gqlType = GraphQLFloat;
    } else if (prop.type === "String") {
      gqlType = GraphQLString;
    } else if (prop.type === "Boolean") {
      gqlType = GraphQLBoolean;
    } else if (prop.type === "ID") {
      gqlType = GraphQLID;
    } else {
      if (this.gqlStore.get(prop.type)) {
        gqlType = this.gqlStore.get(prop.type);
      } else {
        gqlType = this.renderGqlItem(prop.type, definitions);
      }
    }
    if (prop.nested) {
      gqlType = new GraphQLList(gqlType);
    }
    return gqlType;
  }

  @init(55)
  protected autoInit() {
    return Observable.create((o) => {
      const self = di.getInstance("MlclGraphQL");
      const types: string = self.renderGraphQL();
      const resolvers: any = self.renderGenericResolvers();
      try {
        self.typeDefs = types;
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

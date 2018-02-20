"use strict"
import { injectable } from "@molecuel/di";
import { MlclElements } from "@molecuel/elements";

@injectable
export class Vertex {
  constructor(private elements: MlclElements) {}

  /**
   * Applies specified decorator functions to given property of this instance or to this instance itself
   *
   * @param {string} [propertyName]
   * @param {...Array<(...args: any[]) => any>} decorators
   *
   * @memberOf Vertex
   */
  public applyDecorators(propertyName?: string, ...decorators: Array<(...args: any[]) => any>) {
    return this.elements.applyDecorators(this, propertyName, ...decorators);
  }
  /**
   * Return an object that satisfies JSON-like structure to be used in database interactions
   *
   * @param {boolean} [forPopulationLayer=false]
   * @returns {*}
   *
   * @memberOf Vertex
   */
  public toDbObject(forPopulationLayer: boolean = false): any {
    return this.elements.toDbObject(this, forPopulationLayer);
  }
  /**
   * Transforms the calling instance according to the population request
   *
   * @param {string} [properties]
   *
   * @memberOf Vertex
   */
  public async populate(properties?: string) {
    const population = await this.elements.populate(this, properties);
    if (population) {
      for (const prop in population) {
        if (population[prop]) {
          this[prop] = population[prop];
        }
      }
    }
  }
}
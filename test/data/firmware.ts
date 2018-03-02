"use strict";
import { injectable } from "@molecuel/di";
import { Collection, Element, ValidateType } from "@molecuel/elements";
import { Vertex } from '../../lib/index';

@injectable
export class Firmware extends Vertex {
  @ValidateType()
  public name: string;
  @ValidateType()
  public version: string;
}

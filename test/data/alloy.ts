"use strict";
import { injectable } from "@molecuel/di";
import { Collection, Element, ValidateType } from "@molecuel/elements";

@injectable
@Collection("alloys")
export class Alloy extends Element {
  @ValidateType()
  public name: string;
  @ValidateType([String])
  public mixture: string[];
}

"use strict";
import { injectable } from "@molecuel/di";
import { Collection, Element, ValidateType } from "@molecuel/elements";
import { Alloy } from ".";

@injectable
@Collection("robots")
export class Robot extends Element {
  @ValidateType()
  public model: string;
  @ValidateType()
  public arms: number;
  @ValidateType()
  public legs: number;
  @ValidateType(Alloy)
  public material: Alloy;
}

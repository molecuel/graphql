"use strict";
import { injectable } from "@molecuel/di";
import { Collection, Element, HexColor, InArray, IsNotEmpty, NotForPopulation, ValidateType } from "@molecuel/elements";

@injectable
@Collection("robots")
export class Robot extends Element {
  @ValidateType()
  public model: string;
  @ValidateType()
  public arms: number;
  @ValidateType()
  public legs: number;
}

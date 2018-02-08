"use strict";
import { di, injectable } from "@molecuel/di";
import { Collection, Element, IsReferenceTo, ValidateType } from "@molecuel/elements";
import { Alloy } from "./alloy";

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
  @IsReferenceTo(Alloy)
  public material: Alloy;
}

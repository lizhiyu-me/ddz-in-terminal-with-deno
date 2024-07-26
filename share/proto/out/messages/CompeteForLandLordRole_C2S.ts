// @ts-nocheck
import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../runtime/json/scalar.ts";
import {
  WireMessage,
} from "../runtime/wire/index.ts";
import {
  default as serialize,
} from "../runtime/wire/serialize.ts";
import {
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../runtime/wire/deserialize.ts";

export declare namespace $ {
  export type CompeteForLandLordRole_C2S = {
    score: number;
    seatNumber: number;
  }
}

export type Type = $.CompeteForLandLordRole_C2S;

export function getDefaultValue(): $.CompeteForLandLordRole_C2S {
  return {
    score: 0,
    seatNumber: 0,
  };
}

export function createValue(partialValue: Partial<$.CompeteForLandLordRole_C2S>): $.CompeteForLandLordRole_C2S {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.CompeteForLandLordRole_C2S): unknown {
  const result: any = {};
  if (value.score !== undefined) result.score = tsValueToJsonValueFns.uint32(value.score);
  if (value.seatNumber !== undefined) result.seatNumber = tsValueToJsonValueFns.uint32(value.seatNumber);
  return result;
}

export function decodeJson(value: any): $.CompeteForLandLordRole_C2S {
  const result = getDefaultValue();
  if (value.score !== undefined) result.score = jsonValueToTsValueFns.uint32(value.score);
  if (value.seatNumber !== undefined) result.seatNumber = jsonValueToTsValueFns.uint32(value.seatNumber);
  return result;
}

export function encodeBinary(value: $.CompeteForLandLordRole_C2S): Uint8Array {
  const result: WireMessage = [];
  if (value.score !== undefined) {
    const tsValue = value.score;
    result.push(
      [1, tsValueToWireValueFns.uint32(tsValue)],
    );
  }
  if (value.seatNumber !== undefined) {
    const tsValue = value.seatNumber;
    result.push(
      [2, tsValueToWireValueFns.uint32(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.CompeteForLandLordRole_C2S {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.uint32(wireValue);
    if (value === undefined) break field;
    result.score = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.uint32(wireValue);
    if (value === undefined) break field;
    result.seatNumber = value;
  }
  return result;
}

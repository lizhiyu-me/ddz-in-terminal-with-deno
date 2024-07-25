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
  export type CompeteForLandLordRole_S2C = {
    curMaxScore: number;
  }
}

export type Type = $.CompeteForLandLordRole_S2C;

export function getDefaultValue(): $.CompeteForLandLordRole_S2C {
  return {
    curMaxScore: 0,
  };
}

export function createValue(partialValue: Partial<$.CompeteForLandLordRole_S2C>): $.CompeteForLandLordRole_S2C {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.CompeteForLandLordRole_S2C): unknown {
  const result: any = {};
  if (value.curMaxScore !== undefined) result.curMaxScore = tsValueToJsonValueFns.uint32(value.curMaxScore);
  return result;
}

export function decodeJson(value: any): $.CompeteForLandLordRole_S2C {
  const result = getDefaultValue();
  if (value.curMaxScore !== undefined) result.curMaxScore = jsonValueToTsValueFns.uint32(value.curMaxScore);
  return result;
}

export function encodeBinary(value: $.CompeteForLandLordRole_S2C): Uint8Array {
  const result: WireMessage = [];
  if (value.curMaxScore !== undefined) {
    const tsValue = value.curMaxScore;
    result.push(
      [2, tsValueToWireValueFns.uint32(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.CompeteForLandLordRole_S2C {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.uint32(wireValue);
    if (value === undefined) break field;
    result.curMaxScore = value;
  }
  return result;
}

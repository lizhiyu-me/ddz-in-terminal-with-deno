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
  unpackFns,
} from "../runtime/wire/scalar.ts";
import {
  default as deserialize,
} from "../runtime/wire/deserialize.ts";

export declare namespace $ {
  export type PlayTurn_S2C = {
    seatNumber: number;
    handCards: number[];
  }
}

export type Type = $.PlayTurn_S2C;

export function getDefaultValue(): $.PlayTurn_S2C {
  return {
    seatNumber: 0,
    handCards: [],
  };
}

export function createValue(partialValue: Partial<$.PlayTurn_S2C>): $.PlayTurn_S2C {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.PlayTurn_S2C): unknown {
  const result: any = {};
  if (value.seatNumber !== undefined) result.seatNumber = tsValueToJsonValueFns.uint32(value.seatNumber);
  result.handCards = value.handCards.map(value => tsValueToJsonValueFns.uint32(value));
  return result;
}

export function decodeJson(value: any): $.PlayTurn_S2C {
  const result = getDefaultValue();
  if (value.seatNumber !== undefined) result.seatNumber = jsonValueToTsValueFns.uint32(value.seatNumber);
  result.handCards = value.handCards?.map((value: any) => jsonValueToTsValueFns.uint32(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.PlayTurn_S2C): Uint8Array {
  const result: WireMessage = [];
  if (value.seatNumber !== undefined) {
    const tsValue = value.seatNumber;
    result.push(
      [1, tsValueToWireValueFns.uint32(tsValue)],
    );
  }
  for (const tsValue of value.handCards) {
    result.push(
      [2, tsValueToWireValueFns.uint32(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.PlayTurn_S2C {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.uint32(wireValue);
    if (value === undefined) break field;
    result.seatNumber = value;
  }
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 2).map(([, wireValue]) => wireValue);
    const value = Array.from(unpackFns.uint32(wireValues));
    if (!value.length) break collection;
    result.handCards = value as any;
  }
  return result;
}

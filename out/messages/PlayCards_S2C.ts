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
  export type PlayCards_S2C = {
    cards: number[];
    seatNumber: number;
  }
}

export type Type = $.PlayCards_S2C;

export function getDefaultValue(): $.PlayCards_S2C {
  return {
    cards: [],
    seatNumber: 0,
  };
}

export function createValue(partialValue: Partial<$.PlayCards_S2C>): $.PlayCards_S2C {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.PlayCards_S2C): unknown {
  const result: any = {};
  result.cards = value.cards.map(value => tsValueToJsonValueFns.uint32(value));
  if (value.seatNumber !== undefined) result.seatNumber = tsValueToJsonValueFns.uint32(value.seatNumber);
  return result;
}

export function decodeJson(value: any): $.PlayCards_S2C {
  const result = getDefaultValue();
  result.cards = value.cards?.map((value: any) => jsonValueToTsValueFns.uint32(value)) ?? [];
  if (value.seatNumber !== undefined) result.seatNumber = jsonValueToTsValueFns.uint32(value.seatNumber);
  return result;
}

export function encodeBinary(value: $.PlayCards_S2C): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.cards) {
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

export function decodeBinary(binary: Uint8Array): $.PlayCards_S2C {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = Array.from(unpackFns.uint32(wireValues));
    if (!value.length) break collection;
    result.cards = value as any;
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

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
  export type MainMessage = {
    cmdId: number;
    data: Uint8Array;
  }
}

export type Type = $.MainMessage;

export function getDefaultValue(): $.MainMessage {
  return {
    cmdId: 0,
    data: new Uint8Array(),
  };
}

export function createValue(partialValue: Partial<$.MainMessage>): $.MainMessage {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.MainMessage): unknown {
  const result: any = {};
  if (value.cmdId !== undefined) result.cmdId = tsValueToJsonValueFns.uint32(value.cmdId);
  if (value.data !== undefined) result.data = tsValueToJsonValueFns.bytes(value.data);
  return result;
}

export function decodeJson(value: any): $.MainMessage {
  const result = getDefaultValue();
  if (value.cmdId !== undefined) result.cmdId = jsonValueToTsValueFns.uint32(value.cmdId);
  if (value.data !== undefined) result.data = jsonValueToTsValueFns.bytes(value.data);
  return result;
}

export function encodeBinary(value: $.MainMessage): Uint8Array {
  const result: WireMessage = [];
  if (value.cmdId !== undefined) {
    const tsValue = value.cmdId;
    result.push(
      [1, tsValueToWireValueFns.uint32(tsValue)],
    );
  }
  if (value.data !== undefined) {
    const tsValue = value.data;
    result.push(
      [2, tsValueToWireValueFns.bytes(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.MainMessage {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.uint32(wireValue);
    if (value === undefined) break field;
    result.cmdId = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bytes(wireValue);
    if (value === undefined) break field;
    result.data = value;
  }
  return result;
}

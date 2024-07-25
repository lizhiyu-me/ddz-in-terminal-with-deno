import {createValue,encodeBinary,decodeBinary} from "./out/messages/DealCards_S2C.ts"
import {messages} from "./out/index.ts"
const a: messages.DealCards_S2C = createValue({})
const b = encodeBinary(a)
const c = decodeBinary(b)
console.log(a,b,c)
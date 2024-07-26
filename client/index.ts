import { readline } from "https://deno.land/x/readline_sync@0.0.2/mod.ts";
import { WebSocketClient, StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { convert2ReadableNames, convert2CardNumbers, cardNameNumberDic } from '../share/helper.ts';

import { messages as protobufMsgType } from "../share/proto/out/index.ts";
import { name2num as protoMsgCmd } from "../share/proto/out/messages/Cmd.ts";
import { num2name as protoMsgName } from "../share/proto/out/messages/Cmd.ts";

import * as MainMessage from "../share/proto/out/messages/MainMessage.ts";
import * as DealCards_S2C from "../share/proto/out/messages/DealCards_S2C.ts";
import * as Ready_C2S from "../share/proto/out/messages/Ready_C2S.ts";
import * as CompeteForLandLordRole_C2S from "../share/proto/out/messages/CompeteForLandLordRole_C2S.ts";
import * as CompeteForLandLordRole_S2C from "../share/proto/out/messages/CompeteForLandLordRole_S2C.ts";
import * as PlayCards_C2S from "../share/proto/out/messages/PlayCards_C2S.ts";
import * as PlayCards_S2C from "../share/proto/out/messages/PlayCards_S2C.ts";
import * as IllegalCards_S2C from "../share/proto/out/messages/IllegalCards_S2C.ts";
import * as GameEnd_S2C from "../share/proto/out/messages/GameEnd_S2C.ts";
import * as PlayTurn_S2C from "../share/proto/out/messages/PlayTurn_S2C.ts";
import * as GameStart_S2C from "../share/proto/out/messages/GameStart_S2C.ts";
import * as BroadCastMsg_S2C from "../share/proto/out/messages/BroadCastMsg_S2C.ts";

class GameClient{
    private ip = "127.0.0.1";
    private port = 8080;
    private mSocket: WebSocketClient|null = null;
    private seatNumber: number|null = null;
    private playerID: number|null = null;

    constructor(){
        this.joinServer();
    }

    private joinServer() {
        const _ip_port = "127.0.0.1:8080";
        const _ip_port_reg = /^(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5]):([0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
        if (!_ip_port_reg.test(_ip_port)) {
            console.log("Wrong format, please input again.")
            this.joinServer();
        } else {
            const _splited = _ip_port.split(":");
            this.ip = _splited[0];
            this.port = +_splited[1];
        }
        const endpoint = 'ws://'+this.ip+":"+this.port;
        this.mSocket = new StandardWebSocketClient(endpoint);
        this.mSocket.on("open",()=>{
            this.startGame();
        })

        this.mSocket.on('message', async(buffer) => {
            if (buffer.data instanceof Blob) {
                // const reader = new FileReader();
                // reader.onload = () => {
                //     const arrayBuffer = reader.result as Uint8Array;
                //     this.decodeData(arrayBuffer);
                // };
                // reader.onerror = (err) => {
                    //     console.error("Failed to read blob:", err);
                    // };
                    // reader.readAsArrayBuffer(buffer.data);
                    const arrayBuffer = await buffer.data.arrayBuffer()
                    this.decodeData(new Uint8Array(arrayBuffer));
            } else {
                console.error("Expected Blob, received:", buffer.data);
            }
        })
    }

    private startGame() {
        this.send({ cmd: protoMsgCmd.READY_C2S, body: null });
    }

    private send(data:{cmd:number,body:object|null}) {
        const _dataBuffer = this.encodeData(data); 
        if (_dataBuffer) this.mSocket!.send(_dataBuffer);
    }
    

    private encodeData(data:{cmd:number,body:object|null}) {
        const _cmd = data.cmd;
        const _dataBody = data.body;
        let _proto_struct_obj;
        let _data;
        switch (_cmd) {
            case protoMsgCmd.READY_C2S:
                _proto_struct_obj = Ready_C2S.getDefaultValue();
                _proto_struct_obj.seatNumber = 0;
                _data = Ready_C2S.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.PLAYCARDS_C2S:
                _proto_struct_obj = PlayCards_C2S.getDefaultValue();
                _proto_struct_obj.seatNumber = (_dataBody! as protobufMsgType.PlayCards_C2S).seatNumber;
                _proto_struct_obj.cards = (_dataBody! as protobufMsgType.PlayCards_C2S).cards;
                _data = PlayCards_C2S.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.COMPETEFORLANDLORDROLE_C2S:
                _proto_struct_obj = CompeteForLandLordRole_C2S.getDefaultValue();
                _proto_struct_obj.seatNumber = (_dataBody! as protobufMsgType.CompeteForLandLordRole_C2S).seatNumber;
                _proto_struct_obj.score = (_dataBody! as protobufMsgType.CompeteForLandLordRole_C2S).score;
                _data = CompeteForLandLordRole_C2S.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.BROADCAST_MSG_S2C:
                _proto_struct_obj = BroadCastMsg_S2C.getDefaultValue();
                _proto_struct_obj.msg = (_dataBody! as protobufMsgType.BroadCastMsg_S2C).msg;
                _data = BroadCastMsg_S2C.encodeBinary(_proto_struct_obj);
                break;
            default:
                console.log("no message matched.");
                break;
        }
        if (_data) {
            const _mainMsg = MainMessage.getDefaultValue();
            _mainMsg.cmdId = _cmd;
            _mainMsg.data = _data;
            return  MainMessage.encodeBinary(_mainMsg);
        }
        return null;
    }

    decodeData(buffer:Uint8Array) {
        const _mainMsg = MainMessage.decodeBinary(buffer);
        const _cmd = _mainMsg.cmdId;
        //@ts-ignore:
        // console.log("decodeData>_mainMsg>CMD:", protoMsgName[_cmd]);
        const _bytesData = _mainMsg.data;
        let _data;
        switch (_cmd) {
            case protoMsgCmd.DEALCARDS_S2C:
                _data = DealCards_S2C.decodeBinary(_bytesData);
                _data = {
                    cards: _data.cards,
                    seatNumber: _data.seatNumber
                };
                if (this.dealCards_S2C) this.dealCards_S2C(_data);
                break;
            case protoMsgCmd.PLAYCARDS_S2C:
                _data = PlayCards_S2C.decodeBinary(_bytesData);
                _data = {
                    cards: _data.cards,
                    seatNumber: _data.seatNumber
                }
                if (this.playCards_S2C) this.playCards_S2C(_data);
                break;
            case protoMsgCmd.ILLEGALCARDS_S2C:
                _data = IllegalCards_S2C.decodeBinary(_bytesData);
                _data = {
                    seatNumber: _data.seatNumber
                }
                if (this.illegalCards_S2C) this.illegalCards_S2C();
                break;
            case protoMsgCmd.GAMEEND_S2C:
                _data = GameEnd_S2C.decodeBinary(_bytesData);
                _data = {
                    seatNumber: _data.seatNumber
                }
                if (this.gameEnd_S2C) this.gameEnd_S2C(_data);
                break;
            case protoMsgCmd.PLAYTURN_S2C:
                _data = PlayTurn_S2C.decodeBinary(_bytesData);
                _data = {
                    handCards: _data.handCards,
                    seatNumber: _data.seatNumber
                }
                if (this.playTurn_S2C) this.playTurn_S2C(_data);
                break;
            case protoMsgCmd.GAMESTART_S2C:
                _data = GameStart_S2C.decodeBinary(_bytesData);
                _data = {
                    playerId: _data.playerId,
                    seatNumber: _data.seatNumber
                }
                if (this.gameStart_S2C) this.gameStart_S2C(_data);
                break;
            case protoMsgCmd.COMPETEFORLANDLORDROLE_S2C:
                _data = CompeteForLandLordRole_S2C.decodeBinary(_bytesData);
                _data = {
                    curMaxScore: _data.curMaxScore
                }
                if (this.competeForLandLordRole_S2C) this.competeForLandLordRole_S2C(_data);
                break;
            case protoMsgCmd.BROADCAST_MSG_S2C:
                _data = BroadCastMsg_S2C.decodeBinary(_bytesData);
                _data = {
                    msg: _data.msg
                }
                if (this.broadCastMsg_S2C) this.broadCastMsg_S2C(_data);
                break;
            default:
                console.log("no message matched.")
        }
    }

    
//====== data and custom function bellow ======
    playTurn(data:{seatNumber:number}): void {
        if (data.seatNumber == this.seatNumber) {
            this.playCards_C2S();
        }
    }

    sortByValue(arr: number[]): number[] {
        return arr.sort((a, b) => {
            return this.getCardValue(b) - this.getCardValue(a);
        });
    }

    getInputFromCmd(): string {
        return readline.gets('');
    }

    getCardValue(cardSerialNumber: number): number {
        let cardNumber: number;
        const cardNumberWithoutSuit = cardSerialNumber % 0x10;
        switch (cardNumberWithoutSuit) {
            case 0x0e:
                cardNumber = 0x10;
                break;
            case 0x0f:
                cardNumber = 0x11;
                break;
            case 0x01:
                cardNumber = 0x0e;
                break;
            case 0x02:
                cardNumber = 0x0f;
                break;
            default:
                cardNumber = cardNumberWithoutSuit;
        }
        return cardNumber;
    }

    checkIsCardsLegal(cardsNumberStr: string): boolean {
        const cardsNumberStrArr = cardsNumberStr.split(",");
        for (let i = 0; i < cardsNumberStrArr.length; i++) {
            const cardNumberStr = cardsNumberStrArr[i];
            if (!cardNameNumberDic[cardNumberStr]) return false;
        }
        return true;
    }

    resetWhenGameEnd(): void {
        this.seatNumber = null;
        this.playerID = null;
    }

    //====== game logic below ======
    private mCardsArr: number[] = [];

    dealCards_S2C(data:{cards:number[],seatNumber:number}): void {
        const _cards = data.cards;
        this.mCardsArr = this.sortByValue(_cards);
        const _myHandCardsShowArr = convert2ReadableNames(this.mCardsArr);
        console.log('Deal cards complete, your seat number is-> ', data.seatNumber, 'your cards->', _myHandCardsShowArr.join(','));
    }

    competeForLandLordRole_S2C(data:{curMaxScore:number}): void {
        const _curMaxScore = data.curMaxScore;
        const _scoreCanBeSelectedStr = "123".slice(_curMaxScore).split("").join("|");
        console.log(`Select a score to confirm role (you can input ${_scoreCanBeSelectedStr}, the one who select the biggest number will be the land lord, and the base score is the selected number.): `);
        const _score = this.getInputFromCmd();
        this.competeForLandLordRole_C2S(+_score);
    }

    playCards_C2S(): void {
        console.log('Now, your turn.');
        console.log('Your cards->', convert2ReadableNames(this.mCardsArr).join(','));
        console.log('Please input your cards to play (join with ",", e.g."A,A,A,6", press "Enter" to confirm your input, input nothing to pass this turn):');
        const _inputContent = this.getInputFromCmd();
        if (_inputContent == "" || this.checkIsCardsLegal(_inputContent)) {
            const _cardsNumberArr = _inputContent == "" ? [] : convert2CardNumbers(_inputContent.split(","));
            this.send({ cmd: protoMsgCmd.PLAYCARDS_C2S, body: { cards: _cardsNumberArr, seatNumber: this.seatNumber } });
        } else {
            console.log("Illegal cards, please select your cards again.")
            if (this.seatNumber != null){
                this.playTurn({ seatNumber: this.seatNumber });
            }
        }
    }

    playCards_S2C(data:protobufMsgType.PlayCards_S2C): void {
        const _cardsPlayed = data.cards;
        const _seatNumber = data.seatNumber;
        if (_cardsPlayed.length == 0) {
            console.log(`Player ${_seatNumber}-> passed.`)
        } else {
            console.log(`Player ${_seatNumber}-> played ${convert2ReadableNames(_cardsPlayed).join(",")}.`);
        }
    }

    illegalCards_S2C(): void {
        console.log("Illegal Cards.");
        if(this.seatNumber != null) this.playTurn({ seatNumber: this.seatNumber });
    }

    gameEnd_S2C(data:protobufMsgType.GameEnd_S2C): void {
        const _winnerSeatNumber = data.seatNumber;
        const _isWin = _winnerSeatNumber === this.seatNumber;
        const _content = _isWin ? "Congratulations, you win!" : "Oh, you lose.";
        console.log(_content);
        this.resetWhenGameEnd();

        console.log("Press Enter to restart.")
        this.getInputFromCmd();
        this.startGame();
    }

     competeForLandLordRole_C2S(score:number): void {
         console.log(`You has called ${score} score`);
         this.send({ cmd: protoMsgCmd.COMPETEFORLANDLORDROLE_C2S, body: { score: score, seatNumber: this.seatNumber } });
    }
           
    playTurn_S2C(data:protobufMsgType.PlayTurn_S2C): void {
        const _seatNumber = data.seatNumber;
        if (_seatNumber == this.seatNumber) {
            //update hand cards
            if (data.handCards) this.mCardsArr = this.sortByValue(data.handCards);
            this.playCards_C2S();
        }
    }

    gameStart_S2C(data:protobufMsgType.GameStart_S2C): void {
        const _seatNumber = data.seatNumber;
        const _playerID = data.playerId;

        this.seatNumber = _seatNumber;
        this.playerID = _playerID;
    }

    broadCastMsg_S2C(data:protobufMsgType.BroadCastMsg_S2C): void {
        const _msg = data.msg;
        console.log(_msg);
    }
}

new GameClient()
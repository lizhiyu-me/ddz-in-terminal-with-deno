import { readline } from "https://deno.land/x/readline_sync@0.0.2/mod.ts";
import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

import { RuleChecker } from "../share/rule-checker.js";

import { messages as protobufMsgType } from "../share/proto/out/index.ts";
import { name2num as protoMsgCmd } from "../share/proto/out/messages/Cmd.ts";
import { num2name as protoMsgName } from "../share/proto/out/messages/Cmd.ts";

import * as MainMessage from "../share/proto/out/messages/MainMessage.ts";
import * as DealCards_S2C from "../share/proto/out/messages/DealCards_S2C.ts";
import * as CompeteForLandLordRole_C2S from "../share/proto/out/messages/CompeteForLandLordRole_C2S.ts";
import * as CompeteForLandLordRole_S2C from "../share/proto/out/messages/CompeteForLandLordRole_S2C.ts";
import * as PlayCards_C2S from "../share/proto/out/messages/PlayCards_C2S.ts";
import * as PlayCards_S2C from "../share/proto/out/messages/PlayCards_S2C.ts";
import * as IllegalCards_S2C from "../share/proto/out/messages/IllegalCards_S2C.ts";
import * as GameEnd_S2C from "../share/proto/out/messages/GameEnd_S2C.ts";
import * as PlayTurn_S2C from "../share/proto/out/messages/PlayTurn_S2C.ts";
import * as GameStart_S2C from "../share/proto/out/messages/GameStart_S2C.ts";
import * as BroadCastMsg_S2C from "../share/proto/out/messages/BroadCastMsg_S2C.ts";

export type CMDKEY = keyof typeof protoMsgName;

class GameServer {
    static POKER_VALUES: number[] = [
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D,	//diamond A - K
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D,	//club A - K
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D,	//heart A - K
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D,	//spade A - K
        0x4E, 0x4F, //bJkr,rJkr
    ];
    
    private playerIDArr: number[] = [];
    private socketDic: Record<number, WebSocketClient> = {};
    private port: number = 8080;
    private playerCount: number = 2;

    initialCardCount = 17;
    lordCardsCount = 3;
    readyPlayerCount = 0;

    private preCardsArr: number[] = [];
    private preCardsType: number = -1;
    private prePlayerSeat: number = -1;
    private isTrickEnd: boolean = true;
    private mIsGaming: boolean = false;
    private playerCardsDic: { [key: number]: number[] } = {};
    private calledCompeteLordScoreArr: number[] = [];
    private maxCalledLordScore: number = 0;
    private lordRoleSeat: number = 0;
    private lordRolePlayerID: number = 0;
    constructor() {
        this.mIsGaming = false;
        this.selectPlayerCount();
        this.startServer();
    }

    private startServer() {
        const wss = new WebSocketServer(this.port);
        wss.on("connection", (socket: WebSocketClient) => {
            console.log("CONNECTED");
            const { id, seat } = this.generatePlayerIDAndSeatNumber();
            //@ts-ignore:
            socket.id = id;
            //@ts-ignore:
            socket.seat = seat;
            this.socketDic[id] = socket;
            this.addSocketListener(socket);
          });
    }

    private selectPlayerCount() {
        const _playerCount = 2; // Simulated input
        if (_playerCount === 2 || _playerCount === 3) {
            this.playerCount = _playerCount;
        } else {
            console.log("Wrong input, please input again.");
            this.selectPlayerCount();
        }
    }



    private addSocketListener(socket: WebSocketClient) {
        socket.on("message", (e) => {
            //@ts-ignore:
            const _playerID = socket.id;
            this.decodeData(e, _playerID);
        });
    }

    private decodeData(buffer: Uint8Array, playerID: number) {
        // let _mainMsg = card_game_pb.MainMessage.deserializeBinary(buffer);
        const _mainMsg = MainMessage.decodeBinary(buffer);
        const _cmd = _mainMsg.cmdId;
        const _bytesData = _mainMsg.data;
        let _data;
        switch (_cmd) {
            case protoMsgCmd.READY_C2S:
                // _data = Ready_C2S.decodeBinary(_bytesData);
                // _data = { seatNumber: _data.seatNumber };
                this.ready_C2S();
                break;
            case protoMsgCmd.PLAYCARDS_C2S:
                _data = PlayCards_C2S.decodeBinary(_bytesData);
                _data = { cards: _data.cards, seatNumber: _data.seatNumber };
                this.playCards_C2S(playerID, _data);
                break;
            case protoMsgCmd.COMPETEFORLANDLORDROLE_C2S:
                _data = CompeteForLandLordRole_C2S.decodeBinary(_bytesData);
                _data = { score: _data.score, seatNumber: _data.seatNumber };
                this.competeForLandLordRole_C2S(playerID, _data);
                break;
            default:
                console.log("no message matched.");
        }
    }

    private encodeData(cmd: number, data:object|null): Uint8Array | null {
        const _cmd = cmd;
        let _proto_struct_obj;
        let _data;
        switch (_cmd) {
            case protoMsgCmd.DEALCARDS_S2C:
                _proto_struct_obj = DealCards_S2C.getDefaultValue();
                _proto_struct_obj.cards = (data! as protobufMsgType.DealCards_S2C).cards;
                _proto_struct_obj.seatNumber = (data! as protobufMsgType.DealCards_S2C).seatNumber;
                _data = DealCards_S2C.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.PLAYCARDS_S2C:
                _proto_struct_obj = PlayCards_S2C.getDefaultValue();
                _proto_struct_obj.cards = (data! as protobufMsgType.PlayCards_S2C).cards;
                _proto_struct_obj.seatNumber = (data! as protobufMsgType.PlayCards_S2C).seatNumber;
                _data = PlayCards_S2C.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.ILLEGALCARDS_S2C:
                _proto_struct_obj = IllegalCards_S2C.getDefaultValue();
                _proto_struct_obj.seatNumber = (data! as protobufMsgType.IllegalCards_S2C).seatNumber;
                _data = IllegalCards_S2C.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.GAMEEND_S2C:
                _proto_struct_obj = GameEnd_S2C.getDefaultValue();
                _proto_struct_obj.seatNumber = (data! as protobufMsgType.GameEnd_S2C).seatNumber;
                _data = GameEnd_S2C.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.PLAYTURN_S2C:
                _proto_struct_obj = PlayTurn_S2C.getDefaultValue();
                _proto_struct_obj.handCards = (data! as protobufMsgType.PlayTurn_S2C).handCards;
                _proto_struct_obj.seatNumber = (data! as protobufMsgType.PlayTurn_S2C).seatNumber;
                _data = PlayTurn_S2C.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.GAMESTART_S2C:
                _proto_struct_obj = GameStart_S2C.getDefaultValue();
                _proto_struct_obj.playerId = (data! as protobufMsgType.GameStart_S2C).playerId;
                _proto_struct_obj.seatNumber = (data! as protobufMsgType.GameStart_S2C).seatNumber;
                _data = GameStart_S2C.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.COMPETEFORLANDLORDROLE_S2C:
                _proto_struct_obj = CompeteForLandLordRole_S2C.getDefaultValue();
                _proto_struct_obj.curMaxScore = (data! as protobufMsgType.CompeteForLandLordRole_S2C).curMaxScore;
                _data = CompeteForLandLordRole_S2C.encodeBinary(_proto_struct_obj);
                break;
            case protoMsgCmd.BROADCAST_MSG_S2C:
                _proto_struct_obj = BroadCastMsg_S2C.getDefaultValue();
                _proto_struct_obj.msg = (data! as protobufMsgType.BroadCastMsg_S2C).msg;
                _data = BroadCastMsg_S2C.encodeBinary(_proto_struct_obj);
                break;
            default:
                console.log("no message matched.")
        }
        if (_data) {
            const _mainMsg = MainMessage.getDefaultValue();
            _mainMsg.cmdId = cmd;
            _mainMsg.data = _data;
            const _completeData = MainMessage.encodeBinary(_mainMsg);
            return _completeData;
        }
        return null;
    }

    private send(playerID: number, cmd: CMDKEY, data: object | null) {
        if (!this.mIsGaming) return;
        console.log("send msg:", protoMsgName[cmd]);
        const _dataBuffer = this.encodeData(cmd, data);
        if (_dataBuffer) this.socketDic[playerID].send(_dataBuffer);
    }

    private broadcast(cmd: number, data: object | null) {
        if (!this.mIsGaming) return;
        const _dataBuffer = this.encodeData(cmd, data);
        if (_dataBuffer) {
            Object.values(this.socketDic).forEach(socket => {
                socket.send(_dataBuffer);
            });
        }
    }

    dealCards_S2C() {
        const _pokerPool = this.shuffleArray(GameServer.POKER_VALUES.slice());
        for (let i = 0; i < this.playerCount; i++) {
            this.playerCardsDic[i] = _pokerPool.slice(i * this.initialCardCount, (i + 1) * this.initialCardCount);
        }
        const _lordCards = _pokerPool.slice(-this.lordCardsCount);
        this.playerCardsDic[this.lordRoleSeat] = this.playerCardsDic[this.lordRoleSeat].concat(_lordCards);

        let _keyArr = Object.keys(this.playerCardsDic);
        for (let i = 0; i < _keyArr.length; i++) {
            const _originCards = this.playerCardsDic[+_keyArr[i]];
            this.playerCardsDic[+_keyArr[i]] = _originCards.map(card => card % 0x10);
        }

        let _countIdx = 0;
        _keyArr = Object.keys(this.socketDic);
        for (let i = 0; i < _keyArr.length; i++) {
            const _socket = this.socketDic[+_keyArr[i]];
            //@ts-ignore:
            const _playerID = _socket.id;
            //@ts-ignore:
            const _seatNumber = _socket.seat;
            const data = {
                seatNumber: _seatNumber,
                cards: this.playerCardsDic[_countIdx++]
            }
            this.send(_playerID, protoMsgCmd.DEALCARDS_S2C, data);
        }
    }

    ready_C2S() {
        this.readyPlayerCount++;
        if (this.readyPlayerCount == this.playerCount) {
            this.resetGameRoundData();
            this.mIsGaming = true;
            this.roundStart();
            const _firstCompeteLordPlayerSeatNumber = Math.floor(Math.random() * this.playerCount);
            const _playerID = this.getPlayerIDBySeatNumber(_firstCompeteLordPlayerSeatNumber);
            if (_playerID) this.send(_playerID, protoMsgCmd.COMPETEFORLANDLORDROLE_S2C, { seatNumber: _firstCompeteLordPlayerSeatNumber, curMaxScore: this.maxCalledLordScore });
        }
    }

    competeForLandLordRole_C2S(playerID: number, data: object|null) {
        console.log("competeForLandLordRole_C2S>",data);
        const _score = (data! as protobufMsgType.CompeteForLandLordRole_C2S).score;
        const _seatNumber = (data! as protobufMsgType.CompeteForLandLordRole_C2S).seatNumber;
        this.broadMsg("Player " + _seatNumber + " called " + _score + " score.");
        this.calledCompeteLordScoreArr.push(_score);

        if (_score > this.maxCalledLordScore) {
            this.maxCalledLordScore = _score;
            this.lordRoleSeat = _seatNumber;
            this.lordRolePlayerID = playerID;
        }
        const _hasCompeteForLordRoleCompleted = this.calledCompeteLordScoreArr.length == this.playerCount || _score == 3;
        if (_hasCompeteForLordRoleCompleted) {
            console.log("_hasCompeteForLordRoleCompleted>",_hasCompeteForLordRoleCompleted);
            this.broadMsg("Land lord player's seat number is " + this.lordRoleSeat);
            this.dealCards_S2C();
            if (this.lordRolePlayerID) this.send(this.lordRolePlayerID, protoMsgCmd.PLAYTURN_S2C, { seatNumber: this.lordRoleSeat, handCards: this.playerCardsDic[this.lordRoleSeat] });
        } else {
            console.log("call next player to compete lord");
            const _nextTurnSeat = this.getNextPlayerSeatNumber(_seatNumber);
            const _nextPlayerID = this.getPlayerIDBySeatNumber(_nextTurnSeat);
            if (_nextPlayerID) this.send(_nextPlayerID, protoMsgCmd.COMPETEFORLANDLORDROLE_S2C, { seatNumber: this.lordRoleSeat, curMaxScore: this.maxCalledLordScore });
        }
    }

    playCards_C2S(playerID: number, data: object|null) {
        this.checkIsTrickEnd((data! as protobufMsgType.PlayCards_C2S).seatNumber);
        const _cardsNumberArr = (data! as protobufMsgType.PlayCards_C2S).cards;
        const _seatNumber = (data! as protobufMsgType.PlayCards_C2S).seatNumber;
        let _canPlay = false;
        if (_cardsNumberArr.length == 0) { //pass
            _canPlay = true;
            this.playCards_S2C({ cards: [], seatNumber: _seatNumber });
            this.preCardsArr = [];
            this.preCardsType = -1;
            this.prePlayerSeat = _seatNumber;
        } else {
            if (!this.checkHasCards(_cardsNumberArr, _seatNumber)) {
                console.log("no cards to play");
                this.send(playerID, protoMsgCmd.ILLEGALCARDS_S2C, {});
                return;
            }
            let _curCardsType = -1;
            if (this.preCardsType === -1) {
                const _res = Object.keys(RuleChecker.CheckCardType(_cardsNumberArr, -1));
                if (_res.length != 0) {
                    _curCardsType = ~~_res[0];
                    _canPlay = true;
                }
            } else {
                const _res = RuleChecker.CheckCard(_cardsNumberArr, this.preCardsArr, this.preCardsType);
                if (_res['isOK']) {
                    _curCardsType = ~~_res.cardsType[0];
                    _canPlay = true;
                }
            }
            if (_canPlay) {
                this.preCardsArr = _cardsNumberArr;
                this.preCardsType = _curCardsType;
                this.prePlayerSeat = _seatNumber;
                this.playCards_S2C({ cards: this.preCardsArr, seatNumber: _seatNumber });
            } else {
                console.log("Illegal cards");
                this.send(playerID, protoMsgCmd.ILLEGALCARDS_S2C, {});
            }
        }
        if (_canPlay && this.playerCardsDic[_seatNumber].length != 0) setTimeout(() => {
            const _nextTurnSeatNumber = this.getNextPlayerSeatNumber(_seatNumber);
            const _nextTurnPlayerID = this.getPlayerIDBySeatNumber(_nextTurnSeatNumber);
            if (_nextTurnPlayerID) this.send(_nextTurnPlayerID, protoMsgCmd.PLAYTURN_S2C, { seatNumber: _nextTurnSeatNumber, handCards: this.playerCardsDic[_nextTurnSeatNumber] });
        }, 500);
    }

    playCards_S2C(data: object|null) {
        this.removePlayerCards((data! as protobufMsgType.PlayCards_S2C).cards, (data! as protobufMsgType.PlayCards_S2C).seatNumber);
        this.broadcast(protoMsgCmd.PLAYCARDS_S2C, data);
    }

    checkIsTrickEnd(seat: number): void {
        this.isTrickEnd = this.prePlayerSeat === seat;
        if (this.isTrickEnd) {
            this.preCardsArr.length = 0;
            this.preCardsType = -1;
        }
    }

    removePlayerCards(playedCards: number[], seatNumber: number): number[] {
        const _handCardsArr = this.playerCardsDic[seatNumber];
        for (let i = 0; i < playedCards.length; i++) {
            const item = playedCards[i];
            const _idx = _handCardsArr.indexOf(item);
            _handCardsArr.splice(_idx, 1);
        }
        if (_handCardsArr.length === 0) {
            this.broadcast(protoMsgCmd.GAMEEND_S2C, { seatNumber: seatNumber });
            this.resetGameRoundData();
        }
        return _handCardsArr;
    }

    checkHasCards(cardsNumberArr: number[], seatNumber: number): boolean {
        const _handCardsArr = this.playerCardsDic[seatNumber].slice();
        let _res = true;
        for (let i = 0; i < cardsNumberArr.length; i++) {
            const item = cardsNumberArr[i];
            const _idx = _handCardsArr.indexOf(item);
            if (_idx != -1) {
                _handCardsArr.splice(_idx, 1);
            } else {
                _res = false;
            }
        }
        return _res;
    }

    resetGameRoundData(): void {
        this.mIsGaming = false;
        this.preCardsArr.length = 0;
        this.preCardsType = -1;
        this.isTrickEnd = true;
        this.readyPlayerCount = 0;
        this.playerIDArr.length = 0;
        this.calledCompeteLordScoreArr.length = 0;
        this.maxCalledLordScore = 0;
        this.lordRoleSeat = 0;
        this.lordRolePlayerID = 0;
    }

    getNextPlayerSeatNumber(preSeatNumber: number): number {
        let _cur = preSeatNumber + 1;
        if (_cur >= this.playerCount) {
            _cur = _cur - this.playerCount;
        }
        return _cur;
    }

    generatePlayerIDAndSeatNumber(): { id: number, seat: number } {
        const _seat = this.playerIDArr.length;
        const _id = Math.floor(Math.random() * 10000);
        const _isExist = this.playerIDArr.indexOf(_id) != -1;
        if (_isExist) {
            return this.generatePlayerIDAndSeatNumber();
        } else {
            this.playerIDArr.push(_id);
        }
        return { id: _id, seat: _seat };
    }

    roundStart(): void {
        const _keyArr = Object.keys(this.socketDic);
        for (let i = 0; i < _keyArr.length; i++) {
            const _socket = this.socketDic[+_keyArr[i]];
            //@ts-ignore:
            const _playerID = _socket.id;
            //@ts-ignore:
            const _seatNumber = _socket.seat;
            const _data = { "playerId": _playerID, "seatNumber": _seatNumber };
            this.send(_playerID, protoMsgCmd.GAMESTART_S2C, _data);
        }
    }

    getPlayerIDBySeatNumber(seatNumber: number): number | null {
        const _keyArr = Object.keys(this.socketDic);
        for (let i = 0; i < _keyArr.length; i++) {
            const _socket = this.socketDic[+_keyArr[i]];
            //@ts-ignore:
            const _seatNumber = _socket.seat;
            //@ts-ignore:
            if (seatNumber == _seatNumber) return _socket.id;
        }
        return null;
    }

    broadMsg(msgStr: string): void {
        this.broadcast(protoMsgCmd.BROADCAST_MSG_S2C, { "msg": msgStr });
    }

    getInputFromCmd(tips: string): string {
        return readline.gets(tips);
    }

    shuffleArray(input: number[]): number[] {
        for (let i = input.length - 1; i >= 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const itemAtIndex = input[randomIndex];
            input[randomIndex] = input[i];
            input[i] = itemAtIndex;
        }
        return input;
    }
}

new GameServer();


import { readline } from "https://deno.land/x/readline_sync@0.0.2/mod.ts";
import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { RuleChecker } from "../share/rule-checker.js";
import * as card_game_pb from "../share/proto/out/card-game_pb.js";

class GameServer {
    static POKER_VALUES: number[] = [
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D,	//diamond A - K
        0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D,	//club A - K
        0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D,	//heart A - K
        0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D,	//spade A - K
        0x4E, 0x4F, //bJkr,rJkr
    ];
    
    private playerIDArr: number[] = [];
    private socketDic: Record<number, Deno.Conn> = {};
    private port: number = 8080;
    private playerCount: number = 2;

    initialCardCount = 17;
    lordCardsCount = 3;
    readyPlayerCount = 0;

    private preCardsArr: any[] = [];
    private preCardsType: number = -1;
    private prePlayerSeat: number = -1;
    private isTrickEnd: boolean = true;
    private mIsGaming: boolean = false;
    private playerCardsDic: { [key: number]: any[] } = {};
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
            socket.id = id;
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
            let _playerID = socket.id;
            this.decodeData(e, _playerID);
        });
    }

    private decodeData(buffer: Uint8Array, playerID: number) {
        let _mainMsg = card_game_pb.MainMessage.deserializeBinary(buffer);
        let _cmd = _mainMsg.getCmdId();
        let _bytesData = _mainMsg.getData();
        let _data;
        switch (_cmd) {
            case card_game_pb.Cmd.READY_C2S:
                _data = card_game_pb.Ready_C2S.deserializeBinary(_bytesData);
                _data = { seatNumber: _data.getSeatNumber() };
                this.ready_C2S(_data);
                break;
            case card_game_pb.Cmd.PLAYCARDS_C2S:
                _data = card_game_pb.PlayCards_C2S.deserializeBinary(_bytesData);
                _data = { cards: _data.getCardsList(), seatNumber: _data.getSeatNumber() };
                this.playCards_C2S(playerID, _data);
                break;
            case card_game_pb.Cmd.COMPETEFORLANDLORDROLE_C2S:
                _data = card_game_pb.CompeteForLandLordRole_C2S.deserializeBinary(_bytesData);
                _data = { score: _data.getScore(), seatNumber: _data.getSeatNumber() };
                this.competeForLandLordRole_C2S(playerID, _data);
                break;
            default:
                console.log("no message matched.");
        }
    }

    private encodeData(cmd: card_game_pb.Cmd, data: any): Uint8Array | null {
        let _cmd = cmd;
        let _proto_struct_obj;
        switch (_cmd) {
            case card_game_pb.Cmd.DEALCARDS_S2C:
                _proto_struct_obj = new card_game_pb.DealCards_S2C();
                _proto_struct_obj.setCardsList(data.cards);
                _proto_struct_obj.setSeatNumber(data.seatNumber);
                break;
            case card_game_pb.Cmd.PLAYCARDS_S2C:
                _proto_struct_obj = new card_game_pb.PlayCards_S2C();
                _proto_struct_obj.setCardsList(data.cards);
                _proto_struct_obj.setSeatNumber(data.seatNumber);
                break;
            case card_game_pb.Cmd.ILLEGALCARDS_S2C:
                _proto_struct_obj = new card_game_pb.IllegalCards_S2C();
                _proto_struct_obj.setSeatNumber(data.seatNumber);
                break;
            case card_game_pb.Cmd.GAMEEND_S2C:
                _proto_struct_obj = new card_game_pb.GameEnd_S2C();
                _proto_struct_obj.setSeatNumber(data.seatNumber);
                break;
            case card_game_pb.Cmd.PLAYTURN_S2C:
                _proto_struct_obj = new card_game_pb.PlayTurn_S2C();
                _proto_struct_obj.setHandCardsList(data.handCards);
                _proto_struct_obj.setSeatNumber(data.seatNumber);
                break;
            case card_game_pb.Cmd.GAMESTART_S2C:
                _proto_struct_obj = new card_game_pb.GameStart_S2C();
                _proto_struct_obj.setPlayerId(data.playerID);
                _proto_struct_obj.setSeatNumber(data.seatNumber);
                break;
            case card_game_pb.Cmd.COMPETEFORLANDLORDROLE_S2C:
                _proto_struct_obj = new card_game_pb.CompeteForLandLordRole_S2C();
                _proto_struct_obj.setCurMaxScore(data.curMaxScore);
                break;
            case card_game_pb.Cmd.BROADCAST_MSG_S2C:
                _proto_struct_obj = new card_game_pb.BroadCastMsg_S2C();
                _proto_struct_obj.setMsg(data.msg);
                break;
            default:
                console.log("no message matched.")
        }
        if (_proto_struct_obj) {
            let _mainMsg = new card_game_pb.MainMessage();
            _mainMsg.setCmdId(cmd);
            let _data = _proto_struct_obj.serializeBinary();
            _mainMsg.setData(_data);
            return _mainMsg.serializeBinary();
        }
        return null;
    }

    private send(playerID: number, cmd: card_game_pb.Cmd, data: any) {
        console.log("send msg cmd:", cmd);
        if (!this.mIsGaming) return;
        const _dataBuffer = this.encodeData(cmd, data);
        if (_dataBuffer) this.socketDic[playerID].send(_dataBuffer);
    }

    private broadcast(cmd: card_game_pb.Cmd, data: any) {
        if (!this.mIsGaming) return;
        const _dataBuffer = this.encodeData(cmd, data);
        if (_dataBuffer) {
            Object.values(this.socketDic).forEach(socket => {
                socket.send(_dataBuffer);
            });
        }
    }

    dealCards_S2C() {
        let _pokerPool = this.shuffleArray(GameServer.POKER_VALUES.slice());
        for (let i = 0; i < this.playerCount; i++) {
            this.playerCardsDic[i] = _pokerPool.slice(i * this.initialCardCount, (i + 1) * this.initialCardCount);
        }
        let _lordCards = _pokerPool.slice(-this.lordCardsCount);
        this.playerCardsDic[this.lordRoleSeat] = this.playerCardsDic[this.lordRoleSeat].concat(_lordCards);

        let _keyArr = Object.keys(this.playerCardsDic);
        for (let i = 0; i < _keyArr.length; i++) {
            const _originCards = this.playerCardsDic[_keyArr[i]];
            this.playerCardsDic[_keyArr[i]] = _originCards.map(card => card % 0x10);
        }

        let _countIdx = 0;
        _keyArr = Object.keys(this.socketDic);
        for (let i = 0; i < _keyArr.length; i++) {
            let _socket = this.socketDic[_keyArr[i]];
            let _playerID = _socket.id;
            let _seatNumber = _socket.seat;
            let data = {
                seatNumber: _seatNumber,
                cards: this.playerCardsDic[_countIdx++]
            }
            this.send(_playerID, card_game_pb.Cmd.DEALCARDS_S2C, data);
        }
    }

    ready_C2S() {
        this.readyPlayerCount++;
        if (this.readyPlayerCount == this.playerCount) {
            this.resetGameRoundData();
            this.mIsGaming = true;
            this.roundStart();
            let _firstCompeteLordPlayerSeatNumber = Math.floor(Math.random() * this.playerCount);
            let _playerID = this.getPlayerIDBySeatNumber(_firstCompeteLordPlayerSeatNumber);
            this.send(_playerID, card_game_pb.Cmd.COMPETEFORLANDLORDROLE_S2C, { seatNumber: _firstCompeteLordPlayerSeatNumber, curMaxScore: this.maxCalledLordScore });
        }
    }

    competeForLandLordRole_C2S(playerID, data) {
        console.log("competeForLandLordRole_C2S>",data);
        let _score = data.score;
        let _seatNumber = data.seatNumber;
        this.broadMsg("Player " + _seatNumber + " called " + _score + " score.");
        this.calledCompeteLordScoreArr.push(_score);

        if (_score > this.maxCalledLordScore) {
            this.maxCalledLordScore = _score;
            this.lordRoleSeat = _seatNumber;
            this.lordRolePlayerID = playerID;
        }
        let _hasCompeteForLordRoleCompleted = this.calledCompeteLordScoreArr.length == this.playerCount || _score == 3;
        if (_hasCompeteForLordRoleCompleted) {
            console.log("_hasCompeteForLordRoleCompleted>",_hasCompeteForLordRoleCompleted);
            this.broadMsg("Land lord player's seat number is " + this.lordRoleSeat);
            this.dealCards_S2C();
            this.send(this.lordRolePlayerID, card_game_pb.Cmd.PLAYTURN_S2C, { seatNumber: this.lordRoleSeat, handCards: this.playerCardsDic[this.lordRoleSeat] });
        } else {
            console.log("call next player to compete lord");
            let _nextTurnSeat = this.getNextPlayerSeatNumber(_seatNumber);
            let _nextPlayerID = this.getPlayerIDBySeatNumber(_nextTurnSeat);
            this.send(_nextPlayerID, card_game_pb.Cmd.COMPETEFORLANDLORDROLE_S2C, { seatNumber: this.lordRoleSeat, curMaxScore: this.maxCalledLordScore });
        }
    }

    playCards_C2S(playerID, data) {
        this.checkIsTrickEnd(data.seatNumber);
        let _cardsNumberArr = data.cards;
        let _seatNumber = data.seatNumber;
        let _canPlay = false;
        if (_cardsNumberArr.length == 0) { //pass
            _canPlay = true;
            this.playCards_S2C({ cards: [], seatNumber: _seatNumber });
            preCardsArr = [];
            preCardsType = -1;
            prePlayerSeat = _seatNumber;
        } else {
            if (!this.checkHasCards(_cardsNumberArr, _seatNumber)) {
                console.log("no cards to play");
                this.send(playerID, card_game_pb.Cmd.ILLEGALCARDS_S2C, {});
                return;
            }
            let _curCardsType = -1;
            if (preCardsType === -1) {
                let _res = Object.keys(RuleChecker.CheckCardType(_cardsNumberArr, -1));
                if (_res.length != 0) {
                    _curCardsType = ~~_res[0];
                    _canPlay = true;
                }
            } else {
                let _res = RuleChecker.CheckCard(_cardsNumberArr, preCardsArr, preCardsType);
                if (_res['isOK']) {
                    _curCardsType = ~~_res.cardsType[0];
                    _canPlay = true;
                }
            }
            if (_canPlay) {
                preCardsArr = _cardsNumberArr;
                preCardsType = _curCardsType;
                prePlayerSeat = _seatNumber;
                this.playCards_S2C({ cards: preCardsArr, seatNumber: _seatNumber });
            } else {
                console.log("Illegal cards");
                this.send(playerID, card_game_pb.Cmd.ILLEGALCARDS_S2C, {});
            }
        }
        if (_canPlay && this.playerCardsDic[_seatNumber].length != 0) setTimeout(() => {
            let _nextTurnSeatNumber = this.getNextPlayerSeatNumber(_seatNumber);
            let _nextTurnPlayerID = this.getPlayerIDBySeatNumber(_nextTurnSeatNumber);
            this.send(_nextTurnPlayerID, card_game_pb.Cmd.PLAYTURN_S2C, { seatNumber: _nextTurnSeatNumber, handCards: this.playerCardsDic[_nextTurnSeatNumber] });
        }, 500);
    }

    playCards_S2C(data) {
        this.removePlayerCards(data.cards, data.seatNumber);
        this.broadcast(card_game_pb.Cmd.PLAYCARDS_S2C, data);
    }

    checkIsTrickEnd(seat: number): void {
        this.isTrickEnd = this.prePlayerSeat === seat;
        if (this.isTrickEnd) {
            this.preCardsArr.length = 0;
            this.preCardsType = -1;
        }
    }

    removePlayerCards(playedCards: any[], seatNumber: number): any[] {
        let _handCardsArr = this.playerCardsDic[seatNumber];
        for (let i = 0; i < playedCards.length; i++) {
            let item = playedCards[i];
            let _idx = _handCardsArr.indexOf(item);
            _handCardsArr.splice(_idx, 1);
        }
        if (_handCardsArr.length === 0) {
            this.broadcast(card_game_pb.Cmd.GAMEEND_S2C, { seatNumber: seatNumber });
            this.resetGameRoundData();
        }
        return _handCardsArr;
    }

    checkHasCards(cardsNumberArr: any[], seatNumber: number): boolean {
        let _handCardsArr = this.playerCardsDic[seatNumber].slice();
        let _res = true;
        for (let i = 0; i < cardsNumberArr.length; i++) {
            let item = cardsNumberArr[i];
            let _idx = _handCardsArr.indexOf(item);
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
        let _seat = this.playerIDArr.length;
        let _id = Math.floor(Math.random() * 10000);
        let _isExist = this.playerIDArr.indexOf(_id) != -1;
        if (_isExist) {
            return this.getPlayerID();
        } else {
            this.playerIDArr.push(_id);
        }
        return { id: _id, seat: _seat };
    }

    roundStart(): void {
        let _keyArr = Object.keys(this.socketDic);
        for (let i = 0; i < _keyArr.length; i++) {
            let _socket = this.socketDic[_keyArr[i]];
            let _playerID = _socket.id;
            let _seatNumber = _socket.seat;
            let _data = { "playerID": _playerID, "seatNumber": _seatNumber };
            this.send(_playerID, card_game_pb.Cmd.GAMESTART_S2C, _data);
        }
    }

    getPlayerIDBySeatNumber(seatNumber: number): number | null {
        let _keyArr = Object.keys(this.socketDic);
        for (let i = 0; i < _keyArr.length; i++) {
            let _socket = this.socketDic[_keyArr[i]];
            let _seatNumber = _socket.seat;
            if (seatNumber == _seatNumber) return _socket.id;
        }
        return null;
    }

    broadMsg(msgStr: string): void {
        this.broadcast(card_game_pb.Cmd.BROADCAST_MSG_S2C, { "msg": msgStr });
    }

    getInputFromCmd(tips: string): string {
        return readline.gets(tips);
    }

    shuffleArray(input: any[]): any[] {
        for (let i = input.length - 1; i >= 0; i--) {
            let randomIndex = Math.floor(Math.random() * (i + 1));
            let itemAtIndex = input[randomIndex];
            input[randomIndex] = input[i];
            input[i] = itemAtIndex;
        }
        return input;
    }
}

new GameServer();


import { readline } from "https://deno.land/x/readline_sync@0.0.2/mod.ts";
import { WebSocketClient, StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { convert2ReadableNames, convert2CardNumbers, cardNameNumberDic } from '../share/helper.ts';
import * as card_game_pb from "../share/proto/out/card-game_pb.js";

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

        this.mSocket.on('message', (buffer) => {
            if (buffer.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    this.decodeData(arrayBuffer);
                };
                reader.onerror = (err) => {
                    console.error("Failed to read blob:", err);
                };
                reader.readAsArrayBuffer(buffer.data);
            } else {
                console.error("Expected Blob, received:", buffer.data);
            }
        })
    }

    private startGame() {
        this.send({ cmd: card_game_pb.Cmd.READY_C2S, body: null });
    }

    private send(data:{cmd:number,body:object|null}) {
        const _dataBuffer = this.encodeData(data); 
        if (_dataBuffer) this.mSocket!.send(_dataBuffer);
    }
    

    private encodeData(data:{cmd:number,body:object|null}) {
        const _cmd = data.cmd;
        const _dataBody = data.body;
        let _proto_struct_obj;
        switch (_cmd) {
            case card_game_pb.Cmd.READY_C2S:
                _proto_struct_obj = new card_game_pb.Ready_C2S();
                _proto_struct_obj.setSeatNumber(0);
                break;
            case card_game_pb.Cmd.PLAYCARDS_C2S:
                _proto_struct_obj = new card_game_pb.PlayCards_C2S();
                //@ts-ignore:need types according to .proto file
                _proto_struct_obj.setSeatNumber(_dataBody!.seatNumber);
                //@ts-ignore:need types according to .proto file
                _proto_struct_obj.setCardsList(_dataBody!.cards);
                break;
            case card_game_pb.Cmd.COMPETEFORLANDLORDROLE_C2S:
                _proto_struct_obj = new card_game_pb.CompeteForLandLordRole_C2S();
                //@ts-ignore:need types according to .proto file
                _proto_struct_obj.setSeatNumber(_dataBody!.seatNumber);
                //@ts-ignore:need types according to .proto file
                _proto_struct_obj.setScore(_dataBody!.score);
                break;
        }
        if (_proto_struct_obj) {
            const _mainMsg = new card_game_pb.MainMessage();
            _mainMsg.setCmdId(_cmd);
            const _data = _proto_struct_obj.serializeBinary();
            _mainMsg.setData(_data);
            const _completeData = _mainMsg.serializeBinary();
            return _completeData;
        }
        return null;
    }

    decodeData(buffer:ArrayBuffer) {
        const _mainMsg = card_game_pb.MainMessage.deserializeBinary(buffer);
        // console.log("decodeData>_mainMsg:", _mainMsg);
        const _cmd = _mainMsg.getCmdId();
        const _bytesData = _mainMsg.getData();
        let _data;
        switch (_cmd) {
            case card_game_pb.Cmd.DEALCARDS_S2C:
                _data = card_game_pb.DealCards_S2C.deserializeBinary(_bytesData);
                _data = {
                    //@ts-ignore:need types according to .proto file
                    cards: _data.getCardsList(),
                    //@ts-ignore:need types according to .proto file
                    seatNumber: _data.getSeatNumber()
                };
                if (this.dealCards_S2C) this.dealCards_S2C(_data);
                break;
            case card_game_pb.Cmd.PLAYCARDS_S2C:
                _data = card_game_pb.PlayCards_S2C.deserializeBinary(_bytesData);
                _data = {
                    cards: _data.getCardsList(),
                    seatNumber: _data.getSeatNumber()
                }
                if (this.playCards_S2C) this.playCards_S2C(_data);
                break;
            case card_game_pb.Cmd.ILLEGALCARDS_S2C:
                _data = card_game_pb.IllegalCards_S2C.deserializeBinary(_bytesData);
                _data = {
                    seatNumber: _data.getSeatNumber()
                }
                if (this.illegalCards_S2C) this.illegalCards_S2C();
                break;
            case card_game_pb.Cmd.GAMEEND_S2C:
                _data = card_game_pb.GameEnd_S2C.deserializeBinary(_bytesData);
                _data = {
                    seatNumber: _data.getSeatNumber()
                }
                if (this.gameEnd_S2C) this.gameEnd_S2C(_data);
                break;
            case card_game_pb.Cmd.PLAYTURN_S2C:
                _data = card_game_pb.PlayTurn_S2C.deserializeBinary(_bytesData);
                _data = {
                    handCards: _data.getHandCardsList(),
                    seatNumber: _data.getSeatNumber()
                }
                if (this.playTurn_S2C) this.playTurn_S2C(_data);
                break;
            case card_game_pb.Cmd.GAMESTART_S2C:
                _data = card_game_pb.GameStart_S2C.deserializeBinary(_bytesData);
                _data = {
                    playerID: _data.getPlayerId(),
                    seatNumber: _data.getSeatNumber()
                }
                if (this.gameStart_S2C) this.gameStart_S2C(_data);
                break;
            case card_game_pb.Cmd.COMPETEFORLANDLORDROLE_S2C:
                _data = card_game_pb.CompeteForLandLordRole_S2C.deserializeBinary(_bytesData);
                _data = {
                    curMaxScore: _data.getCurMaxScore()
                }
                if (this.competeForLandLordRole_S2C) this.competeForLandLordRole_S2C(_data);
                break;
            case card_game_pb.Cmd.BROADCAST_MSG_S2C:
                _data = card_game_pb.BroadCastMsg_S2C.deserializeBinary(_bytesData);
                _data = {
                    msg: _data.getMsg()
                }
                if (this.broadCastMsg_S2C) this.broadCastMsg_S2C(_data);
                break;
            default:
                console.log("no message matched.")
        }
    }

    
//====== data and custom function bellow ======
    //@ts-ignore:need types according to .proto file
    playTurn(data): void {
        this.playTurn_S2C(data);
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

     //@ts-ignore:need types according to .proto file
    dealCards_S2C(data): void {
        const _cards = data.cards;
        this.mCardsArr = this.sortByValue(_cards);
        const _myHandCardsShowArr = convert2ReadableNames(this.mCardsArr);
        console.log('Deal cards complete, your seat number is-> ', data.seatNumber, 'your cards->', _myHandCardsShowArr.join(','));
    }

     //@ts-ignore:need types according to .proto file
    competeForLandLordRole_S2C(data): void {
        const _curMaxScore = data.curMaxScore;
        const _scoreCanBeSelectedStr = "123".slice(_curMaxScore).split("").join("|");
        console.log(`Select a score to confirm role (you can input ${_scoreCanBeSelectedStr}, the one who select the biggest number will be the land lord, and the base score is the selected number.): `);
        const _score = this.getInputFromCmd();
        this.competeForLandLordRole_C2S(_score);
    }

    playCards_C2S(): void {
        console.log('Now, your turn.');
        console.log('Your cards->', convert2ReadableNames(this.mCardsArr).join(','));
        console.log('Please input your cards to play (join with ",", e.g."A,A,A,6", press "Enter" to confirm your input, input nothing to pass this turn):');
        const _inputContent = this.getInputFromCmd();
        if (_inputContent == "" || this.checkIsCardsLegal(_inputContent)) {
            const _cardsNumberArr = _inputContent == "" ? [] : convert2CardNumbers(_inputContent.split(","));
            this.send({ cmd: card_game_pb.Cmd.PLAYCARDS_C2S, body: { cards: _cardsNumberArr, seatNumber: this.seatNumber } });
        } else {
            console.log("Illegal cards, please select your cards again.")
            this.playTurn({ seatNumber: this.seatNumber });
        }
    }

     //@ts-ignore:need types according to .proto file
    playCards_S2C(data): void {
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
        this.playTurn({ seatNumber: this.seatNumber });
    }

    //@ts-ignore:need types according to .proto file
    gameEnd_S2C(data): void {
        const _winnerSeatNumber = data.seatNumber;
        const _isWin = _winnerSeatNumber === this.seatNumber;
        const _content = _isWin ? "Congratulations, you win!" : "Oh, you lose.";
        console.log(_content);
        this.resetWhenGameEnd();

        console.log("Press Enter to restart.")
        this.getInputFromCmd();
        this.startGame();
    }

     //@ts-ignore:need types according to .proto file
     competeForLandLordRole_C2S(score): void {
         console.log(`You has called ${score} score`);
         this.send({ cmd: card_game_pb.Cmd.COMPETEFORLANDLORDROLE_C2S, body: { score: score, seatNumber: this.seatNumber } });
    }
           
    //@ts-ignore:need types according to .proto file
    playTurn_S2C(data): void {
        const _seatNumber = data.seatNumber;
        if (_seatNumber == this.seatNumber) {
            //update hand cards
            if (data.handCards) this.mCardsArr = this.sortByValue(data.handCards);
            this.playCards_C2S();
        }
    }

    //@ts-ignore:need types according to .proto file
    gameStart_S2C(data): void {
        const _seatNumber = data.seatNumber;
        const _playerID = data.playerID;

        this.seatNumber = _seatNumber;
        this.playerID = _playerID;
    }

    //@ts-ignore:need types according to .proto file
    broadCastMsg_S2C(data): void {
        const _msg = data.msg;
        console.log(_msg);
    }
}

new GameClient()
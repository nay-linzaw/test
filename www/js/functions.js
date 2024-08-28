// functions.js
// This is a JavaScript file

// mBaas接続設定
const ncmb = new NCMB("4841e816b5303b1853a6bff587fc97aac2d67e6f80696c3003a01775efb9c7e1", "2937212ac5a2e41a62cd42dbcd978fadfeeda755d5552af0541fae6eaf5afafa");

// 各種注意メッセージ
const MSG_NEEDSETTING = "ユーザー名とパスワードを入力してください。";

const BUY_NOTICE_DATA = [
    {image:"images/notice4.png", body:"飲料容器は水洗い"},
    {image:"images/notice10.png", body:"分別ステーションへ持参"},
    {image:"images/notice0.png", body:"それぞれの分別ガイドに従って分別投函してください"}
];
const PET_NOTICE_DATA = [
    {image:"images/notice1.png", body:"キャップを外す"},
    {image:"images/notice7.png", body:"ラベルを剥がす"},
    {image:"images/notice4.png", body:"水洗いする"},
    {image:"images/notice2.png", body:"指定のボックスに投函する"}
];
const CAN_NOTICE_DATA = [
    {image:"images/notice11.png", body:"水洗いする"},
    {image:"images/notice2.png", body:"指定のボックスに投函する"}
];
const BOTTLE_NOTICE_DATA = [
    {image:"images/notice3.png", body:"蓋を外す"},
    {image:"images/notice7.png", body:"できるだけラベルを剥がす"},
    {image:"images/notice4.png", body:"水洗いする"},
    {image:"images/notice2.png", body:"指定のボックスに投函する"}
];
const FOOD_NOTICE_DATA = [
    {image:"images/notice12.png", body:"未開封品のみ対象"},
    {image:"images/notice8.png", body:"消費期限が「2ヵ月以上先」であることを確認！"},
    {image:"images/notice9.png", body:"生ものや要冷蔵、要冷凍ではないことを確認！"},
    {image:"images/notice2.png", body:"指定のボックスに投函する"}
];

// 各種チェックアイテム
const PET_CHECK_DATA = [
    {body:"キャップを外した"},
    {body:"ラベルを剥がした"},
    {body:"きちんと水洗いした"},
    {body:"指定のボックスに投函した"}
];
const CAN_CHECK_DATA = [
    {body:"きちんと水洗いした"},
    {body:"指定のボックスに投函した"}
];
const BOTTLE_CHECK_DATA = [
    {body:"蓋を外した"},
    {body:"可能な範囲でラベルを剥がした"},
    {body:"きちんと水洗いした"},
    {body:"指定のボックスに投函した"}
];
const FOOD_CHECK_DATA = [
    {body:"未開封品である"},
    {body:"消費期限が「2ヵ月以上先」である"},
    {body:"生ものや要冷蔵、要冷凍ではない"},
    {body:"指定のボックスに投函した"}
];

// 容器コード
const PET_MSG = {CODE:"0001", BODY:"ペットボトルの分別方法"};
const CAN_MSG = {CODE:"0002", BODY:"缶の分別方法"};
const BOTTLE_MSG = {CODE:"0003", BODY:"ビンの分別方法"};
const FOOD_MSG = {CODE:"0004", BODY:"食品類の投函方法"};

// 環境設定情報
var userid;         // ユーザID
var userobject;     // ユーザ情報レコードオブジェクト
var cameramode;     // カメラモード
var constraints = {}; // カメラモードjson

// 各種コード、名称
var buy_objectid = "";
var buy_storecode = "";
var buy_storename = "";
var buy_jancode = "";
var buy_itemname = "";
var buy_itemtype = "";
var buy_buydate = "";
var separate_boxcode = "";
var separate_boxname = "";

// 一時変数、フラグ変数
var detect_code = "";
var detect_count = 0;
var barcode_reading = false;
var video;

// 注意ページデータ
var noticetitle;
var noticecomment;
var noticefunction;
var noticebutton;
var noticedata = [];

// 購入リストページデータ
var shoppingdata = [];
var alldata = [];
var currentindex;

// 動作モード
var gatemode;
var ncmbget = false;
const IN = true;
const OUT = false;

// 処理中ページ オブジェクト
var progress_modal;

// 音声メッセージ
var voice = new Audio();

//******************************************************************************************************/
//
// showDialog()
//   汎用なのでどこからでも呼ばれる
//   メッセージセット、Dialog画面呼び出し
//
//******************************************************************************************************/
var showInfodialog = function(msg) {
    ons.notification.alert({
        title: "",
        messageHTML: msg,
        buttonLabel: "OK",
        animation: "fade",
        callback: function() {
            voice.pause();
        }
    })
};


//******************************************************************************************************/
//
// readBuyQrcode()
//   購入店舗のQRコード読み取り
//   jsQRバーコード読み取り、shopList検索
//
//******************************************************************************************************/
var readBuyQrcode = function() {
    var video = document.createElement("video");
    var canvasElement = document.getElementById("buypage-qrcanvas");
    var canvas = canvasElement.getContext("2d");
    var buypagemsg = document.getElementById("buypage-msg");
    var qrcode = document.getElementById("buypage-qrcode");
    var codesample = document.getElementById("code-sample");

    function drawLine(begin, end, color) {
        canvas.beginPath();
        canvas.moveTo(begin.x, begin.y);
        canvas.lineTo(end.x, end.y);
        canvas.lineWidth = 4;
        canvas.strokeStyle = color;
        canvas.stroke();
    }

     navigator.mediaDevices.getUserMedia({video:constraints})
         .then(function(stream) {
            // カメラOKなら読取スタート
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            detect_code = "";
            requestAnimationFrame(buypagetick);
            voice.src = "voices/READ_SHOPQR.mp3";
            voice.play();
        })
        .catch((err) => {
            console.log(err.name + ": " + err.message);
            showInfodialog("有効なカメラデバイスがありません。\n設定を確認してください。\n"+err.name + ": " + err.message);
            voice.src = "voices/ERROR_CAMERA.mp3";
            voice.play();
            setTimeout(function(){navi.popPage()}, 500);
        });

    function buypagetick() {

        // QRコードを発見するまで
        if(detect_code == "") {
            buypagemsg.innerText = "店舗のQRコードを読み取ってください。"
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvasElement.height = video.videoHeight;
                canvasElement.width = video.videoWidth;
                canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                var code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                if (code) {
                    drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                    drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                    drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                    drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                    detect_code = code.data;
                }
            }
            requestAnimationFrame(buypagetick);
        } else if(detect_code == "wait") {
            return;
        } else {
            // QRコードが見つかったら店舗名を検索
            progress_modal.show();
            var shopList = ncmb.DataStore("shopList");
            shopList
                .equalTo("shopCode", detect_code)
                .fetchAll()
                .then(function(results) {
                    progress_modal.hide();
                             
                    // 登録されてない場合
                    if(results.length == 0) {
                        ons.notification.alert({
                            title: "",
                            messageHTML: "該当する店舗登録がありません。<br>もう一度QRコードをスキャンしてください。",
                            buttonLabel: "OK",
                            animation: "fade",
                            callback: function() {
                                detect_code = "";
                                requestAnimationFrame(buypagetick);
                            }
                        });
                        voice.src = "voices/RE_READ_SHOPQR.mp3";
                        voice.play();
                    } else {
                        // 登録されていれば確定
                        qrcode.innerHTML = results[0].shopName.replace(/\s+/g,"<br>");
                        buy_storename = results[0].shopName;

                        ons.notification.alert({
                            title: "",
                            messageHTML: "読み取りOK！<br><br>【店舗情報】<br>" + buy_storename.replace(/\s+/g,"<br>"),
                            buttonLabel: "OK",
                            animation: "fade",
                            callback: function() {
                               canvasElement.remove();
                               video.remove();
                               document.getElementById("buypage-readjan").style.display = "block";
                               buypagemsg.innerText = "購入商品のバーコードを読み取ってください。"
                               codesample.src = "images/samplejan.png";
                               buy_storecode = detect_code;
                               readBuyBarcode();
                            }
                        });
                        voice.src = "voices/READ_ITEMBAR.mp3";
                        voice.play();
                    }
                })
                .catch(function(err){
                    progress_modal.hide();
                    ons.notification.alert({
                        title: "",
                        messageHTML: "該当する店舗登録がありません。<br>もう一度QRコードをスキャンしてください。",
                        buttonLabel: "OK",
                        animation: "fade",
                        callback: function() {
                            detect_code = "";
                            requestAnimationFrame(buypagetick);
                        }
                    });
                    voice.src = "voices/RE_READ_SHOPQR.mp3";
                    voice.play();
                    console.log(err);
                })
        }
    }  
}

//******************************************************************************************************/
//
// readBuyBarcode()
//   購入商品のバーコード読み取りとデータベースへのセット
//   quaggaバーコード読み取り、itemList検索、shoppingListデータベース登録
//
//******************************************************************************************************/
var readBuyBarcode = function() {
    var videoview = document.getElementById("buypage-video-view");
    var barcode = document.getElementById("buypage-barcode");

    // Quagga初期化
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoview
        },
        constraints: {
            facingMode: constraints,
        },
        decoder: {
            readers: ["ean_reader"]
        } 
    }, 
    function(err) {
        if (err) {
            showInfodialog(err);
            return;
        }
        console.log("Quagga Initialization finished. Ready to start");
        detect_code = "";
        detect_count = 0;
        barcode_reading = false;
        Quagga.start();
    });

    // バーコード検索中（枠表示）
    Quagga.onProcessed(function(result) {
        var ctx = Quagga.canvas.ctx.overlay;
        var canvas = Quagga.canvas.dom.overlay;
        ctx.clearRect(0, 0, parseInt(canvas.width), parseInt(canvas.height));
        if (result) {
            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, ctx, {color: "blue", lineWidth: 2});
            }
        }
    });

    // バーコード発見
    Quagga.onDetected(function(result) {
        if(barcode_reading) {
            return;
        }

        if(detect_code == result.codeResult.code) {
            detect_count++;
        } else {
            detect_count = 0;
            detect_code = result.codeResult.code;
        }
        if(detect_count >= 3) {
            barcode_reading = true;
            Quagga.stop();
            detect_code = "";
            detect_count = 0;
            buy_jancode = result.codeResult.code;

            // バーコードの商品名取得
            progress_modal.show();
            var itemList = ncmb.DataStore("itemList");
            itemList.equalTo("janCode", buy_jancode)
                    .fetchAll()
                    .then(function(results) {
                        buy_itemname = results[0].itemName;
                        buy_itemtype = results[0].itemType;
                        barcode.textContent = buy_itemname;

                        // 今
                        var now = new Date();
                        var now_datetime = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`.substr(2);
                                    
                        // 購入リストに登録
                        var shoppingList = ncmb.DataStore("shoppingList");
                        var shoppinglist = new shoppingList;
                        shoppinglist.set("buyDate", now_datetime)
                                    .set("itemCode", buy_jancode)
                                    .set("itemName", buy_itemname)
                                    .set("itemType", buy_itemtype)
                                    .set("shopCode", buy_storecode)
                                    .set("shopName", buy_storename)
                                    .set("userId", userid)
                                    .save()
                                    .then(function(shoppingList) {
                                        progress_modal.hide();
                                        ons.notification.confirm({
                                            title: "",
                                            messageHTML: "購入情報を登録しました。<br><br>【購入店舗】<br>"+buy_storename.replace(/\s+/g,"<br>")+"<br><br>【購入商品】<br>"+buy_itemname+"<br><br><font color='red'>続けて他の商品の購入登録を行いますか？</font><br>",
                                            buttonLabels: ["はい", "いいえ"],
                                            animation: "fade",
                                            cancelable: false,
                                            callback: function(index) {
                                              if(index == 0) {
                                                  readBuyBarcode();
                                                  voice.src = "voices/READ_ITEMBAR.mp3";
                                                  voice.play();
                                              } else if(index == 1) {
                                                  noticetitle = "資源分別投函のお願い";
                                                  noticecomment = "商品飲食後は、資源収集ステーションにて容器の分別投函をお願いします。";
                                                  noticefunction = "home";
                                                  noticebutton = "閉じる";
                                                  noticedata = BUY_NOTICE_DATA;
                                                  navi.pushPage("noticepage.html");
                                                  voice.src = "voices/SEPARATE_ITEM.mp3";
                                                  voice.play();
                                              }
                                            }
                                        });
                                        voice.src = "voices/RE_READ_NEXTITEM.mp3";
                                        voice.play();
                                    })
                                    .catch(function(err){
                                        progress_modal.hide();
                                        alert(err);
                                    });

                    })
                    .catch(function(err){
                        progress_modal.hide();
                        ons.notification.alert({
                            title: "",
                            messageHTML: "該当商品の登録がありません。<br>もう一度バーコードをスキャンしてください。",
                            buttonLabel: "OK",
                            animation: "fade",
                            callback: function() {
                                readBuyBarcode();
                            }
                        });
                        voice.src = "voices/RE_READ_ITEMBAR.mp3";
                        voice.play();
                    });
        }
    });

}

//******************************************************************************************************/
//
// readSeparateQrcode()
//   投函BoxのQRコード読み取り
//   jsQRバーコード読み取り、投函日をデータベースへセット
//
//******************************************************************************************************/
var readSeparateQrcode = function() {
    video = document.createElement("video");
    var canvasElement = document.getElementById("separatepage-qrcanvas");
    var canvas = canvasElement.getContext("2d");

    function drawLine(begin, end, color) {
        canvas.beginPath();
        canvas.moveTo(begin.x, begin.y);
        canvas.lineTo(end.x, end.y);
        canvas.lineWidth = 4;
        canvas.strokeStyle = color;
        canvas.stroke();
    }

     navigator.mediaDevices.getUserMedia({video:constraints})
         .then(function(stream) {
            // カメラOKならQRコード読取
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            detect_code = "";
            requestAnimationFrame(separatepagetick);
            voice.src = "voices/READ_BOXQR.mp3";
            voice.play();
        })
        .catch((err) => {
            console.log(err.name + ": " + err.message);
            showInfodialog("有効なカメラデバイスがありません。\n設定を確認してください。\n"+err.name + ": " + err.message);
            voice.src = "voices/ERROR_CAMERA.mp3";
            voice.play();
            setTimeout(function(){navi.popPage()}, 500);
        });

    function separatepagetick() {

        // QRコードを発見するまで
        if(detect_code == "") {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvasElement.height = video.videoHeight;
                canvasElement.width = video.videoWidth;
                canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                var code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                if (code) {
                    drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                    drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                    drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                    drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                    detect_code = code.data;
                }
            }
            requestAnimationFrame(separatepagetick);
        } else if(detect_code == "wait") {
            return;
        } else {
            // QRコードが見つかったらBox名を検索
            progress_modal.show();
            var boxList = ncmb.DataStore("boxList");
            boxList
                .equalTo("boxCode", detect_code)
                .fetchAll()
                .then(function(results) {
                    progress_modal.hide();
                             
                    // 登録されてない場合
                    if(results.length == 0) {
                        ons.notification.alert({
                            title: "",
                            messageHTML: "該当するBox登録がありません。<br>もう一度QRコードをスキャンしてください。",
                            buttonLabel: "OK",
                            animation: "fade",
                            callback: function() {
                                detect_code = "";
                                requestAnimationFrame(separatepagetick);
                            }
                        });
                        voice.src = "voices/RE_READ_BOXQR.mp3";
                        voice.play();
                    } else {
                        // 登録されていれば確定
                        separate_boxname = results[0].boxName;
                        ons.notification.alert({
                            title: "",
                            messageHTML: "読み取りOK！<br><br>【Box情報】<br>" + separate_boxname.replace(/\s+/g,"<br>"),
                            buttonLabel: "OK",
                            animation: "fade",
                            callback: function() {
                                canvasElement.remove();
                                video.remove();
                                separate_boxcode = detect_code;
                                navi.replacePage("checkpage.html");
                                voice.src = "voices/CHECK_SEPARATE.mp3";
                                voice.play();
                            }
                        })
                    }
                })
                .catch(function(err){
                    progress_modal.hide();
                    ons.notification.alert({
                        title: "",
                        messageHTML: "該当するBox登録がありません。<br>もう一度QRコードをスキャンしてください。",
                        buttonLabel: "OK",
                        animation: "fade",
                        callback: function() {
                            detect_code = "";
                            requestAnimationFrame(separatepagetick);
                        }
                    });
                    voice.src = "voices/RE_READ_BOXQR.mp3";
                    voice.play();
                    console.log(err);
                })
        }
    }  
}

//******************************************************************************************************/
//
// getQrcode()
//   入場／退場時のQR生成用コード取得
//   gateQrCode検索、QRコードイメージの表示
//   mode: IN=入場ゲートコード取得　　OUT=出場ゲートコード取得
//
//******************************************************************************************************/
var getQrcode = function(mode) {
    progress_modal.show();
    var gateqrcode= ncmb.DataStore("gateQrCode");
    gateqrcode
        .fetchAll()
        .then(function(results) {
            var object = results[0];
            if(mode == IN) {
                document.getElementById("gatetitle").textContent = "ステーション入場";
                document.getElementById("gatecomment").innerHTML = "ゲートにQRコードをかざして<br>ステーションに入場してください。<br><br>";
                document.getElementById("gateinbutton").textContent = "入場完了";
                var qrcode = new QRCode(document.getElementById("gateimage"), {
                    text: object.gateInCode,
                	width: 200,
                	height: 200,
            	    colorDark : "#000000",
	                colorLight : "#ffffff",
	                correctLevel : QRCode.CorrectLevel.H
                });
                voice.src = "voices/IN_STATION.mp3";
                voice.play();
            } else {
                document.getElementById("gatetitle").textContent = "ステーション退場";
                document.getElementById("gatecomment").innerHTML = "ゲートにQRコードをかざして<br>ステーションから退場してください。<br><br>";
                document.getElementById("gateinbutton").textContent = "退場完了";
                var qrcode = new QRCode(document.getElementById("gateimage"), {
                    text: object.gateOutCode,
                	width: 200,
                	height: 200,
            	    colorDark : "#000000",
	                colorLight : "#ffffff",
	                correctLevel : QRCode.CorrectLevel.H
                });
                voice.src = "voices/OUT_STATION.mp3";
                voice.play();
            }
            progress_modal.hide();
        })
        .catch(function(err){
            progress_modal.hide();
            alert.log(err);
        });
}

//******************************************************************************************************/
//
// checkcheck(button)
//   すべてのチェックボックスがONになっていればbuttonを有効化、そうでなければ無効化
//
//******************************************************************************************************/
function checkcheck(btn) {
    var chk = document.querySelectorAll("input[type='checkbox']");
    var flg = true;
    chk.forEach(function(elm) {
        if(!elm.checked) {
            flg=false;
        }
    });
    if(flg) {
        document.getElementById(btn).removeAttribute("disabled");
    } else {
        document.getElementById(btn).setAttribute("disabled", true);
    }
}
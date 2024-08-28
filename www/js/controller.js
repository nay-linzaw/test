// controller.js
// This is a JavaScript file

// コントローラセクション
ons.bootstrap()
  .controller("AppController", function($scope) {

    $scope.push_loginpage = function() {
        // 処理中にする
        progress_modal.show();

        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;

        // 登録情報がなければ初期設定ページ表示
        if(username == "nay" && password == "nay") {
            navi.replacePage("menupage.html");
        } else {
            showInfodialog(MSG_NEEDSETTING);
        }
    }
    // メニューページの「購入登録」ボタン押下時
    $scope.push_buypage = function() {
      // 登録情報がなければ初期設定ページ表示
      if(userid == "" || userid == null || userid == undefined) {
        showInfodialog(MSG_NEEDSETTING);
      } else {
        navi.pushPage("buypage.html");
      }
    }

    // メニューページの「分別投函」ボタン押下時
    $scope.push_separatepage = function() {
      // 登録情報がなければ初期設定ページ表示
      if(userid == "" || userid == null || userid == undefined) {
        showInfodialog(MSG_NEEDSETTING);
      } else {
        gatemode = IN;
        navi.pushPage("gatepage.html");
      }
    }

    // メニューページの「初期設定」ボタン押下時
    $scope.push_settingpage = function() {
        navi.pushPage("settingpage.html");
    }

    // メニューページの「履歴参照」ボタン押下時
    $scope.push_historypage = function() {
        // ダブルクリック対応
        if(ncmbget) {
            return;
        }

        // 登録情報がなければ初期設定ページ表示
        if(userid == "" || userid == null || userid == undefined) {
            showInfodialog(MSG_NEEDSETTING);
        } else {
            // このユーザの全リストを検索
            ncmbget = true;
            alldata = [];
            var shoppinglist = ncmb.DataStore("shoppingList");
            shoppinglist
                .equalTo("userId", userid)
                .order("buyDate",true)
                .fetchAll()
                .then(function(results) {
                    for(var i=0; i<results.length; i++) {
                        var object = results[i];
                        var shortdate = object.buyDate.substr(3,5).replace("-","/");
                        var recycle_icon = "";
                        var bgcolor = "";
                        if(object.separateDate != null) {
                            recycle_icon = "fa-recycle";
                            bgcolor = "aquamarine";
                        }
                        alldata.push({buyDate:object.buyDate, buyshortDate:shortdate, itemName:object.itemName, shopName:object.shopName, separateDate:object.separateDate, boxName:object.boxName, icon:recycle_icon, color:bgcolor});
                    }
                    progress_modal.hide();
                    navi.pushPage("alllistpage.html");
                    ncmbget = false;
                })
                .catch(function(err) {
                    progress_modal.hide();
                    alert(err);
                    ncmbget = false;
                });
        }
    }

    // メニューページ起動時
    $scope.menuInit = function() {
        // ローカルストレージデータ取得
        userid = localStorage.getItem("userid");
        userobject = localStorage.getItem("userobject");
        cameramode = localStorage.getItem("cameramode");

        // 処理中ページ取得しておく
        progress_modal = document.getElementById("progress.html");

        // 登録情報がなければ初期設定ページ表示
        if(userid == "" || userid == null || userid == undefined) {
            showInfodialog(MSG_NEEDSETTING);
        } else {
            // 登録情報があればカメラモードjsonを設定
            if(cameramode == "フロント") {
                constraints = {facingMode: "user"};
            } else {
                constraints = {facingMode: {exact: "environment"}};
            }
        }
    }

    // 購入登録ページ起動時
    $scope.buyInit = function() {
        buy_storecode = "";
        buy_jancode = "";
        buy_itemname = "";

        // 店舗QRコード読み取り
        readBuyQrcode();
    }

    // 分別投函ページ（購入済商品リスト）起動時
    $scope.mylistInit = function() {
        // 購入品リスト
        $scope.myitems = shoppingdata;

        // 購入商品がないときはメッセージ表示する
        if(shoppingdata.length == 0) {
            ons.notification.alert({
                title: "",
                messageHTML: "購入商品がありません。",
                            buttonLabel: "OK",
                            animation: "fade",
            });
            voice.src = "voices/NONE_ITEM.mp3";
            voice.play();
        } else {
            voice.src = "voices/SELECT_ITEM.mp3";
            voice.play();
        }
    }

    // 履歴参照ページ起動時
    $scope.alllistInit = function() {
        $scope.allitems = alldata;
    }

    // 初期設定ページ起動時
    $scope.settingInit = function() {
        // 処理中にする
        progress_modal.show();

        // 現在のカメラモード
        document.getElementById("cameramode").value = cameramode;

        // UserID一覧を取得してリスト項目に表示
        var userListOptions = [];
        var userList = ncmb.DataStore("userList");
        userList
            .order("userName",true)
            .fetchAll()
            .then(function(results) {
                for(var i=0; i<results.length; i++) {
                    var object = results[i];
                    userListOptions.push("<option value='"+object.objectId+"'>"+object.userId+"</option>");
                }
                progress_modal.hide();
                var useridlistelm = document.getElementById("useridlist");
                useridlistelm.innerHTML = userListOptions;

                // 現在のユーザID
                useridlistelm.value = userobject;

                // 現在のポイント確認
                if(userobject) {
                    var userList = ncmb.DataStore("userList");
                    userList
                        .fetchById(userobject)
                        .then(uitem => {
                            document.getElementById("userpoint").innerHTML = uitem.point + " pt";
                        })
                        .catch(function(err){
                            alert(err);
                            progress_modal.hide();
                        });
                }
             })
             .catch(function(err){
                 progress_modal.hide();
                 alert(err);
             });
    }

    // 初期設定ページの「登録」ボタン押下時
    $scope.save_setting = function() {
        var useridlistobj =document.getElementById("useridlist");
        var idx = useridlistobj.selectedIndex;
        userid = useridlistobj[idx].text;
        userobject = useridlistobj[idx].value;
        cameramode = document.getElementById("cameramode").value;

        // すべての入力があれば保存
        if(userid == "" || cameramode == "") {
            showInfodialog("すべての項目を設定してください。");
            voice.src = "voices/SET_ALLITEM.mp3";
            voice.play();
        } else {
            // ローカルストレージに保存
            localStorage.setItem("userid", userid);
            localStorage.setItem("userobject", userobject);
            localStorage.setItem("cameramode", cameramode);

            // カメラモードjsonを設定
            if(cameramode == "フロント") {
                constraints = {facingMode: "user"};
            } else {
                constraints = {facingMode: {exact: "environment"}};
            }

            // ページを閉じる
            navi.popPage();
        }
    }

    // 注意表示ページ起動時
    $scope.noticeInit = function() {
        $scope.noticetitle = noticetitle;
        $scope.noticecomment = noticecomment;
        $scope.noticefunction = noticefunction;
        $scope.noticebutton = noticebutton;
        $scope.noticeitems = noticedata;
    }

    // 注意ページの「閉じる」ボタン押下時
    $scope.goHome = function(func) {
        if(func == "home") {
            navi.resetToPage("menupage.html", {animation:"fade"});
        } else {
            // QRコード判別中断時は再開
            detect_code = "";
            navi.replacePage("separatepage.html", {animation:"fade"});
        }
    }

    // ゲートページ起動時
    $scope.gateInit = function() {
        getQrcode(gatemode);
    }

    // ゲートイン・アウト後
    $scope.gateIn = function() {
        // ダブルクリック対応
        if(ncmbget) {
            return;
        }
        ncmbget = true;

        // 入場時処理は購入済商品一覧ページへ
        if(gatemode == IN) {
            // 処理中にする
            progress_modal.show();

            // 購入済商品＆分別前のリストを検索
            shoppingdata = [];
            var shoppinglist = ncmb.DataStore("shoppingList");
            shoppinglist
                .equalTo("userId", userid)
                .equalTo("separateDate", null)
                .order("buyDate",true)
                .fetchAll()
                .then(function(results) {
                    for(var i=0; i<results.length; i++) {
                        var object = results[i];
                        shoppingdata.push({objectId:object.objectId, buyDate:object.buyDate, itemName:object.itemName, itemType:object.itemType});
                    }
                    progress_modal.hide();

                    // 購入済商品一覧ページに切り替え
                    navi.replacePage("mylistpage.html");
                    ncmbget = false;
                })
                .catch(function(err){
                    progress_modal.hide();
                    alert(err);
                    ncmbget = false;
                });
        // 退場時はメニューページにリセット
        } else {
            navi.resetToPage("menupage.html");
            ncmbget = false;
        }
    }

    // 分別実行ページへの切り替え
    $scope.goSeparate = function(item_objectid, item_buydate, item_itemname, item_itemtype) {
        buy_objectid = item_objectid;
        buy_buydate = item_buydate;
        buy_itemname = item_itemname;
        buy_itemtype = item_itemtype;
        navi.pushPage("separatepage.html");
    }

    // 分別実行ページ起動時
    $scope.separateInit = function() {
        $scope.separate_itemname = buy_itemname;
        $scope.separate_buydate = buy_buydate;
        $scope.separate_itemtype = buy_itemtype;
        readSeparateQrcode();
    }

    // 分別実行ページからの分別注意ページ起動
    $scope.showNotice = function(itemtype) {
         // 容器ごとに表示を分ける
        switch(itemtype.substr(0,4)) {
            case PET_MSG.CODE:
                noticecomment = PET_MSG.BODY;
                noticedata = PET_NOTICE_DATA;
　           break;

            case CAN_MSG.CODE:
                noticecomment = CAN_MSG.BODY;
                noticedata = CAN_NOTICE_DATA;
            break

            case BOTTLE_MSG.CODE:
                noticecomment = BOTTLE_MSG.BODY;
                noticedata = BOTTLE_NOTICE_DATA;
            break;

            default: //FOOD
                noticecomment = FOOD_MSG.BODY;
                noticedata = FOOD_NOTICE_DATA;
        }
        noticetitle = "資源ごとの分別";
        noticefunction = "return";
        noticebutton = "戻る";

        // QR認識を中断
        detect_code = "wait";
        video.remove();
        document.getElementById("separatepage-qrcanvas").remove();

        // 注意ページに切り替え
        navi.replacePage("noticepage.html", {animation:"fade"});
    }

    // 分別投函チェックページ起動時
    $scope.checkInit = function() {
        $scope.check_buydate = buy_buydate;
        $scope.check_itemname = buy_itemname;
        document.getElementById("check_boxname").innerHTML = separate_boxname.replace(/\s+/g,"<br>");

         // 容器ごとにチェック項目を分ける
        switch(buy_itemtype.substr(0,4)) {
            case PET_MSG.CODE:
                $scope.checks = PET_CHECK_DATA;
　           break;

            case CAN_MSG.CODE:
                $scope.checks = CAN_CHECK_DATA;
            break

            case BOTTLE_MSG.CODE:
                $scope.checks = BOTTLE_CHECK_DATA;
            break;

            default: // FOOD
                $scope.checks = FOOD_CHECK_DATA;
        }   
    }

    // 分別投函チェック完了時
    $scope.resetMainpage = function() {
        // ダブルクリック対応
        if(ncmbget) {
            return;
        }
        ncmbget = true;

        // 処理中にする
        progress_modal.show();

        // 今
        var now = new Date();
        var now_datetime = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`.substr(2);
                                    
        // 投函日時の登録
        var shoppingList = ncmb.DataStore("shoppingList");
        shoppingList
            .fetchById(buy_objectid)
            .then(sitem => {
                // 現在日時でデータ更新
                sitem
                    .set("separateDate", now_datetime)
                    .set("boxCode", separate_boxcode)
                    .set("boxName", separate_boxname);
                sitem.update();

                // ユーザへポイント加算
                var userList = ncmb.DataStore("userList");
                userList
                    .fetchById(userobject)
                    .then(uitem => {
                        uitem.setIncrement("point", 1);
                        uitem.update();
                    })
                    .catch(function(err){
                        progress_modal.hide();
                        alert(err);
                    });

                progress_modal.hide();
                ons.notification.confirm({
                    title: "",
                    messageHTML: "投函情報を登録しました。<br><br>【投函Box】<br>"+separate_boxname.replace(/\s+/g,"<br>")+"<br><br>【投函商品】<br>"+buy_itemname+"<br><br>該当ポイントが付与されました！<br><br><font color='red'>続けて他の商品の分別投函を行いますか？</font><br>",
                    buttonLabels: ["はい", "いいえ"],
                    animation: "fade",
                    cancelable: false,
                    callback: function(index) {
                        // 購入済商品＆分別前のリストを検索
                        progress_modal.show();
                        shoppingdata = [];
                        var shoppinglist = ncmb.DataStore("shoppingList");
                        shoppinglist
                            .equalTo("userId", userid)
                            .equalTo("separateDate", null)
                            .order("buyDate",true)
                            .fetchAll()
                            .then(function(results) {
                                for(var i=0; i<results.length; i++) {
                                    var object = results[i];
                                    shoppingdata.push({objectId:object.objectId, buyDate:object.buyDate, itemName:object.itemName, itemType:object.itemType});
                                }
                                progress_modal.hide();
                                $scope.myitems = shoppingdata;
                                // リストを更新して前ページに戻る
                                if(index == 0) {
                                    navi.popPage({refresh:true});
                                // リストを更新してからゲートページへ
                                } else if(index == 1) {
                                    gatemode = OUT;
                                    navi.replacePage("gatepage.html");
                                }
                                ncmbget = false;
                            })
                            .catch(function(err){
                                progress_modal.hide();
                                alert(err);
                                ncmbget = false;
                            });
                    }
                });
                voice.src = "voices/POST_NEXTITEM.mp3";
                voice.play();
            })
            .catch(e => {
                progress_modal.hide();
                alert(e);
                ncmbget = false;
            });
    }

    // 全商品一覧ページの対象アイテムクリック時
    $scope.goHistory = function($index) {
        currentindex = $index;
        navi.pushPage("historypage.html");
    }

    // 履歴データページ初期表示時
    $scope.historyInit = function() {
        if(alldata[currentindex].separateDate == null) {
            document.getElementById("history_msg").textContent = "この商品は分別投函されていません。";
            $scope.history_icon = "fa-gift";
        } else {
            document.getElementById("history_msg").textContent = "この商品は分別投函済です。";
            $scope.history_icon = "fa-recycle";
        }

        $scope.history_color = alldata[currentindex].color;
        $scope.history_buydate = alldata[currentindex].buyDate;
        $scope.history_itemname = alldata[currentindex].itemName;
        $scope.history_separatedate = alldata[currentindex].separateDate;

        document.getElementById("history_shopname").innerHTML = alldata[currentindex].shopName.replace(/\s+/g,"<br>");
        document.getElementById("history_boxname").innerHTML = alldata[currentindex].boxName.replace(/\s+/g,"<br>");
    }

  });
$(document).ready(function(){
    //將兩張圖片分別保存
    $("#originalImg").change(function(e){
        selectedImage1 = e.target.files[0];
    });
    $("#changedImg").change(function(e){
        selectedImage2 = e.target.files[0];
    });
    //當按下開始按鈕，先分析第二張(較少物件)的圖，再分析第一張(較多物件)的圖
    $("#myButton").click(function(){
        processImageFile(selectedImage2);
        setTimeout(function(){
            processImageFile(selectedImage1)
        },1000);
        //創造URL，顯示圖片1 2
        var sourceImageUrl = URL.createObjectURL(selectedImage1);
        document.querySelector("#sourceImage1").src = sourceImageUrl;
        var sourceImageUr2 = URL.createObjectURL(selectedImage2);
        document.querySelector("#sourceImage2").src = sourceImageUr2;
    });
});

let detect_arr = []
let con_arr = []
let det
var cnt = 0
var length1

function processImageFile(imageObject) {

    //確認區域與所選擇的相同或使用客製化端點網址
    var url = "https://eastasia.api.cognitive.microsoft.com/";
    //改用detect模型
    var uriBase = url + "vision/v2.1/detect";

    var params = {
        "visualFeatures": "Faces,Objects,Adult,Brands,Categories,Description",
        // "details": "Landmarks",
        "maxCandidates": "10",
        "language": "zh",
    };
    //送出分析
    $.ajax({
        url: uriBase + "?" + $.param(params),
        // Request header
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        processData:false,
        contentType:false,
        // Request body
        data: imageObject
    })
    .done(function(data) {
        //顯示JSON內容
        $("#responseTextArea").val(JSON.stringify(data, null, 2));
        $("#picDescription").empty();
        // 提取物件偵測結果
        const detectedObjects = data.objects;
        let temp_arr = [];
        //設定紅框規格
        const objectContainer = document.getElementById("objectContainer");
        objectContainer.style.position = "absolute";
        objectContainer.style.border = "2px solid red";
        //處理圖中所偵測到的標籤
        if (detectedObjects && detectedObjects.length > 0) {
            for (var x = 0; x < detectedObjects.length; x++) {
                const objectLabel = detectedObjects[x].object;
                // 將 object 值存入陣列
                temp_arr.push(objectLabel);
            }
        }
        else {
            // 無物件偵測結果的處理邏輯
            $("#picDescription").append("未偵測到任何物件");
        }
        //將每張圖的標籤保存到detect_arr
        detect_arr.push(temp_arr);
        console.log(detect_arr);
        //計算第幾張圖(每按一次開始需要分析2張)
        cnt++;
        //當分析到第二張(按一次開始分析)
        if(cnt == 2){
            //用第一張(較多標籤)的每個標籤去掃第二張(較少標籤)的每個標籤，
            //如果有多出的標籤，則輸出標籤與繪製紅框
            for(var j=0;j<detectedObjects.length;j++){
                for(var i=0;i<length1;i++){
                    if(detect_arr[1][j]==detect_arr[0][i]){
                        break;
                    }
                    if(i == length1-1){
                        // 顯示物件描述
                        $("#picDescription").append(`在紅框的地方，左圖比右圖多：`+detect_arr[1][j]+`<br>`);
                        console.log(j)
                        // 計算圈出框的位置和尺寸
                        const boxLeft = detectedObjects[j].rectangle.x+10;
                        const boxTop = detectedObjects[j].rectangle.y+270;
                        const boxWidth = detectedObjects[j].rectangle.w;
                        const boxHeight = detectedObjects[j].rectangle.h;
                        
                        // 設定物件容器的位置和尺寸
                        objectContainer.style.left = boxLeft + "px";
                        objectContainer.style.top = boxTop + "px";
                        objectContainer.style.width = boxWidth + "px";
                        objectContainer.style.height = boxHeight + "px";
                    }
                }
            }
            //每按完一次開始分析完後，歸零
            detect_arr = [];
            cnt = 0;
        }
        //儲存第一張圖的標籤數，但不影響到第二張圖
        length1 = detectedObjects.length;
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
        //丟出錯誤訊息
        var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : jQuery.parseJSON(jqXHR.responseText).message;
        alert(errorString);
    });
};

